const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rebuildstats')
        .setDescription('Force recalculate all totals including Robux'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            await UserStats.deleteMany({});
            const allTxs = await Transaction.find({});

            for (const tx of allTxs) {
                const usd = tx.amountUSD || 0;
                const rbx = tx.amountRobux || 0;
                const isPurchase = tx.type === 'purchase';

                await UserStats.findOneAndUpdate(
                    { userId: tx.userId },
                    { 
                        $inc: { 
                            purchasedUSD: isPurchase ? usd : 0,
                            soldUSD: !isPurchase ? usd : 0,
                            purchasedRobux: isPurchase ? rbx : 0,
                            soldRobux: !isPurchase ? rbx : 0,
                            countDeals: 1
                        }
                    },
                    { upsert: true }
                );
            }
            await interaction.editReply("✅ Stats rebuilt! Robux Leaderboard should now be populated.");
        } catch (err) { console.error(err); }
    }
};