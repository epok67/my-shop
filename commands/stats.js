const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View your financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const stats = await UserStats.findOne({ userId: target.id });

        if (!stats) return interaction.editReply(`No records found for ${target.username}.`);

        const estDate = (date) => date ? date.toLocaleString('en-US', { timeZone: 'America/New_York' }) : 'Never';

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`💼 Financial Dossier: ${target.username}`)
            .setDescription(`**User:** <@${target.id}>`)
            .addFields(
                // Data stored in totalSold displays as "Total Bought"
                { name: '📥 Total Bought', value: `$${stats.totalSold.toFixed(2)}`, inline: true },
                { name: '📤 Total Sold', value: `$${stats.totalBought.toFixed(2)}`, inline: true },
                { name: '💎 Peak Performance', value: `Highest Transaction: $${stats.highestSale.toFixed(2)}`, inline: false },
                { name: '🕒 Recently Purchased', value: `**Item:** ${stats.lastPurchaseItem || 'None'}\n**At (EST):** ${estDate(stats.lastPurchaseDate)}`, inline: false }
            )
            .setFooter({ text: `Report generated: ${estDate(new Date())}` });

        await interaction.editReply({ embeds: [embed] });
    }
};