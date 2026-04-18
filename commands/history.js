const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View transaction history')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 }).limit(10);

        if (txs.length === 0) return interaction.editReply('No history found.');

        const embed = new EmbedBuilder()
            .setTitle(`📜 History: ${target.username}`)
            .setColor(0x00FF00);

        const historyList = txs.map(t => {
            const val = (t.amountRobux || 0) > 0 ? `${t.amountRobux.toLocaleString()} R$` : `$${(t.amountUSD || t.amount || 0).toFixed(2)}`;
            const typeIcon = (t.type === 'sale' || t.type === 'sell') ? '📥' : '📤';
            return `\`${typeIcon}\` **${val}** - ${t.item || 'Unknown'} (<t:${Math.floor(t.date.getTime()/1000)}:R>)`;
        }).join('\n');

        embed.setDescription(historyList);
        await interaction.editReply({ embeds: [embed] });
    }
};