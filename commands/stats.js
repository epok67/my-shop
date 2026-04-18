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

        // Calculation Logic
        const counts = {};
        txs.forEach(t => { if(t.item) counts[t.item] = (counts[t.item] || 0) + 1; });
        const favItem = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        
        const latestTx = txs[0]; // Most recent deal
        const totalBoughtUSD = stats.totalSold || 0; // Amount customer spent
        const totalSoldUSD = stats.totalRevenue || 0; // Revenue you made
        const avgUSD = totalBoughtUSD / stats.countSold;
        const lastTs = Math.floor(stats.lastPurchaseDate.getTime() / 1000);

        // Determine amount string for the last transaction
        const lastAmount = latestTx.payment === 'Robux' 
            ? `<:Epok_Robux:1394440796211515402> ${latestTx.robuxAmount.toLocaleString()}` 
            : `$${latestTx.amount.toFixed(2)}`;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: `Full Audit: ${target.tag}`, iconURL: target.displayAvatarURL() })
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setTitle('💼 Comprehensive Financial Overview')
            .addFields(
                { name: '📥 Total Spent (USD)', value: `\`$${totalBoughtUSD.toFixed(2)}\``, inline: true },
                { name: '📤 Total Sold (Revenue)', value: `\`$${totalSoldUSD.toFixed(2)}\``, inline: true },
                { name: '🪙 Total Robux', value: `<:Epok_Robux:1394440796211515402> \`${(stats.totalRobux || 0).toLocaleString()}\``, inline: true },
                { name: '🤝 Total Deals', value: `\`${stats.countSold}\` Transactions`, inline: true },
                { name: '💎 Highest Deal', value: `\`$${stats.highestSale.toFixed(2)}\``, inline: true },
                { name: '📊 Average Deal', value: `\`$${avgUSD.toFixed(2)}\``, inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '✨ Favorite Item', value: `📦 **${favItem.toUpperCase()}** (${counts[favItem]} deals)`, inline: true },
                { name: '🕒 Last Transaction', value: `**Item:** ${latestTx.item.toUpperCase()}\n**Amount:** ${lastAmount}\n**Date:** <t:${lastTs}:F> (<t:${lastTs}:R>)`, inline: false }
            )
            .setFooter({ text: 'Epok\'s Store Advanced Tracking System', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};