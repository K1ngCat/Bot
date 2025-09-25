const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilderUtil = require('../utils/embedBuilder');
const SessionManager = require('../utils/sessionManager');

const sessionManager = new SessionManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sessioncancel')
        .setDescription('Cancel the current session and notify participants'),
    async execute(interaction) {
        const session = sessionManager.getSession(interaction.channelId);

        if (!session) {
            return await interaction.reply({ 
                content: 'No active session to cancel in this channel!', 
                ephemeral: true 
            });
        }

        try {
            // alle gespeicherten Teilnehmer informieren
            const participants = session.participants || [];
            const failedDMs = [];

            for (const userId of participants) {
                try {
                    const user = await interaction.client.users.fetch(userId);
                    const cancelEmbed = EmbedBuilderUtil.getCancelEmbed(); 
                    await user.send({ embeds: [cancelEmbed] });
                } catch (dmError) {
                    failedDMs.push(`<@${userId}>`);
                    console.error(`Failed to DM participant ${userId}:`, dmError);
                }
            }

            // Session aus Speicher löschen
            sessionManager.endSession(interaction.channelId);

            await interaction.reply({
                content: `❌ Session cancelled!\nNotified: ${participants.length} participants.` +
                         (failedDMs.length > 0 ? `\n⚠️ Failed: ${failedDMs.join(', ')}` : '')
            });

        } catch (error) {
            console.error('Error cancelling session:', error);
            await interaction.reply({ 
                content: 'There was an error cancelling the session!', 
                ephemeral: true 
            });
        }
    },
};
