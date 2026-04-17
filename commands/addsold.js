const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsold')
        .setDescription('Record a sale for a user (Admin Only)')
        .addUserOption(option => option.setName('user').setDescription('The customer').setRequired(true))
        .addNumberOption(option => option.setName('amount').setDescription('Sale amount').setRequired(true))
        .addStringOption(option => option.setName('item').setDescription('Item sold').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item');

        try {
            await Transaction.create({
                txId: 'TX-' + Date.now().toString().slice(-6),
                buyerId: user.id,
                buyerTag: user.tag,
                amount: amount,
                items: item,
                date: new Date()
            });

            await UserStats.findOneAndUpdate(
                { userId: user.id },
                { 
                    $inc: { totalSold: amount, count: 1 },
                    $set: { 
                        username: user.username,
                        lastPurchaseItem: item, 
                        lastPurchaseDate: new Date() 
                    }
                },
                { upsert: true, new: true }
            );

            await interaction.editReply(`✅ Recorded: **$${amount}** (${item}) for ${user.username}.`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Database error. Check console logs.');
        }
    },
};