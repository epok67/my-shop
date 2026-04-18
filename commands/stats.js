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
        
        try {
            const stats = await UserStats.findOne({ userId: target.id }) || {};
            const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 });

            if (txs.length === 0 && !stats.userId) {
                return interaction.editReply(`No records found for **${target.username}**.`);
            }

            let rPurchasedUSD = 0, rSoldUSD = 0, rPurchasedRobux = 0, rSoldRobux = 0;
            let bestTx = { item: 'None', value: 0, isRobux: false };

            txs.forEach(t => {
                const tUSD = t.amountUSD || 0;
                const tRobux = t.amountRobux || 0;
                const type = t.type || 'purchase';

                // Calculate Totals
                if (type === 'purchase') { rPurchasedUSD += tUSD; rPurchasedRobux += tRobux; } 
                else { rSoldUSD += tUSD; rSoldRobux += tRobux; }

                // Determine "Best Transaction" (Highest single value)
                if (tUSD > bestTx.value) {
                    bestTx = { item: t.item, value: tUSD, isRobux: false };
                } else if (tRobux > bestTx.value && !bestTx.isRobux) {
                    // Simple logic: If it's a huge Robux deal, it counts as "Best"
                    bestTx = { item: t.item, value: tRobux, isRobux: true };
                }
            });

            const finalPurchasedUSD = Math.max(rPurchasedUSD, stats.purchasedUSD || 0);
            const finalSoldUSD = Math.max(rSoldUSD, stats.soldUSD || 0);
            const finalPurchasedRobux = Math.max(rPurchasedRobux, stats.purchasedRobux || 0);
            const finalSoldRobux = Math.max(rSoldRobux, stats.soldRobux || 0);
            
            const bestDisplay = bestTx.item !== 'None' 
                ? `📦 **${bestTx.item.toUpperCase()}** (${bestTx.isRobux ? 'R$' : '$'}${bestTx.value.toLocaleString()})` 
                : '`N/A`';

            const lastTs = txs.length > 0 ? Math.floor(txs[0].date.getTime() / 1000) : null;

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setAuthor({ name: `Full Audit: ${target.tag}`, iconURL: target.displayAvatarURL() })
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setTitle('💼 Comprehensive Financial Overview')
                .addFields(
                    { name: '🛒 Total Purchased (USD)', value: `\`$${finalPurchasedUSD.toFixed(2)}\``, inline: true },
                    { name: '🤝 Total Sold (USD)', value: `\`$${finalSoldUSD.toFixed(2)}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '🛒 Total Purchased (R$)', value: `<:Epok_Robux:1394440796211515402> \`${finalPurchasedRobux.toLocaleString()}\``, inline: true },
                    { name: '🤝 Total Sold (R$)', value: `<:Epok_Robux:1394440796211515402> \`${finalSoldRobux.toLocaleString()}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '📊 Total Deals', value: `\`${txs.length || stats.countDeals || 0}\` Transactions`, inline: true },
                    { name: '🏆 Best Transaction', value: bestDisplay, inline: true },
                    { name: '🕒 Last Transaction', value: lastTs ? `<t:${lastTs}:R>` : 'No records', inline: true }
                )
                .setFooter({ text: 'Epok\'s Store Tracking System' });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) { console.error(err); }
    }
};