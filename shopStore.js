const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'shopStore.json');

function load() {
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function save(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function addPurchase(userId, item, expiresAt) {
    const data = load();
    if (!data[userId]) data[userId] = {};
    data[userId][item] = expiresAt; // can be null for permanent
    save(data);
}

function getPurchase(userId, item) {
    const data = load();
    return data[userId] ? data[userId][item] : null;
}

function getAllPurchases() {
    return load();
}

function removePurchase(userId, item) {
    const data = load();
    if (data[userId]) {
        delete data[userId][item];
        if (Object.keys(data[userId]).length === 0) delete data[userId];
        save(data);
    }
}

module.exports = { addPurchase, getPurchase, removePurchase, getAllPurchases };
