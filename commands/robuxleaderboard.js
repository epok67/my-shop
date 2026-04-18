const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('robuxleaderboard')
        .setDescription('Top buyers by Robux volume'),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const top = await UserStats.find({ purchasedRobux: { $gt: 0 } }).sort({ purchasedRobux: -1 }).limit(10);

            const embed = new EmbedBuilder()
                .setColor(0x7289DA)
                .setTitle('<:Epok_Robux:1394440796211515402> Top Spenders Leaderboard (Robux)')
                .setDescription(top.length > 0 ? top.map((u, i) => `**${i + 1}.** <@${u.userId}> - \`${u.purchasedRobux.toLocaleString()}\` R$`).join('\n') : 'No data yet.')
                .setFooter({ text: 'Epok\'s Store • Robux tracking' });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) { console.error(err); }
    }
};