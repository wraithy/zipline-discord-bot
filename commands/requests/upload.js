const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { DOMAIN, SSL_ENABLED, ZIPLINE_TOKEN, PRIVATE_UPLOADS, CHUNKING_ENABLED, CHUNK_SIZE_IN_MB, FILE_SIZE_LIMIT_IN_MB } = process.env;
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("node:path");
const embed = new EmbedBuilder();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("upload")
        .setDescription("Uploads a file to the remote server.")
        .addAttachmentOption((option) => option.setName("file").setDescription("file to upload").setRequired(true)),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment("file", true);
        const fileName = attachment.name;
        const filePath = path.join(__dirname, "../../tmp", fileName);

        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        if (PRIVATE_UPLOADS === "true") {
            await interaction.deferReply({ ephemeral: true });
        } else {
            await interaction.deferReply();
        }

        try {
            if (attachment.size > 95 * 1024 * 1024 && CHUNKING_ENABLED === "false") {
                embed.setDescription(`❌ \`${fileName}\` is too large. The maximum file size limit is \`95mb\`.`);
                embed.setColor("Red");
                interaction.editReply({ embeds: [embed] });
                return;
            }

            if (attachment.size > FILE_SIZE_LIMIT_IN_MB * 1024 * 1024) {
                embed.setDescription(`❌ \`${fileName}\` is too large. The maximum file size limit is \`${FILE_SIZE_LIMIT_IN_MB}mb\`.`);
                embed.setColor("Red");
                interaction.editReply({ embeds: [embed] });
                return;
            }

            const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
            fs.writeFileSync(filePath, response.data);

            embed.setDescription(`✅ \`${fileName}\` has been fetched and will now be uploaded.`);
            embed.setColor("Green");
            interaction.editReply({ embeds: [embed] });

            if (attachment.size < 95 * 1024 * 1024) {
                const file = fs.createReadStream(filePath);
                const form = new FormData();
                form.append("file", file, {
                    filename: fileName,
                    contentType: attachment.contentType,
                    knownLength: attachment.size,
                });

                const uploadResponse = await axios.post(`${SSL_ENABLED === "true" ? "https://" : "http://"}${DOMAIN}/api/upload`, form, {
                    headers: {
                        Authorization: ZIPLINE_TOKEN,
                        "content-type": "multipart/form-data",
                    },
                });

                embed.setDescription(
                    `✅ [${fileName}](${uploadResponse.data.files}) has been uploaded successfully.\n\n\`\`\`${uploadResponse.data.files}\`\`\``
                );
                embed.setColor("Green");
                interaction.editReply({ embeds: [embed] });
                fs.unlinkSync(filePath);
            } else {
                const chunkSize = CHUNK_SIZE_IN_MB * 1024 * 1024;
                const numChunks = Math.ceil(attachment.size / chunkSize);

                function generateRandomString() {
                    return Math.random().toString(36).substring(2, 6);
                }

                const identifier = generateRandomString();

                for (let i = numChunks - 1; i >= 0; i--) {
                    const start = i * chunkSize;
                    const end = Math.min(start + chunkSize, attachment.size);
                    const chunk = fs.createReadStream(filePath, { start, end });
                    const formData = new FormData();
                    formData.append("file", chunk, {
                        filename: fileName,
                        contentType: attachment.contentType,
                        knownLength: end - start,
                    });
                    axios
                        .post(`${SSL_ENABLED === "true" ? "https://" : "http://"}${DOMAIN}/api/upload`, formData, {
                            headers: {
                                Authorization: process.env.ZIPLINE_TOKEN,
                                "Content-Type": "multipart/form-data",
                                "Content-Range": `bytes ${start}-${end - 1}/${attachment.size}`,
                                "X-Zipline-Partial-Filename": fileName,
                                "X-Zipline-Partial-Lastchunk": i === 0 ? "true" : "false",
                                "X-Zipline-Partial-Identifier": identifier,
                                "X-Zipline-Partial-Mimetype": attachment.contentType,
                            },
                        })
                        .then((response) => {
                            if (response.data.files) {
                                embed.setDescription(
                                    `✅ [${fileName}](${response.data.files}) has been uploaded successfully.\n\n\`\`\`${response.data.files}\`\`\``
                                );
                                embed.setColor("Green");
                                interaction.editReply({ embeds: [embed] });
                                fs.unlinkSync(filePath);
                            }
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            }
        } catch (error) {
            console.error(error);

            embed.setDescription("❌ An error occurred while downloading/uploading the file.");
            embed.setColor("Red");
            interaction.followUp({ embeds: [embed] });
            fs.unlinkSync(filePath);
        }
    },
};
