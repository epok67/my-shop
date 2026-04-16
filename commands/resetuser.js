const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetuser')
        .setDescription('Wipe all store data for a specific user')
        .addUserOption(option => option.setName('user').setDescription('The user to wipe').setRequired(true)),
    
    async execute(interaction) {
        // --- YOUR ID CHECK ---
        // PASTE YOUR DISCORD ID BELOW WHERE IT SAYS "YOUR_ID_HERE"
        const MY_ID = "1371611239532199956"; 
        
        if (interaction.user.id !== MY_ID) {
            return interaction.reply("❌ You do not have permission to do this!");
        }

        const target = interaction.options.getUser('user');
        const filePath = path.join(__dirname, '..', 'data', 'transactions.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Keep all transactions EXCEPT the ones from this target user
        const originalCount = data.transactions.length;
        data.transactions = data.transactions.filter(t => t.buyerId !== target.id);
        const removedCount = originalCount - data.transactions.length;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        await interaction.reply(`✅ Wiped ${removedCount} records for ${target.username}.`);
    },
};