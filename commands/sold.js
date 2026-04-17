const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sold')
        .setDescription('View items and total amount sold by a user')
        .addUserOption(option => option.setName('user').setDescription('User to check').setRequired(true)),

    async execute(interaction) {
        if (interaction.member.id !== '1278006636375576689' && !interaction.member.roles.cache.has('1278006636375576689')) {
            return interaction.reply({ content: '❌ Only admins can use this command!', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const stats = await UserStats.findOne({ userId: user.id });
        const txs = await Transaction.find({ buyerId: user.id });

        if (!stats || txs.length === 0) return interaction.reply("No sales data found for this user.");

        const itemsList = txs.map(t => t.items).join(', ');

        const embed = new EmbedBuilder()
            .setTitle(`💼 Sales Report for ${user.username}`)
            .addFields(
                { name: 'Total Amount Sold', value: `$${stats.totalSold.toFixed(2)}`, inline: true },
                { name: 'Items Sold', value: itemsList || 'None' }
            );
        interaction.reply({ embeds: [embed] });
    },
};