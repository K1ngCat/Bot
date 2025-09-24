const fs = require('fs');
const path = require('path');


const filePath = path.join(process.cwd(), 'data', 'lottery.json');


const initializeLotteryFile = () => {
    try {
        
        if (!fs.existsSync(filePath)) {
            
            fs.writeFileSync(filePath, '{}', 'utf8');
            console.log('Lottery file was not found, created a new one.');
        }
    } catch (error) {
        console.error('Error initializing lottery file:', error);
    }
};


initializeLotteryFile();


const readLotteryData = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading lottery data:', error);
        return {};
    }
};


const writeLotteryData = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing lottery data:', error);
    }
};


const addLotteryEntry = (userId) => {
    const entries = readLotteryData();
    entries[userId] = (entries[userId] || 0) + 1;
    writeLotteryData(entries);
};


const getLotteryEntries = () => {
    return readLotteryData();
};


const clearLotteryEntries = () => {
    writeLotteryData({});
};

module.exports = {
    addLotteryEntry,
    getLotteryEntries,
    clearLotteryEntries
};
