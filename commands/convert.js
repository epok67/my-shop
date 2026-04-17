const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('convert')
        .setDescription('Convert currency (e.g., 100 USD to CAD)')
        .addNumberOption(o => o.setName('amount').setDescription('Amount to convert').setRequired(true))
        .addStringOption(o => o.setName('from').setDescription('Source currency (e.g. USD)').setRequired(true))
        .addStringOption(o => o.setName('to').setDescription('Target currency (e.g. CAD)').setRequired(true)),
    
    async execute(interaction) {
        const amount = interaction.options.getNumber('amount');
        const from = interaction.options.getString('from').toUpperCase();
        const to = interaction.options.getString('to').toUpperCase();
        
        // PASTE YOUR API KEY HERE
        const API_KEY = "75037938a5b1d16c483e5587";
        const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${to}/${amount}`;

        try {
            await interaction.deferReply(); // API takes a second, so we defer
            const res = await axios.get(url);
            
            const result = res.data.conversion_result;

            const embed = new EmbedBuilder()
                .setTitle('💱 Currency Converter')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'From', value: `${amount} ${from}`, inline: true },
                    { name: 'To', value: `${result.toFixed(2)} ${to}`, inline: true }
                )
                .setFooter({ text: `Rate: 1 ${from} = ${res.data.conversion_rate} ${to}` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply("❌ Conversion failed. Check your currency codes (e.g., USD, EUR, GBP).");
        }
    },
};