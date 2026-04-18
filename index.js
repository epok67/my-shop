require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MANDATORY DNS FIX FOR RAILWAY/WINDOWS
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); 

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected");
        client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        console.error("❌ Login Failed:", err);
    }
}

// Fixed event name to stop Railway crash loop
client.once('clientReady', c => {
    console.log(`🚀 Logged in as ${c.user.tag}!`);
});

start();