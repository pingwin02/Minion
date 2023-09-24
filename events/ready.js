const { Events } = require("discord.js");
const { logInfo } = require("..");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logInfo(`Logged in as ${client.user.tag}!`, 2);
  },
};
