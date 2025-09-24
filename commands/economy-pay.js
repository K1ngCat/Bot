const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, addMoney } = require('../economyStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-pay')
        .setDescription('Pay another user some of your money.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to pay')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of money to pay')
                .setRequired(true)),

    async execute(interaction) {
        const senderId = interaction.user.id;
        const recipient = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        if (recipient.id === senderId) {
            return interaction.reply({ content: '❌ You cannot pay yourself.', ephemeral: true });
        }

        if (amount <= 0) {
            return interaction.reply({ content: '❌ Please enter a positive amount.', ephemeral: true });
        }

        const senderBalance = getBalance(senderId);
        if (senderBalance < amount) {
            return interaction.reply({ content: `❌ You do not have enough money. Your balance: $${senderBalance}`, ephemeral: true });
        }

       
        addMoney(senderId, -amount);
        addMoney(recipient.id, amount);

        const embed = new EmbedBuilder()
            .setTitle('💸 Payment Successful')
            .setColor('Green')
            .setDescription(`<@${senderId}> has paid <@${recipient.id}> **$${amount}**!`)
            .addFields(
                { name: `${interaction.user.username}'s New Balance`, value: `$${getBalance(senderId)}`, inline: true },
                { name: `${recipient.username}'s New Balance`, value: `$${getBalance(recipient.id)}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
