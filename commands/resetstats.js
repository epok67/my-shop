const { SlashCommandBuilder } = require('discord.js');
const { UserStats, Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetstats')
        .setDescription('!!! DANGER: Wipes ALL data from database !!!'),

    async execute(interaction) {
        await UserStats.deleteMany({});
        await Transaction.deleteMany({});
        await interaction.reply({ content: '⚠️ All data has been purged from the database.', ephemeral: true });
    }
};