const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getLeaderboard } = require('../economyStore'); // Make sure this path is correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-leaderboard')
        .setDescription('Shows the richest players on the server with interactive pages.'),

    async execute(interaction) {
        const leaderboard = getLeaderboard(); // This should return an array like [['userId', { money: amount }], ...]

        if (!leaderboard || leaderboard.length === 0) {
            return interaction.reply({ content: "There's no one on the leaderboard yet!", ephemeral: true });
        }

        const pageSize = 10; // Number of users per page
        const totalPages = Math.ceil(leaderboard.length / pageSize);
        let currentPage = 0;

        // Function to get the emoji for the rank
        const getRankEmoji = (rank) => {
            if (rank === 1) return '🥇';
            if (rank === 2) return '🥈';
            if (rank === 3) return '🥉';
            return `**${rank}.**`; // For ranks 4 and above
        };

        // Function to generate the embed for the current page
        const generateEmbed = (page) => {
            const startIndex = page * pageSize;
            const endIndex = startIndex + pageSize;
            const currentPageData = leaderboard.slice(startIndex, endIndex);

            const description = currentPageData.map((user, index) => {
                const rank = startIndex + index + 1;
                const userId = user[0];
                const userData = user[1];
                // Format with commas for better readability, e.g., 1,000,000
                const formattedMoney = userData.money.toLocaleString(); 
                
                return `${getRankEmoji(rank)} <@${userId}> — 💰 $${formattedMoney}`;
            }).join('\n');

            return new EmbedBuilder()
                .setTitle("🏆 Server Economy Leaderboard")
                .setColor("Gold")
                .setDescription(description || "Nothing to see on this page.")
                .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
        };
        
        // Function to create the buttons
        const generateButtons = (page) => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('first_page')
                        .setLabel('⏪ First')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀️ Prev')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Next ▶️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page >= totalPages - 1),
                    new ButtonBuilder()
                        .setCustomId('last_page')
                        .setLabel('Last ⏩')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page >= totalPages - 1)
                );
        };
        
        // Send the initial reply
        const initialEmbed = generateEmbed(currentPage);
        const initialButtons = generateButtons(currentPage);
        
        const message = await interaction.reply({
            embeds: [initialEmbed],
            components: [initialButtons],
            fetchReply: true,
        });

        // Create a collector to listen for button clicks
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000, // Collector stays active for 60 seconds
        });

        collector.on('collect', async (buttonInteraction) => {
            // Only allow the original user to interact
            if (buttonInteraction.user.id !== interaction.user.id) {
                return buttonInteraction.reply({ content: "You can't use these buttons!", ephemeral: true });
            }

            // Update page based on button clicked
            if (buttonInteraction.customId === 'first_page') currentPage = 0;
            if (buttonInteraction.customId === 'prev_page') currentPage--;
            if (buttonInteraction.customId === 'next_page') currentPage++;
            if (buttonInteraction.customId === 'last_page') currentPage = totalPages - 1;
            
            // Generate the new embed and buttons for the updated page
            const newEmbed = generateEmbed(currentPage);
            const newButtons = generateButtons(currentPage);

            await buttonInteraction.update({
                embeds: [newEmbed],
                components: [newButtons],
            });
        });

        // When the collector times out, disable the buttons
        collector.on('end', () => {
            const disabledButtons = generateButtons(currentPage);
            disabledButtons.components.forEach(button => button.setDisabled(true));
            
            message.edit({ components: [disabledButtons] }).catch(console.error);
        });
    }
};