const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: String,
    transactionId: String,
    type: String, // 'purchase' or 'sale'
    amountUSD: { type: Number, default: 0 },
    amountRobux: { type: Number, default: 0 },
    item: String,
    payment: String,
    date: { type: Date, default: Date.now }
});

const userStatsSchema = new mongoose.Schema({
    userId: String,
    purchasedUSD: { type: Number, default: 0 },
    soldUSD: { type: Number, default: 0 },
    purchasedRobux: { type: Number, default: 0 },
    soldRobux: { type: Number, default: 0 },
    countDeals: { type: Number, default: 0 },
    lastPurchaseDate: Date
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const UserStats = mongoose.model('UserStats', userStatsSchema);

module.exports = { Transaction, UserStats };