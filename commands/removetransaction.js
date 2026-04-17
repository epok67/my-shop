const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removetransaction')
        .setDescription('Remove a transaction and update user stats')
        .addStringOption(option => option.setName('id').setDescription('Transaction ID').setRequired(true)),

    async execute(interaction) {
        if (interaction.member.id !== '1278006636375576689' && !interaction.member.roles.cache.has('1278006636375576689')) {
            return interaction.reply({ content: '❌ Only admins can use this command!', ephemeral: true });
        }

        const id = interaction.options.getString('id').toUpperCase();
        const tx = await Transaction.findOneAndDelete({ txId: id });

        if (!tx) return interaction.reply({ content: "Order not found.", ephemeral: true });

        // Reverse the stats
        await UserStats.findOneAndUpdate(
            { userId: tx.buyerId },
            { $inc: { totalSold: -tx.amount, count: -1 } }
        );

        interaction.reply(`✅ Transaction **${id}** removed and stats updated.`);
    },
};