const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats, Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View comprehensive financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        
        const stats = await UserStats.findOne({ userId: target.id });
        const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 });

        if (!stats || txs.length === 0) {
            return interaction.editReply(`No records found for **${target.username}**.`);
        }

        const counts = {};
        txs.forEach(t => { if(t.item) counts[t.item] = (counts[t.item] || 0) + 1; });
        const favItem = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        
        const latestTx = txs[0];
        const avgUSD = (stats.purchasedUSD || 0) / (stats.countDeals || 1);
        const lastTs = Math.floor(stats.lastPurchaseDate.getTime() / 1000);

        const lastAmount = latestTx.payment === 'Robux' 
            ? `<:Epok_Robux:1394440796211515402> ${latestTx.amountRobux.toLocaleString()}` 
            : `$${latestTx.amountUSD.toFixed(2)}`;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: `Full Audit: ${target.tag}`, iconURL: target.displayAvatarURL() })
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setTitle('💼 Comprehensive Financial Overview')
            .addFields(
                // USD Row
                { name: '🛒 Total Purchased (USD)', value: `\`$${(stats.purchasedUSD || 0).toFixed(2)}\``, inline: true },
                { name: '🤝 Total Sold (USD)', value: `\`$${(stats.soldUSD || 0).toFixed(2)}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, // Spacer
                
                // Robux Row
                { name: '🛒 Total Purchased (R$)', value: `<:Epok_Robux:1394440796211515402> \`${(stats.purchasedRobux || 0).toLocaleString()}\``, inline: true },
                { name: '🤝 Total Sold (R$)', value: `<:Epok_Robux:1394440796211515402> \`${(stats.soldRobux || 0).toLocaleString()}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, // Spacer
                
                // General Stats
                { name: '📊 Total Deals', value: `\`${stats.countDeals}\` Transactions`, inline: true },
                { name: '💎 Highest Deal', value: `\`$${(stats.highestDeal || 0).toFixed(2)}\``, inline: true },
                { name: '📈 Average USD Deal', value: `\`$${avgUSD.toFixed(2)}\``, inline: true },
                
                // Bottom Details
                { name: '✨ Favorite Item', value: `📦 **${favItem.toUpperCase()}** (${counts[favItem]} deals)`, inline: false },
                { name: '🕒 Last Transaction', value: `**Item:** ${latestTx.item.toUpperCase()}\n**Amount:** ${lastAmount}\n**Date:** <t:${lastTs}:f>`, inline: false }
            )
            .setFooter({ text: 'Epok\'s Store Advanced Tracking System', iconURL: interaction.guild.iconURL() });

        await interaction.editReply({ embeds: [embed] });
    }
};