const fs = require("node:fs");

const { REST, Routes } = require("discord.js");

// Require the necessary discord.js classes
const {
  Client,
  Partials,
  GatewayIntentBits,
  Collection,
} = require("discord.js");

require("dotenv").config();

const keep_alive = require("./keep_alive.js"); //for replit

module.exports = {
  logInfo,
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

// Create logs folder if it doesn't exist
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}
/**
 * Logs information to the console and appends it to a log file.
 * @param {string} info - Information to log.
 * @param {integer} type - Type of information to log.
 *
 * type = 0: Command;
 * type = 1: Error;
 * type = 2: Info;
 *
 * @returns {void}
 */

function logInfo(info, type) {
  const currentdate =
    new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + " UTC";

  var logMessage = `[${currentdate}] - `;

  switch (type) {
    case 0:
      logMessage += "[COMMAND] ";
      break;
    case 1:
      logMessage += "[ERROR] ";
      break;
    case 2:
      logMessage += "[INFO] ";
      break;
    default:
      logMessage += "[OTHER] ";
      break;
  }

  logMessage += info;

  fs.appendFile("logs/log.log", `${logMessage}\n`, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });

  console.log(logMessage);
}

function sendError(title, err, interaction) {
  logInfo(`Error: ${title}\n${err}`, 1);
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
