const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top traders'),

    async execute(interaction) {
        await interaction.deferReply();
        const allStats = await UserStats.find({});

        const sortedUsers = allStats.map(s => {
            const bought = s.purchasedUSD || s.totalSold || s.totalBought || 0;
            const sold = s.soldUSD || s.totalRevenue || 0;
            return { userId: s.userId, total: bought + sold };
        }).sort((a, b) => b.total - a.total).slice(0, 10);

        const embed = new EmbedBuilder()
            .setTitle('🏆 Top Traders Leaderboard')
            .setColor(0xFFD700)
            .setFooter({ text: '⚠️ Note: Robux transactions are not included in this leaderboard.' });

        let description = '';
        sortedUsers.forEach((u, i) => {
            if (u.total > 0) {
                description += `**${i + 1}.** <@${u.userId}> - Total: \`$${u.total.toFixed(2)}\`\n`;
            }
        });

        embed.setDescription(description || "No ranked traders yet.");
        await interaction.editReply({ embeds: [embed] });
    }
};