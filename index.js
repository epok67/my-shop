const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');
const { watchLTC } = require('./services/ltcWatcher');
require('dotenv').config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.DirectMessages, 
        GatewayIntentBits.GuildMessages 
    ],
    partials: [Partials.Channel, Partials.Message] // Needed for DMs
});

client.commands = new Collection();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Error:', err));

const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(foldersPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.once('ready', () => {
    console.log(`🚀 Logged in as ${client.user.tag}!`);
    // Check LTC every 60 seconds
    setInterval(() => watchLTC(client), 60000);
});

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

client.login(process.env.DISCORD_TOKEN);