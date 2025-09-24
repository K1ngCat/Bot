const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBalance, addMoney } = require('../economyStore');

// === Configuration ===
const COOLDOWN = 60 * 1000; // 1 minute
const MAX_BET = 1000;
const MAX_WIN = 250000;
const cooldowns = new Map();
const VIP_ROLES = ["1409481150447091803", "1372089433876070450"];
const REAL_VIP = "1409486868214452255"; // special VIP

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-blackjack')
        .setDescription('Play blackjack and bet money')
        .addIntegerOption(option => option.setName('bet').setDescription('Amount of money to bet').setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const member = interaction.member;
        const isVIP = member.roles.cache.some(r => VIP_ROLES.includes(r.id));
        const isRealVIP = member.roles.cache.has(REAL_VIP);
        const now = Date.now();

        const currentCooldown = isRealVIP ? COOLDOWN / 2 : COOLDOWN;
        const currentMaxBet = isRealVIP ? MAX_BET * 2 : MAX_BET;

        if (!isVIP && cooldowns.has(userId) && now - cooldowns.get(userId) < currentCooldown) {
            const remaining = Math.ceil((currentCooldown - (now - cooldowns.get(userId))) / 1000);
            return interaction.reply({ content: `⏳ Wait ${remaining}s before playing again.`, ephemeral: true });
        }

        const bet = interaction.options.getInteger('bet');
        const balance = getBalance(userId);

        if (bet <= 0) return interaction.reply({ content: "❌ Enter a valid bet amount.", ephemeral: true });
        if (balance < bet) return interaction.reply({ content: "❌ You don’t have enough money.", ephemeral: true });
        if (!isVIP && bet > currentMaxBet) return interaction.reply({ content: `❌ Maximum bet is $${currentMaxBet}.`, ephemeral: true });

        // Add user to cooldown
        if (!isVIP) cooldowns.set(userId, now);

        // Deck of cards setup with updated icons
        const suits = ["♠️", "♥️", "♦️", "♣️"];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const deck = [];
        for (const suit of suits) {
            for (const value of values) {
                deck.push({ value, suit });
            }
        }

        // Helper function to draw a card and remove it from the deck
        function drawCard(d) {
            return d.splice(Math.floor(Math.random() * d.length), 1)[0];
        }

        // Helper function to calculate the score of a hand
        function calcScore(cards) {
            let score = 0, aces = 0;
            for (const c of cards) {
                if (["J", "Q", "K"].includes(c.value)) score += 10;
                else if (c.value === "A") { score += 11; aces++; }
                else score += Number(c.value);
            }
            while (score > 21 && aces) { score -= 10; aces--; }
            return score;
        }

        let playerCards = [drawCard(deck), drawCard(deck)];
        let dealerCards = [drawCard(deck), drawCard(deck)];

        // Helper function to format cards with bigger, bold text
        const makeHandString = (cards, hidden = false) => {
            if (hidden) {
                return `**\`${cards[0].value}${cards[0].suit}\` + \`?\`**`;
            }
            return cards.map(c => `**\`${c.value}${c.suit}\`**`).join(" ");
        }

        // Initial embed with updated styling
        const initialEmbed = new EmbedBuilder()
            .setTitle("✨ Blackjack Time! ✨")
            .setColor("DarkButNotBlack")
            .setDescription(
                `**Your Hand:** \n# ${makeHandString(playerCards)}\n\n` +
                `**Dealer's Hand:** \n# ${makeHandString(dealerCards, true)}\n`
            )
            .addFields(
                { name: 'Your Total', value: `${calcScore(playerCards)}`, inline: true },
                { name: 'Bet:', value: `$${bet}`, inline: true },
            );

        // Action buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Hit 🃏').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('stand').setLabel('Stand ✋').setStyle(ButtonStyle.Danger)
            );

        // Take the bet money from the user
        addMoney(userId, -bet);
        
        const reply = await interaction.reply({ embeds: [initialEmbed], components: [row] });

        const collector = reply.createMessageComponentCollector({ time: 60000 });
        let finished = false;

        collector.on('collect', async i => {
            if (i.user.id !== userId) {
                return i.reply({ content: "❌ This is not your game!", ephemeral: true });
            }
            if (finished) {
                return i.deferUpdate();
            }

            if (i.customId === 'hit') {
                playerCards.push(drawCard(deck));
                const playerScore = calcScore(playerCards);
                
                if (playerScore > 21) {
                    finished = true;
                    collector.stop();
                    const loseEmbed = new EmbedBuilder()
                        .setTitle("💥 Bust! You Lost!")
                        .setColor("Red")
                        .setDescription(`Your Hand:\n# ${makeHandString(playerCards)}\n\n` +
                            `Dealer's Hand:\n# ${makeHandString(dealerCards)}\n`)
                        .addFields(
                            { name: 'Your Total', value: `${playerScore}`, inline: true },
                            { name: 'Dealer Total', value: `${calcScore(dealerCards)}`, inline: true },
                            { name: 'Outcome', value: `You lost **$${bet}**.` }
                        );
                    return i.update({ embeds: [loseEmbed], components: [] });
                }

                const newEmbed = new EmbedBuilder()
                    .setTitle("✨ Blackjack Time! ✨")
                    .setColor("DarkButNotBlack")
                    .setDescription(
                        `Your Hand:\n# ${makeHandString(playerCards)}\n\n` +
                        `Dealer's Hand:\n# ${makeHandString(dealerCards, true)}\n`
                    )
                    .addFields(
                        { name: 'Your Total', value: `${playerScore}`, inline: true },
                        { name: 'Bet:', value: `$${bet}`, inline: true },
                    );

                await i.update({ embeds: [newEmbed], components: [row] });
            }

            if (i.customId === 'stand') {
                finished = true;
                await i.deferUpdate();
                collector.stop();
            }
        });

        collector.on('end', async () => {
            if (finished && calcScore(playerCards) <= 21) {
                const playerScore = calcScore(playerCards);
                let dealerScore = calcScore(dealerCards);
                
                // This is the change to make it easier: the dealer now hits until their score is 18 or more
                while (dealerScore < 17) { // Reverted to a more balanced dealer logic
                    dealerCards.push(drawCard(deck));
                    dealerScore = calcScore(dealerCards);
                }

                let winnings = 0;
                let outcomeMessage;
                let color;

                if (dealerScore > 21 || playerScore > dealerScore) {
                    winnings = bet;
                    outcomeMessage = `🎉 You won **$${winnings}**!`;
                    color = "Green";
                } else if (playerScore === dealerScore) {
                    winnings = 0;
                    addMoney(userId, bet); // Return the initial bet
                    outcomeMessage = `🤝 It's a push! Your bet has been returned.`;
                    color = "Orange";
                } else {
                    winnings = -bet;
                    outcomeMessage = `💥 You lost **$${bet}**.`;
                    color = "Red";
                }

                // Apply max win limit if not a VIP
                if (!isVIP && winnings > MAX_WIN) {
                    winnings = MAX_WIN;
                }
                
                // Add or subtract the final winnings
                if (winnings !== 0) {
                     addMoney(userId, winnings);
                }

                const resultEmbed = new EmbedBuilder()
                    .setTitle("🃏 Game Over! 🃏")
                    .setColor(color)
                    .setDescription(`Your Hand:\n# ${makeHandString(playerCards)}\n\n` +
                        `Dealer's Hand:\n# ${makeHandString(dealerCards)}\n`)
                    .addFields(
                        { name: 'Your Total', value: `${playerScore}`, inline: true },
                        { name: 'Dealer Total', value: `${dealerScore}`, inline: true },
                        { name: 'Final Outcome', value: outcomeMessage },
                    );

                await interaction.editReply({ embeds: [resultEmbed], components: [] });
            }
        });
    }
};
