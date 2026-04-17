const { SlashCommandBuilder } = require('discord.js');
const { UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetuser')
        .setDescription('Completely wipe stats for a user')
        .addUserOption(o => o.setName('user').setDescription('Target').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        await UserStats.findOneAndDelete({ userId: target.id });
        await interaction.reply({ content: `✅ Reset all stats for ${target.username}.`, ephemeral: true });
    }
};