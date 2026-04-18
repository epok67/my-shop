const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rebuildstats')
        .setDescription('Force recalculate all user statistics from scratch'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            await UserStats.deleteMany({}); // Wipe the old summary
            const allTxs = await Transaction.find({});

            for (const tx of allTxs) {
                const usd = tx.amountUSD || 0;
                const robux = tx.amountRobux || 0;
                const type = tx.type || 'purchase';

                await UserStats.findOneAndUpdate(
                    { userId: tx.userId },
                    { 
                        $inc: { 
                            purchasedUSD: type === 'purchase' ? usd : 0,
                            soldUSD: type === 'sale' ? usd : 0,
                            purchasedRobux: type === 'purchase' ? robux : 0,
                            soldRobux: type === 'sale' ? robux : 0,
                            countDeals: 1
                        }
                    },
                    { upsert: true }
                );
            }
            await interaction.editReply("✅ All user stats and leaderboards have been rebuilt from transaction history.");
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Rebuild failed.");
        }
    }
};