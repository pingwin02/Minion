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
- `/inzynier`: Adds the "Inżynier" role to the user.
- `/kiedy-kolos`: Updates message with events from Google Calendar API.
- `/losuj`: Generates a random number within the given range.
- `/przywroc-wnioski`: Restores student verification requests.
- `/purge`: Deletes the specified number of messages.
- `/verify`: Command for student verification.
- `/wybor-specek`: Initiates the process of selecting specialities.

- `!pin`: Pins a replied message.
- `!unpin`: Unpins a replied message.
- `!clear`: Deletes messages sent by the bot in the current channel.\*
- `!avatar_update`: Updates the bot's avatar and banner.\*
- `!remove_all_roles`: Removes all roles and channel permission overrides from every member of the server.\*
- `!handle_guests`: Adds the "Gość" role to all users without any specialities.\*

\*These commands are only available to the bot's admin.

## Prerequisites

To run the bot, you need to have the following files:

- `.env`:

  - `TOKEN`: Token of the bot.
  - `CLIENT_ID`: Client ID of the bot.
  - `ADMIN_ID`: ID of the admin.

  Optional:

  - `SUSPEND_VERIFY`: Set to `true` to disable the `/verify` command globally.
  - `TOKEN_DEV`: Token of the bot for development purposes.
  - `CLIENT_ID_DEV`: Client ID of the bot for development purposes.
  - `ADMIN_ID_DEV`: ID of the admin for development purposes.

- `config.json`:

```json
{
  "auth": {
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "client_email": "<SERVICE_NAME>@<PROJECT_ID>.iam.gserviceaccount.com",
    "client_id": "<CLIENT_ID>",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/<SERVICE_NAME>%40<PROJECT_ID>.iam.gserviceaccount.com",
    "private_key": "<PRIVATE_KEY>",
    "private_key_id": "<PRIVATE_KEY_ID>",
    "project_id": "<PROJECT_ID>",
    "token_uri": "https://oauth2.googleapis.com/token",
    "type": "service_account",
    "universe_domain": "googleapis.com"
  },
  "common": {
    "spreadsheetDataId": "<SPREADSHEET_ID>",
    "spreadsheetId": "<SPREADSHEET_ID>"
  },
  "guilds": {
    "<GUILD1_ID>": {
      "allowedKiedyKolosId": "<CHANNEL_ID>",
      "autoVerify": false,
      "calendarId": "<ID>calendar.google.com",
      "inviteLink": "https://discord.gg/invite",
      "inzynierId": "<CHANNEL_ID>",
      "kiedyKolosId": "<CHANNEL_ID>",
      "logo": "https://example.com/logo1.png",
      "name": "Example 1",
      "regulaminId": "<CHANNEL_ID>",
      "wnioskiId": "<CHANNEL_ID>"
    },
    "<GUILD2_ID>": {
      "allowedKiedyKolosId": "<CHANNEL_ID>",
      "autoVerify": true,
      "calendarId": "<ID>@group.calendar.google.com",
      "inviteLink": "https://discord.gg/invite",
      "inzynierId": "<CHANNEL_ID>",
      "isDev": true,
      "kiedyKolosId": "<CHANNEL_ID>",
      "logo": "https://example.com/logo2.png",
      "name": "Example 2 dev",
      "regulaminId": "<CHANNEL_ID>",
      "wnioskiId": "<CHANNEL_ID>"
    }
  }
}
```

### JSON Configuration Structure for Discord Bot

#### 🔹 **Section `common` (general settings)**

- `spreadsheetDataId` - Google Sheets ID containing data for auto-verification.
- `spreadsheetId` - Main Google Sheets ID used in the application.

#### 🔹 **Section `guilds` (configuration for individual Discord servers)**

Each guild (Discord server) has its own key (`<GUILD_ID>`) containing its settings:

##### **🔸 Guild configuration variables:**

- `allowedKiedyKolosId` - ID of the channel where users can use the `/kiedy-kolos` command.
- `autoVerify` - Boolean (`true/false`) specifying whether users are automatically verified.
- `calendarId` - Google Calendar ID associated with the server.
- `inviteLink` - Invitation link to the Discord server.
- `inzynierId` - Channel ID for the `/inzynier` command.
- `kiedyKolosId` - ID of the channel where the bot posts exam schedules.
- `logo` - URL of the server's logo, used in embedded messages (`embeds`).
- `name` - Name of the server.
- `regulaminId` - ID of the channel containing the server rules.
- `wnioskiId` - ID of the channel where verification requests are received.

##### **🔸 Additional optional server settings:**

- `isDev` - Boolean (`true/false`) indicating that the server is for testing.

## Setup

Follow the steps below to set up and run the bot:

1. Run the script `npm run deploy` to register the bot's slash commands.
2. Start the bot using a tool like nodemon or type `npm start`.

For development purposes, you can run the bot using the command `npm run dev`.

That's it! The bot should now be up and running, ready to respond to commands on your Discord server.

## License

Minion is released under the [MIT License](LICENSE).

## Credits

Minion was created by pingwin02.
