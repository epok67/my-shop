require('dotenv').config();
const { REST, Routes } = require("discord.js");

// Replace these with your actual IDs
const TOKEN = process.env.MTQ5NDA3OTQ4MzY1NjAxNjAyMg.GcHysI.jJ73kIce8AIcrBTNlRv5H6AnhSejKdkpmveN5c;
const CLIENT_ID = "1494079483656016022";
const GUILD_ID = "1278005202712137768";

const rest = new REST().setToken(TOKEN);

(async () => {
  try {
    console.log("Clearing all global and guild commands...");

    // 1. Clear Guild Commands
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    
    // 2. Clear Global Commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });

    console.log("Success! All commands have been deleted.");
  } catch (error) {
    console.error(error);
  }
})();