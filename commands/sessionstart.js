const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedBuilderUtil = require('../utils/embedBuilder');
const SessionManager = require('../utils/sessionManager');

const sessionManager = new SessionManager();
const STAFF_CHANNEL_ID = "1403853409483755635";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sessionstart')
        .setDescription('Start the session and DM all participants')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The session link to send to participants')
                .setRequired(true)),
    async execute(interaction) {
        const link = interaction.options.getString('link');
        const session = sessionManager.getSession(interaction.channelId);
        
        if (!session) {
            return await interaction.reply({ 
                content: 'No active session found in this channel!', 
                ephemeral: true 
            });
        }
        
        sessionManager.setSessionLink(interaction.channelId, link);

        try {
            const pingMessage = await interaction.channel.messages.fetch(session.messageId);
            const reaction = pingMessage.reactions.cache.get('✅');
            const users = await reaction.users.fetch();

            const participants = [];
            const failedDMs = [];

            
            for (const [userId, user] of users) {
                if (user.bot) continue;

                try {
                    const dmEmbed = EmbedBuilderUtil.getDMEmbed(link);
                    await user.send({ embeds: [dmEmbed] });
                    participants.push(user.toString());
                    sessionManager.addParticipant(interaction.channelId, userId);
                } catch (dmError) {
                    failedDMs.push(user.toString());
                    console.error(`Failed to DM user ${user.tag}:`, dmError);
                }
            }

            
            const summaryEmbed = EmbedBuilderUtil.getSessionStartEmbed(link, participants);
            let summaryText = `🚀 Session started! Everyone who reacted has been DM'd the link.`;
            if (failedDMs.length > 0) {
                summaryText += `\n⚠️ Failed to DM: ${failedDMs.join(', ')}`;
            }

            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('get_link')
                    .setLabel('Get Link')
                    .setStyle(ButtonStyle.Primary)
            );

            const sessionMessage = await interaction.reply({ 
                content: summaryText,
                embeds: [summaryEmbed],
                components: [row]
            });

           
            const staffChannel = await interaction.client.channels.fetch(STAFF_CHANNEL_ID);
            await staffChannel.send({
                content: `✅ Session started in <#${interaction.channelId}>\nParticipants who got the link:\n${participants.length > 0 ? participants.join(', ') : "No participants"}`
            });

           
            const collector = sessionMessage.createMessageComponentCollector({
                filter: i => i.customId === 'get_link',
                time: 30000
            });

            const lateJoiners = [];

            collector.on('collect', async i => {
                try {
                    const dmEmbed = EmbedBuilderUtil.getDMEmbed(link, true);
                    await i.user.send({ embeds: [dmEmbed] });
                    lateJoiners.push(i.user.toString());
                    await i.reply({ content: "✅ I've sent you the link in your DMs!", ephemeral: true });
                } catch (error) {
                    await i.reply({ content: "❌ Could not DM you. Please check your settings.", ephemeral: true });
                }
            });

            collector.on('end', async () => {
            
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('get_link')
                        .setLabel('Get Link')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
                await sessionMessage.edit({ components: [disabledRow] });

              
                if (lateJoiners.length > 0) {
                    await staffChannel.send({
                        content: `⏰ Late joiners who used the button:\n${lateJoiners.join(', ')}`
                    });
                } else {
                    await staffChannel.send({ content: "⏰ No late joiners used the button." });
                }
            });

        } catch (error) {
            console.error('Error starting session:', error);
            await interaction.reply({ 
                content: 'There was an error starting the session!', 
                ephemeral: true 
            });
        }
    },
};
