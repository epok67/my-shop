require('dotenv').config(); 
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); 

const mongoose = require('mongoose');
const { Transaction, UserStats } = require('../models/Transaction');

async function fix() {
    let uri = process.env.MONGO_URI;
    
    if (!uri) {
        console.error("❌ ERROR: MONGO_URI is undefined.");
        process.exit(1);
    }

    // Auto-fix if "MONGO_URI=" was accidentally included in the value
    if (uri.startsWith('MONGO_URI=')) {
        uri = uri.replace('MONGO_URI=', '');
    }

    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Attempting connection to: ${maskedUri}`);
    
    try {
        await mongoose.connect(uri);
        console.log("✅ Connected successfully!");

        const data = [
            { id: '1491189501165437129', item: 'YELLOW 4', amt: 9, pay: 'Cards', type: 'purchase' },
            { id: '724421552619258007', item: 'DUPED GREEN 5', amt: 15, pay: 'ETH (Crypto)', type: 'purchase' }
        ];

        for (const d of data) {
            const txId = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
            
            await Transaction.create({
                userId: d.id, 
                transactionId: txId, 
                type: d.type,
                amountUSD: d.amt, 
                amountRobux: 0, 
                item: d.item, 
                payment: d.pay, 
                date: new Date()
            });
            
            await UserStats.findOneAndUpdate(
                { userId: d.id },
                { $inc: { purchasedUSD: d.amt, countDeals: 1 } },
                { upsert: true }
            );
            console.log(`✅ Restored: ${d.item} ($${d.amt}) for User ${d.id}`);
        }
        
        console.log("✨ All data successfully injected.");
        process.exit(0);
    } catch (err) {
        console.error("❌ FATAL ERROR:", err.message);
        process.exit(1);
    }
}

fix();