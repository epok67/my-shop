const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View purchase stats')
        .addUserOption(option => option.setName('user').setDescription('Optional: User to check')),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user') || interaction.user;
        
        const stats = await UserStats.findOne({ userId: user.id });

        if (!stats) {
            return interaction.editReply(`No sales data found for **${user.username}**.`);
        }

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`📊 Sales Stats: ${user.username}`)
            .addFields(
                { name: 'Total Revenue', value: `$${stats.totalSold.toFixed(2)}`, inline: true },
                { name: 'Total Transactions', value: `${stats.count}`, inline: true },
                { name: 'Latest Item', value: `${stats.lastPurchaseItem || 'N/A'}` }
            );

        await interaction.editReply({ embeds: [embed] });
    },
};