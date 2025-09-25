const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilderUtil = require('../utils/embedBuilder');
const SessionManager = require('../utils/sessionManager');

const sessionManager = new SessionManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sessionstart')
        .setDescription('Start the session and DM all participants')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The session link to send to participants')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('location')
                .setDescription('The location of the session')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('minreactions')
                .setDescription('Minimum number of ✅ reactions required to start the session')
                .setRequired(false)),
    async execute(interaction) {
        const link = interaction.options.getString('link');
        const location = interaction.options.getString('location') || null;
        const minReactions = interaction.options.getInteger('minreactions') || 0;

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

            // Check if enough reactions
            const validUsers = users.filter(u => !u.bot);
            if (validUsers.size < minReactions) {
                return await interaction.reply({ 
                    content: `Not enough participants reacted! (${validUsers.size}/${minReactions} required)`, 
                    ephemeral: true 
                });
            }

            const participants = [];
            const failedDMs = [];
            
            for (const [userId, user] of validUsers) {
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
            
            const summaryEmbed = EmbedBuilderUtil.getSessionStartEmbed(link, participants, location);
            
            let summaryText = 'Session started! ';
            if (failedDMs.length > 0) {
                summaryText += `Failed to DM: ${failedDMs.join(', ')}. `;
            }
            summaryText += 'Reinvites will be available in a few minutes.';
            
            await interaction.reply({ 
                content: summaryText,
                embeds: [summaryEmbed] 
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
