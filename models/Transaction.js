const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    transactionId: { type: String, unique: true }, // For your ID lookups
    type: { type: String, enum: ['purchase', 'sale'] }, 
    amountUSD: { type: Number, default: 0 },
    amountRobux: { type: Number, default: 0 },
    item: { type: String, uppercase: true },
    payment: { type: String },
    date: { type: Date, default: Date.now }
});

const userStatsSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    purchasedUSD: { type: Number, default: 0 },
    soldUSD: { type: Number, default: 0 },
    purchasedRobux: { type: Number, default: 0 },
    soldRobux: { type: Number, default: 0 },
    countDeals: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date }
});

module.exports = {
    Transaction: mongoose.model('Transaction', transactionSchema),
    UserStats: mongoose.model('UserStats', userStatsSchema)
};