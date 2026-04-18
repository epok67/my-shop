const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetuser')
        .setDescription('Wipe all data for a specific user')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)),

    async execute(interaction) {
        const OWNER_ROLE = '1278006636375576689';
        if (!interaction.member.roles.cache.has(OWNER_ROLE)) return interaction.reply({ content: '❌ Admin only.', ephemeral: true });

        const target = interaction.options.getUser('user');

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Danger Zone')
            .setDescription(`Are you sure you want to wipe all stats and history for **${target.username}**? This cannot be undone.`)
            .setColor(0xFF0000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_wipe').setLabel('Confirm Wipe').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_wipe').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const collector = response.createMessageComponentCollector({ time: 30000 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_wipe') {
                await Transaction.deleteMany({ userId: target.id });
                await UserStats.deleteOne({ userId: target.id });
                await i.update({ content: `✅ Data for **${target.username}** has been purged.`, embeds: [], components: [] });
            } else {
                await i.update({ content: '❌ Wipe cancelled.', embeds: [], components: [] });
            }
        });
    }
};