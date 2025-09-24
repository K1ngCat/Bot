const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addMoney, getLastDaily, updateDaily } = require('../economyStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-daily')
        .setDescription('Claim your daily reward of $500'),
    async execute(interaction) {
        const lastClaim = getLastDaily(interaction.user.id);
        const now = Date.now();

        if (now - lastClaim < 86400000) {
            const hours = Math.floor((86400000 - (now - lastClaim)) / 3600000);
            const embed = new EmbedBuilder()
                .setTitle("⏳ Already Claimed")
                .setColor("Red")
                .setDescription(`You already claimed your daily! Come back in **${hours}h**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        addMoney(interaction.user.id, 500);
        updateDaily(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle("🎁 Daily Reward")
            .setColor("Green")
            .setDescription("You claimed your daily reward of **$500**!");
        await interaction.reply({ embeds: [embed] });
    }
};
