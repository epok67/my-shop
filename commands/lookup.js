const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Find a transaction by ID')
        .addStringOption(option => option.setName('id').setDescription('Transaction ID').setRequired(true)),

    async execute(interaction) {
        const id = interaction.options.getString('id').toUpperCase();
        const tx = await Transaction.findOne({ txId: id });

        if (!tx) return interaction.reply({ content: "Order not found.", ephemeral: true });

        interaction.reply(`**Order Found:** ID: ${tx.txId} | User: <@${tx.buyerId}> | Item: ${tx.items} | Amount: $${tx.amount}`);
    },
};