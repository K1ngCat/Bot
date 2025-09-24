const fs = require('fs');
const path = './economy.json';

let economy = {};

// Load economy data from JSON on startup
try {
    if (fs.existsSync(path)) {
        economy = JSON.parse(fs.readFileSync(path, 'utf8'));
    }
} catch (err) {
    console.error("Failed to load economy data:", err);
}

// Save economy data to JSON
function saveEconomy() {
    fs.writeFileSync(path, JSON.stringify(economy, null, 2));
}

// Add money to a user
function addMoney(userId, amount) {
    if (!economy[userId]) economy[userId] = { money: 0, lastDaily: 0 };
    economy[userId].money += amount;
    saveEconomy();
    return economy[userId].money;
}

// Get a user's balance
function getBalance(userId) {
    if (!economy[userId]) economy[userId] = { money: 0, lastDaily: 0 };
    return economy[userId].money;
}

// Get ALL balances (needed for rank check)
function getAllBalances() {
    const balances = {};
    for (const [userId, data] of Object.entries(economy)) {
        balances[userId] = data.money;
    }
    return balances;
}

// Get the full sorted leaderboard
function getLeaderboard() {
    return Object.entries(economy)
        .sort((a, b) => b[1].money - a[1].money);
}

// Update daily claim time
function updateDaily(userId) {
    if (!economy[userId]) economy[userId] = { money: 0, lastDaily: 0 };
    economy[userId].lastDaily = Date.now();
    saveEconomy();
}

// Get last daily claim
function getLastDaily(userId) {
    if (!economy[userId]) economy[userId] = { money: 0, lastDaily: 0 };
    return economy[userId].lastDaily;
}

module.exports = {
    addMoney,
    getBalance,
    getAllBalances,
    getLeaderboard,
    updateDaily,
    getLastDaily
};