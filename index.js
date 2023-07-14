const fs = require("node:fs");
const path = require("node:path");

const { REST, Routes } = require("discord.js");

// Require the necessary discord.js classes
const {
  Client,
  Partials,
  GatewayIntentBits,
  Collection,
} = require("discord.js");

require("dotenv").config();

module.exports = {
  printMessage,
  sendError,
};

const TOKEN = process.env.token;
const CLIENT_ID = process.env.clientId;

if (
  !TOKEN ||
  !CLIENT_ID ||
  !process.env.kiedykolosID ||
  !process.env.weryfikacjeID
) {
  console.log(
    "Please provide a valid token, client ID, kiedykolos channel ID and weryfikacje channel ID in the .env file."
  );
  process.exit(1);
}

const LOAD_SLASH = process.argv[2] == "load";

function printMessage(message) {
  const currentdate =
    new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + " UTC";

  let user = message.author;
  if (message.author === undefined) user = message.user;

  let commandName = message.commandName;
  if (commandName === undefined) commandName = message.content;

  if (message.guild === null)
    return console.log(
      `${currentdate} - ${user.username} (${user.id}) used ${commandName} command in DMs`
    );
  return console.log(
    `${currentdate} - ${user.username} (${user.id}) used ${commandName} command in #${message.channel.name} (${message.channel.id}) at ${message.guild.name} (${message.guild.id})`
  );
}

function sendError(title, err, interaction) {
  interaction.channel.send(
    `:x: Wystąpił nieoczekiwany błąd: ${title}\n\`${err}\``
  );
}

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Load slash commands from commands folder
client.slashcommands = new Collection();
let commands = [];
const slashFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of slashFiles) {
  const slashcmd = require(`./commands/${file}`);
  if ("data" in slashcmd && "execute" in slashcmd) {
    client.slashcommands.set(slashcmd.data.name, slashcmd);
  } else {
    console.log(
      `[WARNING] The command at ./commands/${file} is missing a required "data" or "execute" property.`
    );
  }
  if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
}

// If deploy argument is passed, load slash commands and exit
if (LOAD_SLASH) {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  (async () => {
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );
      const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
} else {
  // Otherwise, load events and login
  const eventFiles = fs
    .readdirSync("./events")
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  // Login to Discord
  client.login(TOKEN);
}
