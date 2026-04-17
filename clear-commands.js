const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started clearing all application commands.');
        // Clear global commands
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        // Clear guild commands (replace YOUR_GUILD_ID with your actual server ID)
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
        console.log('Successfully deleted all global and guild commands.');
    } catch (error) {
        console.error(error);
    }
})();