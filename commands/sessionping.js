const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilderUtil = require('../utils/embedBuilder');
const SessionManager = require('../utils/sessionManager');
const CountdownManager = require('../utils/countdownManager');

const sessionManager = new SessionManager();
const countdownManager = new CountdownManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sessionping')
        .setDescription('Create a session ping with reaction tracking')
        .addIntegerOption(option =>
            option.setName('hours')
                .setDescription('Hours until session starts')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(24))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Minutes until session starts')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(59))
        .addStringOption(option =>
            option.setName('location')
                .setDescription('The location of the session')
                .setRequired(true)),
    async execute(interaction) {
        const timeHours = interaction.options.getInteger('hours');
        const timeMinutes = interaction.options.getInteger('minutes');
        const location = interaction.options.getString('location');

        const embed = EmbedBuilderUtil.getSessionPingEmbed(timeHours, timeMinutes, location);

        try {
            const message = await interaction.reply({ 
                embeds: [embed], 
                fetchReply: true 
            });
            
            await message.react('✅');
            
            sessionManager.createSession(
                interaction.channelId, 
                message.id, 
                timeHours, 
                timeMinutes
            );
            
            countdownManager.startCountdown(
                interaction.channel,
                message.id,
                timeHours,
                timeMinutes
            );
            
        } catch (error) {
            console.error('Error creating session ping:', error);
            await interaction.reply({ 
                content: 'There was an error creating the session ping!', 
                ephemeral: true 
            });
        }
    },
};
