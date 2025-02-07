const {
  Client,
  Partials,
  GatewayIntentBits,
  Collection,
  ActivityType,
  PresenceUpdateStatus
} = require("discord.js");
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const utils = require("./utils");

require("dotenv").config();

const LOAD_SLASH = process.argv.includes("load");
const DEV = utils.isDev();

const TOKEN = DEV ? process.env.TOKEN_DEV : process.env.TOKEN;
const CLIENT_ID = DEV ? process.env.CLIENT_ID_DEV : process.env.CLIENT_ID;
const isConfigCreated = fs.existsSync("config.json");

if (!TOKEN || !CLIENT_ID || !process.env.GOOGLE_AUTH || !isConfigCreated) {
  utils.logInfo(
    "Environment variables",
    new Error("Missing environment variables in .env file or config.json.")
  );
  setTimeout(() => {
    process.exit(1);
  }, 1000);
}

if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  presence: {
    activities: [{ name: "studentów (debili)", type: ActivityType.Listening }],
    status: PresenceUpdateStatus.Online
  }
});

client.slashcommands = new Collection();
const commands = [];
const slashFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of slashFiles) {
  const slashcmd = require(`./commands/${file}`);
  if ("data" in slashcmd && "execute" in slashcmd) {
    client.slashcommands.set(slashcmd.data.name, slashcmd);
  } else {
    utils.logInfo(
      "Loading slash commands",
      new Error(
        `The command at ./commands/${file} is missing ` +
          "a required \"data\" or \"run\" property."
      )
    );
  }
  if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
}

client.buttoncommands = new Collection();
const buttonFiles = fs
  .readdirSync("./buttons")
  .filter((file) => file.endsWith(".js"));
for (const file of buttonFiles) {
  const buttoncmd = require(`./buttons/${file}`);
  if ("name" in buttoncmd && "execute" in buttoncmd) {
    client.buttoncommands.set(buttoncmd.name, buttoncmd);
  } else {
    utils.logInfo(
      "Loading button commands",
      new Error(
        `The command at ./buttons/${file} is missing ` +
          "a required \"name\" or \"execute\" property."
      )
    );
  }
}

if (LOAD_SLASH) {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  (async () => {
    try {
      utils.logInfo(
        `Started refreshing ${commands.length} application (/) commands.`
      );
      const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands
      });
      utils.logInfo(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (error) {
      utils.logInfo("Reloading slash commands", error);
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  })();
} else {
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
    utils.logInfo("uncaughtException", err);
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  client.login(TOKEN).catch((err) => {
    utils.logInfo("Logging in", err);
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}
