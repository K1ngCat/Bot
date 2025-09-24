const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ticketsFile = path.join(__dirname, '..', 'tickets.json');

function loadTickets() {
    if (!fs.existsSync(ticketsFile)) return [];
    return JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkrecord')
        .setDescription('Check the ticket record for a user.')
        .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const tickets = loadTickets().filter(t => t.userId === user.id);

        if (tickets.length === 0) {
            return interaction.reply({ content: `✅ ${user.tag} has a clean record.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`📄 Ticket Record for ${user.tag}`)
            .setColor(0xFFD700)
            .setDescription(
                tickets.map((t, i) =>
                    `**Ticket #:** ${t.ticketNumber}\n` +
                    `**Date:** <t:${Math.floor(new Date(t.date).getTime() / 1000)}:f>\n` +
                    `**Officer:** <@${t.issuedBy}>\n` +
                    `**Offences:** ${t.offences.length > 0 ? '\n' + t.offences.map(o => `  - ${o}`).join('\n') : 'None'}\n` +
                    `**Arrested:** ${t.arrested}\n` +
                    `**License Suspension:** ${t.licenseSuspension}\n` +
                    `**Fine:** $${t.fine}\n` +
                    `**Paid Off:** ${t.paidOff ? '✅ Yes' : '❌ No'}`
                ).join('\n────────────────────\n')
            );

        await interaction.reply({ embeds: [embed] });
    }
};
