const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, addMoney } = require('../economyStore');

const COOLDOWN = 60 * 1000;
const MAX_BET = 1000;
const MAX_WIN = 250000;
const cooldowns = new Map();
const VIP_ROLES = ["1409481150447091803","1372089433876070450", "1403091358419259433"];
const REAL_VIP = "1409486868214452255";

module.exports = {
    data:new SlashCommandBuilder()
        .setName('economy-slots')
        .setDescription('Play the casino slots!')
        .addIntegerOption(option=>option.setName('bet').setDescription('Amount to bet').setRequired(true)),
    async execute(interaction){
        const userId=interaction.user.id;
        const member=interaction.member;
        const isVIP=member.roles.cache.some(r=>VIP_ROLES.includes(r.id));
        const isRealVIP=member.roles.cache.has(REAL_VIP);
        const now=Date.now();

        const currentCooldown = isRealVIP ? COOLDOWN/2 : COOLDOWN;
        const currentMaxBet = isRealVIP ? MAX_BET*2 : MAX_BET;

        const bet=interaction.options.getInteger('bet');
        const balance=getBalance(userId);

        if(bet<=0) return interaction.reply({ content:"❌ Enter a valid bet amount.", ephemeral:true });
        if(balance<bet) return interaction.reply({ content:"❌ You don’t have enough money.", ephemeral:true });
        if(!isVIP && bet>currentMaxBet) return interaction.reply({ content:`❌ Maximum bet is $${currentMaxBet}.`, ephemeral:true });
        if(!isVIP && cooldowns.has(userId) && now-cooldowns.get(userId)<currentCooldown){
            const remaining=Math.ceil((currentCooldown-(now-cooldowns.get(userId)))/1000);
            return interaction.reply({ content:`⏳ Wait ${remaining}s before playing again.`, ephemeral:true });
        }
        if(!isVIP) cooldowns.set(userId, now);
        addMoney(userId,-bet);

        const reels=[
            { symbol:"🍒", weight:22, multiplier:2 },
            { symbol:"🍋", weight:15, multiplier:3 },
            { symbol:"🍊", weight:10, multiplier:5 },
            { symbol:"🍇", weight:9, multiplier:8 },
            { symbol:"🍉", weight:7, multiplier:10 },
            { symbol:"⭐", weight:5, multiplier:15 },
            { symbol:"💎", weight:2, multiplier:25 },
            { symbol:"7️⃣", weight:1, multiplier:50 }
        ];

        function spinReel(reels){
            const totalWeight=reels.reduce((sum,r)=>sum+r.weight,0);
            let rand=Math.floor(Math.random()*totalWeight);
            for(const r of reels){ if(rand<r.weight) return r; rand-=r.weight; }
        }

        const rollingEmbed=new EmbedBuilder().setTitle("🎰 Slots Machine 🎰").setColor("Blurple").setDescription("🎲 **Spinning...**");
        await interaction.reply({ embeds:[rollingEmbed] });
        await new Promise(resolve=>setTimeout(resolve,2000));

        const spin=[spinReel(reels),spinReel(reels),spinReel(reels)];
        let winnings=0;
        if(spin[0].symbol===spin[1].symbol && spin[1].symbol===spin[2].symbol) winnings=bet*spin[0].multiplier;
        else if(spin[0].symbol===spin[1].symbol || spin[1].symbol===spin[2].symbol || spin[0].symbol===spin[2].symbol){
            const matchingSymbol=spin[0].symbol===spin[1].symbol?spin[0]:spin[1].symbol===spin[2].symbol?spin[1]:spin[0];
            winnings=Math.floor(bet*(matchingSymbol.multiplier/2));
        }
        if(!isVIP && winnings>MAX_WIN) winnings=MAX_WIN;
        if(winnings>0) addMoney(userId,winnings); else addMoney(userId,-bet);

        const resultString = `\`\`\`\n           ${spin[0].symbol} | ${spin[1].symbol} | ${spin[2].symbol}     \n\`\`\``;
        const resultEmbed=new EmbedBuilder()
            .setTitle("🎰 Slots Result 🎰")
            .setColor(winnings>0?"Green":"Red")
            .setDescription(resultString)
            .addFields(
                { name:"💵 Bet", value:`$${bet}`, inline:true },
                { name:"🎉 Winnings", value:winnings>0?`$${winnings}`:`Lost $${bet}`, inline:true },
                { name:"📊 Payout Table", value:reels.map(r=>`${r.symbol} → x${r.multiplier}`).join("\n") }
            )
            .setFooter({ text:"Match 3 symbols for full payout, 2 symbols for half payout!" });

        await interaction.editReply({ embeds:[resultEmbed] });
    }
};
