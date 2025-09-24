const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const charactersFile = path.join(__dirname, '..', 'characters.json');

function loadCharacters() {
    if (!fs.existsSync(charactersFile)) return {};
    return JSON.parse(fs.readFileSync(charactersFile, 'utf8'));
}

function saveCharacters(data) {
    fs.writeFileSync(charactersFile, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('character-create')
        .setDescription('Create your character profile')
        .addStringOption(opt => opt.setName('fullname').setDescription('Full name').setRequired(true))
        .addStringOption(opt => opt.setName('birthdate').setDescription('Date of Birth (YYYY-MM-DD)').setRequired(true))
        .addStringOption(opt => opt.setName('eyecolor').setDescription('Eye color').setRequired(true))
        .addStringOption(opt => opt.setName('haircolor').setDescription('Hair color').setRequired(true))
        .addStringOption(opt => opt.setName('job').setDescription('Main job').setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const fullname = interaction.options.getString('fullname');
        const birthdate = interaction.options.getString('birthdate');
        const eyecolor = interaction.options.getString('eyecolor');
        const haircolor = interaction.options.getString('haircolor');
        const job = interaction.options.getString('job');

        if (!fullname.includes(' ')) {
            return interaction.reply({
                content: '❌ Please include a first and last name.',
                ephemeral: true
            });
        }

        const characters = loadCharacters();

        characters[userId] = {
            fullname,
            birthdate,
            eyecolor,
            haircolor,
            job
        };

        saveCharacters(characters);

        const embed = new EmbedBuilder()
            .setTitle('✅ Character Created')
            .setColor('#00FF00')
            .addFields(
                { name: '🪪 Full Name', value: fullname },
                { name: '📅 Date of Birth', value: birthdate },
                { name: '👁️ Eye Color', value: eyecolor },
                { name: '🎨 Hair Color', value: haircolor },
                { name: '🧑‍🏭 Job', value: job }
            )
            .setFooter({ text: 'Keep this safe – you may need it later.' })
            .setTimestamp();

      
        try {
            await interaction.user.send({ embeds: [embed] });
        } catch {
            await interaction.reply({
                content: '✅ Character created, but I could not DM you. Please enable DMs.',
                ephemeral: true
            });

           
            return interaction.followUp({ embeds: [embed] });
        }

      
        return interaction.reply({
            content: `✅ Character created for **${fullname}**.`,
            embeds: [embed]
        });
    }
};
