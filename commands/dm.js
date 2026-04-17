const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a formal DM to a user via the bot')
        .addUserOption(o => o.setName('user').setDescription('The recipient').setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('What to say').setRequired(true)),

    async execute(interaction) {
        // Updated to your specific Discord ID
        if (interaction.user.id !== '459516116465876992') {
            return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
        }

        const target = interaction.options.getUser('user');
        const text = interaction.options.getString('message');

        const dmEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('✉️ Message from Epok\'s Store')
            .setDescription(text)
            .setFooter({ text: 'Reply in the server if you have questions!' });

        try {
            await target.send({ embeds: [dmEmbed] });
            await interaction.reply({ content: `✅ DM sent to ${target.username}`, ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: `❌ Failed to DM ${target.username}. Their DMs might be closed.`, ephemeral: true });
        }
    }
};