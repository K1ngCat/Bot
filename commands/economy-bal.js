const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getLeaderboard } = require('../economyStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-bal')
        .setDescription("Check a user's balance and see the server's top players.")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose balance you want to check (defaults to you)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const leaderboard = getLeaderboard();

        if (!leaderboard || leaderboard.length === 0) {
            return interaction.reply({ content: "The economy has no players yet!", ephemeral: true });
        }

        const userEntry = leaderboard.find(([id]) => id === targetUser.id);
        const userRank = userEntry ? leaderboard.indexOf(userEntry) + 1 : 0;
        const userBalance = userEntry ? userEntry[1].money : 0;
        const totalUsers = leaderboard.length;

        const mainEmbed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('💰 Economy Overview')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                {
                    name: '🏆 Top 3 Richest',
                    value: leaderboard.slice(0, 3).map((user, index) => {
                        const medals = ['🥇', '🥈', '🥉'];
                        const formattedMoney = user[1].money.toLocaleString();
                        return `${medals[index]} <@${user[0]}>: **$${formattedMoney}**`;
                    }).join('\n') || 'Not enough players.',
                    inline: false,
                },
                {
                    name: `📊 Stats for ${targetUser.username}`,
                    value: `**Balance:** $${userBalance.toLocaleString()}\n**Rank:** ${userRank > 0 ? `#${userRank}` : 'Unranked'} / ${totalUsers}`,
                    inline: false,
                }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.username}` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_full_leaderboard')
                    .setLabel('View Full Leaderboard')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📖')
            );

        const response = await interaction.reply({
            embeds: [mainEmbed],
            components: [row]
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== interaction.user.id) {
                return buttonInteraction.reply({ content: "You can't use this button.", ephemeral: true });
            }

            await buttonInteraction.deferReply({ ephemeral: true });

            const pageSize = 10;
            const totalPages = Math.ceil(leaderboard.length / pageSize);
            let currentPage = 0;

            const getRankEmoji = (rank) => {
                if (rank === 1) return '🥇';
                if (rank === 2) return '🥈';
                if (rank === 3) return '🥉';
                return `**${rank}.**`;
            };

            const generateLeaderboardEmbed = (page) => {
                const start = page * pageSize;
                const end = start + pageSize;
                const pageData = leaderboard.slice(start, end);

                const description = pageData.map((user, index) => {
                    const rank = start + index + 1;
                    return `${getRankEmoji(rank)} <@${user[0]}> — 💰 $${user[1].money.toLocaleString()}`;
                }).join('\n');

                return new EmbedBuilder()
                    .setTitle("🏆 Server Economy Leaderboard")
                    .setColor("Gold")
                    .setDescription(description)
                    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
            };

            const generateLeaderboardButtons = (page) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('lb_first').setLabel('⏪').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                    new ButtonBuilder().setCustomId('lb_prev').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                    new ButtonBuilder().setCustomId('lb_next').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1),
                    new ButtonBuilder().setCustomId('lb_last').setLabel('⏩').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1)
                );
            };

            const leaderboardMessage = await buttonInteraction.editReply({
                embeds: [generateLeaderboardEmbed(currentPage)],
                components: [generateLeaderboardButtons(currentPage)],
                ephemeral: true
            });

            const lbCollector = leaderboardMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            lbCollector.on('collect', async (i) => {
                if (i.customId === 'lb_first') currentPage = 0;
                if (i.customId === 'lb_prev') currentPage--;
                if (i.customId === 'lb_next') currentPage++;
                if (i.customId === 'lb_last') currentPage = totalPages - 1;

                await i.update({
                    embeds: [generateLeaderboardEmbed(currentPage)],
                    components: [generateLeaderboardButtons(currentPage)]
                });
            });

            lbCollector.on('end', () => {
                const disabledButtons = generateLeaderboardButtons(currentPage);
                disabledButtons.components.forEach(b => b.setDisabled(true));
                buttonInteraction.editReply({ components: [disabledButtons] }).catch(() => {});
            });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                ButtonBuilder.from(row.components[0]).setDisabled(true)
            );
            response.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};