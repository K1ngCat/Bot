const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedBuilderUtil = require('../utils/embedBuilder');
const SessionManager = require('../utils/sessionManager');

const sessionManager = new SessionManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reinvites')
        .setDescription('Create a reinvite button for users who missed the session'),
    async execute(interaction) {
        const session = sessionManager.getSession(interaction.channelId);
        
        if (!session) {
            return await interaction.reply({ 
                content: 'No active session found in this channel!', 
                ephemeral: true 
            });
        }
        
        const embed = EmbedBuilderUtil.getReinvitesEmbed();
        
        const button = new ButtonBuilder()
            .setCustomId('reinvite_button')
            .setLabel('Get Reinvite')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔄');
        
        const row = new ActionRowBuilder().addComponents(button);
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row] 
        });
    },
};