const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

let lastTxHash = null; 
const LTC_ADDRESS = 'LfHoEQv9hJEuNciskmpdX6yUQCdBFaFboL';
const CHANNEL_ID = '1397978290693865512';

async function watchLTC(client) {
    try {
        const response = await axios.get(`https://api.blockcypher.com/v1/ltc/main/addrs/${LTC_ADDRESS}/full?limit=1`);
        
        if (!response.data || !response.data.txs || response.data.txs.length === 0) return;

        const latestTx = response.data.txs[0];

        // First run: establish baseline
        if (lastTxHash === null) {
            lastTxHash = latestTx.hash;
            console.log(`LTC Watcher Active. Baseline set to: ${lastTxHash}`);
            return;
        }

        // No new activity
        if (latestTx.hash === lastTxHash) return;

        lastTxHash = latestTx.hash;
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel) return;

        const isIncoming = latestTx.outputs.some(out => out.addresses && out.addresses.includes(LTC_ADDRESS));
        const amountLTC = latestTx.total / 100000000; 

        const embed = new EmbedBuilder()
            .setTitle(isIncoming ? '📥 Crypto Received' : '📤 Crypto Sent')
            .setColor(isIncoming ? 0x2ECC71 : 0xE74C3C)
            .addFields(
                { name: 'Amount', value: `\`${amountLTC.toFixed(4)} LTC\``, inline: true },
                { name: 'Type', value: isIncoming ? 'Deposit' : 'Withdrawal', inline: true },
                { name: 'Transaction ID', value: `\`${latestTx.hash.substring(0, 16)}...\``, inline: false },
                { name: 'Explorer', value: `[View on Blockchair](https://blockchair.com/litecoin/transaction/${latestTx.hash})` }
            )
            .setTimestamp();

        await channel.send({ content: '🔔 **LTC Wallet Activity Detected!**', embeds: [embed] });
    } catch (err) {
        // Silent error for connection timeouts
        if (err.code !== 'ECONNRESET') {
            console.error('LTC Watcher Sync Error:', err.message);
        }
    }
}

module.exports = { watchLTC };