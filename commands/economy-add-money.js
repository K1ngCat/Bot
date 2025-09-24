const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addMoney, getBalance } = require('../economyStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-add-money')
        .setDescription('Add money to a user\'s balance.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only admins can use
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to give money to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of money to add')
                .setRequired(true)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        if (amount <= 0) {
            return interaction.reply({ content: '❌ You must add a positive amount of money.', ephemeral: true });
        }

        addMoney(user.id, amount);
        const newBalance = getBalance(user.id);

        const embed = new EmbedBuilder()
            .setTitle('💰 Money Added')
            .setColor('Green')
            .setDescription(`Successfully added **$${amount}** to <@${user.id}>'s balance.`)
            .addFields(
                { name: 'New Balance', value: `$${newBalance}`, inline: true },
                { name: 'Added By', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};