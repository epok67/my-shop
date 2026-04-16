const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View detailed transaction history')
        .addUserOption(option => option.setName('user').setDescription('The user to check')),

    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const filePath = path.join(__dirname, '..', 'data', 'transactions.json');
        const { transactions } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const userOrders = transactions.filter(t => t.buyerId === target.id);

        if (userOrders.length === 0) return interaction.reply("No history found for this user.");

        const totalSpent = userOrders.reduce((sum, t) => sum + t.amount, 0);
        const avg = totalSpent / userOrders.length;
        const lastOrder = userOrders[userOrders.length - 1];

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`📜 History for ${target.username}`)
            .addFields(
                { name: '📊 Total Deals', value: `${userOrders.length}`, inline: true },
                { name: '💵 Total Spent', value: `$${totalSpent.toFixed(2)}`, inline: true },
                { name: '📈 Avg Deal', value: `$${avg.toFixed(2)}`, inline: true },
                { name: '🕒 Last Order Date', value: lastOrder.date, inline: false }
            );

        // Show the last 5 orders in a list
        const list = userOrders.slice(-5).map(o => `**#${o.id}**: $${o.amount} - ${o.items}`).join('\n');
        embed.addFields({ name: 'Recent Orders (Last 5)', value: list || 'None' });

        await interaction.reply({ embeds: [embed] });
    },
};