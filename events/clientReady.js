const { Events } = require("discord.js");
const utils = require("../utils");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    utils.logInfo(`Logged in as ${client.user.tag}!`);
  }
};
