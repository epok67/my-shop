const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edittransaction')
        .setDescription('Modify an order and log changes')
        .addStringOption(o => o.setName('txid').setDescription('The Order ID').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('Update item name'))
        .addNumberOption(o => o.setName('amount').setDescription('Update amount'))
        .addStringOption(o => o.setName('payment').setDescription('Update payment method')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const txId = interaction.options.getString('txid');
        
        try {
            const tx = await Transaction.findOne({ transactionId: txId });
            if (!tx) return interaction.editReply("❌ Order ID not found.");

            const oldData = { item: tx.item, amt: tx.amountUSD || tx.amountRobux, pay: tx.payment };
            const newItem = interaction.options.getString('item')?.toUpperCase() || tx.item;
            const newAmt = interaction.options.getNumber('amount') || oldData.amt;
            const newPay = interaction.options.getString('payment') || tx.payment;

            // Apply updates
            tx.item = newItem;
            tx.payment = newPay;
            if (newPay === 'Robux') { tx.amountRobux = newAmt; tx.amountUSD = 0; }
            else { tx.amountUSD = newAmt; tx.amountRobux = 0; }
            await tx.save();

            // Log to Sales Channel (Eastern Time)
            const logChannel = await interaction.client.channels.fetch('1397978290693865512');
            if (logChannel) {
                const nowET = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
                const embed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle(`🛠️ Transaction Edited`)
                    .addFields(
                        { name: '🆔 Order ID', value: `\`${txId}\``, inline: false },
                        { name: '⬅️ Previous', value: `📦 ${oldData.item} | 💰 ${oldData.amt} | 💳 ${oldData.pay}`, inline: false },
                        { name: '➡️ Updated', value: `📦 ${newItem} | 💰 ${newAmt} | 💳 ${newPay}`, inline: false },
                        { name: '🕒 Edit Time (ET)', value: `\`${nowET}\``, inline: false }
                    );
                await logChannel.send({ content: `:id: **Order ID Edited**\n\`${txId}\``, embeds: [embed] });
            }

            await interaction.editReply("✅ Transaction updated and logged to sales.");
        } catch (err) { console.error(err); }
    }
};