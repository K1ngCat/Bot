const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLotteryEntries } = require('../lotteryStore');


const LOTTERY_PRIZE = 500000; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery-info')
        .setDescription('Shows information about the current Golden Ticket lottery.'),
    async execute(interaction) {
        const entries = getLotteryEntries();
        const totalTickets = Object.values(entries).reduce((sum, count) => sum + count, 0);

        if (totalTickets === 0) {
            return interaction.reply({ content: '🎟️ The lottery is empty! Be the first to buy a ticket with `/economy-buy`!', ephemeral: true });
        }

        const infoEmbed = new EmbedBuilder()
            .setTitle('🎫 Golden Ticket Lottery Info')
            .setColor('DarkGold')
            .setDescription(`The current jackpot is: **$${LOTTERY_PRIZE}**!`)
            .addFields(
                { name: 'Total Tickets', value: `${totalTickets}`, inline: true },
                { name: 'Participants', value: `${Object.keys(entries).length}`, inline: true }
            )
            .setFooter({ text: 'Buy a Golden Ticket with /economy-buy to increase your chance!' });

        let participantsList = '';
        for (const [userId, count] of Object.entries(entries)) {
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            if (member) {
                const chance = ((count / totalTickets) * 100).toFixed(2);
                participantsList += `> ${member.displayName}: **${count}** tickets (${chance}% chance)\n`;
            }
        }

       
        if (participantsList.length > 1024) {
            participantsList = participantsList.substring(0, 1020) + '...';
        }

        if (participantsList) {
            infoEmbed.addFields({ name: 'Current Participants', value: participantsList });
        }

        await interaction.reply({ embeds: [infoEmbed] });
    }
};