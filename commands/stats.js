const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats, Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View detailed financial stats')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const stats = await UserStats.findOne({ userId: target.id });
        const txs = await Transaction.find({ userId: target.id });

        if (!stats || txs.length === 0) return interaction.editReply(`No records for ${target.username}.`);

        const getFav = (arr, key) => {
            const counts = {};
            arr.forEach(t => {
                if(t[key]) counts[t[key]] = (counts[t[key]] || 0) + 1;
            });
            return Object.keys(counts).length > 0 ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) : "N/A";
        };

        const favItem = getFav(txs, 'item');
        const favPayment = getFav(txs, 'payment');
        const estDate = (date) => date ? date.toLocaleString('en-US', { timeZone: 'America/New_York' }) : 'Never';

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`💼 Financial Dossier: ${target.username}`)
            .addFields(
                { name: '📥 Total Bought', value: `$${stats.totalSold.toFixed(2)}`, inline: true },
                { name: '💎 Highest Deal', value: `$${stats.highestSale.toFixed(2)}`, inline: true },
                { name: '✨ Favorite Item', value: `📦 ${favItem}`, inline: false },
                { name: '💳 Preferred Method', value: favPayment, inline: false },
                { name: '🕒 Last Transaction', value: `**Item:** ${stats.lastPurchaseItem}\n**Date:** ${estDate(stats.lastPurchaseDate)}`, inline: false }
            )
            .setFooter({ text: `Generated: ${estDate(new Date())}` });

        await interaction.editReply({ embeds: [embed] });
    }
};