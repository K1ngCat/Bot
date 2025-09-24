const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ticketsFile = path.join(__dirname, '..', 'tickets.json');


const TICKET_ROLE_1 = '1402654203268038817';
const TICKET_ROLE_2 = '1402654271480139876';
const TICKET_ROLE_3 = '1402654308998054030';

function loadTickets() {
    if (!fs.existsSync(ticketsFile)) return [];
    return JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
}

function saveTickets(tickets) {
    fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wsp-ticket')
        .setDescription('Issue a WSP ticket to a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(opt => opt.setName('user').setDescription('User receiving the ticket').setRequired(true))
        .addStringOption(opt => opt.setName('arrested').setDescription('Arrested?').addChoices(
            { name: 'Yes', value: 'Yes' },
            { name: 'No', value: 'No' }
        ).setRequired(true))
        .addStringOption(opt => opt.setName('license_suspension').setDescription('License Suspension?').addChoices(
            { name: 'Yes', value: 'Yes' },
            { name: 'No', value: 'No' }
        ).setRequired(true))
        .addIntegerOption(opt => opt.setName('fine').setDescription('Total fine amount').setRequired(true))
        .addStringOption(opt => opt.setName('offence1').setDescription('Offence 1'))
        .addStringOption(opt => opt.setName('offence2').setDescription('Offence 2'))
        .addStringOption(opt => opt.setName('offence3').setDescription('Offence 3'))
        .addStringOption(opt => opt.setName('offence4').setDescription('Offence 4'))
        .addStringOption(opt => opt.setName('offence5').setDescription('Offence 5')),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const guild = interaction.guild;
        const member = await guild.members.fetch(user.id);

        const offences = [
            interaction.options.getString('offence1'),
            interaction.options.getString('offence2'),
            interaction.options.getString('offence3'),
            interaction.options.getString('offence4'),
            interaction.options.getString('offence5')
        ].filter(Boolean);

        const arrested = interaction.options.getString('arrested');
        const licenseSuspension = interaction.options.getString('license_suspension');
        const fine = interaction.options.getInteger('fine');

        
        const ticketNumber = Math.floor(Math.random() * 1000000); 

        
        if (licenseSuspension === 'Yes') {
            const suspensionRoleId = '1404924040606515210'; 
            try { await member.roles.add(suspensionRoleId); } catch (e) { console.log('Failed to add license suspension role:', e); }
        }

        
        try {
            if (!member.roles.cache.has(TICKET_ROLE_1)) await member.roles.add(TICKET_ROLE_1);
            else if (!member.roles.cache.has(TICKET_ROLE_2)) await member.roles.add(TICKET_ROLE_2);
            else if (!member.roles.cache.has(TICKET_ROLE_3)) {
                await member.roles.add(TICKET_ROLE_3);
                try { await user.send('⚠️ You have received your third ticket role. Please be careful!'); } catch {}
            }
        } catch (e) { console.log('Failed to assign ticket role:', e); }

        
        const tickets = loadTickets();
        tickets.push({ userId: user.id, issuedBy: interaction.user.id, date: new Date().toISOString(), offences, arrested, licenseSuspension, fine, ticketNumber });
        saveTickets(tickets);

       
        const offencesText = offences.length > 0 ? offences.map(o => `• ${o}`).join('\n') : 'None';
        const embed = new EmbedBuilder()
            .setTitle('🚔 Wisconsin State Patrol - Traffic Ticket')
            .setColor(0x0000FF)
            .setDescription(
                `**Ticket #:** ${ticketNumber}\n` +
                `**Offender:** <@${user.id}>\n` +
                `**Offences:**\n${offencesText}\n` +
                `**Arrested:** ${arrested}\n` +
                `**License Suspension:** ${licenseSuspension}\n` +
                `**Fine Amount:** $${fine}\n` +
                `**Officer:** <@${interaction.user.id}>\n` +
                `**Date:** <t:${Math.floor(Date.now()/1000)}:f>`
            )
            .setFooter({ text: 'Greenville RP | WSP Division' });

        await interaction.reply({ content: `<@${interaction.user.id}>`, embeds: [embed] });
        try { await user.send({ content: 'You have been issued a WSP ticket:', embeds: [embed] }); } catch {}
    }
};
