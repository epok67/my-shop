const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View transaction stats')
        .addUserOption(option => option.setName('user').setDescription('User to view')),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const stats = await UserStats.findOne({ userId: user.id });

        if (!stats) return interaction.reply("No purchase history found for this user.");

        const embed = new EmbedBuilder()
            .setTitle(`📊 Stats for ${user.username}`)
            .addFields(
                { name: 'Total Spent', value: `$${stats.totalSold.toFixed(2)}`, inline: true },
                { name: 'Last Item', value: stats.lastPurchaseItem, inline: true },
                { name: 'Last Purchase Date', value: stats.lastPurchaseDate.toLocaleDateString(), inline: true }
            );
        interaction.reply({ embeds: [embed] });
    },
};