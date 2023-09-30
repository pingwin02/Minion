const { Events } = require("discord.js");
const { logInfo } = require("../functions");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logInfo(`Logged in as ${client.user.tag}!`);
  },
};
