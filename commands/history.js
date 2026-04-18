const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View detailed transaction ledger')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        
        // Get last 10 transactions
        const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 }).limit(10);

        if (txs.length === 0) return interaction.editReply(`No transaction history for **${target.username}**.`);

        const embed = new EmbedBuilder()
            .setTitle(`📜 Transaction Ledger: ${target.username}`)
            .setColor(0x5865F2)
            .setThumbnail(target.displayAvatarURL())
            .setDescription('Displaying the 10 most recent transactions below:\n\u200B');

        txs.forEach((tx, index) => {
            const date = `<t:${Math.floor(tx.date.getTime() / 1000)}:d>`;
            const amount = tx.payment === 'Robux' 
                ? `<:Epok_Robux:1394440796211515402> ${tx.robuxAmount.toLocaleString()}` 
                : `$${tx.amount.toFixed(2)}`;

            embed.addFields({
                name: `${index + 1}. ${tx.item.toUpperCase()} (${date})`,
                value: `> **Amount:** ${amount}\n> **Method:** ${tx.payment}\n> **ID:** \`${tx._id}\``,
                inline: false
            });
        });

        await interaction.editReply({ embeds: [embed] });
    }
};