const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetstats')
        .setDescription('!!! PERMANENTLY WIPE ALL STORE DATA !!!'),
    
    async execute(interaction) {
        // --- REPLACE WITH YOUR DISCORD USER ID ---
        const OWNER_ID = "YOUR_ID_HERE"; 
        
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply("❌ You do not have permission to do this!");
        }

        try {
            const filePath = path.join(__dirname, '..', 'data', 'transactions.json');
            
            // Overwrite with empty array
            fs.writeFileSync(filePath, JSON.stringify({ transactions: [] }, null, 2));

            await interaction.reply("✅ All store data has been wiped.");
        } catch (error) {
            console.error(error);
            await interaction.reply("❌ Failed to wipe data. Check the server console.");
        }
    },
};