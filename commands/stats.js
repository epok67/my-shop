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

            // Convert to Title Case for "Best Transaction"
            const cleanBestItem = bestItem.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setAuthor({ name: `Full Audit: ${target.tag}`, iconURL: target.displayAvatarURL() })
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setTitle('<:EpokShopIcon:1419448781581320363> Comprehensive Financial Overview')
                .addFields(
                    { name: '<a:Epok_PayPal:1394440794496307280> Purchased (USD)', value: `\`$${pUSD.toFixed(2)}\``, inline: true },
                    { name: '<a:Epok_MoneyTower:1394440799466422332> Sold (USD)', value: `\`$${sUSD.toFixed(2)}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }, 
                    { name: '<:Epok_Robux:1394440796211515402> Purchased (R$)', value: `\`${pRbx.toLocaleString()}\``, inline: true },
                    { name: '<:Epok_Robux:1394440796211515402> Sold (R$)', value: `\`${sRbx.toLocaleString()}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }, 
                    { name: '<:Epok_Buyer:1411729871268216874> Total Deals', value: `\`${txs.length}\` Transactions`, inline: true },
                    { name: '<a:Epok_GiftBox:1397282003346264226> Best Transaction', value: `**${cleanBestItem}**`, inline: true },
                    { name: '<a:Epok_BlueDot:1452761174377496576> Last Transaction', value: `<t:${Math.floor(txs[0].date.getTime() / 1000)}:R>`, inline: true