const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilderUtil = require('../utils/embedBuilder');
const SessionManager = require('../utils/sessionManager');

const sessionManager = new SessionManager();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sessionearlyaccess')
        .setDescription('Send early access link to selected participants')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The early access session link')
                .setRequired(true)),
    async execute(interaction) {
        const link = interaction.options.getString('link');
        const session = sessionManager.getSession(interaction.channelId);

        if (!session) {
            return await interaction.reply({ 
                content: 'No active session found in this channel!', 
                ephemeral: true 
            });
        }

        try {
            const earlyAccessUsers = session.earlyAccess || []; 
            const participants = [];
            const failedDMs = [];

            for (const userId of earlyAccessUsers) {
                try {
                    const user = await interaction.client.users.fetch(userId);
                    const dmEmbed = EmbedBuilderUtil.getDMEmbed(link);
                    await user.send({ embeds: [dmEmbed] });
                    participants.push(user.toString());
                } catch (dmError) {
                    failedDMs.push(`<@${userId}>`);
                    console.error(`Failed to DM early access user ${userId}:`, dmError);
                }
            }

            await interaction.reply({
                content: `✅ Early access started!\nSent to: ${participants.join(', ') || 'none'}` +
                         (failedDMs.length > 0 ? `\n⚠️ Failed: ${failedDMs.join(', ')}` : '')
            });

        } catch (error) {
            console.error('Error sending early access:', error);
            await interaction.reply({
                content: 'There was an error sending the early access invites!',
                ephemeral: true
            });
        }
    },
};
