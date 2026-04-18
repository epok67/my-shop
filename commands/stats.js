const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats, Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View detailed financial stats')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const stats = await UserStats.findOne({ userId: target.id });
        const txs = await Transaction.find({ userId: target.id });

        if (!stats || txs.length === 0) return interaction.editReply(`No records for ${target.username}.`);

        // Frequency-based Favorite Item Logic
        const counts = {};
        txs.forEach(t => { if(t.item) counts[t.item] = (counts[t.item] || 0) + 1; });
        const favItem = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        // Robux Conversion (1:1000 Rate)
        const robuxValue = Math.floor(stats.totalSold * 1000);
        const avgDealUSD = stats.totalSold / stats.countSold;
        const avgDealRobux = Math.floor(avgDealUSD * 1000);

        const lastTs = Math.floor(stats.lastPurchaseDate.getTime() / 1000);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`💼 Financial Dossier: ${target.username}`)
            .addFields(
                { name: '📤 Total Sales Value', value: `\`$${stats.totalSold.toFixed(2)}\` / \`R$ ${robuxValue.toLocaleString()}\``, inline: false },
                { name: '📦 Total Items Sold', value: `\`${stats.countSold}\` deals logged`, inline: true },
                { name: '💎 Highest Deal', value: `\`$${stats.highestSale.toFixed(2)}\``, inline: true },
                { name: '📊 Average Deal', value: `\`$${avgDealUSD.toFixed(2)}\` / \`R$ ${avgDealRobux.toLocaleString()}\``, inline: false },
                { name: '✨ Favorite Item', value: `📦 **${favItem}** (${counts[favItem]} times)`, inline: true },
                { name: '🕒 Last Transaction', value: `<t:${lastTs}:R>`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};