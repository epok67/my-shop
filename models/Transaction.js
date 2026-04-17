const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    txId: String,
    buyerId: String,
    buyerTag: String,
    amount: Number,
    items: String,
    date: { type: Date, default: Date.now }
});

const UserStatsSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    username: String,
    totalSold: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    lastPurchaseItem: String,
    lastPurchaseDate: Date
});

module.exports = {
    Transaction: mongoose.model('Transaction', TransactionSchema),
    UserStats: mongoose.model('UserStats', UserStatsSchema)
};