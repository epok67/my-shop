const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');
const crypto = require('crypto');

// RESTORED: All your custom emoji IDs
const EMOJIS = {
    'PayPal': '<a:Epok_PayPal:1394440794496307280>',
    'LTC': '<a:Epok_LTC:1397288075826172054>',
    'Crypto': '<:Epok_Crypto:1453124886192193648>',
    'Cards': '<:Epok_Cards:1489435803250589798>',
    'Other': '<:Epok_Payments:1420933742788083712>',
    'Robux': '<:Epok_Robux:1394440796211515402>',
    'CashApp': '<:Epok_CashApp:1397288071615221872>',
    'Venmo': '<:Epok_Venmo:1397288073372500019>'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record any deal')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(o => o.setName('type').setDescription('Deal type').setRequired(true)
            .addChoices(
                { name: 'I Sold (Customer Purchased)', value: 'purchase' }, 
                { name: 'I Bought (Customer Sold)', value: 'sale' }
            ))
        .addNumberOption(o => o.setName('amount').setDescription('Amount').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('Item name').setRequired(true))
        .addStringOption(o => o.setName('payment').setDescription('Payment method').setRequired(true)
            .addChoices(
                { name: 'PayPal', value: 'PayPal' }, 
                { name: 'CashApp', value: 'CashApp' },
                { name: 'Venmo', value: 'Venmo' }, 
                { name: 'LTC', value: 'LTC' },
                { name: 'Crypto (ETH/SOL/BTC/USDT)', value: 'Crypto' }, 
                { name: 'Cards', value: 'Cards' },
                { name: 'Robux', value: 'Robux' }, 
                { name: 'Other', value: 'Other' }
            ))
        .addStringOption(o => o.setName('manual_other').setDescription('If "Other" is selected, type method here'))
        .addAttachmentOption(o => o.setName('proof').setDescription('Optional: Attach screenshot')),

    async execute(interaction) {
        // Keep the defer for Railway stability
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const user = interaction.options.getUser('user');
            const type = interaction.options.getString('type');
            const amount = interaction.options.getNumber('amount');
            const item = interaction.options.getString('item').toUpperCase();
            const proof = interaction.options.getAttachment('proof');
            let payment = interaction.options.getString('payment');
            const manual = interaction.options.getString('manual_other');

            // RESTORED: Manual "Other" logic
            if (payment === 'Other' && manual) payment = manual;
            
            const txId = crypto.randomBytes(3).toString('hex').toUpperCase();
            const isRobux = payment === 'Robux';
            const usd = isRobux ? 0 : amount;
            const robux = isRobux ? amount : 0;
            const now = new Date();

            // Save to DB
            await Transaction.create({ 
                userId: user.id, 
                transactionId: txId, 
                type, 
                amountUSD: usd, 
                amountRobux: robux, 
                item, 
                payment, 
                date: now 
            });

            // Update Global Stats
            await UserStats.findOneAndUpdate(
                { userId: user.id },
                { 
                    $inc: { 
                        purchasedUSD: type === 'purchase' ? usd : 0,
                        soldUSD: type === 'sale' ? usd : 0,
                        purchasedRobux: type === 'purchase' ? robux : 0,
                        soldRobux: type === 'sale' ? robux : 0,
                        countDeals: 1
                    },
                    $set: { lastPurchaseDate: now }
                },
                { upsert: true }
            );

            // RESTORED: Logging to your specific channel with custom emojis
            const logChannel = await interaction.client.channels.fetch('1397978290693865512');
            if (logChannel) {
                const emoji = EMOJIS[payment] || EMOJIS['Other'];
                const valStr = isRobux 
                    ? `${EMOJIS['Robux']} **${amount.toLocaleString()}**` 
                    : `**$${amount.toFixed(2)}**`;

                const embed = new EmbedBuilder()
                    .setColor(type === 'purchase' ? 0x2ECC71 : 0xE74C3C)
                    .setTitle(`✅ Transaction [ID: ${txId}]`)
                    .addFields(
                        { name: '👤 User', value: `<@${user.id}>`, inline: true },
                        { name: '📦 Item', value: `**${item}**`, inline: true },
                        { name: '💰 Value', value: valStr, inline: true },
                        { name: '💳 Method', value: `${emoji} **${payment}**`, inline: true }
                    )
                    .setTimestamp();

                if (proof) embed.setImage(proof.url);
                await logChannel.send({ embeds: [embed] });
            }

            await interaction.editReply(`✅ Logged as **${txId}**.`);

        } catch (err) {
            console.error("Add Transaction Error:", err);
            await interaction.editReply("❌ Failed to log transaction.");
        }
    }
};