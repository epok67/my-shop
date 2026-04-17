const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('List every transaction for a specific user (Admin Only)')
        .addUserOption(option => option.setName('user').setDescription('The user to look up').setRequired(true)),

    async execute(interaction) {
        // Admin check using your specific Role ID
        if (interaction.member.id !== '1278006636375576689' && !interaction.member.roles.cache.has('1278006636375576689')) {
            return interaction.reply({ content: '❌ Only admins can use this command!', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        
        // Find ALL transactions for this user, sorted by date (newest first)
        const allTransactions = await Transaction.find({ buyerId: user.id }).sort({ date: -1 });

        if (!allTransactions || allTransactions.length === 0) {
            return interaction.reply(`No transaction history found for **${user.username}**.`);
        }

        const embed = new EmbedBuilder()
            .setColor(0x8A2BE2)
            .setTitle(`📜 Complete History: ${user.username}`)
            .setDescription(`Found ${allTransactions.length} total transactions.`)
            .setTimestamp();

        // Map every transaction into a readable string
        // Format: [ID] Date - Amount - Items
        const historyList = allTransactions.map(tx => {
            const dateShort = tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A';
            return `\`${tx.txId}\` | ${dateShort} | **$${tx.amount.toFixed(2)}** | ${tx.items}`;
        }).join('\n');

        // If the list is too long for one embed (Discord limit is 4096 chars), 
        // we slice it to ensure it sends.
        const finalDescription = historyList.length > 4000 
            ? historyList.substring(0, 3997) + "..." 
            : historyList;

        embed.setDescription(finalDescription);

        await interaction.reply({ embeds: [embed] });
    },
};