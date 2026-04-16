const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");

// Replace these placeholders with your actual values
const TOKEN = "YOUR_TOKEN_HERE";
const CLIENT_ID = "1494079483656016022";
const GUILD_ID = "1278005202712137768";

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
  }
}

const rest = new REST().setToken(TOKEN);

(async () => {
  try {
    // STEP 1: Clear all existing commands for this guild
    console.log("Clearing old slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    // STEP 2: Deploy the new, clean set of commands
    console.log(`Refreshing ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Successfully reloaded commands.");
  } catch (error) {
    console.error(error);
  }
})();