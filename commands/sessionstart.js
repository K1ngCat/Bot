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
            // Fetch the original ping message
            const pingMessage = await interaction.channel.messages.fetch(session.messageId);
            
            // Get users who reacted
            const reaction = pingMessage.reactions.cache.get('✅');
            const users = await reaction.users.fetch();
            
            const participants = [];
            const failedDMs = [];
            
            // Send DMs to all users who reacted
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
            
            // Create and send summary embed
            const summaryEmbed = EmbedBuilderUtil.getSessionStartEmbed(link, participants);
            
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