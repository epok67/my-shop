const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats, Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View your financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Check another user (Optional)').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const stats = await UserStats.findOne({ userId: target.id });

        if (!stats) return interaction.editReply(`No financial records found for ${target.username}.`);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyTxs = await Transaction.find({ userId: target.id, date: { $gte: thirtyDaysAgo } });
        const monthlySpent = monthlyTxs.reduce((sum, tx) => sum + tx.amount, 0);

        const embed = new EmbedBuilder()
            .setColor(0x7289DA)
            .setTitle(`💼 Financial Profile: ${target.username}`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '📊 Lifetime Performance', value: `Total Sold: $${stats.totalSold.toFixed(2)}\nTotal Bought: $${stats.totalBought.toFixed(2)}`, inline: true },
                { name: '📅 30-Day Activity', value: `Activity: $${monthlySpent.toFixed(2)}\nTransactions: ${monthlyTxs.length}`, inline: true },
                { name: '🏆 Milestones', value: `Highest Sale: $${stats.highestSale.toFixed(2)}\nTotal Sales: ${stats.countSold}`, inline: false },
                { name: '🕒 Recent', value: `Last Item: ${stats.lastPurchaseItem || 'N/A'}\nDate: ${stats.lastPurchaseDate?.toDateString() || 'N/A'}` }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};