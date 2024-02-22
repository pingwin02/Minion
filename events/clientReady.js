const { Events } = require("discord.js");
const { logInfo } = require("../functions");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.user.setAvatar("img/bot_logo_anim.gif");
    logInfo(`Logged in as ${client.user.tag}!`);
  },
};
