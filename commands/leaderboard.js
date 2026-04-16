const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('See the top spenders in the store'),
    async execute(interaction) {
        const filePath = path.join(__dirname, '..', 'data', 'transactions.json');
        const { transactions } = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Group by buyerId and sum amounts
        const totals = {};
        transactions.forEach(t => {
            totals[t.buyerTag] = (totals[t.buyerTag] || 0) + t.amount;
        });

        // Sort and map to array
        const sorted = Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const list = sorted.map((entry, i) => `${i + 1}. **${entry[0]}** - $${entry[1].toFixed(2)}`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🏆 Store Leaderboard')
            .setDescription(list || 'No transactions yet.')
            .setColor(0xFFD700);
        
        await interaction.reply({ embeds: [embed] });
    },
};