const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, addMoney } = require('../economyStore');


const cooldowns = new Map();
const COOLDOWN = 6000 * 1000; 


const PROTECTED_ROLES = [
    '1421494265808293909',
    '1403853403863515328',
    '1403853403834286170'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-rob')
        .setDescription('Attempt to rob another user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to rob')
                .setRequired(true)
        ),

    async execute(interaction) {
        const robber = interaction.user;
        const victim = interaction.options.getUser('user');
        const guild = interaction.guild;
        const victimMember = await guild.members.fetch(victim.id);

        if (victim.id === robber.id) {
            return interaction.reply({ content: '❌ You cannot rob yourself.', ephemeral: true });
        }

        const now = Date.now();
        if (cooldowns.has(robber.id) && now - cooldowns.get(robber.id) < COOLDOWN) {
            const remaining = Math.ceil((COOLDOWN - (now - cooldowns.get(robber.id))) / 1000);
            return interaction.reply({ content: `⏳ You must wait ${remaining}s before robbing again.`, ephemeral: true });
        }

        const robberBal = getBalance(robber.id);
        const victimBal = getBalance(victim.id);

        if (victimBal < 100) {
            return interaction.reply({ content: '❌ That person is too poor to rob.', ephemeral: true });
        }

      
        const hasProtectedRole = PROTECTED_ROLES.some(roleId => victimMember.roles.cache.has(roleId));

        let description;
        let success;

        if (hasProtectedRole) {
            
            const penalty = Math.floor(robberBal * 0.1);
            addMoney(robber.id, -penalty);
            success = false;
            description = `🚨 <@${robber.id}> tried to rob <@${victim.id}> who has a protected role and got caught! Lost **$${penalty}**.`;
        } else {
            
            success = Math.random() < 0.5;

            if (success) {
                
                const amountStolen = Math.floor(victimBal * (0.1 + Math.random() * 0.2));
                addMoney(robber.id, amountStolen);
                addMoney(victim.id, -amountStolen);

                description = `💸 <@${robber.id}> successfully robbed <@${victim.id}> and stole **$${amountStolen}**!`;
            } else {
                
                const penalty = Math.floor(robberBal * 0.1);
                addMoney(robber.id, -penalty);

                description = `🚨 <@${robber.id}> tried to rob <@${victim.id}> but got caught and lost **$${penalty}** as a fine!`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('⚔️ Robbery Attempt')
            .setColor(success ? 'Green' : 'Red')
            .setDescription(description)
            .setTimestamp();

        cooldowns.set(robber.id, now);
        await interaction.reply({ embeds: [embed] });
    }
};
