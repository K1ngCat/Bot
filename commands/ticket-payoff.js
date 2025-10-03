const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getBalance, addMoney } = require('../economyStore');

const ticketsFile = path.join(__dirname, '..', 'tickets.json');


const TICKET_ROLE_1 = '1403853403741880500';
const TICKET_ROLE_2 = '1403853403741880499';
const TICKET_ROLE_3 = '1403853403741880498';

function loadTickets() {
    if (!fs.existsSync(ticketsFile)) return [];
    return JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
}

function saveTickets(tickets) {
    fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-payoff')
        .setDescription('Pay off a ticket using the ticket number.')
        .addIntegerOption(opt => opt.setName('ticket_number').setDescription('Random ticket number to pay off').setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const ticketNumber = interaction.options.getInteger('ticket_number');
        const guild = interaction.guild;
        const member = await guild.members.fetch(userId);

        const tickets = loadTickets();
        const ticket = tickets.find(t => t.userId === userId && t.ticketNumber === ticketNumber);

        if (!ticket) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Ticket Not Found')
                .setColor('Red')
                .setDescription('No ticket found for you with that ticket number.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (ticket.paidOff) {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Already Paid')
                .setColor('Yellow')
                .setDescription(`Ticket **#${ticketNumber}** has already been paid off.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const balance = getBalance(userId);
        if (balance < ticket.fine) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Insufficient Funds')
                .setColor('Red')
                .setDescription(`You need **$${ticket.fine}** to pay off this ticket, but you only have **$${balance}**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        
        addMoney(userId, -ticket.fine);

        
        ticket.paidOff = true;
        saveTickets(tickets);

       
        if (member.roles.cache.has(TICKET_ROLE_3)) await member.roles.remove(TICKET_ROLE_3);
        else if (member.roles.cache.has(TICKET_ROLE_2)) await member.roles.remove(TICKET_ROLE_2);
        else if (member.roles.cache.has(TICKET_ROLE_1)) await member.roles.remove(TICKET_ROLE_1);

        const embed = new EmbedBuilder()
            .setTitle('✅ Ticket Paid Off')
            .setColor('Green')
            .setDescription(`You successfully paid off ticket **#${ticketNumber}**.\nAmount deducted: **$${ticket.fine}**\nYour new balance: **$${getBalance(userId)}**\nTicket role removed.`);

        await interaction.reply({ embeds: [embed] });
    }
};
