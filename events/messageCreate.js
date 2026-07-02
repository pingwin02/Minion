const { Events } = require("discord.js");
const utils = require("../utils");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.author.bot) return;

      const lowerContent = message.content.toLowerCase();
      const handler = getMessageHandler(message, lowerContent);

      if (isProtectedCommandChannel(message) && !handler) {
        const guildName = message.guild?.name || message.guildId;
        const channelName = message.channel.name || message.channelId;
        const authorName = message.author.username;

        await message.delete();
        utils.logInfo(
          `[${guildName}] Deleted message in protected channel ` +
            `#${channelName} by @${authorName}: ${message.content}`
        );
        return;
      }

      if (handler) {
        await handler(message);
      }
    } catch (err) {
      utils.logInfo(`${message.content} message`, err);
    }
  }
};

function getMessageHandler(message, lowerContent) {
  const isAdminMessage = message.author.id === process.env.ADMIN_ID;

  if (lowerContent === "!pin" && message.reference) {
    return utils.handlePinCommand;
  }

  if (lowerContent === "!unpin" && message.reference) {
    return utils.handleUnpinCommand;
  }

  if (lowerContent === "!clear" && isAdminMessage) {
    return utils.handleClearCommand;
  }

  if (lowerContent === "student") {
    return utils.handleStudentCommand;
  }

  if (lowerContent.includes("obszar")) {
    return utils.handleObszarCommand;
  }

  if (lowerContent === "!avatar_update" && isAdminMessage) {
    return utils.handleAvatarUpdateCommand;
  }

  if (lowerContent === "!remove_all_roles" && isAdminMessage) {
    return utils.handleRemoveAllRolesCommand;
  }

  if (lowerContent === "!handle_guests" && message.guild && isAdminMessage) {
    return utils.handleGuests;
  }

  return null;
}

function isProtectedCommandChannel(message) {
  if (!message.guild) {
    return false;
  }

  const guildConfig = utils.getGuildConfig(message.guildId);
  const protectedChannelIds = [
    guildConfig.inzynierId,
    guildConfig.magisterId
  ].filter(Boolean);

  return protectedChannelIds.includes(message.channelId);
}
