const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record a transaction')
        .addUserOption(o => o.setName('user').setDescription('The customer').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('The price').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('The item sold').setRequired(true))
        .addStringOption(o => o.setName('payment').setDescription('Payment method').setRequired(true)
            .addChoices(
                { name: 'PayPal', value: '<a:Epok_PayPal:1394440794496307280> PayPal' },
                { name: 'Litecoin (LTC)', value: '<a:Epok_LTC:1397288075826172054> Litecoin (LTC)' },
                { name: 'Popular Crypto (ETH/SOL/BTC/USDT)', value: '<:Epok_Crypto:1453124886192193648> Crypto' },
                { name: 'Credit / Debit Cards', value: '<:Epok_Cards:1489435803250589798> Credit / Debit' },
                { name: 'Paysafe/Google/Apple/Other', value: '<:Epok_Payments:1420933742788083712> Mobile Pay/Other' },
                { name: 'Robux', value: '<:Epok_Robux:1394440796211515402> Robux' },
                { name: 'CashApp', value: '<:Epok_CashApp:1397288071615221872> CashApp' },
                { name: 'Venmo', value: '<:Epok_Venmo:1397288073372500019> Venmo' },
            ))
        .addAttachmentOption(o => o.setName('attachment').setDescription('Attach receipt').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item');
        const payment = interaction.options.getString('payment');
        const now = new Date();

        await Transaction.create({ userId: user.id, amount, item, payment, date: now });
        await UserStats.findOneAndUpdate({ userId: user.id }, 
            { $inc: { totalSold: amount, countSold: 1 }, $set: { lastPurchaseItem: item, lastPurchaseDate: now }, $max: { highestSale: amount } }, 
            { upsert: true });

        const logChannel = await interaction.client.channels.fetch('1397978290693865512');
        if (logChannel) {
            const embed = new EmbedBuilder().setColor(0x2ECC71).setTitle('📢 New Transaction Logged')
                .addFields(
                    { name: '👤 User', value: `${user.username} (<@${user.id}>)`, inline: true },
                    { name: '💰 Amount', value: `$${amount.toFixed(2)}`, inline: true },
                    { name: '💳 Method', value: payment, inline: true },
                    { name: '📦 Item', value: item, inline: false },
                    { name: '🕒 Time (EST)', value: now.toLocaleString('en-US', { timeZone: 'America/New_York' }) }
                );
            const attachment = interaction.options.getAttachment('attachment');
            if (attachment) embed.setImage(attachment.url);
            await logChannel.send({ embeds: [embed] });
        }
        await interaction.editReply(`✅ Successfully logged $${amount.toFixed(2)} for ${user.username}.`);
    }
};