const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: String,
    amount: Number,
    item: String,
    payment: String, // Ensure this is here
    date: { type: Date, default: Date.now }
});

const UserStatsSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    totalSold: { type: Number, default: 0 },
    totalBought: { type: Number, default: 0 },
    countSold: { type: Number, default: 0 },
    countBought: { type: Number, default: 0 },
    highestSale: { type: Number, default: 0 },
    lastPurchaseItem: String,
    lastPurchaseDate: Date
});

module.exports = {
    Transaction: mongoose.model('Transaction', TransactionSchema),
    UserStats: mongoose.model('UserStats', UserStatsSchema)
};