const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removetransaction')
        .setDescription('Remove a transaction by ID')
        .addStringOption(o => o.setName('txid').setDescription('The Transaction ID (from MongoDB)').setRequired(true)),

    async execute(interaction) {
        const txId = interaction.options.getString('txid');
        const tx = await Transaction.findById(txId);

        if (!tx) return interaction.reply({ content: "❌ Transaction not found.", ephemeral: true });

        // Update the user's total before deleting the record
        await UserStats.findOneAndUpdate(
            { userId: tx.userId },
            { 
                $inc: { 
                    totalSold: -tx.amount, 
                    countSold: -1 
                } 
            }
        );

        await Transaction.findByIdAndDelete(txId);
        await interaction.reply(`✅ Removed transaction ${txId} and updated user stats.`);
    }
};