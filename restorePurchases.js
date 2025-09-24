const { getAllPurchases, removePurchase } = require('./shopStore');

async function restorePurchases(client) {
    const purchases = getAllPurchases();

    for (const userId in purchases) {
        for (const itemKey in purchases[userId]) {
            const purchase = purchases[userId][itemKey];
            const guild = client.guilds.cache.first(); 
            if (!guild) continue;

            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) continue;

            const roleId = purchase.roleId;
            const role = guild.roles.cache.get(roleId);
            if (!role) continue;

            if (purchase.expiresAt && Date.now() >= purchase.expiresAt) {
                
                await member.roles.remove(role).catch(() => {});
                removePurchase(userId, itemKey);
                member.send(`⏰ Your **${itemKey}** role expired while I was offline!`).catch(() => {});
            } else if (purchase.expiresAt) {
                
                const remaining = purchase.expiresAt - Date.now();
                setTimeout(async () => {
                    await member.roles.remove(role).catch(() => {});
                    removePurchase(userId, itemKey);
                    member.send(`⏰ Your **${itemKey}** role expired!`).catch(() => {});
                }, remaining);
            }
        }
    }
}

module.exports = { restorePurchases };
