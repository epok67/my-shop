const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('receipt')
        .setDescription('DM a professional receipt')
        .addStringOption(o => o.setName('id').setDescription('Transaction ID').setRequired(true)),

    async execute(interaction) {
        const OWNER_ROLE_ID = '1278006636375576689';
        if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) return interaction.reply({ content: '❌ Admin only.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });
        const tx = await Transaction.findById(interaction.options.getString('id'));
        if (!tx) return interaction.editReply("❌ ID not found.");

        const customer = await interaction.client.users.fetch(tx.userId);
        const unixTs = Math.floor(tx.date.getTime() / 1000);

        const receiptEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('🧾 Official Purchase Receipt')
            .addFields(
                { name: 'Item', value: tx.item, inline: true },
                { name: 'Price', value: `$${tx.amount.toFixed(2)}`, inline: true },
                { name: 'Method', value: tx.payment, inline: true },
                { name: 'Date', value: `<t:${unixTs}:F>`, inline: false }
            )
            .setFooter({ text: `Order ID: ${tx._id}` });

        try {
            await customer.send({ embeds: [receiptEmbed] });
            await interaction.editReply(`✅ Receipt sent to ${customer.username}.`);
        } catch (err) {
            await interaction.editReply("❌ User DMs closed.");
        }
    }
};