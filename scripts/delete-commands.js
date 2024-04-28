const { REST, Routes } = require("discord.js");
require("dotenv").config();
const { BOT_TOKEN, CLIENT_ID } = process.env;

const rest = new REST().setToken(BOT_TOKEN);

(async () => {
    try {
        console.log(`Started deleting application (/) commands.`);

        rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
            .then(() => console.log("Successfully deleted all application commands."))
            .catch(console.error);
    } catch (error) {
        console.error(error);
    }
})();
