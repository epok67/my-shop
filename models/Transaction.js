const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
    userId: String,
    purchasedUSD: { type: Number, default: 0 }, // They bought from you (USD)
    purchasedRobux: { type: Number, default: 0 }, // They bought from you (Robux)
    soldUSD: { type: Number, default: 0 }, // They sold to you (USD)
    soldRobux: { type: Number, default: 0 }, // They sold to you (Robux)
    countDeals: { type: Number, default: 0 },
    highestDeal: { type: Number, default: 0 },
    lastPurchaseItem: String,
    lastPurchaseDate: Date
});

const transactionSchema = new mongoose.Schema({
    userId: String,
    type: String, // 'buy' or 'sell'
    amountUSD: { type: Number, default: 0 },
    amountRobux: { type: Number, default: 0 },
    item: String,
    payment: String,
    date: Date
});

module.exports = {
    UserStats: mongoose.model('UserStats', userStatsSchema),
    Transaction: mongoose.model('Transaction', transactionSchema)
};