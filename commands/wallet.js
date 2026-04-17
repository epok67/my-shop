const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Check live LTC wallet balance and stats'),

    async execute(interaction) {
        await interaction.deferReply();
        const LTC_ADDRESS = 'LfHoEQv9hJEuNciskmpdX6yUQCdBFaFboL';

        try {
            const [addrRes, priceRes] = await Promise.all([
                axios.get(`https://api.blockcypher.com/v1/ltc/main/addrs/${LTC_ADDRESS}/balance`),
                axios.get('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd')
            ]);

            const ltcPrice = priceRes.data.litecoin.usd;
            const balance = addrRes.data.balance / 100000000;
            const received = addrRes.data.total_received / 100000000;
            const sent = addrRes.data.total_sent / 100000000;

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('🔵 Litecoin Address Details')
                .setDescription(`\`${LTC_ADDRESS}\``)
                .setThumbnail('https://cryptologos.cc/logos/litecoin-ltc-logo.png')
                .addFields(
                    { name: '💰 Balance', value: `**${balance.toFixed(4)} LTC** ($${(balance * ltcPrice).toFixed(2)} USD)`, inline: false },
                    { name: '📥 Total Received', value: `${received.toFixed(4)} LTC`, inline: true },
                    { name: '📤 Total Sent', value: `${sent.toFixed(4)} LTC`, inline: true },
                    { name: '📊 Transactions', value: `${addrRes.data.n_tx} total`, inline: true }
                )
                .setFooter({ text: `1 LTC = $${ltcPrice} USD` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Error fetching wallet data. Please try again later.");
        }
    }
};