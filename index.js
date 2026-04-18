require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); 

// SAFE MODE: Only using the basic Guild intent. 
// This fixes the "Disallowed Intents" crash 100% of the time.
const client = new Client({ 
    intents: [ GatewayIntentBits.Guilds ] 
});

client.commands = new Collection();
const commandsPath = path.resolve(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded: ${command.data.name}`);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    console.log(`📥 [/${interaction.commandName}] called`);
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error.', ephemeral: true });
        }
    }
});

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🌐 DB Connected");
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err) { console.error("❌ Login Failed:", err); }
}

client.once('ready', c => console.log(`🚀 ONLINE: ${c.user.tag}`));
start();