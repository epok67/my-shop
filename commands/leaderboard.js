const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top traders'),

    async execute(interaction) {
        await interaction.deferReply();
        const allStats = await UserStats.find({});

        if (!allStats || allStats.length === 0) {
            return interaction.editReply('No data found for the leaderboard.');
        }

        const sortedUsers = allStats.map(s => {
            const bought = s.purchasedUSD || s.totalSold || s.totalBought || 0;
            const sold = s.soldUSD || s.totalRevenue || 0;
            return {
                userId: s.userId,
                totalVolume: bought + sold
            };
        }).sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 10);

        const embed = new EmbedBuilder()
            .setTitle('🏆 Top Traders Leaderboard')
            .setColor(0xFFD700);

        let description = '';
        sortedUsers.forEach((u, i) => {
            if (u.totalVolume > 0) {
                description += `**${i + 1}.** <@${u.userId}> - Volume: \`$${u.totalVolume.toFixed(2)}\`\n`;
            }
        });

        embed.setDescription(description || "No ranked traders yet.");
        await interaction.editReply({ embeds: [embed] });
    }
};