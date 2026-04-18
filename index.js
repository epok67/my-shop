require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// DNS Fix for Windows/Railway connection stability
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Command Loader
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// Interaction Handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const errPayload = { content: '❌ Error executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(errPayload);
        else await interaction.reply(errPayload);
    }
});

// Boot Sequence
async function start() {
    try {
        console.log("📡 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI.trim());
        console.log("✅ Database Connected");
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        console.error("❌ Startup Failed:", err.message);
        process.exit(1);
    }
}

client.once('clientReady', c => console.log(`🚀 Logged in as ${c.user.tag}!`));
start();