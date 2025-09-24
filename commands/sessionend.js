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
            
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            for (const [id, message] of messages) {
                
                if (id !== interaction.id) {
                    await message.delete().catch(console.error);
                }
            }
            
            
            sessionManager.deleteSession(interaction.channelId);
            
           
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