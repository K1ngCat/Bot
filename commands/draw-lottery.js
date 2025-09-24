const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLotteryEntries, clearLotteryEntries } = require('../lotteryStore');
const { addMoney } = require('../economyStore');

// Make sure this value matches the one in lottery-info.js
const LOTTERY_PRIZE = 10000;

module.exports = {
    // 🔒 Restrict this command to server administrators only
    data: new SlashCommandBuilder()
        .setName('draw-lottery')
        .setDescription('Draws the winner of the Golden Ticket lottery.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Defer the reply, as this command might take a moment to process
        await interaction.deferReply({ ephemeral: false });

        const entries = getLotteryEntries();
        const totalTickets = Object.values(entries).reduce((sum, count) => sum + count, 0);

        // Check if there are any tickets to draw from
        if (totalTickets === 0) {
            return interaction.editReply({ content: '❌ There are no tickets to draw from. Nobody has purchased one yet!', ephemeral: false });
        }

        // Create a list of all ticket entries to draw from
        const ticketPool = [];
        for (const [userId, count] of Object.entries(entries)) {
            for (let i = 0; i < count; i++) {
                ticketPool.push(userId);
            }
        }

        // Pick a random winner from the ticket pool
        const winnerId = ticketPool[Math.floor(Math.random() * ticketPool.length)];
        
        // Get the winner's member object
        const winner = await interaction.guild.members.fetch(winnerId).catch(() => null);

        if (!winner) {
            // If the winner left the server, clear the entries and let the user know
            clearLotteryEntries();
            return interaction.editReply({ content: 'A winner was drawn, but they were no longer in the server! The lottery has been reset.', ephemeral: false });
        }
        
        // Add the prize money to the winner's balance
        addMoney(winner.id, LOTTERY_PRIZE);

        // Clear all lottery entries for the next round
        clearLotteryEntries();

        // Create and send the winner announcement embed
        const winnerEmbed = new EmbedBuilder()
            .setTitle('🎉 Golden Ticket Lottery Winner! 🎉')
            .setColor('DarkGold')
            .setDescription(`A drumroll, please... The winner is... ${winner}!`)
            .addFields(
                { name: 'Prize', value: `$${LOTTERY_PRIZE}`, inline: true },
                { name: 'Congratulations!', value: `${winner} has won the lottery prize! Their winnings have been added to their balance.` }
            )
            .setFooter({ text: 'The lottery has been reset. Use /economy-buy to get a ticket for the next round!' });

        await interaction.editReply({ embeds: [winnerEmbed] });
    }
};
