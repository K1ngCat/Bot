// commands/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gvhrp-help')
        .setDescription('Shows a categorized list of all commands'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("📖 Help Menu")
            .setColor("Blue")
            .setDescription("Here’s a list of all available commands, grouped by category:")

            // --- Character Commands ---
            .addFields(
                { name: "👤 Character Commands", value: 
`• /character-create – Create a new character
• /character-delete – Delete one of your characters
• /checkcharacter – View your character details` }
            )

            // --- Registration Commands ---
            .addFields(
                { name: "🚗 Registration Commands", value: 
`• /registercar – Register a new car to your character
• /update-registration – Update car registration
• /deleteregistration – Delete a registration record
• /checkregistration – Check vehicle registration by plate` }
            )

            // --- Record Commands ---
            .addFields(
                { name: "📂 Record Commands | OCSO/WSP only", value: 
`• /checkrecord – Check a user’s ticket/record
• /wiperecord – Wipe a user’s record` }
            )

            // --- License Commands ---
            .addFields(
                { name: "🎫 License Commands | Staff only", value: 
`• /givelicense – Give a license to a user
• /removelicense – Remove a license from a user` }
            )

            // --- Ticket Commands ---
            .addFields(
                { name: "🚨 Ticket Commands", value: 
`• /ocso-ticket – Issue a ticket from OCSO
• /wsp-ticket – Issue a ticket from WSP
• /ticket-payoff – Pay off a ticket` }
            )

            // --- Wanted System ---
            .addFields(
                { name: "🚓 Wanted System | WSP/OCSO only", value: 
`• /wanted – Mark someone as wanted
• /unwanted – Remove someone from wanted list` }
            )

            // --- Session Commands ---
            .addFields(
                { name: "📅 Session Commands | Admin only ", value: 
`• /sessionstart – Start a session
• /sessionping – Ping the session
• /sessionend – End the session` }
            )

            // --- Economy System ---
            .addFields(
                { name: "💰 Economy Commands", value: 
`• /economy-bal [user] – Check balance (shows rank on leaderboard)
• /economy-leaderboard – See top richest users
• /economy-work – Work a random job (1h cooldown)
• /economy-daily – Claim daily reward (24h cooldown)
• /economy-collect – Collect session pay
• /economy-add-money – Admin only: add money
• /economy-pay – Send money to another player
• /economy-buy - Buy some items like VIP or BVE
• /economy-rob – Try to rob another player (chance-based)` }
            )

            // --- Casino Commands ---
            .addFields(
                { name: "🎲 Casino Commands", value: 
`• /economy-blackjack <bet> – Play Blackjack
• /economy-roulette <bet> <color> – Play Roulette
• /economy-slots <bet> – Play the Slot Machine
• /economy-poker <bet> – Play Poker` }
            )

            // --- Context Menu ---
            .addFields(
                { name: "📌 Context Menu", value: 
`• Save Car (Right-Click → Apps → Save Car)` }
            )

            .setFooter({ text: "Use /help anytime to see this menu. Economy + Casino = RP money system. Character/Registration/Tickets = RP law system." });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};