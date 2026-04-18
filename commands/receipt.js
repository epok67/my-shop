const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('receipt')
        .setDescription('Generate and DM a receipt to the customer')
        .addStringOption(o => o.setName('id').setDescription('The Transaction ID').setRequired(true)),

    async execute(interaction) {
        const OWNER_ROLE_ID = '1278006636375576689';
        if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
            return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const txId = interaction.options.getString('id');

        try {
            const tx = await Transaction.findById(txId);
            if (!tx) return interaction.editReply("❌ Transaction ID not found.");

            const customer = await interaction.client.users.fetch(tx.userId);
            
            const receiptEmbed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('🧾 Official Purchase Receipt')
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    { name: 'Order ID', value: `\`${tx._id}\`` },
                    { name: 'Item', value: tx.item, inline: true },
                    { name: 'Amount', value: `$${tx.amount.toFixed(2)}`, inline: true },
                    { name: 'Method', value: tx.payment || 'Unknown', inline: true },
                    { name: 'Date', value: tx.date.toLocaleString('en-US', { timeZone: 'America/New_York' }) }
                )
                .setFooter({ text: 'Thank you for shopping at Epok\'s Store!' });

            await customer.send({ embeds: [receiptEmbed] });
            await interaction.editReply(`✅ Receipt sent to ${customer.username}.`);
        } catch (err) {
            await interaction.editReply("❌ Error fetching transaction or DMing user.");
        }
    }
};