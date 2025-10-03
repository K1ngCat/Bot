// utils/countdownManager.js
const EmbedBuilderUtil = require('./embedBuilder');

class CountdownManager {
    constructor() {
        this.activeCountdowns = new Map();
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

    async startCountdown(channel, messageId, timeHours, timeMinutes, location, minReactions) {
        const totalMs = (timeHours * 60 * 60 * 1000) + (timeMinutes * 60 * 1000);
        const endTime = Date.now() + totalMs;

        this.activeCountdowns.set(messageId, {
            channelId: channel.id,
            messageId: messageId,
            endTime,
            location,
            minReactions,
            interval: null
        });

        let message;
        try {
            message = await channel.messages.fetch(messageId);
        } catch (error) {
            console.error('Error fetching message for countdown:', error);
            return;
        }

        const updateCountdown = async () => {
            const now = Date.now();
            const remaining = endTime - now;

            if (remaining <= 0) {
                this.stopCountdown(messageId);

                const finishedEmbed = EmbedBuilderUtil.getSessionPingEmbed(0, 0, location, minReactions);
                finishedEmbed
                    .setColor(0xFF0000)
                    .setTitle('⏰ Session Starting NOW!')
                    .setDescription('The session is starting! Use `/sessionstart` to begin!');

                try {
                    await message.edit({ embeds: [finishedEmbed] });
                } catch (error) {
                    if (error.code === 10008) {
                        console.warn(`Countdown message ${messageId} was deleted.`);
                    } else {
                        console.error('Error updating finished countdown:', error);
                    }
                }

                return;
            }

            const timeData = this.formatTime(remaining);
            try {
                const embed = EmbedBuilderUtil.getSessionPingEmbed(
                    timeData.hours,
                    timeData.minutes,
                    location,
                    minReactions
                );

                await message.edit({ embeds: [embed] });
            } catch (error) {
                if (error.code === 10008) {
                    console.warn(`Countdown message ${messageId} was deleted.`);
                } else {
                    console.error('Error updating countdown:', error);
                }
                this.stopCountdown(messageId);
            }
        };

        await updateCountdown();
        const interval = setInterval(updateCountdown, 30000); // alle 30s updaten
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
            if (countdown.interval) clearInterval(countdown.interval);
        }
        this.activeCountdowns.clear();
    }

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
