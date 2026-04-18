const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record a transaction')
        .addUserOption(o => o.setName('user').setDescription('The target user').setRequired(true))
        .addStringOption(o => o.setName('deal_type').setDescription('Did they buy from you or sell to you?').setRequired(true)
            .addChoices(
                { name: 'Customer Purchased (I sold to them)', value: 'purchase' },
                { name: 'Customer Sold (I bought from them)', value: 'sale' }
            ))
        .addNumberOption(o => o.setName('amount').setDescription('Numerical amount').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('Item name').setRequired(true))
        .addStringOption(o => o.setName('payment').setDescription('Currency / Method').setRequired(true)
            .addChoices(
                { name: 'PayPal', value: 'PayPal' },
                { name: 'Litecoin (LTC)', value: 'LTC' },
                { name: 'CashApp', value: 'CashApp' },
                { name: 'Robux', value: 'Robux' }
            )),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const dealType = interaction.options.getString('deal_type');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item').toUpperCase();
        const payment = interaction.options.getString('payment');
        
        let usd = payment === 'Robux' ? 0 : amount;
        let robux = payment === 'Robux' ? amount : 0;

        const now = new Date();
        const newTx = await Transaction.create({ 
            userId: user.id, type: dealType, amountUSD: usd, amountRobux: robux, item, payment, date: now 
        });
        
        // Route the money to the correct database field based on the deal type
        const incQuery = { countDeals: 1 };
        if (dealType === 'purchase') {
            incQuery.purchasedUSD = usd;
            incQuery.purchasedRobux = robux;
        } else {
            incQuery.soldUSD = usd;
            incQuery.soldRobux = robux;
        }

        await UserStats.findOneAndUpdate(
            { userId: user.id }, 
            { 
                $inc: incQuery, 
                $set: { lastPurchaseItem: item, lastPurchaseDate: now }, 
                $max: { highestDeal: amount } 
            }, 
            { upsert: true }
        );

        const logChannel = await interaction.client.channels.fetch('1397978290693865512');
        if (logChannel) {
            const displayValue = payment === 'Robux' 
                ? `<:Epok_Robux:1394440796211515402> **${amount.toLocaleString()}**` 
                : `**$${amount.toFixed(2)}**`;

            const embed = new EmbedBuilder()
                .setColor(dealType === 'purchase' ? 0x2ECC71 : 0xE74C3C)
                .setTitle(`✅ ${dealType === 'purchase' ? 'Sale' : 'Purchase'} Logged`)
                .addFields(
                    { name: '👤 User', value: `<@${user.id}>`, inline: true },
                    { name: '📦 Item', value: `**${item}**`, inline: true },
                    { name: '💰 Value', value: displayValue, inline: true }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        await interaction.editReply(`✅ Successfully logged for ${user.username}.`);
    }
};