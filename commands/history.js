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
        
        try {
            const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 }).limit(10);

            if (txs.length === 0) {
                return interaction.editReply(`No transaction history found for **${target.username}**.`);
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`📜 Transaction History: ${target.username}`)
                .setDescription(txs.map(t => {
                    const typeEmoji = t.type === 'purchase' ? '🛒' : '🤝';
                    const val = t.amountUSD ? `$${t.amountUSD.toFixed(2)}` : `<:Epok_Robux:1394440796211515402> ${t.amountRobux?.toLocaleString()}`;
                    return `\`${t.transactionId || 'N/A'}\` | ${typeEmoji} **${t.item}** - ${val} (<t:${Math.floor(t.date.getTime() / 1000)}:R>)`;
                }).join('\n'))
                .setFooter({ text: 'Showing last 10 transactions' });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Error fetching history.");
        }
    }
};