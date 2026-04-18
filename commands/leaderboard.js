const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Top buyers by USD volume'),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const top = await UserStats.find({ purchasedUSD: { $gt: 0 } }).sort({ purchasedUSD: -1 }).limit(10);

            const embed = new EmbedBuilder()
                .setColor(0xF1C40F)
                .setTitle('<:Epok_DiamondShine:1404982812993654795> Top Spenders Leaderboard (USD)')
                .setDescription(top.length > 0 ? top.map((u, i) => `**${i + 1}.** <@${u.userId}> - \`$${u.purchasedUSD.toFixed(2)}\``).join('\n') : 'No data yet.')
                .setFooter({ text: '⚠️ Note: Robux transactions are not included in this leaderboard.' });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) { console.error(err); }
    }
}; 