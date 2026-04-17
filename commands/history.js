const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View full transaction history for a user')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user');
        const txs = await Transaction.find({ userId: user.id }).sort({ date: -1 });

        if (txs.length === 0) return interaction.editReply(`No history found for ${user.username}.`);

        const pageSize = 5;
        const pages = Math.ceil(txs.length / pageSize);
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * pageSize;
            const end = start + pageSize;
            const slice = txs.slice(start, end);
            
            const embed = new EmbedBuilder()
                .setTitle(`📜 Transaction History: ${user.username}`)
                .setColor(0x5865F2)
                .setFooter({ text: `Page ${page + 1} of ${pages} | Timezone: EST` });

            slice.forEach(t => {
                const estTime = t.date.toLocaleString('en-US', { timeZone: 'America/New_York' });
                embed.addFields({ 
                    name: `💰 $${t.amount.toFixed(2)} - ${t.item}`, 
                    value: `**Method:** ${t.payment || 'N/A'}\n**Date:** ${estTime}` 
                });
            });
            return embed;
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Previous').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('next').setLabel('Next ➡️').setStyle(ButtonStyle.Secondary)
        );

        const message = await interaction.editReply({ 
            embeds: [generateEmbed(0)], 
            components: pages > 1 ? [row] : [] 
        });

        if (pages > 1) {
            const collector = message.createMessageComponentCollector({ time: 120000 });
            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) return i.reply({ content: "Run the command yourself to use the buttons!", ephemeral: true });
                
                if (i.customId === 'next' && currentPage < pages - 1) currentPage++;
                else if (i.customId === 'prev' && currentPage > 0) currentPage--;
                
                await i.update({ embeds: [generateEmbed(currentPage)] });
            });
        }
    }
};