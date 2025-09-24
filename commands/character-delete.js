const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const charactersFile = path.join(__dirname, '..', 'characters.json');
const STAFF_ROLE_ID = '1373407655456014376'; // Staff-Rollen-ID hier eintragen

function loadCharacters() {
    if (!fs.existsSync(charactersFile)) return {};
    return JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
}

function saveCharacters(data) {
    fs.writeFileSync(charactersFile, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('character-delete')
        .setDescription('Delete a character')
        .addUserOption(opt => 
            opt.setName('user')
            .setDescription('User whose character you want to delete (staff only)')
            .setRequired(false)
        ),

    async execute(interaction) {
        const characters = loadCharacters();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);

        if (targetUser.id !== interaction.user.id && !isStaff) {
            return interaction.reply({ 
                content: '❌ You can only delete your own character unless you have the staff role.', 
                flags: 1 << 6 
            });
        }

        if (!characters[targetUser.id]) {
            return interaction.reply({ 
                content: `❌ No character found for ${targetUser.tag}.`, 
                flags: 1 << 6 
            });
        }

        
        delete characters[targetUser.id];
        saveCharacters(characters);

        
        try {
            await targetUser.send(`❌ Your character profile has been deleted by ${interaction.user.tag}.`);
        } catch {
            
        }

        return interaction.reply({ 
            content: `✅ Character for ${targetUser.tag} has been deleted.`, 
            flags: 1 << 6 
        });
    }
};
