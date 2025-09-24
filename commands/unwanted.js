const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const wantedFile = path.join(__dirname, '..', 'wantedData.json');

function loadWantedData() {
    if (!fs.existsSync(wantedFile)) {
        fs.writeFileSync(wantedFile, '{}');
    }
    return JSON.parse(fs.readFileSync(wantedFile, 'utf8'));
}

function saveWantedData(data) {
    fs.writeFileSync(wantedFile, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwanted')
        .setDescription('Remove a user from the wanted list.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove from wanted list')
                .setRequired(true)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        let wantedData;

        try {
            wantedData = loadWantedData();
        } catch (err) {
            console.error('Failed to load wanted data:', err);
            return interaction.reply({ content: '❌ Failed to load wanted data.', ephemeral: true });
        }

        if (!wantedData[user.id]) {
            return interaction.reply({ content: `${user.tag} is not on the wanted list.`, ephemeral: true });
        }

        delete wantedData[user.id];

        try {
            saveWantedData(wantedData);
        } catch (err) {
            console.error('Failed to save wanted data:', err);
            return interaction.reply({ content: '❌ Failed to save wanted data.', ephemeral: true });
        }

        return interaction.reply(`${user.tag} has been removed from the wanted list.`);
    }
};
