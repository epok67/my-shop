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
                { name: 'PayPal', value: '<a:Epok_PayPal:1394440794496307280> PayPal' },
                { name: 'Litecoin (LTC)', value: '<a:Epok_LTC:1397288075826172054> Litecoin (LTC)' },
                { name: 'Robux', value: '<:Epok_Robux:1394440796211515402> Robux' },
                { name: 'CashApp', value: '<:Epok_CashApp:1397288071615221872> CashApp' },
                { name: 'Other (Manual Entry)', value: 'MANUAL' },
            ))
        .addStringOption(o => o.setName('manual_payment').setDescription('Type method here if you selected "Other"').setRequired(false))
        .addAttachmentOption(o => o.setName('attachment').setDescription('Attach receipt').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const amountUSD = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item');
        let payment = interaction.options.getString('payment');
        
        // Robux calculation (Example: $1 = 1000 Robux)
        const robuxRate = 1000;
        const amountRobux = Math.floor(amountUSD * robuxRate);

        if (payment === 'MANUAL') {
            payment = interaction.options.getString('manual_payment') || '📝 Other';
        }

        const now = new Date();
        const newTx = await Transaction.create({ userId: user.id, amount: amountUSD, item, payment, date: now });

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
                .setTitle('📢 New Sale Logged')
                .addFields(
                    { name: '👤 Customer', value: `<@${user.id}>`, inline: true },
                    { name: '💰 Value', value: `$${amountUSD.toFixed(2)} USD\n<:Epok_Robux:1394440796211515402> ${amountRobux.toLocaleString()} Robux`, inline: true },
                    { name: '💳 Method', value: payment, inline: true },
                    { name: '📦 Item', value: item, inline: false }
                )
                .setTimestamp();

            const attachment = interaction.options.getAttachment('attachment');
            if (attachment) embed.setImage(attachment.url);
            await logChannel.send({ embeds: [embed] });
        }
        await interaction.editReply(`✅ Sale recorded for ${user.username}.`);
    }
};