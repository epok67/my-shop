const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removetransaction')
        .setDescription('Remove a transaction by Order ID')
        .addIntegerOption(option => option.setName('id').setDescription('The Order ID').setRequired(true)),

    async execute(interaction) {
        const id = interaction.options.getInteger('id');
        const filePath = path.join(__dirname, '..', 'data', 'transactions.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const index = data.transactions.findIndex(t => t.id === id);
        if (index === -1) return interaction.reply(`Order #${id} not found.`);

        data.transactions.splice(index, 1);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        await interaction.reply(`✅ Order #${id} has been removed successfully.`);
    },
};