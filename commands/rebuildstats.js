const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rebuildstats')
        .setDescription('!!! ADMIN: Migrates all history to Bought and clears Sold !!!'),

    async execute(interaction) {
        // Replace with your actual Discord User ID
        if (interaction.user.id !== '1371611239532199956') {
            return interaction.reply({ content: "❌ Unauthorized.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        await UserStats.deleteMany({});
        const allTxs = await Transaction.find({});
        const statsMap = {};
        
        for (const tx of allTxs) {
            if (!statsMap[tx.userId]) {
                statsMap[tx.userId] = { 
                    userId: tx.userId, 
                    totalSold: 0, 
                    totalBought: 0, 
                    countSold: 0, 
                    countBought: 0, 
                    highestSale: 0 
                };
            }
            
            // Migrate history to 'Bought' only
            statsMap[tx.userId].totalBought += tx.amount;
            statsMap[tx.userId].countBought += 1;
            
            // Explicitly force Sold to 0
            statsMap[tx.userId].totalSold = 0;
            statsMap[tx.userId].countSold = 0;
            
            if (tx.amount > statsMap[tx.userId].highestSale) {
                statsMap[tx.userId].highestSale = tx.amount;
            }
        }
        
        await UserStats.insertMany(Object.values(statsMap));
        await interaction.editReply(`✅ Successfully migrated history to 'Bought' and cleared 'Sold' stats.`);
    }
};