const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats, Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View your detailed financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const stats = await UserStats.findOne({ userId: target.id });

        if (!stats) return interaction.editReply(`No records found for ${target.username}.`);

        // Calculate Monthly Data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyTxs = await Transaction.find({ userId: target.id, date: { $gte: thirtyDaysAgo } });
        const monthlySpent = monthlyTxs.reduce((sum, tx) => sum + tx.amount, 0);

        // Calculate "All Time" metrics
        const totalVolume = stats.totalSold + stats.totalBought;
        const profitLoss = (stats.totalSold - stats.totalBought).toFixed(2);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2) // Discord Blurple
            .setTitle(`💼 Financial Dossier: ${target.username}`)
            .setDescription(`**User:** <@${target.id}> (${target.username})`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '📥 Total Bought', value: `$${stats.totalBought.toFixed(2)}`, inline: true },
                { name: '📤 Total Sold', value: `$${stats.totalSold.toFixed(2)}`, inline: true },
                { name: '⚖️ Net Balance', value: `$${profitLoss}`, inline: true },
                { name: '📈 Transaction Velocity', value: `Total Lifetime Volume: $${totalVolume.toFixed(2)}\nMonthly Spend: $${monthlySpent.toFixed(2)}`, inline: false },
                { name: '💎 Peak Performance', value: `Highest Single Transaction: $${stats.highestSale.toFixed(2)}`, inline: false },
                { name: '🕒 Recently Purchased', value: `**Item:** ${stats.lastPurchaseItem || 'None'}\n**At:** ${stats.lastPurchaseDate ? stats.lastPurchaseDate.toLocaleString() : 'Never'}`, inline: false }
            )
            .setFooter({ text: `Dossier generated at: ${new Date().toLocaleString()}` });

        await interaction.editReply({ embeds: [embed] });
    }
};