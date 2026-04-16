const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View your personal store statistics')
        .addUserOption(option => option.setName('user').setDescription('User to check')),
    
    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const filePath = path.join(__dirname, '..', 'data', 'transactions.json');
        const { transactions } = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const userDeals = transactions.filter(t => t.buyerId === target.id);
        if (userDeals.length === 0) return interaction.reply(`${target.username} has no store history.`);

        const totalValue = userDeals.reduce((sum, t) => sum + t.amount, 0);
        const avg = totalValue / userDeals.length;
        const high = Math.max(...userDeals.map(t => t.amount));
        const itemsList = userDeals.map(t => t.items).join(', ');

        const embed = new EmbedBuilder()
            .setColor(0x8A2BE2)
            .setTitle(`📊 Stats for ${target.username}`)
            .addFields(
                { name: 'Total Deals', value: `${userDeals.length}`, inline: true },
                { name: 'Total Spent', value: `$${totalValue.toFixed(2)}`, inline: true },
                { name: 'Average Deal', value: `$${avg.toFixed(2)}`, inline: true },
                { name: 'Highest Deal', value: `$${high.toFixed(2)}`, inline: true },
                { name: 'Rank', value: userDeals.length > 10 ? 'VIP Customer' : 'Regular', inline: true },
                { name: 'Account Age', value: 'Active', inline: true },
                { name: 'Items Purchased', value: itemsList.length > 100 ? itemsList.substring(0, 90) + '...' : itemsList }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};