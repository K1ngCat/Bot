const fs = require('fs');
const path = require('path');

// CORRECTED LINE: Using process.cwd() for a more reliable path to the root directory
const filePath = path.join(process.cwd(), 'data', 'lottery.json');

// Funktion zum Initialisieren der Datei, falls sie nicht existiert
const initializeLotteryFile = () => {
    try {
        // Überprüfen, ob die Datei existiert.
        if (!fs.existsSync(filePath)) {
            // Wenn nicht, erstellen wir sie mit einem leeren JSON-Objekt.
            fs.writeFileSync(filePath, '{}', 'utf8');
            console.log('Lottery file was not found, created a new one.');
        }
    } catch (error) {
        console.error('Error initializing lottery file:', error);
    }
};

// Sicherstellen, dass die Datei existiert, bevor wir fortfahren
initializeLotteryFile();

// Funktion zum Lesen der Lotteriedaten
const readLotteryData = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading lottery data:', error);
        return {};
    }
};

// Funktion zum Schreiben der Lotteriedaten
const writeLotteryData = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing lottery data:', error);
    }
};

/**
 * Fügt einem Benutzereintrag ein Lotterielos hinzu.
 * @param {string} userId Die ID des Benutzers.
 */
const addLotteryEntry = (userId) => {
    const entries = readLotteryData();
    entries[userId] = (entries[userId] || 0) + 1;
    writeLotteryData(entries);
};

/**
 * Ruft alle Lotterie-Einträge ab.
 * @returns {Object} Ein Objekt, dessen Schlüssel Benutzer-IDs und dessen Werte die Anzahl der Lose sind.
 */
const getLotteryEntries = () => {
    return readLotteryData();
};

/**
 * Löscht alle Lotterie-Einträge nach einer Ziehung.
 */
const clearLotteryEntries = () => {
    writeLotteryData({});
};

module.exports = {
    addLotteryEntry,
    getLotteryEntries,
    clearLotteryEntries
};
