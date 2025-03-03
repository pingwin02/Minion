const { Events } = require("discord.js");
const utils = require("../utils");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.author.bot) return;

      const lowerContent = message.content.toLowerCase();

      if (lowerContent === "pin" && message.reference) {
        await utils.handlePinCommand(message);
      } else if (lowerContent === "unpin" && message.reference) {
        await utils.handleUnpinCommand(message);
      } else if (
        message.content === "!clear" &&
        message.author.id === process.env.ADMIN_ID
      ) {
        await utils.handleClearCommand(message);
      } else if (message.content === "student") {
        await utils.handleStudentCommand(message);
      } else if (message.content.includes("obszar")) {
        await utils.handleObszarCommand(message);
      } else if (
        message.content === "!avatar_update" &&
        message.author.id === process.env.ADMIN_ID
      ) {
        await utils.handleAvatarUpdateCommand(message);
      } else if (
        message.content === "!remove_all_roles" &&
        message.guild &&
        message.author.id === process.env.ADMIN_ID
      ) {
        await utils.handleRemoveAllRolesCommand(message);
      }
    } catch (err) {
      utils.logInfo(`${message.content} message`, err);
    }
  }
};
