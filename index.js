require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// ... (Your command loader code here) ...

async function startBot() {
    try {
        // We use a clean URI check because Railway sometimes adds extra characters
        const uri = process.env.MONGO_URI.trim();
        
        console.log("📡 Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("✅ Database Connected");

        // ONLY login once the database is 100% ready
        client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        console.error("❌ FATAL: Database connection failed. Bot will not start.");
        console.error(err.message);
        process.exit(1);
    }
}

// Update the event name to 'clientReady' to fix the warning in your logs
client.once('clientReady', c => {
    console.log(`🚀 Logged in as ${c.user.tag}!`);
});

startBot();