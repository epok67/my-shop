const mongoose = require('mongoose');
const { Transaction, UserStats } = require('./models/Transaction');

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const data = [
        { id: '1491189501165437129', item: 'YELLOW 4', amt: 9, pay: 'Cards', type: 'purchase' },
        { id: '724421552619258007', item: 'DUPED GREEN 5', amt: 15, pay: 'ETH (Crypto)', type: 'purchase' }
    ];

    for (const d of data) {
        await Transaction.create({
            userId: d.id, transactionId: 'RECOVERED', type: d.type,
            amountUSD: d.amt, amountRobux: 0, item: d.item, payment: d.pay, date: new Date()
        });
        await UserStats.findOneAndUpdate(
            { userId: d.id },
            { $inc: { purchasedUSD: d.amt, countDeals: 1 } },
            { upsert: true }
        );
    }
    console.log("Data restored.");
    process.exit();
}
fix();