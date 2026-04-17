const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all available commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📖 Bot Command Guide')
            .setColor(0x00AE86)
            .addFields(
                { name: '🛍️ Transactions', value: '`/addtransaction`: Log a new sale\n`/history`: View your full purchase list' },
                { name: '📊 Statistics', value: '`/stats`: Your personal dossier & favorites\n`/leaderboard`: See the top spenders' },
                { name: '🛠️ Admin', value: '`/removetransaction`: Delete by ID\n`/rebuildstats`: Sync database' }
            );
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};