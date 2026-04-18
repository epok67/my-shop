const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats, Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View detailed financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const stats = await UserStats.findOne({ userId: target.id });
        const txs = await Transaction.find({ userId: target.id });

        if (!stats || txs.length === 0) {
            return interaction.editReply(`No records found for **${target.username}**.`);
        }

        const counts = {};
        txs.forEach(t => { if(t.item) counts[t.item] = (counts[t.item] || 0) + 1; });
        const favItem = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        // Separate Metrics: Total Sold (Revenue) vs Total Bought (Expense)
        const totalSold = stats.totalRevenue || 0; // Revenue you made from them
        const totalBought = stats.totalSold || 0;  // Amount they spent

        const avgUSD = totalBought / stats.countSold;
        const lastTs = Math.floor(stats.lastPurchaseDate.getTime() / 1000);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: `${target.username}'s Financial Dossier`, iconURL: target.displayAvatarURL() })
            .addFields(
                { name: '📥 Total Bought', value: `\`$${totalBought.toFixed(2)}\``, inline: true },
                { name: '📤 Total Sold', value: `\`$${totalSold.toFixed(2)}\``, inline: true },
                { name: '💎 Highest Deal', value: `\`$${stats.highestSale.toFixed(2)}\``, inline: true },
                { name: '📊 Avg. Per Deal', value: `\`$${avgUSD.toFixed(2)}\``, inline: false },
                { name: '✨ Favorite Item', value: `📦 **${favItem}** (${counts[favItem]}x)`, inline: true },
                { name: '🕒 Last Activity', value: `<t:${lastTs}:R>`, inline: true }
            )
            .setFooter({ text: 'Epok\'s Store • Real-time Data' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};