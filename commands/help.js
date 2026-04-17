const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Commands')
            .setColor(0x8A2BE2)
            .addFields(
                { name: '/addtransaction', value: 'Record a new deal (Admin Only)' },
                { name: '/removetransaction', value: 'Delete a transaction by ID (Admin Only)' },
                { name: '/lookup', value: 'Find a transaction by ID' },
                { name: '/history', value: 'View full history of a user (Admin Only)' },
                { name: '/sold', value: 'View total sales/items for a user (Admin Only)' },
                { name: '/stats', value: 'View purchase stats for a user' },
                { name: '/help', value: 'List all commands' }
            );
        await interaction.reply({ embeds: [embed] });
    },
};