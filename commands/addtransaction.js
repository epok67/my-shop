const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record a transaction')
        .addUserOption(o => o.setName('user').setDescription('The customer').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('Price in USD').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('Item sold').setRequired(true))
        .addStringOption(o => o.setName('payment').setDescription('Payment method').setRequired(true)
            .addChoices(
                { name: 'PayPal', value: 'PayPal' },
                { name: 'Litecoin (LTC)', value: 'LTC' },
                { name: 'Robux', value: 'Robux' }
            ))
        .addNumberOption(o => o.setName('robux_amount').setDescription('Specify exact Robux if applicable').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const usd = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item').toLowerCase();
        const payment = interaction.options.getString('payment');
        const rValue = interaction.options.getNumber('robux_amount') || (usd * 1000); 

        const now = new Date();
        await Transaction.create({ userId: user.id, amount: usd, item, payment, date: now, robuxAmount: rValue });
        
        await UserStats.findOneAndUpdate(
            { userId: user.id }, 
            { 
                $inc: { totalSold: usd, countSold: 1 }, 
                $set: { lastPurchaseItem: item, lastPurchaseDate: now }, 
                $max: { highestSale: usd } 
            }, 
            { upsert: true }
        );

        const logChannel = await interaction.client.channels.fetch('1397978290693865512');
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('✅ New Transaction Logged')
                .addFields(
                    { name: '👤 Customer', value: `<@${user.id}>`, inline: true },
                    { name: '📦 Item', value: `**${item}**`, inline: true },
                    { name: '💰 USD Value', value: `\`$${usd.toFixed(2)}\``, inline: true },
                    { name: '🪙 Robux Total', value: `<:Epok_Robux:1394440796211515402> **${rValue.toLocaleString()}**`, inline: true },
                    { name: '💳 Method', value: `**${payment}**`, inline: true }
                );
            await logChannel.send({ embeds: [embed] });
        }
        await interaction.editReply(`✅ Logged for ${user.username}.`);
    }
};