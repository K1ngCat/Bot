const { EmbedBuilder } = require('discord.js');

class EmbedBuilderUtil {
    static formatDate(date) {
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }

    static getSessionPingEmbed(timeHours, timeMinutes, cooldown) {
        const now = new Date();
        const startTime = new Date(now.getTime() + (timeHours * 60 * 60 * 1000) + (timeMinutes * 60 * 1000));
        
        return new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎮 Gaming Session Starting Soon!')
            .setDescription('React with ✅ to get notified when the session starts!')
            .addFields(
                { name: '⏰ Start Time', value: this.formatDate(startTime), inline: true },
                { name: '⏱️ Cooldown', value: `${cooldown} minutes`, inline: true },
                { name: '📅 Date', value: startTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Get ready for an amazing gaming experience!' });
    }

    static getSessionStartEmbed(link, participants) {
        return new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🚀 Session Started!')
            .setDescription('Check your DMs for the join link!')
            .addFields(
                { name: '🔗 Join Link', value: link || 'Not provided', inline: true },
                { name: '👥 Participants', value: participants.length > 0 ? participants.join(', ') : 'No participants yet', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Have fun gaming!' });
    }

    static getReinvitesEmbed() {
        return new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🔄 Reinvites Available!')
            .setDescription('Click the button below to get a new invite link if you missed the session!')
            .setTimestamp()
            .setFooter({ text: 'Reinvites will be available for a few minutes' });
    }

    static getSessionEndEmbed() {
        return new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Session Ended')
            .setDescription('This session has officially ended. Please wait for the next one!')
            .setTimestamp()
            .setFooter({ text: 'Thanks for participating!' });
    }

    static getDMEmbed(link, isReinvite = false) {
        return new EmbedBuilder()
            .setColor(isReinvite ? 0xFFA500 : 0x00FF00)
            .setTitle(isReinvite ? '🔄 New Invite Link' : '🎮 Session Starting!')
            .setDescription(isReinvite 
                ? 'Here is your new invite link for the session:' 
                : 'The session is starting! Here is your invite link:')
            .addFields(
                { name: '🔗 Join Link', value: link || 'Not provided', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: isReinvite ? 'Enjoy the session!' : 'Have fun gaming!' });
    }
}

module.exports = EmbedBuilderUtil;