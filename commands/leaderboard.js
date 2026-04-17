const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top financial performers'),

    async execute(interaction) {
        await interaction.deferReply();

        // Query only users with balances > 0 to avoid empty entries
        const topBought = await UserStats.find({ totalBought: { $gt: 0 } }).sort({ totalBought: -1 }).limit(10);
        const topSold = await UserStats.find({ totalSold: { $gt: 0 } }).sort({ totalSold: -1 }).limit(10);

        const formatList = (list, key) => 
            list.map((u, i) => `${i + 1}. <@${u.userId}> - $${u[key].toFixed(2)}`).join('\n') || 'None';

        const embed = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle('🏆 Financial Leaderboard')
            .addFields(
                { name: '🛒 Top Spenders (Most Bought)', value: formatList(topBought, 'totalBought'), inline: true },
                { name: '💰 Top Earners (Most Sold)', value: formatList(topSold, 'totalSold'), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Economy Rankings' });

        await interaction.editReply({ embeds: [embed] });
    }
};