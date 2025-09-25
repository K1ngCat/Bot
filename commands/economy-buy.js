const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { addPurchase, getPurchase, removePurchase } = require('../shopStore'); 
const { getBalance, addMoney } = require('../economyStore'); 
const { addLotteryEntry, getLotteryEntries } = require('../lotteryStore'); 


const SHOP_ITEMS = [
    { label: 'VIP 30 Min', value: 'vip30', roleId: '1409486868214452255', duration: 30 * 60 * 1000, price: 20000 },
    { label: 'VIP 1 Hour', value: 'vip60', roleId: '1409486868214452255', duration: 60 * 60 * 1000, price: 40010 },
    { label: 'BVE 1 Day', value: 'bve1', roleId: '1404415599903244449', duration: 24 * 60 * 60 * 1000, price: 8000 },
    { label: 'BVE 3 Days', value: 'bve3', roleId: '1404415599903244449', duration: 3 * 24 * 60 * 60 * 1000, price: 20000 },
    { label: 'Gambling Mafia', value: 'member', roleId: '1409278757025611918', duration: null, price: 60000 },
    { label: 'Elon Musk', value: 'elon', roleId: '1409594907081052343', duration: null, price: 10000000 },
    
    { label: 'Lottery Ticket', value: 'lottery_ticket', duration: null, price: 1500 }
];

module.exports = {
  
    data: new SlashCommandBuilder()
        .setName('economy-buy')
        .setDescription('Open the shop and buy items'),
   
    async execute(interaction) {

       
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('shop-select')
                    .setPlaceholder('Select an item to buy')
                    .addOptions(
                        SHOP_ITEMS.map(i => ({
                            label: i.label,
                            value: i.value,
                            description: `${i.duration ? `Temporary (${i.duration/1000/3600}h)` : 'Permanent'} - $${i.price}`
                        }))
                    )
            );

        await interaction.reply({ content: '🛒 Choose what you want to buy:', components: [row], ephemeral: true });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id && i.isStringSelectMenu(),
            time: 60_000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: "❌ This isn't your shop!", ephemeral: true });

            collector.stop(); 

            const selected = SHOP_ITEMS.find(x => x.value === i.values[0]);
            if (!selected) return i.reply({ content: '❌ Invalid item.', ephemeral: true });

            const member = i.member;

           
            if (getPurchase(member.id, selected.value) && selected.value !== 'lottery_ticket') {
                return i.reply({ content: `❌ You already bought **${selected.label}**.`, ephemeral: true });
            }

           
            const balance = getBalance(member.id);
            if (balance < selected.price) {
                return i.reply({ content: `❌ You need $${selected.price} to buy this item.`, ephemeral: true });
            }

            
            addMoney(member.id, -selected.price);

            
            if (selected.value === 'lottery_ticket') {
                const entries = getLotteryEntries();
                if (entries[member.id] && entries[member.id] >= 5) { 
                    addMoney(member.id, selected.price);
                    return i.reply({ content: '❌ You have reached the maximum of 5 lottery tickets.', ephemeral: true });
                }

                addLotteryEntry(member.id);

                const dmEmbed = new EmbedBuilder()
                    .setTitle('🧾 Purchase Receipt')
                    .setColor('Gold')
                    .setDescription(`Thank you for your purchase! You've been entered into the next lottery drawing.`)
                    .addFields(
                        { name: 'Item', value: selected.label, inline: true },
                        { name: 'Price', value: `$${selected.price}`, inline: true }
                    )
                    .setFooter({ text: 'Use /lottery-info to see the current participants!' });

                await interaction.user.send({ embeds: [dmEmbed] });
                await i.update({ content: `✅ You purchased a **Golden Ticket**! Good luck!`, components: [] });

                const shopEmbed = new EmbedBuilder()
                    .setTitle('🎟️ New Golden Ticket Purchase!')
                    .setColor('DarkGold')
                    .setDescription(`${member} just bought a **Golden Ticket** for $${selected.price}. The pot is growing!`)
                    .setFooter({ text: 'Use /lottery-info to see your chances!' });
                
                return await interaction.channel.send({ embeds: [shopEmbed] });

            } else { 
               
                const role = member.guild.roles.cache.get(selected.roleId);
                if (!role) return i.reply({ content: '❌ Role not found.', ephemeral: true });
                await member.roles.add(role);

               
                if (selected.duration) {
                    addPurchase(member.id, selected.value, Date.now() + selected.duration);
                    setTimeout(async () => {
                        if (getPurchase(member.id, selected.value)) {
                            await member.roles.remove(role).catch(() => {});
                            removePurchase(member.id, selected.value);
                            member.send(`⏰ Your **${selected.label}** role expired!`);
                        }
                    }, selected.duration);
                } else {
                    addPurchase(member.id, selected.value, null);
                }
                
                
                const now = new Date();
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🧾 Purchase Receipt')
                    .setColor('Green')
                    .setDescription(`Thank you for your purchase!`)
                    .addFields(
                        { name: 'Item', value: selected.label, inline: true },
                        { name: 'Price', value: `$${selected.price}`, inline: true },
                        { name: 'Duration', value: selected.duration ? `${selected.duration/1000/3600} hours` : 'Permanent', inline: true },
                        { name: 'Date', value: `${now.toDateString()} ${now.toLocaleTimeString()}`, inline: true }
                    )
                    .setFooter({ text: 'Use /economy-buy to browse the shop again!' });

                await interaction.user.send({ embeds: [dmEmbed] });

               
                const shopEmbed = new EmbedBuilder()
                    .setTitle('🛒 New Purchase!')
                    .setColor('Blue')
                    .setDescription(`${member} bought **${selected.label}** for $${selected.price}`)
                    .addFields(
                        { name: 'Other items in shop', value: SHOP_ITEMS.filter(x => x.value !== selected.value).map(x => `${x.label} - $${x.price}${x.duration ? ` (${x.duration/1000/3600}h)` : ''}`).join('\n') }
                    )
                    .setFooter({ text: 'Use /economy-buy to get your own items!' });

                await i.update({ content: `✅ You purchased **${selected.label}**! Check your DMs.`, components: [] });
                await interaction.channel.send({ embeds: [shopEmbed] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) interaction.editReply({ content: '⏳ Shop selection timed out.', components: [] });
        });
    }
};
