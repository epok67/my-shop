const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removetransaction')
        .setDescription('Delete a transaction and update user stats')
        .addStringOption(o => o.setName('txid').setDescription('The Transaction ID (e.g., REC-4891 or 4891)').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const inputId = interaction.options.getString('txid').toUpperCase();
        
        // Clean the ID (removes "REC-" if you typed it, or keeps it if that's how it's stored)
        const cleanId = inputId.replace('REC-', '');

        try {
            // Search for the transaction using both possible formats
            const tx = await Transaction.findOne({ 
                $or: [
                    { transactionId: inputId }, 
                    { transactionId: cleanId }
                ] 
            });

            if (!tx) {
                return interaction.editReply(`❌ Could not find a transaction with ID: \`${inputId}\``);
            }

            // Remove the transaction
            await Transaction.deleteOne({ _id: tx._id });

            // Subtract from User Stats
            const type = tx.type || 'purchase';
            const usd = tx.amountUSD || 0;
            const robux = tx.amountRobux || 0;

            await UserStats.findOneAndUpdate(
                { userId: tx.userId },
                { 
                    $inc: { 
                        purchasedUSD: type === 'purchase' ? -usd : 0,
                        soldUSD: type === 'sale' ? -usd : 0,
                        purchasedRobux: type === 'purchase' ? -robux : 0,
                        soldRobux: type === 'sale' ? -robux : 0,
                        countDeals: -1
                    }
                }
            );

            await interaction.editReply(`✅ Successfully deleted transaction \`${tx.transactionId}\` and updated user stats.`);
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Error while trying to delete transaction.");
        }
    }
};