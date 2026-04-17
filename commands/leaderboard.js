const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top financial performers'),

    async execute(interaction) {
        await interaction.deferReply();

        // Fetch top 10
        const topBought = await UserStats.find().sort({ totalBought: -1 }).limit(10);
        const topSold = await UserStats.find().sort({ totalSold: -1 }).limit(10);

        // Map function to show mentions instead of usernames
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