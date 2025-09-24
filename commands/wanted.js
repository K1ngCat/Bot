const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const wantedFile = path.join(__dirname, '..', 'wantedData.json');

function loadWantedData() {
    if (!fs.existsSync(wantedFile)) {
        fs.writeFileSync(wantedFile, '{}'); // create empty file if missing
        console.log('Created new wantedData.json file');
    }
    const data = fs.readFileSync(wantedFile, 'utf8');
    return JSON.parse(data);
}

function saveWantedData(data) {
    try {
        fs.writeFileSync(wantedFile, JSON.stringify(data, null, 2));
        console.log('✅ Wanted data saved to:', wantedFile);
    } catch (err) {
        console.error('❌ Failed to save wanted data:', err);
        throw err; // rethrow to handle in execute
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wanted')
        .setDescription('Mark a user as wanted.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The person to mark as wanted')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warrant')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        if (!reason) {
            return interaction.reply({ content: '❌ Reason is missing!', ephemeral: true });
        }

        let wantedData;
        try {
            wantedData = loadWantedData();
        } catch (err) {
            console.error('❌ Failed to load wanted data:', err);
            return interaction.reply({ content: '❌ Failed to load wanted data.', ephemeral: true });
        }

        if (wantedData[user.id]) {
            return interaction.reply({
                content: `${user.tag} is already marked as wanted.\nReason: ${wantedData[user.id].grund}`,
                ephemeral: true
            });
        }

        wantedData[user.id] = {
            grund: reason,
            by: interaction.user.tag,
            date: new Date().toISOString()
        };

        try {
            saveWantedData(wantedData);
        } catch (err) {
            return interaction.reply({
                content: '❌ Failed to save wanted data. Please contact the admin.',
                ephemeral: true
            });
        }

        return interaction.reply(`${user.tag} has been marked as **wanted**.\n📌 Reason: ${reason}`);
    }
};

