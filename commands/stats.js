const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View comprehensive financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        
        const stats = await UserStats.findOne({ userId: target.id }) || {};
        const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 });

        if (txs.length === 0 && !stats.userId) {
            return interaction.editReply(`No records found for **${target.username}**.`);
        }

        let rPurchasedUSD = 0, rSoldUSD = 0, rPurchasedRobux = 0, rSoldRobux = 0, highestDeal = 0;
        const counts = {};

        txs.forEach(t => {
            if (t.item) counts[t.item] = (counts[t.item] || 0) + 1;
            const tUSD = t.amountUSD || t.amount || 0;
            const tRobux = t.amountRobux || t.robuxAmount || 0;
            const type = t.type || 'purchase';

            if (type === 'purchase') { rPurchasedUSD += tUSD; rPurchasedRobux += tRobux; } 
            else { rSoldUSD += tUSD; rSoldRobux += tRobux; }

            if (tUSD > highestDeal) highestDeal = tUSD;
        });

        const lPurchasedUSD = stats.purchasedUSD || stats.totalSold || stats.totalBought || 0;
        const lSoldUSD = stats.soldUSD || stats.totalRevenue || 0;
        const lPurchasedRobux = stats.purchasedRobux || stats.totalRobux || 0;
        const lSoldRobux = stats.soldRobux || 0;

        const finalPurchasedUSD = Math.max(lPurchasedUSD, rPurchasedUSD);
        const finalSoldUSD = Math.max(lSoldUSD, rSoldUSD);
        const finalPurchasedRobux = Math.max(lPurchasedRobux, rPurchasedRobux);
        const finalSoldRobux = Math.max(lSoldRobux, rSoldRobux);
        const finalHighest = Math.max(highestDeal, stats.highestDeal || 0);

        const totalDeals = Math.max(txs.length, stats.countDeals || 0);
        const favItem = Object.keys(counts).length > 0 ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) : 'N/A';
        const avgUSD = totalDeals > 0 ? ((finalPurchasedUSD + finalSoldUSD) / totalDeals) : 0;
        
        const lastTs = txs.length > 0 ? Math.floor(txs[0].date.getTime() / 1000) : null;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: `Full Audit: ${target.tag}`, iconURL: target.displayAvatarURL() })
            .setTitle('💼 Comprehensive Financial Overview')
            .addFields(
                { name: '🛒 Total Purchased (USD)', value: `\`$${finalPurchasedUSD.toFixed(2)}\``, inline: true },
                { name: '🤝 Total Sold (USD)', value: `\`$${finalSoldUSD.toFixed(2)}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '🛒 Total Purchased (R$)', value: `<:Epok_Robux:1394440796211515402> \`${finalPurchasedRobux.toLocaleString()}\``, inline: true },
                { name: '🤝 Total Sold (R$)', value: `<:Epok_Robux:1394440796211515402> \`${finalSoldRobux.toLocaleString()}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '📊 Total Deals', value: `\`${totalDeals}\` Transactions`, inline: true },
                { name: '💎 Highest Deal', value: `\`$${finalHighest.toFixed(2)}\``, inline: true },
                { name: '📈 Average USD Deal', value: `\`$${avgUSD.toFixed(2)}\``, inline: true },
                { name: '✨ Favorite Item', value: `📦 **${favItem.toUpperCase()}**`, inline: true },
                { name: '🕒 Last Transaction', value: lastTs ? `<t:${lastTs}:R>` : 'Unknown', inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};