const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { DOMAIN, SSL_ENABLED, ZIPLINE_TOKEN, PRIVATE_SHORTEN } = process.env;
const axios = require("axios");
const embed = new EmbedBuilder();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shorten")
        .setDescription("Shortens the provided URL.")
        .addStringOption((option) => option.setName("url").setDescription("url to shorten").setRequired(true))
        .addStringOption((option) => option.setName("vanity").setDescription("custom vanity").setRequired(false)),
    async execute(interaction) {
        const url = interaction.options.getString("url", true);
        const vanity = interaction.options.getString("vanity");

        await interaction.deferReply({ ephemeral: PRIVATE_SHORTEN === "true" ? true : false });

        if (!url || (!url.startsWith("https://") && !url.startsWith("http://"))) {
            embed.setDescription("❌ Please provide a vaild URL to shorten.");
            embed.setColor("Red");
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        try {
            const shortenResponse = await axios.post(
                `${SSL_ENABLED === "true" ? "https://" : "http://"}${DOMAIN}/api/shorten`,
                { url, vanity },
                {
                    headers: {
                        Authorization: ZIPLINE_TOKEN,
                        "content-type": "application/json",
                    },
                }
            );

            embed.setDescription(`✅ [Your URL](${shortenResponse.data.url}) has been shortened successfully.\n\n\`\`\`${shortenResponse.data.url}\`\`\``);
            embed.setColor("Green");
            interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);

            embed.setDescription("❌ An error occurred while shortening this URL.");
            embed.setColor("Red");
            interaction.followUp({ embeds: [embed] });
        }
    },
};
