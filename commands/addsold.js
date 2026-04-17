const { SlashCommandBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsold')
        .setDescription('Record a sale for a user')
        .addUserOption(o => o.setName('user').setDescription('The customer').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('The sale amount').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('The item sold').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item');

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
        await interaction.editReply(`✅ Recorded sale for **${user.username}**: $${amount}`);
    }
};