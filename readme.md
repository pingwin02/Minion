# Minion Readme

<p align="center">
  <img src="bot_logo.png" width="150" height="150">
</p>

This readme provides instructions for running and configuring Minion bot for Discord.

## Requirements

Before running the bot, make sure you have the following dependencies installed:

- `discord.js`
- `dotenv`
- `googleapis`
- `moment-timezone`

## Commands

The bot supports the following 6 slash commands and one prefix command:

1. `/info`: Provides information about the bot.
2. `/kiedy-kolos`: Updates message with events from Google Calendar API.
3. `/losuj`: Generates a random number within the given range.
4. `/purge`: Deletes the specified number of messages.
5. `/verify`: Command for student verification.

Additionally, the bot supports the command `!clear`, which deletes messages sent by the bot in the current channel.

## Prerequisites

To run the bot, you need to have the following file:

- `.env`: This file should contain the following variables:
  - `TOKEN`: Token of the bot.
  - `CLIENT_ID`: Client ID of the bot.
  - `ADMIN_ID`: ID of the admin.
  - `KIEDY_KOLOS_ID`: ID of the channel for `/kiedy-kolos` command.
  - `WNIOSKI_ID`: ID of the channel for `/verify` command.
  - `CALENDAR_ID`: ID of the Google Calendar.
  - `SPREADSHEET_ID`: ID of the Google Spreadsheet.
  - `GOOGLE_AUTH`: Whole google API key from the Google Cloud Platform.

For example:

```
TOKEN=1234567890
CLIENT_ID=1234567890
```

## Setup

Follow the steps below to set up and run the bot:

1. Run the script `npm run deploy` to load the slash commands into the bot.
2. Start the bot using a tool like nodemon or type `npm start`.

That's it! The bot should now be up and running, ready to respond to commands on your Discord server.
