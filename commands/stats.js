const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction, UserStats } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View comprehensive financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        
        try {
            const stats = await UserStats.findOne({ userId: target.id }) || {};
            const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 });

            if (txs.length === 0 && !stats.userId) {
                return interaction.editReply(`No records found for **${target.username}**.`);
            }

            let rPurchasedUSD = 0, rSoldUSD = 0, rPurchasedRobux = 0, rSoldRobux = 0;
            let bestItem = 'None';
            let highVal = 0;

            txs.forEach(t => {
                const tUSD = t.amountUSD || 0;
                const tRobux = t.amountRobux || 0;
                const type = t.type || 'purchase';

                if (type === 'purchase') { rPurchasedUSD += tUSD; rPurchasedRobux += tRobux; } 
                else { rSoldUSD += tUSD; rSoldRobux += tRobux; }

                if (tUSD > highVal || tRobux > highVal) {
                    highVal = Math.max(tUSD, tRobux);
                    bestItem = t.item;
                }
            });

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setAuthor({ name: `${target.tag}'s Financial Audit`, iconURL: target.displayAvatarURL() })
                .setTitle('📊 Store Performance Profile')
                .addFields(
                    { name: '💰 Total USD', value: `Purchased: \`$${rPurchasedUSD.toFixed(2)}\` \nSold: \`$${rSoldUSD.toFixed(2)}\``, inline: true },
                    { name: '<:Epok_Robux:1394440796211515402> Total Robux', value: `Purchased: \`${rPurchasedRobux.toLocaleString()}\` \nSold: \`${rSoldRobux.toLocaleString()}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '🏆 Best Transaction', value: `📦 **${bestItem.toUpperCase()}**`, inline: true },
                    { name: '📊 Total Deals', value: `\`${txs.length}\` Trades`, inline: true },
                    { name: '🕒 Last Seen', value: txs[0] ? `<t:${Math.floor(txs[0].date.getTime() / 1000)}:R>` : 'N/A', inline: true }
                )
                .setFooter({ text: 'Epok\'s Store • Internal Tracking' });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) { console.error(err); }
    }
};