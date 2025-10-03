const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addMoney } = require('../economyStore');


const roleRewards = {
    "1372308043454349403": { amount: 200, name: "WSP" },
    "1402987906477461585": { amount: 150, name: "DOT" },
    "1372089433876070450": { amount: 650, name: "Owner" },
    "1404434528839143465": { amount: 550, name: "Executive" },
    "1372088734148853832": { amount: 500, name: "Executive Assistent" },
    "1404434674763431936": { amount: 450, name: "Director" },
    "1404434972160430100": { amount: 350, name: "Manager" },
    "1372094351328677972": { amount: 300, name: "Moderator" },
    "1405164435634524234": { amount: 200, name: "OCSO" },
    "1373407655456014376": { amount: 150, name: "Staff Suport" },
    "1407030051249328250": { amount: 100, name: "Member" },
    "1409278757025611918": { amount: 120, name: "Gambling Mafia" },
    "1403091358419259433": { amount: 400, name: "Server Booster"}
};


const COOLDOWN = 3 * 60 * 60 * 1000;


let lastCollected = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-collect')
        .setDescription('Collect rewards based on your roles'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();

        
        if (lastCollected[userId] && now - lastCollected[userId] < COOLDOWN) {
            const remaining = COOLDOWN - (now - lastCollected[userId]);
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);

            const embed = new EmbedBuilder()
                .setTitle("⏳ Cooldown Active")
                .setColor("Red")
                .setDescription(`You already collected your role rewards! Come back in **${hours}h ${minutes}m**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let totalCollected = 0;
        let collectedRoles = [];

        for (const [roleId, info] of Object.entries(roleRewards)) {
            if (interaction.member.roles.cache.has(roleId)) {
                totalCollected += info.amount;
                collectedRoles.push(`**${info.name}**: $${info.amount}`);
            }
        }

        if (totalCollected === 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ No Rewards")
                .setColor("Red")
                .setDescription("You have no roles with rewards.");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        addMoney(userId, totalCollected);
        lastCollected[userId] = now; 

        const embed = new EmbedBuilder()
            .setTitle("💰 Role Rewards Collected")
            .setColor("Gold")
            .setDescription(`You collected a total of **$${totalCollected}**!`)
            .addFields(
                { name: "Collected from roles", value: collectedRoles.join("\n") }
            )
            .setFooter({ text: "Keep earning from your roles!" });

        await interaction.reply({ embeds: [embed] });
    }
};

