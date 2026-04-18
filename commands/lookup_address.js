const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup_address')
        .setDescription('Lookup stats for any Litecoin address')
        .addStringOption(o => o.setName('address').setDescription('The LTC address to check').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const address = interaction.options.getString('address');

        try {
            const [addrRes, priceRes] = await Promise.all([
                axios.get(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`),
                axios.get('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd')
            ]);

            const ltcPrice = priceRes.data.litecoin.usd;
            const balance = addrRes.data.balance / 100000000;
            const received = addrRes.data.total_received / 100000000;
            const sent = addrRes.data.total_sent / 100000000;

            const embed = new EmbedBuilder()
                .setColor(0xF7931A)
                .setTitle('🔍 Universal LTC Lookup')
                .setDescription(`\`${address}\``)
                .addFields(
                    { name: '💰 Balance', value: `**${balance.toFixed(4)} LTC** ($${(balance * ltcPrice).toFixed(2)} USD)`, inline: false },
                    { name: '📥 Received', value: `${received.toFixed(4)} LTC`, inline: true },
                    { name: '📤 Sent', value: `${sent.toFixed(4)} LTC`, inline: true },
                    { name: '📊 Tx Count', value: `${addrRes.data.n_tx} txs`, inline: true }
                )
                .setFooter({ text: `Current Price: $${ltcPrice} USD` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply("❌ Invalid address or API error. Make sure it is a valid LTC address.");
        }
    }
};