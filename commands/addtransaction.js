async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.getUser('user');
        const dealType = interaction.options.getString('deal_type');
        const amount = interaction.options.getNumber('amount');
        const item = interaction.options.getString('item').toUpperCase();
        const payment = interaction.options.getString('payment');
        
        const isRobux = payment.toLowerCase().includes('robux');
        let usd = isRobux ? 0 : amount;
        let robux = isRobux ? amount : 0;
        const now = new Date();

        // 1. Create the receipt
        await Transaction.create({ 
            userId: user.id, type: dealType, amountUSD: usd, amountRobux: robux, item, payment, date: now 
        });

        // 2. THIS WAS MISSING: Update the main UserStats so the leaderboard works!
        await UserStats.findOneAndUpdate(
            { userId: user.id },
            { 
                $inc: { 
                    purchasedUSD: dealType === 'purchase' ? usd : 0,
                    soldUSD: dealType === 'sale' ? usd : 0,
                    purchasedRobux: dealType === 'purchase' ? robux : 0,
                    soldRobux: dealType === 'sale' ? robux : 0,
                    countDeals: 1
                },
                $set: { lastPurchaseDate: now }
            },
            { upsert: true, new: true }
        );

        const logChannel = await interaction.client.channels.fetch('1397978290693865512');
        if (logChannel) {
            const displayValue = isRobux ? `<:Epok_Robux:1394440796211515402> **${amount.toLocaleString()}**` : `**$${amount.toFixed(2)}**`;
            const embed = new EmbedBuilder()
                .setColor(dealType === 'purchase' ? 0x2ECC71 : 0xE74C3C)
                .setTitle(`✅ ${dealType === 'purchase' ? 'Sale' : 'Purchase'} Logged`)
                .addFields(
                    { name: '👤 User', value: `<@${user.id}>`, inline: true },
                    { name: '📦 Item', value: `**${item}**`, inline: true },
                    { name: '💰 Value', value: displayValue, inline: true },
                    { name: '💳 Method', value: `**${payment}**`, inline: true }
                ).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        await interaction.editReply(`✅ Successfully logged for ${user.username}.`);
    }