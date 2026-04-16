const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('Leave feedback for a deal')
        .addIntegerOption(o => o.setName('stars').setDescription('1-5 stars').setRequired(true).setMinValue(1).setMaxValue(5))
        .addStringOption(o => o.setName('comment').setDescription('Your thoughts'))
        .addAttachmentOption(o => o.setName('image').setDescription('Optional photo')),
    async execute(interaction) {
        const stars = interaction.options.getInteger('stars');
        const comment = interaction.options.getString('comment') || 'No comment provided.';
        const image = interaction.options.getAttachment('image');

        const embed = new EmbedBuilder()
            .setTitle('⭐ New Feedback Received')
            .setDescription(`**Rating:** ${'⭐'.repeat(stars)}\n**Comment:** ${comment}`)
            .setFooter({ text: `From: ${interaction.user.tag}` })
            .setColor(0x00FF00);

        if (image) embed.setImage(image.url);

        await interaction.reply({ content: '✅ Thank you for your feedback!', ephemeral: true });
        // You could also send this to a specific "feedback-channel" here
    },
};