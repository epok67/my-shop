const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');
const crypto = require('crypto');

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
        const txId = crypto.randomBytes(4).toString('hex').toUpperCase();

        // 1. Save Transaction
        await Transaction.create({
            txId,
            buyerId: user.id,
            buyerTag: user.tag,
            amount,
            items
        });

        // 2. Update User Stats (Atomic update)
        const stats = await UserStats.findOneAndUpdate(
            { userId: user.id },
            { 
                $inc: { totalSold: amount, count: 1 },
                $set: { username: user.username }
            },
            { upsert: true, new: true }
        );

        const embed = new EmbedBuilder()
            .setColor(0x8A2BE2)
            .setTitle('🎉 New Deal Closed!')
            .addFields(
                { name: '💰 Amount', value: `$${amount.toFixed(2)}`, inline: true },
                { name: '📦 Items', value: items, inline: true },
                { name: '📊 New Total', value: `$${stats.totalSold.toFixed(2)}` }
            )
            .setImage(proof.url)
            .setFooter({ text: `Order ID: ${txId}` });

        await interaction.reply({ embeds: [embed] });
    },
};