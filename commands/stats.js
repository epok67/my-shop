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

        // Logic for Most Frequent Item
        const counts = {};
        txs.forEach(t => { if(t.item) counts[t.item] = (counts[t.item] || 0) + 1; });
        const favItem = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        
        const lastTs = Math.floor(stats.lastPurchaseDate.getTime() / 1000);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: `${target.username}'s Dossier`, iconURL: target.displayAvatarURL() })
            .addFields(
                { name: '📥 Total Spent (USD)', value: `\`$${(stats.totalRevenue || 0).toFixed(2)}\``, inline: true },
                { name: '🪙 Total Robux (R$)', value: `<:Epok_Robux:1394440796211515402> \`${(stats.totalRobux || 0).toLocaleString()}\``, inline: true },
                { name: '📊 Total Deals', value: `\`${stats.countSold}\` logged`, inline: true },
                { name: '✨ Favorite Item', value: `📦 **${favItem}** (${counts[favItem]}x)`, inline: false },
                { name: '🕒 Last Activity', value: `<t:${lastTs}:R>`, inline: true }
            )
            .setFooter({ text: 'Epok\'s Store • Financial Tracking' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};