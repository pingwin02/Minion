const { EmbedBuilder, OverwriteType, MessageFlags } = require("discord.js");
const { printError } = require("./embeds.js");
const { logInfo } = require("./logger.js");
const { getGuildConfig, getCommonConfig } = require("./config.js");
const { appendRow, fetchSheetData } = require("./google.js");

async function cleanPermissions(members, guild) {
  const clientRolePosition = guild.members.me.roles.highest.position;
  const removalPromises = [];

  members.forEach((member) => {
    const removableRoles = member.roles.cache.filter(
      (role) =>
        role.position < clientRolePosition &&
        role.managed === false &&
        role.name !== "@everyone"
    );

    if (removableRoles.size > 0) {
      const roleNames = removableRoles
        .map((role) => `@${role.name}`)
        .join(", ");
      const nickname = member.user.username;
      logInfo(`Removing roles from @${nickname}: ${roleNames}`);

      removalPromises.push(
        member.roles
          .remove(removableRoles)
          .catch((err) =>
            logInfo(
              `Error while removing roles from ${nickname}`,
              new Error(err.message)
            )
          )
      );
    }
  });

  await Promise.all(removalPromises);
  const channels = await guild.channels.fetch();
  const permissionOverwrites = [];

  channels.forEach((channel) => {
    channel.permissionOverwrites.cache.forEach((perm) => {
      permissionOverwrites.push({ channel, perm });
    });
  });

  for (const { channel, perm } of permissionOverwrites) {
    if (perm.type === OverwriteType.Member) {
      const member = guild.members.cache.get(perm.id);
      if (member) {
        const nickname = member.user.username;
        logInfo(`Removing @${nickname} permissions from #${channel.name}`);
        try {
          await channel.permissionOverwrites.delete(perm.id);
        } catch (err) {
          logInfo(
            `Error while removing @${nickname} permissions`,
            new Error(err.message)
          );
        }
      }
    }
  }
}

async function manageRoles({ client, interaction }) {
  await interaction.deferUpdate();

  const guild = interaction.guild;
  const guildName = getGuildConfig(guild.id).name;
  const member = interaction.member;
  const userId = member.id;
  const nick = interaction.user.username;
  const role = interaction.customId.split("#")[1];

  const spreadsheetId = getCommonConfig().spreadsheetId;
  const ranges = ["D2:D", "F2:F"];
  const [guildNames, ids] = await fetchSheetData(spreadsheetId, ranges);
  const row =
    ids.findIndex(
      (idRow, index) =>
        idRow[0] === userId && guildNames[index]?.[0] === guildName
    ) + 2;

  if (!guild || !member) {
    return printError(interaction, "Cannot find server or user.");
  }

  const roles = [
    "SK",
    "ATI",
    "PWWIO",
    "ISI",
    "ISINF",
    "UM",
    "TGM",
    "English",
    "Gość"
  ];

  const userRoles = member.roles.cache.filter((r) => roles.includes(r.name));

  if (role === "REMOVE") {
    const rolesToRemove = await Promise.all(
      roles.map(async (role) => guild.roles.cache.find((r) => r.name === role))
    );

    const validRoles = rolesToRemove.filter((role) => role);

    if (!userRoles.size) {
      logInfo("manageRoles", "User has no roles to remove");
      return await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle(":x: No roles to remove")
            .setDescription("You do not have any specialization roles.")
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    if (row === 1) {
      await appendRow(spreadsheetId, "E2", [
        null,
        null,
        null,
        guildName,
        "Removed",
        userId,
        nick
      ]);
    } else {
      await appendRow(spreadsheetId, "E", ["Removed"], row);
    }

    await member.roles.remove(validRoles);
    logInfo(`Removed roles from user @${nick}`);

    return await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle(":white_check_mark: Role removed")
          .setDescription("Specialization role removed.")
      ],
      flags: MessageFlags.Ephemeral
    });
  }

  const roleToAdd = await guild.roles.cache.find((r) => r.name === role);

  if (!roleToAdd) {
    return printError(interaction, "Cannot find role.");
  }

  if (userRoles.size) {
    logInfo("manageRoles", "User already has a role");
    return await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle(":x: You already have a role")
          .setDescription(
            "You already have a specialization role assigned. " +
              "To change your role, use the \"Remove\" " +
              "button before choosing another."
          )
      ],
      flags: MessageFlags.Ephemeral
    });
  }

  if (row === 1) {
    await appendRow(spreadsheetId, "E2", [
      null,
      null,
      null,
      guildName,
      role,
      userId,
      nick
    ]);
  } else {
    await appendRow(spreadsheetId, "E", [role], row);
  }

  await member.roles.add(roleToAdd);
  logInfo(`Added role @${roleToAdd.name} to user @${nick}`);

  return await interaction.followUp({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setTitle(":white_check_mark: Role added")
        .setDescription(`Role <@&${roleToAdd.id}> added.`)
    ],
    flags: MessageFlags.Ephemeral
  });
}

module.exports = {
  cleanPermissions,
  manageRoles
};
