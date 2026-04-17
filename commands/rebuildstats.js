const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rebuildstats')
        .setDescription('!!! ADMIN: Rebuilds stats and removes empty users !!!'),

    async execute(interaction) {
        // REPLACE WITH YOUR DISCORD ID
        if (interaction.user.id !== '1371611239532199956') {
            return interaction.reply({ content: "❌ Unauthorized.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        // 1. Completely wipe the stats collection
        await UserStats.deleteMany({});
        
        // 2. Fetch all transaction records
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
            
            // Only aggregate Bought (as requested)
            statsMap[tx.userId].totalBought += tx.amount;
            statsMap[tx.userId].countBought += 1;
            
            // Track highest purchase
            if (tx.amount > statsMap[tx.userId].highestSale) {
                statsMap[tx.userId].highestSale = tx.amount;
            }
        }
        
        // 3. Only save users who actually have a balance > 0
        const statsArray = Object.values(statsMap).filter(s => s.totalBought > 0 || s.totalSold > 0);
        
        if (statsArray.length > 0) {
            await UserStats.insertMany(statsArray);
        }
        
        await interaction.editReply(`✅ Stats rebuilt. ${statsArray.length} users processed.`);
    }
};