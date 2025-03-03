const { logInfo } = require("./logger");
const { timedDelete } = require("./time");
const { OverwriteType, MessageType } = require("discord.js");

async function handlePinCommand(message) {
  const channel = message.channel;
  const refMessageId = message.reference.messageId;
  if (!refMessageId) return;

  const msgToPin = await channel.messages.fetch(refMessageId);
  if (!msgToPin) {
    logInfo("handlePinCommand", "Message not found");
    return;
  }
  await msgToPin.pin();
  if (message.guild) await message.delete();
}

async function handleUnpinCommand(message) {
  const channel = message.channel;
  const refMessageId = message.reference?.messageId;
  if (!refMessageId) return;

  const msgToUnpin = await channel.messages.fetch(refMessageId);
  if (!msgToUnpin) {
    logInfo("handleUnpinCommand", "Message not found");
    return;
  }
  await msgToUnpin.unpin();

  const systemMessages = await channel.messages.fetch({ limit: 10 });

  const pinMessage = systemMessages.find(
    (msg) =>
      msg.type === MessageType.ChannelPinnedMessage &&
      msg.reference?.messageId === refMessageId
  );

  if (pinMessage) {
    await pinMessage.delete();
  }

  if (message.guild) await message.delete();
}

async function handleClearCommand(message) {
  logInfo(`Messages cleared by @${message.author.username}`);
  const channel = message.client.channels.cache.get(
    message.channelId.toString()
  );
  const toDelete = [];
  const messages = await channel.messages.fetch({ limit: 100 });

  messages.forEach((msg) => {
    if (msg.author.id === message.client.user.id) toDelete.push(msg.id);
  });
  if (toDelete.length === 0) {
    const msg1 = await message.reply({
      content: "Nie znaleziono żadnych wiadomości do usunięcia"
    });
    timedDelete(msg1);
  } else {
    toDelete.forEach((msgId) => {
      timedDelete(channel.messages.cache.get(msgId), 0);
    });
    const msg2 = await message.reply({
      content: `Usunąłem **${toDelete.length}** moich wiadomości`
    });
    timedDelete(msg2);
  }
  if (message.guild) timedDelete(message);
}

async function handleStudentCommand(message) {
  await message.reply("debil <:dziubdziub:1052315768555061279>");
}

async function handleObszarCommand(message) {
  await message.react("<:obszar:1346228519700533269>");
}

async function handleAvatarUpdateCommand(message) {
  await message.react("⌚");
  message.client.user.setAvatar("img/bot_logo_anim.gif");
  message.client.user.setBanner("img/bot_banner_anim.gif");
  await message.reactions.removeAll();
  await message.react("✅");
}

async function handleRemoveAllRolesCommand(message) {
  await message.react("⌚");
  const members = await message.guild.members.fetch();
  members.forEach((member) => {
    member.roles.cache.forEach((role) => {
      if (
        role.position < message.guild.members.me.roles.highest.position &&
        role.name !== "@everyone" &&
        role.managed === false
      ) {
        setTimeout(() => {
          logInfo(`Removing role @${role.name} from @${member.user.username}`);
          member.roles.remove(role).catch((err) => {
            logInfo(
              `Error while removing role @${role.name} ` +
                `from @${member.user.username}`,
              new Error(err.message)
            );
          });
        }, 20);
      }
    });
  });
  const channels = await message.guild.channels.fetch();
  channels.forEach((channel) => {
    channel.permissionOverwrites.cache.forEach((perm) => {
      if (perm.type === OverwriteType.Member) {
        const member = message.guild.members.cache.get(perm.id);
        if (member) {
          const memberUsername = member.user.username;
          setTimeout(() => {
            logInfo(
              `Removing @${memberUsername} permissions from #${channel.name}`
            );
            channel.permissionOverwrites.delete(perm.id).catch((err) => {
              logInfo(
                `Error while removing @${memberUsername} ` +
                  `permissions from #${channel.name}`,
                new Error(err.message)
              );
            });
          }, 20);
        }
      }
    });
  });
  await message.reactions.removeAll();
  await message.react("✅");
}

module.exports = {
  handlePinCommand,
  handleUnpinCommand,
  handleClearCommand,
  handleStudentCommand,
  handleObszarCommand,
  handleAvatarUpdateCommand,
  handleRemoveAllRolesCommand
};
