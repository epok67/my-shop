const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record a sale')
        .addUserOption(o => o.setName('user').setDescription('The customer').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('The USD price').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('The item sold').setRequired(true))
        .addStringOption(o => o.setName('payment').setDescription('Select payment method').setRequired(true)
            .addChoices(
                { name: 'PayPal', value: 'PayPal' },
                { name: 'Litecoin (LTC)', value: 'Litecoin' },
                { name: 'Robux', value: 'Robux' },
                { name: 'Other', value: 'Other' }
            ))
        .addAttachmentOption(o => o.setName('attachment').setDescription('Attach receipt').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const amountUSD = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item').toLowerCase();
        const payment = interaction.options.getString('payment');
        
        const robuxValue = Math.floor(amountUSD * 1000);
        const now = new Date();

        // Create Database Entry
        await Transaction.create({ userId: user.id, amount: amountUSD, item, payment, date: now });
        await UserStats.findOneAndUpdate(
            { userId: user.id }, 
            { 
                $inc: { totalSold: amountUSD, countSold: 1 }, 
                $set: { lastPurchaseItem: item, lastPurchaseDate: now }, 
                $max: { highestSale: amountUSD } 
            }, 
            { upsert: true }
        );

        const logChannel = await interaction.client.channels.fetch('1397978290693865512');
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('📢 Sale Logged Successfully')
                .addFields(
                    { name: '👤 Customer', value: `<@${user.id}>`, inline: true },
                    { name: '📦 Item', value: item, inline: true },
                    { name: '💰 USD Price', value: `\`$${amountUSD.toFixed(2)}\``, inline: true },
                    { name: '🪙 Robux Price', value: `\`R$ ${robuxValue.toLocaleString()}\``, inline: true },
                    { name: '💳 Method', value: payment, inline: true }
                )
                .setTimestamp();

            const attachment = interaction.options.getAttachment('attachment');
            if (attachment) embed.setImage(attachment.url);
            await logChannel.send({ embeds: [embed] });
        }
        await interaction.editReply(`✅ Sale recorded for ${user.username}.`);
    }
};