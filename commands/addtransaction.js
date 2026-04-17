const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtransaction')
        .setDescription('Record a transaction and log it with an optional attachment')
        .addUserOption(o => o.setName('user').setDescription('The customer').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('The price').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('The item sold').setRequired(true))
        .addAttachmentOption(o => o.setName('attachment').setDescription('Attach a receipt or proof').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item');
        const attachment = interaction.options.getAttachment('attachment');
        const now = new Date();

        await Transaction.create({ userId: user.id, amount, item, date: now });
        await UserStats.findOneAndUpdate(
            { userId: user.id },
            { 
                $inc: { totalSold: amount, countSold: 1 },
                $set: { lastPurchaseItem: item, lastPurchaseDate: now },
                $max: { highestSale: amount } 
            },
            { upsert: true }
        );

        const logChannel = await interaction.client.channels.fetch('1397978290693865512');
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📢 New Transaction Logged')
                .addFields(
                    { name: '👤 User', value: `${user.username} (<@${user.id}>)`, inline: true },
                    { name: '💰 Amount', value: `$${amount.toFixed(2)}`, inline: true },
                    { name: '📦 Item', value: `${item}`, inline: false },
                    { name: '🕒 Time (EST)', value: now.toLocaleString('en-US', { timeZone: 'America/New_York' }), inline: false }
                );
            
            // Add image if an attachment exists
            if (attachment) {
                logEmbed.setImage(attachment.url);
            }
            
            logEmbed.setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }
        await interaction.editReply(`✅ Logged for ${user.username} ${attachment ? 'with receipt' : ''}.`);
    }
};