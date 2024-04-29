# Dependencies
- [Node.js](https://nodejs.org)
- Access to a [Zipline](https://github.com/diced/zipline) instance

# Commands
- **/upload** allows you to attach any file (100mb or smaller) which will then be uploaded to your Zipline instance.
- **/shorten** allows you to shorten any link that you provide with the option to set your own vanity for the URL using the `vanity` command option.

# How to use
1. Clone the repo by either running `git clone https://github.com/wraithy/zipline-discord bot` in your terminal or via the "Code" dropdown button.
2. Open a terminal/change directory to the "zipline-discord-bot" directory and run `npm i` to download all of the required packages.
3. Edit the ".env.example" file and fill the variables with your credentials and rename the file to just ".env".
4. Start the node app by running the `npm start` command which will register/refresh the slash commands before running the bot.

If you have any issues, feel free to open an issue. I did add chunking to the bot with the goal of being able to upload files bigger than 100mb however I found that attachments in slash commands have a limit of 100mb. I may implement another way of uploading in the future (by using legacy commands or maybe just listening for attachments in general) but the current system should be just fine for most people as Zipline is mostly used for serving screenshots and small videos.
