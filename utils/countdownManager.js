const { EmbedBuilder } = require('discord.js');
const SessionManager = require('./sessionManager');

class CountdownManager {
    constructor() {
        this.activeCountdowns = new Map();
        this.sessionManager = new SessionManager();
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return {
            hours: hours % 24,
            minutes: minutes % 60,
            seconds: seconds % 60,
            totalMs: ms
        };
    }

    createCountdownEmbed(timeData, cooldown) {
        return new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎮 Gaming Session Starting Soon!')
            .setDescription('React with ✅ to get notified when the session starts!')
            .addFields(
                { name: '⏰ Time Remaining', value: `${timeData.hours}h ${timeData.minutes}m ${timeData.seconds}s`, inline: true },
                { name: '⏱️ Cooldown', value: `${cooldown} minutes`, inline: true },
                { name: '📅 Start Time', value: new Date(Date.now() + timeData.totalMs).toLocaleString(), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Get ready for an amazing gaming experience!' });
    }

    async startCountdown(channel, messageId, timeHours, timeMinutes, cooldown) {
        const totalMs = (timeHours * 60 * 60 * 1000) + (timeMinutes * 60 * 1000);
        const endTime = Date.now() + totalMs;
        
        // Store the countdown data
        this.activeCountdowns.set(messageId, {
            channelId: channel.id,
            messageId: messageId,
            endTime: endTime,
            cooldown: cooldown,
            interval: null
        });

        // Get the message
        let message;
        try {
            message = await channel.messages.fetch(messageId);
        } catch (error) {
            console.error('Error fetching message for countdown:', error);
            return;
        }

        // Update function
        const updateCountdown = async () => {
            const now = Date.now();
            const remaining = endTime - now;
            
            if (remaining <= 0) {
                // Countdown finished
                this.stopCountdown(messageId);
                
                const finishedEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⏰ Session Starting NOW!')
                    .setDescription('The session is starting! Use `/sessionstart` to begin!')
                    .setTimestamp()
                    .setFooter({ text: 'Session is ready to start!' });
                
                try {
                    await message.edit({ embeds: [finishedEmbed] });
                } catch (error) {
                    console.error('Error updating finished countdown:', error);
                }
                
                return;
            }

            const timeData = this.formatTime(remaining);
            
            try {
                const embed = this.createCountdownEmbed(timeData, cooldown);
                await message.edit({ embeds: [embed] });
            } catch (error) {
                console.error('Error updating countdown:', error);
                this.stopCountdown(messageId);
            }
        };

        // Initial update
        await updateCountdown();

        // Set up interval for updates (every 30 seconds)
        const interval = setInterval(updateCountdown, 30000);
        this.activeCountdowns.get(messageId).interval = interval;
    }

    stopCountdown(messageId) {
        const countdown = this.activeCountdowns.get(messageId);
        if (countdown && countdown.interval) {
            clearInterval(countdown.interval);
        }
        this.activeCountdowns.delete(messageId);
    }

    stopAllCountdowns() {
        for (const [messageId, countdown] of this.activeCountdowns) {
            if (countdown.interval) {
                clearInterval(countdown.interval);
            }
        }
        this.activeCountdowns.clear();
    }

    // Check for expired sessions on startup
    cleanupExpiredCountdowns() {
        const now = Date.now();
        for (const [messageId, countdown] of this.activeCountdowns) {
            if (countdown.endTime <= now) {
                this.stopCountdown(messageId);
            }
        }
    }
}

module.exports = CountdownManager;