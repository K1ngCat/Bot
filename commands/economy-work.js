const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addMoney } = require('../economyStore');

const jobs = [
    "Truck Driver 🚚",
    "Police Officer 👮",
    "Farmer 🌾",
    "Doctor 🏥",
    "Software Developer 👨‍💻",
    "Streamer 🎥",
    "Mechanic 🔧"
];

// Configurable cooldown (1 hour = 3600000 ms)
const WORK_COOLDOWN = 60 * 60 * 1000;

// Store last work timestamps in memory
const lastWorked = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-work')
        .setDescription('Work a random job to earn money'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();

        // Check cooldown
        if (lastWorked.has(userId)) {
            const expiration = lastWorked.get(userId) + WORK_COOLDOWN;
            if (now < expiration) {
                const remaining = expiration - now;
                const hours = Math.floor(remaining / 3600000);
                const minutes = Math.floor((remaining % 3600000) / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);

                const embed = new EmbedBuilder()
                    .setTitle("⏳ Cooldown Active")
                    .setColor("Red")
                    .setDescription(
                        `You are still resting from your last job!\n\n` +
                        `Come back in **${hours}h ${minutes}m ${seconds}s**.`
                    );

                return interaction.reply({ embeds: [embed], flags: 64 }); // ephemeral
            }
        }

        // Choose random job + earnings
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const earnings = Math.floor(Math.random() * 300) + 100;

        addMoney(userId, earnings);
        lastWorked.set(userId, now); // update cooldown

        const embed = new EmbedBuilder()
            .setTitle("💼 Work Complete!")
            .setColor("Purple")
            .setDescription(`You worked as a **${job}** and earned **$${earnings}**!`)
            .setFooter({ text: `You can work again in ${WORK_COOLDOWN / 60000} minutes.` });

        await interaction.reply({ embeds: [embed] });
    }
};

