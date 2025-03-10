const { logInfo } = require("./logger");
const { timedDelete } = require("./time");
const { MessageType } = require("discord.js");
const { appendRow, fetchSheetData } = require("./google");
const { getCommonConfig } = require("./config");
const { cleanPermissions } = require("./roles");

async function handlePinCommand(message) {
  const channel = message.channel;
  const refMessageId = message.reference.messageId;
  if (!refMessageId) return;

  logInfo(
    `Message ${refMessageId} in #${channel.name || "DM"} ` +
      `pinned by @${message.author.username}`
  );

  const msgToPin = await channel.messages.fetch(refMessageId);
  if (!msgToPin) {
    logInfo("handlePinCommand", "Message not found");
    return;
  }
  await msgToPin.pin();
  if (message.guild) timedDelete(message, 1000);
}

async function handleUnpinCommand(message) {
  const channel = message.channel;
  const refMessageId = message.reference?.messageId;
  if (!refMessageId) return;

  logInfo(
    `Message ${refMessageId} in #${channel.name || "DM"} ` +
      `unpinned by @${message.author.username}`
  );

  const msgToUnpin = await channel.messages.fetch(refMessageId);
  if (!msgToUnpin) {
    logInfo("handleUnpinCommand", "Message not found");
    return;
  }

  if (msgToUnpin.author.id !== message.author.id) {
    logInfo(
      "handleUnpinCommand",
      "Cannot unpin message not authored by the user"
    );
    const reply = await message.reply(
      "Nie możesz odpiąć wiadomości, której nie jesteś autorem"
    );
    timedDelete(reply);
    if (message.guild) timedDelete(message, 5000);
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

  await cleanPermissions(members, message.guild);

  await message.reactions.removeAll();
  await message.react("✅");
}

async function handleGuests(message) {
  await message.react("⌚");
  const { spreadsheetId } = getCommonConfig();

  const sheetName = "Wnioski";
  const range = `${sheetName}!A2:F`;

  const data = await fetchSheetData(spreadsheetId, range);

  const guestsToUpdate = data
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row[4] === "Gość" && row[5])
    .map(({ row, index }) => ({
      discordId: row[5],
      rowIndex: index + 2
    }));

  for (const { discordId, rowIndex } of guestsToUpdate) {
    const member = await message.guild.members.cache.get(discordId);

    if (!member) {
      logInfo("handleGuests", `Member not found for discordId: ${discordId}`);
      continue;
    }

    const studentRole = message.guild.roles.cache.find(
      (role) => role.name === "Student"
    );
    const guestRole = message.guild.roles.cache.find(
      (role) => role.name === "Gość"
    );

    if (!studentRole || !guestRole) {
      logInfo("handleGuests", "Roles not found");
      continue;
    }

    if (studentRole) {
      await member.roles.remove(studentRole);
    }

    if (guestRole) {
      await member.roles.add(guestRole);
    }

    const updatedValue = "#" + discordId;
    const updateRange = `${sheetName}!F`;

    await appendRow(spreadsheetId, updateRange, [updatedValue], rowIndex);
  }

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
  handleRemoveAllRolesCommand,
  handleGuests
};
