const fs = require('fs');
const path = require('path');

class SessionManager {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/sessions.json');
        this.ensureDataFileExists();
    }

    ensureDataFileExists() {
        const dir = path.dirname(this.dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.dataPath)) {
            fs.writeFileSync(this.dataPath, JSON.stringify({}));
        }
    }

    getSessions() {
        try {
            const data = fs.readFileSync(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading sessions:', error);
            return {};
        }
    }

    saveSessions(sessions) {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(sessions, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving sessions:', error);
            return false;
        }
    }

    createSession(channelId, messageId, timeHours, timeMinutes, cooldown) {
        const sessions = this.getSessions();
        const startTime = new Date();
        startTime.setHours(startTime.getHours() + timeHours);
        startTime.setMinutes(startTime.getMinutes() + timeMinutes);

        sessions[channelId] = {
            messageId,
            participants: [],
            reinviteUsers: [],
            startTime: startTime.toISOString(),
            cooldown,
            link: null
        };

        return this.saveSessions(sessions);
    }

    addParticipant(channelId, userId) {
        const sessions = this.getSessions();
        if (sessions[channelId] && !sessions[channelId].participants.includes(userId)) {
            sessions[channelId].participants.push(userId);
            return this.saveSessions(sessions);
        }
        return false;
    }

    addReinviteUser(channelId, userId) {
        const sessions = this.getSessions();
        if (sessions[channelId] && !sessions[channelId].reinviteUsers.includes(userId)) {
            sessions[channelId].reinviteUsers.push(userId);
            return this.saveSessions(sessions);
        }
        return false;
    }

    setSessionLink(channelId, link) {
        const sessions = this.getSessions();
        if (sessions[channelId]) {
            sessions[channelId].link = link;
            return this.saveSessions(sessions);
        }
        return false;
    }

    getSession(channelId) {
        const sessions = this.getSessions();
        return sessions[channelId] || null;
    }

    deleteSession(channelId) {
        const sessions = this.getSessions();
        if (sessions[channelId]) {
            delete sessions[channelId];
            return this.saveSessions(sessions);
        }
        return false;
    }

    cleanupExpiredSessions() {
        const sessions = this.getSessions();
        const now = new Date();
        
        for (const [channelId, session] of Object.entries(sessions)) {
            const sessionTime = new Date(session.startTime);
            const cooldownMs = session.cooldown * 60 * 1000;
            
            if (now.getTime() > sessionTime.getTime() + cooldownMs + 3600000) { // 1 hour after cooldown
                delete sessions[channelId];
            }
        }
        
        return this.saveSessions(sessions);
    }
}

module.exports = SessionManager;