const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Transaction } = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View comprehensive financial dossier')
        .addUserOption(o => o.setName('user').setDescription('Target user')),

    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.user;
        
        try {
            const txs = await Transaction.find({ userId: target.id }).sort({ date: -1 });

            if (txs.length === 0) {
                return interaction.editReply(`No records found for **${target.username}**.`);
            }

            let pUSD = 0, sUSD = 0, pRbx = 0, sRbx = 0;
            let bestItem = 'None';
            let highVal = 0;

            txs.forEach(t => {
                const usd = t.amountUSD || 0;
                const rbx = t.amountRobux || 0;
                if (t.type === 'purchase') { pUSD += usd; pRbx += rbx; } 
                else { sUSD += usd; sRbx += rbx; }

                if (usd > highVal || rbx > highVal) {
                    highVal = Math.max(usd, rbx);
                    bestItem = t.item;
                }
            });

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setAuthor({ name: `Full Audit: ${target.tag}`, iconURL: target.displayAvatarURL() })
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setTitle('💼 Comprehensive Financial Overview')
                .addFields(
                    { name: '🛒 Total Purchased (USD)', value: `\`$${pUSD.toFixed(2)}\``, inline: true },
                    { name: '🤝 Total Sold (USD)', value: `\`$${sUSD.toFixed(2)}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }, 
                    { name: '🛒 Total Purchased (R$)', value: `<:Epok_Robux:1394440796211515402> \`${pRbx.toLocaleString()}\``, inline: true },
                    { name: '🤝 Total Sold (R$)', value: `<:Epok_Robux:1394440796211515402> \`${sRbx.toLocaleString()}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }, 
                    { name: '📊 Total Deals', value: `\`${txs.length}\` Transactions`, inline: true },
                    { name: '🏆 Best Transaction', value: `📦 **${bestItem.toUpperCase()}**`, inline: true },
                    { name: '🕒 Last Transaction', value: `<t:${Math.floor(txs[0].date.getTime() / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: 'Epok\'s Store Tracking System' });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) { 
            console.error(err); 
            await interaction.editReply("❌ Error loading stats.");
        }
    }
};