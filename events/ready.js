const { Events, ActivityType } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    // Set the bot's activity
    client.user.setPresence({
      activities: [
        { name: `studentów (debili)`, type: ActivityType.Listening },
      ],
      status: "online",
    });
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
