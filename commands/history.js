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
            .setColor(0x00FF00)
            .setThumbnail(target.displayAvatarURL());

        const historyList = txs.map(t => {
            // Check every possible field to ensure no $0.00 shows up
            const usd = t.amountUSD || t.amount || 0;
            const rbk = t.amountRobux || t.robuxAmount || 0;
            
            const val = rbk > 0 ? `${rbk.toLocaleString()} R$` : `$${usd.toFixed(2)}`;
            const typeIcon = (t.type === 'sale' || t.type === 'sell') ? '📥' : '📤';
            return `\`${typeIcon}\` **${val}** - ${t.item || 'Unknown Item'} (<t:${Math.floor(t.date.getTime()/1000)}:R>)`;
        }).join('\n');

        embed.setDescription(historyList);
        await interaction.editReply({ embeds: [embed] });
    }
};