const { SlashCommandBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edittransaction')
        .setDescription('Modify any aspect of an existing order')
        .addStringOption(o => o.setName('txid').setDescription('The Order ID').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('Update item name'))
        .addNumberOption(o => o.setName('amount').setDescription('Update amount (USD or Robux)'))
        .addStringOption(o => o.setName('payment').setDescription('Update payment method'))
        .addStringOption(o => o.setName('date').setDescription('Update date (Format: YYYY-MM-DD)'))
        .addStringOption(o => o.setName('time').setDescription('Update time (Format: HH:MM in UTC)')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const txId = interaction.options.getString('txid');
        
        try {
            const tx = await Transaction.findOne({ transactionId: txId });
            if (!tx) return interaction.editReply("❌ Order ID not found.");

            const newItem = interaction.options.getString('item');
            const newAmount = interaction.options.getNumber('amount');
            const newPayment = interaction.options.getString('payment');
            const newDate = interaction.options.getString('date');
            const newTime = interaction.options.getString('time');

            const updateData = {};
            if (newItem) updateData.item = newItem.toUpperCase();
            if (newPayment) updateData.payment = newPayment;
            
            if (newAmount) {
                if (tx.payment === 'Robux' || newPayment === 'Robux') {
                    updateData.amountRobux = newAmount;
                    updateData.amountUSD = 0;
                } else {
                    updateData.amountUSD = newAmount;
                    updateData.amountRobux = 0;
                }
            }

            if (newDate || newTime) {
                const baseDate = newDate || tx.date.toISOString().split('T')[0];
                const baseTime = newTime || tx.date.toISOString().split('T')[1].substring(0, 5);
                updateData.date = new Date(`${baseDate}T${baseTime}:00Z`);
            }

            await Transaction.updateOne({ transactionId: txId }, { $set: updateData });
            await interaction.editReply(`✅ **Order ${txId}** has been updated. Run \`/rebuildstats\` to sync totals.`);
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Failed to edit transaction. Check your date/time format.");
        }
    }
};