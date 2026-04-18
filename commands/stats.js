const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View comprehensive financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        
        // Fetch ALL transactions. We rebuild the stats from the actual receipts to prevent $0.00 errors.
        const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 });

        if (txs.length === 0) {
            return interaction.editReply(`No records found for **${target.username}**.`);
        }

        let purchasedUSD = 0, soldUSD = 0;
        let purchasedRobux = 0, soldRobux = 0;
        let highestDeal = 0;
        const counts = {};

        txs.forEach(t => {
            // Count favorite items
            if (t.item) counts[t.item] = (counts[t.item] || 0) + 1;

            // Legacy fallback logic to catch old database entries
            const tUSD = t.amountUSD || t.amount || 0;
            const tRobux = t.amountRobux || t.robuxAmount || 0;
            const type = t.type || 'purchase'; // Assumes old deals were purchases if unlabelled

            if (type === 'purchase') {
                purchasedUSD += tUSD;
                purchasedRobux += tRobux;
            } else {
                soldUSD += tUSD;
                soldRobux += tRobux;
            }

            // Track highest deal
            if (tUSD > highestDeal) highestDeal = tUSD;
        });

        const totalDeals = txs.length;
        const favItem = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const avgUSD = totalDeals > 0 ? ((purchasedUSD + soldUSD) / totalDeals) : 0;
        
        const latestTx = txs[0];
        const lastTs = Math.floor(latestTx.date.getTime() / 1000);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: `Full Audit: ${target.tag}`, iconURL: target.displayAvatarURL() })
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setTitle('💼 Comprehensive Financial Overview')
            .addFields(
                { name: '🛒 Total Purchased (USD)', value: `\`$${purchasedUSD.toFixed(2)}\``, inline: true },
                { name: '🤝 Total Sold (USD)', value: `\`$${soldUSD.toFixed(2)}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                
                { name: '🛒 Total Purchased (R$)', value: `<:Epok_Robux:1394440796211515402> \`${purchasedRobux.toLocaleString()}\``, inline: true },
                { name: '🤝 Total Sold (R$)', value: `<:Epok_Robux:1394440796211515402> \`${soldRobux.toLocaleString()}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                
                { name: '📊 Total Deals', value: `\`${totalDeals}\` Transactions`, inline: true },
                { name: '💎 Highest Deal', value: `\`$${highestDeal.toFixed(2)}\``, inline: true },
                { name: '📈 Average USD Deal', value: `\`$${avgUSD.toFixed(2)}\``, inline: true },
                
                { name: '✨ Favorite Item', value: `📦 **${favItem.toUpperCase()}** (${counts[favItem]} deals)`, inline: true },
                { name: '🕒 Last Transaction', value: `<t:${lastTs}:R>`, inline: true }
            )
            .setFooter({ text: 'Epok\'s Store Advanced Tracking System', iconURL: interaction.guild?.iconURL() });

        await interaction.editReply({ embeds: [embed] });
    }
};