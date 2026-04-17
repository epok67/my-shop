const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record a transaction and log it')
        .addUserOption(o => o.setName('user').setDescription('The user involved').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('The amount').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('The item name').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item');

        // 1. Save to Database
        await Transaction.create({ userId: user.id, amount, item });
        await UserStats.findOneAndUpdate(
            { userId: user.id },
            { 
                $inc: { totalSold: amount, countSold: 1 },
                $set: { lastPurchaseItem: item, lastPurchaseDate: new Date() },
                $max: { highestSale: amount } 
            },
            { upsert: true }
        );

        // 2. Log to the specific channel
        const LOG_CHANNEL_ID = '1397978290693865512';
        const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);

        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📢 New Transaction Logged')
                .addFields(
                    { name: '👤 User', value: `${user.username}`, inline: true },
                    { name: '💰 Amount', value: `$${amount.toFixed(2)}`, inline: true },
                    { name: '📦 Item', value: `${item}`, inline: false }
                )
                .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.editReply(`✅ Transaction logged and posted to the logs channel!`);
    }
};