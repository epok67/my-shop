const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Check your personal LTC wallet balance'),

    async execute(interaction) {
        const OWNER_ROLE_ID = '1278006636375576689';
        if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
            return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
        }

        await interaction.deferReply();
        const MY_LTC = 'LfHoEQv9hJEuNciskmpdX6yUQCdBFaFboL';

        try {
            const [addrRes, priceRes] = await Promise.all([
                axios.get(`https://api.blockcypher.com/v1/ltc/main/addrs/${MY_LTC}/balance`),
                axios.get('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd')
            ]);

            const ltcPrice = priceRes.data.litecoin.usd;
            const balance = addrRes.data.balance / 100000000;

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('💼 Personal Wallet Status')
                .addFields(
                    { name: 'Current Balance', value: `**${balance.toFixed(4)} LTC**`, inline: true },
                    { name: 'USD Value', value: `**$${(balance * ltcPrice).toFixed(2)}**`, inline: true },
                    { name: 'Total TXs', value: `${addrRes.data.n_tx}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            await interaction.editReply("❌ Could not fetch wallet data.");
        }
    }
};