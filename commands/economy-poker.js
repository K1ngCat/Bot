const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getBalance, addMoney } = require('../economyStore');

const COOLDOWN = 3 * 60 * 1000;
const MAX_BET = 500;
const MAX_WIN = 100000;
const cooldowns = new Map();

const VIP_ROLES = ["1409481150447091803", "1372089433876070450", "1403091358419259433"];
const REAL_VIP = "1409486868214452255";

const suitEmojis = {
    "♠": "♠️",
    "♥": "♥️",
    "♦": "♦️",
    "♣": "♣️"
};

const suits = ["♠", "♥", "♦", "♣"];
const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];

const payouts = {
    "Royal Flush": 50,
    "Straight Flush": 20,
    "Four of a Kind": 15,
    "Full House": 10,
    "Flush": 8,
    "Straight": 6,
    "Three of a Kind": 4,
    "Two Pair": 3,
    "One Pair": 2,
    "High Card": 0
};


function buildDeck() {
    const deck = [];
    for (const s of suits) for (const v of values) deck.push({ v, s });
    return deck;
}


function draw(deck) {
    return deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
}


function evaluateHand(cards) {
    const counts = {};
    const vals = [];
    const flush = cards.every(c => c.s === cards[0].s);

    for (const c of cards) {
        counts[c.v] = (counts[c.v] || 0) + 1;
        vals.push(values.indexOf(c.v));
    }

    vals.sort((a, b) => a - b);
    const uniqueVals = [...new Set(vals)];
    const straight = uniqueVals.length === 5 && vals[4] - vals[0] === 4;

    const royal = flush && straight && vals[0] === 3; // A 10-J-Q-K-A straight

    if (royal) return "Royal Flush";
    if (straight && flush) return "Straight Flush";
    if (Object.values(counts).includes(4)) return "Four of a Kind";
    if (Object.values(counts).includes(3) && Object.values(counts).includes(2)) return "Full House";
    if (flush) return "Flush";
    if (straight) return "Straight";
    if (Object.values(counts).includes(3)) return "Three of a Kind";
    if (Object.values(counts).filter(x => x === 2).length === 2) return "Two Pair";
    if (Object.values(counts).includes(2)) return "One Pair";
    return "High Card";
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-poker')
        .setDescription('Play 5-card draw poker')
        .addIntegerOption(option => option.setName('bet').setDescription('The amount you want to bet.').setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const member = await interaction.guild.members.fetch(userId);
        const isVIP = member.roles.cache.some(r => VIP_ROLES.includes(r.id));
        const isRealVIP = member.roles.cache.has(REAL_VIP);
        const now = Date.now();

       
        let currentCooldown;
        let currentMaxBet;
        let maxRedraws;

        if (isVIP) {
            currentCooldown = 0;
            currentMaxBet = Infinity;
            maxRedraws = Infinity;
        } else if (isRealVIP) {
            currentCooldown = COOLDOWN / 2;
            currentMaxBet = MAX_BET * 2;
            maxRedraws = 4;
        } else {
            currentCooldown = COOLDOWN;
            currentMaxBet = MAX_BET;
            maxRedraws = 3;
        }

        const bet = interaction.options.getInteger('bet');
        const balance = getBalance(userId);

       
        if (bet > currentMaxBet) return interaction.reply({ content: `❌ Your maximum bet is $${currentMaxBet.toLocaleString()}.`, ephemeral: true });
        
        if (bet <= 0) return interaction.reply({ content: "❌ Please enter a valid bet greater than zero.", ephemeral: true });
        if (balance < bet) return interaction.reply({ content: "❌ You do not have enough money to place that bet.", ephemeral: true });

        const lastPlayed = cooldowns.get(userId);
        if (!isVIP && lastPlayed && (now - lastPlayed < currentCooldown)) {
            const remaining = Math.ceil((currentCooldown - (now - lastPlayed)) / 1000);
            return interaction.reply({ content: `⏳ You're on a cooldown! Please wait ${remaining} seconds.`, ephemeral: true });
        }
        if (!isVIP) cooldowns.set(userId, now);

        
        addMoney(userId, -bet);

        let deck = buildDeck();
        let hand = [draw(deck), draw(deck), draw(deck), draw(deck), draw(deck)];

        const makeHandString = () => hand.map(c => `**\`${c.v}${suitEmojis[c.s]}\`**`).join(" ");

        const embed = new EmbedBuilder()
            .setTitle("🎴 Poker: 5-Card Draw 🎴")
            .setColor("Blue")
            .setDescription(
                `🃏 **Your Hand:** 🃏\n\n` +
                `# ${makeHandString()}\n\n` +
                `You have **${maxRedraws}** redraws remaining.`
            )
            .setFooter({ text: "Click 'Draw New Cards' or 'Finish' to evaluate your hand." });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('draw').setLabel('🎲 Draw New Cards').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('finish').setLabel('✅ Finish').setStyle(ButtonStyle.Success)
            );

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
        let redraws = 0;

        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: "This is not your game!", ephemeral: true });

            if (i.customId === 'draw') {
                if (redraws >= maxRedraws) {
                    await i.update({ components: [] }); 
                    collector.stop('max_redraws');
                    return;
                }
                redraws++;

                if (deck.length < 5) {
                    deck = buildDeck();
                    await i.followUp({ content: "ℹ️ The deck was low and has been reshuffled.", ephemeral: true });
                }

                
                hand = [draw(deck), draw(deck), draw(deck), draw(deck), draw(deck)];

                const remainingRedraws = maxRedraws - redraws;
                const newEmbed = EmbedBuilder.from(embed)
                    .setDescription(
                        `🃏 **Your Hand:** 🃏\n\n` +
                        `# ${makeHandString()}\n\n` +
                        `You have **${remainingRedraws}** redraws remaining.`
                    );

                await i.update({ embeds: [newEmbed] });
            }

            if (i.customId === 'finish') {
                collector.stop();
            }
        });

        collector.on('end', async (collected, reason) => {
            const finalHandName = evaluateHand(hand);
            const multiplier = payouts[finalHandName] ?? 0;

            let totalPayout = (bet * multiplier);
            if (totalPayout > 0) {
                totalPayout += bet; 
            }

            
            if (!isVIP && totalPayout > MAX_WIN) {
                totalPayout = MAX_WIN;
            }

            let resultMessage = '';
            let color = '';

            if (totalPayout > 0) {
                addMoney(userId, totalPayout);
                resultMessage = `🎉 You won **$${totalPayout.toLocaleString()}**! (x${multiplier})`;
                color = multiplier >= 20 ? "Gold" : "Green";
            } else {
                resultMessage = `💸 You lost **$${bet.toLocaleString()}**`;
                color = "Red";
            }

            const resultEmbed = new EmbedBuilder()
                .setTitle("🎴 Poker Result 🎴")
                .setColor(color)
                .setDescription(
                    `🃏 **Final Hand:** 🃏\n\n` +
                    `# ${makeHandString()}\n\n` +
                    `───────────────\n` +
                    `**Hand:** ${finalHandName}\n` +
                    `**Bet:** $${bet.toLocaleString()}\n` +
                    resultMessage
                )
                .addFields({
                    name: "📊 Payout Table",
                    value: Object.entries(payouts).map(([handName, multi]) => `${handName}: x${multi}`).join("\n"),
                    inline: false
                });

            await interaction.editReply({ embeds: [resultEmbed], components: [] });
        });
    }
};