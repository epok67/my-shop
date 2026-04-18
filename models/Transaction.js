const mongoose = require('mongoose');

const txSchema = new mongoose.Schema({
    userId: String,
    transactionId: String,
    type: String,
    amountUSD: Number,
    amountRobux: Number,
    item: String,
    payment: String,
    date: { type: Date, default: Date.now }
});

const statsSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    purchasedUSD: { type: Number, default: 0 },
    soldUSD: { type: Number, default: 0 },
    purchasedRobux: { type: Number, default: 0 },
    soldRobux: { type: Number, default: 0 },
    countDeals: { type: Number, default: 0 },
    lastPurchaseDate: Date
});

module.exports = {
    Transaction: mongoose.model('Transaction', txSchema),
    UserStats: mongoose.model('UserStats', statsSchema)
};