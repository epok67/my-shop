const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetuser')
        .setDescription('Purge all data for a user')
        .addUserOption(o => o.setName('user').setDescription('User to wipe').setRequired(true)),

    async execute(interaction) {
        const OWNER_ROLE = '1278006636375576689';
        if (!interaction.member.roles.cache.has(OWNER_ROLE)) return interaction.reply({ content: '❌ Access Denied.', ephemeral: true });

        const target = interaction.options.getUser('user');

        const embed = new EmbedBuilder()
            .setTitle('🚨 FINAL WARNING')
            .setDescription(`This will permanently delete **EVERY** transaction and stat for **${target.tag}**.\nThis action is irreversible.`)
            .setColor(0xFF0000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm').setLabel('PERMANENT WIPE').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel').setLabel('ABORT').setStyle(ButtonStyle.Secondary)
        );

        const reply = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const collector = reply.createMessageComponentCollector({ time: 15000 });
        collector.on('collect', async i => {
            if (i.customId === 'confirm') {
                await Transaction.deleteMany({ userId: target.id });
                await UserStats.deleteOne({ userId: target.id });
                await i.update({ content: `✅ Purged all data for **${target.tag}**.`, embeds: [], components: [] });
            } else {
                await i.update({ content: '❌ Reset aborted.', embeds: [], components: [] });
            }
        });
    }
};