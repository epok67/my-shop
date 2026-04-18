const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetstats')
        .setDescription('Wipe the ENTIRE database (Global Reset)'),

    async execute(interaction) {
        const OWNER_ROLE = '1278006636375576689';
        if (!interaction.member.roles.cache.has(OWNER_ROLE)) return interaction.reply({ content: '❌ Admin only.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle('☢️ GLOBAL DATA PURGE')
            .setDescription('You are about to delete **EVERY** transaction and user stat in the database. Proceed?')
            .setColor(0x000000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('global_wipe').setLabel('YES, WIPE EVERYTHING').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('stop_wipe').setLabel('ABORT').setStyle(ButtonStyle.Success)
        );

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const collector = response.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'global_wipe') {
                await Transaction.deleteMany({});
                await UserStats.deleteMany({});
                await i.update({ content: '💀 The database has been zeroed out.', embeds: [], components: [] });
            } else {
                await i.update({ content: '✅ Global reset aborted.', embeds: [], components: [] });
            }
        });
    }
};