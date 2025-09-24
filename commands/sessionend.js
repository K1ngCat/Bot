const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilderUtil = require('../utils/embedBuilder');
const SessionManager = require('../utils/sessionManager');

const sessionManager = new SessionManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sessionend')
        .setDescription('End the current session and clean up all data'),
    async execute(interaction) {
        const session = sessionManager.getSession(interaction.channelId);
        
        if (!session) {
            return await interaction.reply({ 
                content: 'No active session found in this channel!', 
                ephemeral: true 
            });
        }
        
        try {
            // Delete all messages in the channel
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            for (const [id, message] of messages) {
                // Don't delete the command message itself until after replying
                if (id !== interaction.id) {
                    await message.delete().catch(console.error);
                }
            }
            
            // Delete session data
            sessionManager.deleteSession(interaction.channelId);
            
            // Send session end message
            const embed = EmbedBuilderUtil.getSessionEndEmbed();
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error ending session:', error);
            await interaction.reply({ 
                content: 'There was an error ending the session!', 
                ephemeral: true 
            });
        }
    },
};