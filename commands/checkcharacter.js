const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const charactersFile = path.join(__dirname, '..', 'characters.json');
const ticketsFile = path.join(__dirname, '..', 'tickets.json');
const wantedFile = path.join(__dirname, '..', 'wantedData.json');


const suspendedRoleId = '1421487020894847006';        
const drivingLicenseRoleId = '1403853403741880495';   

function loadCharacters() {
    if (!fs.existsSync(charactersFile)) return {};
    return JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
}

function loadTickets() {
    if (!fs.existsSync(ticketsFile)) return [];
    return JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
}

function loadWantedData() {
    if (!fs.existsSync(wantedFile)) return {};
    return JSON.parse(fs.readFileSync(wantedFile, 'utf8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkcharacter')
        .setDescription('Check a user’s character, ticket info, and license status')
        .addUserOption(opt => 
            opt.setName('user')
                .setDescription('User to check')
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const characters = loadCharacters();
        const tickets = loadTickets();
        const wantedData = loadWantedData();

        const charData = characters[targetUser.id];
        if (!charData) {
            return interaction.reply({ content: '❌ No character found for this user.', ephemeral: true });
        }

        const ticketCount = tickets.filter(t => t.userId === targetUser.id).length;
        const hasSuspended = member?.roles.cache.has(suspendedRoleId);
        const hasDrivingLicense = member?.roles.cache.has(drivingLicenseRoleId);

        const isWanted = wantedData[targetUser.id];
        const wantedField = isWanted
            ? {
                name: '🚨 WANTED',
                value: `**Reason:** ${isWanted.grund}\n**Issued by:** ${isWanted.by}\n**Date:** ${new Date(isWanted.date).toLocaleString()}`,
                inline: false
            }
            : null;

        const embed = new EmbedBuilder()
            .setTitle(`Character Info – ${charData.fullname}`)
            .setColor(hasSuspended ? 0xFF0000 : 0x00FF00)
            .addFields(
                { name: 'Date of Birth', value: charData.birthdate, inline: true },
                { name: 'Eye Color', value: charData.eyecolor, inline: true },
                { name: 'Hair Color', value: charData.haircolor, inline: true },
                { name: 'Job', value: charData.job, inline: true },
                { name: 'Tickets', value: `${ticketCount}`, inline: true },
                { name: 'License Suspended', value: hasSuspended ? 'Yes' : 'No', inline: true },
                { name: 'Driving License', value: hasDrivingLicense ? '✅ Yes' : '❌ No', inline: true }
            )
            .setFooter({ text: `User ID: ${targetUser.id}` });

        if (wantedField) embed.addFields(wantedField);

        return interaction.reply({ embeds: [embed] });
    }
};
