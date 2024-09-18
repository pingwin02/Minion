# Minion Readme

<p align="center">
  <img src="img/bot_logo.png" width="150" height="150">
</p>

This readme provides instructions for running and configuring Minion bot for Discord.

## Requirements

Before running the bot, make sure you have the following dependencies installed:

- `discord.js`
- `dotenv`
- `googleapis`
- `moment-timezone`

You can install these dependencies using the following command:

```
npm install
```

## Commands

The bot supports the following slash and prefix commands:

- `/info`: Provides information about the bot.
- `/kiedy-kolos`: Updates message with events from Google Calendar API.
- `/losuj`: Generates a random number within the given range.
- `/purge`: Deletes the specified number of messages.
- `/verify`: Command for student verification.

- `!clear`: Deletes messages sent by the bot in the current channel.
- `!avatar_update`: Updates the bot's avatar and banner.\*
- `!remove_all_roles`: Removes all roles and channel permission overrides from every member of the server.\*

\*These commands are only available to the bot's admin.

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
  - `SPREADSHEET_DATA_ID`: ID of the Google Spreadsheet for automatic verification.
  - `GUILD_ID`: ID of the server.
  - `GOOGLE_AUTH`: Whole google API key from the Google Cloud Platform.

  Optional:

  - `SUSPEND_VERIFY`: Set to `true` to disable the `/verify` command.
  - `TOKEN_DEV`: Token of the bot for development purposes.
  - `CLIENT_ID_DEV`: Client ID of the bot for development purposes.
  - `DEV_CHANNEL_ID`: ID of the channel for development purposes.
  - `DEV_GUILD_ID`: ID of the server for development purposes.

For example:

```
TOKEN=1234567890
CLIENT_ID=1234567890
```

## Setup

Follow the steps below to set up and run the bot:

1. Run the script `npm run deploy` to register the bot's slash commands.
2. Start the bot using a tool like nodemon or type `npm start`.

For development purposes, you can run the bot using the command `npm run dev`.

That's it! The bot should now be up and running, ready to respond to commands on your Discord server.
