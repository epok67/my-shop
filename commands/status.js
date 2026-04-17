const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check bot health and uptime'),

    async execute(interaction) {
        const uptime = Math.floor(process.uptime());
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = uptime % 60;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🟢 System Status')
            .addFields(
                { name: 'Latency', value: `\`${interaction.client.ws.ping}ms\``, inline: true },
                { name: 'Uptime', value: `\`${h}h ${m}m ${s}s\``, inline: true },
                { name: 'Platform', value: 'Railway.app Cloud', inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};