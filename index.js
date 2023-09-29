const {
  Client,
  Partials,
  GatewayIntentBits,
  Collection,
  ActivityType,
  PresenceUpdateStatus,
} = require("discord.js");
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const { inspect } = require("util");

require("dotenv").config();

const LOAD_SLASH = process.argv[2] == "load";

if (!LOAD_SLASH) {
  const keep_alive = require("./website/server.js");
}

module.exports = {
  logInfo,
  sendError,
  msToTime,
};

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (
  !TOKEN ||
  !CLIENT_ID ||
  !process.env.ADMIN_ID ||
  !process.env.KIEDY_KOLOS_ID ||
  !process.env.WNIOSKI_ID ||
  !process.env.CALENDAR_ID ||
  !process.env.GOOGLE_AUTH
) {
  console.log(
    "[ERROR] Missing one or more required environment variables in .env file. Please add them and try again."
  );
  process.exit(1);
}

// Create logs folder if it doesn't exist
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}
/**
 * Logs information to the console and appends it to a log file.
 * @param {string} info - Information to log.
 * @param {Error} error - Error to log (optional)
 * @returns {void}
 */

function logInfo(info, error) {
  var currentdate = new Date()
    .toLocaleString("pl-PL", {
      timeZone: "Europe/Warsaw",
    })
    .replace(",", "");

  var logMessage = `[${currentdate}] - `;

  if (error) {
    logMessage += `[ERROR] ${info}: ${inspect(error, {
      depth: 0,
    })}`;
  } else {
    logMessage += `[INFO] ${info}`;
  }

  fs.appendFile("logs/log.log", `${logMessage}\n`, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });

  console.log(logMessage);
}

/**
 * Converts a number of milliseconds to a human-readable time format.
 * @param {number} ms - Number of milliseconds to convert.
 * @returns {string} Human-readable time format.
 */

function msToTime(ms) {
  let seconds = (ms / 1000).toFixed(1);
  let minutes = (ms / (1000 * 60)).toFixed(1);
  let hours = (ms / (1000 * 60 * 60)).toFixed(1);
  let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
  if (seconds < 60) return seconds + " sekund";
  else if (minutes < 60) return minutes + " minut";
  else if (hours < 24) return hours + " godzin";
  else return days + " dni";
}

/**
 * Sends an error message to the channel and logs the error.
 * @param {string} title - Title of the error.
 * @param {Error} err - Error to log.
 * @param {Interaction} interaction - Interaction to reply to.
 * @returns {void}
 */

function sendError(title, err, interaction) {
  logInfo(title, err);
  interaction.channel.send(
    `:x: Wystąpił nieoczekiwany błąd: ${title}\n\`${err}\``
  );
}

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  presence: {
    activities: [{ name: `studentów (debili)`, type: ActivityType.Listening }],
    status: PresenceUpdateStatus.Online,
  },
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

// Load button commands from buttons folder
client.buttoncommands = new Collection();
const buttonFiles = fs
  .readdirSync("./buttons")
  .filter((file) => file.endsWith(".js"));
for (const file of buttonFiles) {
  const buttoncmd = require(`./buttons/${file}`);
  if ("name" in buttoncmd && "execute" in buttoncmd) {
    client.buttoncommands.set(buttoncmd.name, buttoncmd);
  } else {
    console.log(
      `[WARNING] The button at ./buttons/${file} is missing a required "name" or "execute" property.`
    );
  }
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
