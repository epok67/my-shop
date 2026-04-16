const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record a deal')
        .addUserOption(option => option.setName('user').setDescription('The buyer').setRequired(true))
        .addNumberOption(option => option.setName('amount').setDescription('USD amount').setRequired(true))
        .addStringOption(option => option.setName('items').setDescription('List of items sold').setRequired(true))
        .addAttachmentOption(option => option.setName('proof').setDescription('Screenshot').setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const items = interaction.options.getString('items');
        const proof = interaction.options.getAttachment('proof');
        const now = new Date();

        const filePath = path.join(__dirname, '..', 'data', 'transactions.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const newOrder = {
            id: data.transactions.length + 1,
            buyerId: user.id,
            buyerTag: user.tag,
            amount,
            items,
            date: now.toLocaleString(),
            timestamp: now.getTime()
        };

        data.transactions.push(newOrder);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        const embed = new EmbedBuilder()
            .setColor(0x8A2BE2)
            .setTitle('🎉 New Deal Closed!')
            .setDescription(`${user} completed an order!`)
            .addFields(
                { name: '💰 Amount', value: `$${amount.toFixed(2)}`, inline: true },
                { name: '📦 Items', value: items, inline: true },
                { name: '🕒 Date', value: newOrder.date }
            )
            .setImage(proof.url)
            .setFooter({ text: `Order ID: ${newOrder.id}` });

        await interaction.reply({ embeds: [embed] });
    },
};