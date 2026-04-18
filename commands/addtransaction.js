const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record a transaction')
        .addUserOption(o => o.setName('user').setDescription('The customer').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('Numerical amount (Enter 67 for $67 or 67 for R$67)').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('Item sold').setRequired(true))
        .addStringOption(o => o.setName('payment').setDescription('Payment method').setRequired(true)
            .addChoices(
                { name: 'PayPal', value: 'PayPal' },
                { name: 'Litecoin (LTC)', value: 'LTC' },
                { name: 'CashApp', value: 'CashApp' },
                { name: 'Robux', value: 'Robux' }
            ))
        .addAttachmentOption(o => o.setName('attachment').setDescription('Attach receipt').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item').toLowerCase();
        const payment = interaction.options.getString('payment');
        
        let usdInc = 0;
        let robuxInc = 0;

        if (payment === 'Robux') {
            robuxInc = amount;
        } else {
            usdInc = amount;
        }

        const now = new Date();
        await Transaction.create({ userId: user.id, amount: usdInc, robuxAmount: robuxInc, item, payment, date: now });
        
        await UserStats.findOneAndUpdate(
            { userId: user.id }, 
            { 
                $inc: { totalRevenue: usdInc, totalRobux: robuxInc, countSold: 1 }, 
                $set: { lastPurchaseItem: item, lastPurchaseDate: now }, 
                $max: { highestSale: usdInc } 
            }, 
            { upsert: true }
        );

        const logChannel = await interaction.client.channels.fetch('1397978290693865512');
        if (logChannel) {
            const displayValue = payment === 'Robux' 
                ? `<:Epok_Robux:1394440796211515402> **${amount.toLocaleString()}**` 
                : `**$${amount.toFixed(2)}**`;

            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('✅ New Transaction Logged')
                .addFields(
                    { name: '👤 Customer', value: `<@${user.id}>`, inline: true },
                    { name: '📦 Item', value: `**${item}**`, inline: true },
                    { name: '💰 Value', value: displayValue, inline: true },
                    { name: '💳 Method', value: `**${payment}**`, inline: true }
                )
                .setTimestamp();

            const attachment = interaction.options.getAttachment('attachment');
            if (attachment) embed.setImage(attachment.url);
            await logChannel.send({ embeds: [embed] });
        }
        await interaction.editReply(`✅ Logged ${payment === 'Robux' ? amount + ' Robux' : '$' + amount} for ${user.username}.`);
    }
};