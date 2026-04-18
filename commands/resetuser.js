const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetuser')
        .setDescription('Wipe all stats and history for a user')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)),

    async execute(interaction) {
        const OWNER_ROLE = '1278006636375576689';
        if (!interaction.member.roles.cache.has(OWNER_ROLE)) return interaction.reply({ content: '❌ Admin only.', ephemeral: true });

        const target = interaction.options.getUser('user');

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Reset User Data?')
            .setDescription(`This will permanently delete all logs and financial stats for **${target.username}**.`)
            .setColor(0xFF0000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm').setLabel('Yes, Reset').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const collector = response.createMessageComponentCollector({ time: 30000 });
        collector.on('collect', async i => {
            if (i.customId === 'confirm') {
                await Transaction.deleteMany({ userId: target.id });
                await UserStats.deleteOne({ userId: target.id });
                await i.update({ content: `✅ Data for **${target.username}** has been wiped.`, embeds: [], components: [] });
            } else {
                await i.update({ content: '❌ Reset cancelled.', embeds: [], components: [] });
            }
        });
    }
};