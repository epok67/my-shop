const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View transaction history for a user')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 }).limit(10);

        if (txs.length === 0) return interaction.editReply(`No history found for **${target.username}**.`);

        const embed = new EmbedBuilder()
            .setTitle(`📜 History: ${target.username}`)
            .setColor(0x5865F2);

        let historyText = "";
        txs.forEach(tx => {
            const val = tx.payment === 'Robux' ? `R$ ${tx.robuxAmount}` : `$${tx.amount.toFixed(2)}`;
            historyText += `• **${tx.item}** | ${val} | <t:${Math.floor(tx.date.getTime()/1000)}:d>\n`;
        });

        embed.setDescription(historyText || "No transactions found.");
        await interaction.editReply({ embeds: [embed] });
    }
};