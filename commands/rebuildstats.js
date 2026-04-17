const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rebuildstats')
        .setDescription('!!! ADMIN: Rebuilds stats by moving ALL history to Bought !!!'),

    async execute(interaction) {
        // SECURITY: Only you can run this
        if (interaction.user.id !== '1371611239532199956') {
            return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        // 1. Wipe current stats
        await UserStats.deleteMany({});
        
        // 2. Fetch all transactions
        const allTxs = await Transaction.find({});
        
        // 3. Rebuild map (Logic swapped to totalBought)
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
            
            // SWAPPED LOGIC: Moving everything to Bought
            statsMap[tx.userId].totalBought += tx.amount;
            statsMap[tx.userId].countBought += 1;
            
            // Still tracking highestSale as a metric for performance
            if (tx.amount > statsMap[tx.userId].highestSale) {
                statsMap[tx.userId].highestSale = tx.amount;
            }
        }
        
        // 4. Save back to database
        const statsArray = Object.values(statsMap);
        await UserStats.insertMany(statsArray);
        
        await interaction.editReply(`✅ Successfully rebuilt all stats! History migrated to 'Bought' for ${statsArray.length} users.`);
    }
};