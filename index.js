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
const { logInfo } = require("./functions");

// Load environment variables
require("dotenv").config();

const LOAD_SLASH = process.argv.includes("load");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (
  !TOKEN ||
  !CLIENT_ID ||
  !process.env.ADMIN_ID ||
  !process.env.KIEDY_KOLOS_ID ||
  !process.env.WNIOSKI_ID ||
  !process.env.CALENDAR_ID ||
  !process.env.SPREADSHEET_ID ||
  !process.env.GOOGLE_AUTH
) {
  logInfo(
    "Environment variables",
    new Error(
      "Missing one or more environment variables in .env file. Please add them and try again."
    )
  );
  process.exit(1);
}

// Create logs folder if it doesn't exist
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
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
    activities: [{ name: "studentów (debili)", type: ActivityType.Listening }],
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
    logInfo(
      "Loading slash commands",
      new Error(
        `The command at ./commands/${file} is missing a required "data" or "run" property.`
      )
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
    logInfo(
      "Loading button commands",
      new Error(
        `The command at ./buttons/${file} is missing a required "name" or "run" property.`
      )
    );
  }
}

// If deploy argument is passed, load slash commands and exit
if (LOAD_SLASH) {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  (async () => {
    try {
      logInfo(
        `Started refreshing ${commands.length} application (/) commands.`
      );
      const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
      logInfo(`Successfully reloaded ${data.length} application (/) commands.`);
      process.exit(0);
    } catch (error) {
      logInfo("Reloading slash commands", error);
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

  process.on("uncaughtException", (err) => {
    logInfo("uncaughtException", err);
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Login to Discord
  client.login(TOKEN).catch((err) => {
    logInfo("Logging in", err);
    process.exit(1);
  });
}
