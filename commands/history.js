const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('List all transactions for a user')
        .addUserOption(option => option.setName('user').setDescription('The user').setRequired(true)),

    async execute(interaction) {
        if (interaction.member.id !== '1278006636375576689' && !interaction.member.roles.cache.has('1278006636375576689')) {
            return interaction.reply({ content: '❌ Only admins can use this!', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const allTransactions = await Transaction.find({ buyerId: user.id }).sort({ date: -1 });

        if (!allTransactions.length) return interaction.reply("No history found.");

        const historyList = allTransactions.map(tx => 
            `\`${tx.txId}\` | $${tx.amount.toFixed(2)} | ${tx.items}`
        ).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`📜 History: ${user.username}`)
            .setDescription(historyList.length > 4000 ? historyList.substring(0, 3997) + "..." : historyList);

        await interaction.reply({ embeds: [embed] });
    },
};