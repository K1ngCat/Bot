const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, addMoney } = require('../economyStore');
const crypto = require('crypto');


const COOLDOWN = 60 * 1000; 
const MAX_BET = 250;
const MAX_WIN = 250000;
const cooldowns = new Map();
const VIP_ROLES = ["1409481150447091803", "1372089433876070450", "1403091358419259433"];
const REAL_VIP = "1409486868214452255";


function superRandom(max) {
    const strong = crypto.randomInt(0, max); 
    const weak = Math.floor(Math.random() * max); 
    return (strong + weak) % max;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-roulette')
        .setDescription('Bet on roulette (red, black, green, or odd/even)')
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Choose your bet: red, black, green, odd, or even')
                .setRequired(true)
                .addChoices(
                    { name: 'Red', value: 'red' },
                    { name: 'Black', value: 'black' },
                    { name: 'Green', value: 'green' },
                    { name: 'Odd', value: 'odd' },
                    { name: 'Even', value: 'even' }
                )
        )
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount of money to bet')
                .setRequired(true)
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const member = interaction.member;
        const isVIP = member.roles.cache.some(r => VIP_ROLES.includes(r.id));
        const isRealVIP = member.roles.cache.has(REAL_VIP);
        const now = Date.now();

        const currentCooldown = isRealVIP ? COOLDOWN / 2 : COOLDOWN;
        const currentMaxBet = isRealVIP ? MAX_BET * 2 : MAX_BET;

        const bet = interaction.options.getInteger('bet');
        const choice = interaction.options.getString('color').toLowerCase();
        const balance = getBalance(userId);

        
        if (bet <= 0)
            return interaction.reply({ content: "❌ Enter a valid bet amount.", ephemeral: true });
        if (balance < bet)
            return interaction.reply({ content: "❌ You don’t have enough money.", ephemeral: true });
        if (!isVIP && bet > currentMaxBet)
            return interaction.reply({ content: `❌ Maximum bet is $${currentMaxBet}.`, ephemeral: true });
        if (!isVIP && cooldowns.has(userId) && now - cooldowns.get(userId) < currentCooldown) {
            const remaining = Math.ceil((currentCooldown - (now - cooldowns.get(userId))) / 1000);
            return interaction.reply({ content: `⏳ Wait ${remaining}s before playing again.`, ephemeral: true });
        }
        if (!isVIP) cooldowns.set(userId, now);

        
        addMoney(userId, -bet);

        
        const spin = superRandom(51);
        let resultColor = "green"; 
        if (spin >= 5 && spin <= 27) {
            resultColor = "red";
        } else if (spin >= 28 && spin <= 50) {
            resultColor = "black";
        }

        
        let winnings = 0;
        let didWin = false;

        
        switch (choice) {
            case 'red':
            case 'black':
                didWin = (choice === resultColor);
                if (didWin) winnings = bet * 2;
                break;
            case 'green':
                didWin = (choice === resultColor);
                if (didWin) winnings = bet * 14;
                break;
            case 'odd':
                
                didWin = (spin > 0 && spin % 2 !== 0);
                if (didWin) winnings = bet * 2;
                break;
            case 'even':
                
                didWin = (spin > 0 && spin % 2 === 0);
                if (didWin) winnings = bet * 2;
                break;
        }

        
        if (!isVIP && winnings > MAX_WIN) {
            winnings = MAX_WIN;
        }

        
        if (winnings > 0) {
            addMoney(userId, winnings);
        }

       
        const embed = new EmbedBuilder()
            .setTitle("🎰 Roulette Wheel Spin")
            .setColor(didWin ? "Green" : "Red")
            .setDescription(`## **The ball landed on ${resultColor.toUpperCase()} (${spin})!**`)
            .addFields(
                { name: 'Your Bet', value: `$${bet} on **${choice.toUpperCase()}**`, inline: true },
                { name: 'Outcome', value: didWin ? `🎉 You won **$${winnings}**!` : `💀 You lost your bet.`, inline: true }
            )
            .setFooter({ text: "Spin is chaos-random 🔮" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};