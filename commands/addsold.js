const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsold')
        .setDescription('Record a sale to a customer')
        .addUserOption(o => o.setName('user').setDescription('The customer who bought from you').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('Numerical amount').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('What did you sell?').setRequired(true))
        .addStringOption(o => o.setName('method').setDescription('Payment method used').setRequired(true)
            .addChoices(
                { name: 'USD (Cashapp/PayPal/etc)', value: 'USD' },
                { name: 'Robux', value: 'Robux' }
            )),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item').toUpperCase();
        const method = interaction.options.getString('method');
        const now = new Date();

        const isRobux = method === 'Robux';
        const usdVal = isRobux ? 0 : amount;
        const robuxVal = isRobux ? amount : 0;

        // Save the detailed receipt for History
        await Transaction.create({ 
            userId: user.id, 
            type: 'purchase', // Customer "purchased" from you
            amountUSD: usdVal, 
            amountRobux: robuxVal, 
            item: item, 
            payment: method, 
            date: now 
        });

        // Update the running totals for Stats and Leaderboard
        await UserStats.findOneAndUpdate(
            { userId: user.id },
            { 
                $inc: { 
                    purchasedUSD: usdVal,
                    purchasedRobux: robuxVal,
                    countDeals: 1
                },
                $set: { lastPurchaseDate: now }
            },
            { upsert: true, new: true }
        );

        const logChannel = await interaction.client.channels.fetch('1397978290693865512');
        if (logChannel) {
            const displayValue = isRobux ? `<:Epok_Robux:1394440796211515402> **${amount.toLocaleString()}**` : `**$${amount.toFixed(2)}**`;
            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle(`✅ Sale Recorded`)
                .addFields(
                    { name: '👤 Customer', value: `<@${user.id}>`, inline: true },
                    { name: '📦 Item', value: `**${item}**`, inline: true },
                    { name: '💰 Value', value: displayValue, inline: true },
                    { name: '💳 Method', value: `**${method}**`, inline: true }
                ).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        await interaction.editReply(`✅ Recorded sale for ${user.username}.`);
    }
};