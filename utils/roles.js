const { EmbedBuilder } = require("discord.js");
const { printError } = require("./embeds.js");
const { logInfo } = require("./logger.js");
const { getGuildConfig, getCommonConfig } = require("./config.js");
const { appendRow, fetchSheetData } = require("./google.js");

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
    return printError(
      interaction,
      "Nie można znaleźć serwera lub użytkownika."
    );
  }

  const roles = ["UM", "ISI", "SK", "ISINT", "PWWIO", "TGM", "ATI"];

  const userRoles = member.roles.cache.filter((r) => roles.includes(r.name));

  if (role === "DELETE") {
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
            .setTitle(":x: Brak roli do usunięcia")
            .setDescription("Nie posiadasz roli specjalności.")
        ],
        ephemeral: true
      });
    }

    if (row === 1) {
      await appendRow(spreadsheetId, "E2", [
        null,
        null,
        null,
        guildName,
        "Usunięto",
        userId,
        nick
      ]);
    } else {
      await appendRow(spreadsheetId, "E", ["Usunięto"], row);
    }

    await member.roles.remove(validRoles);

    return await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle(":white_check_mark: Usunięto rolę")
          .setDescription("Usunięto rolę specjalności.")
      ],
      ephemeral: true
    });
  }

  const roleToAdd = await guild.roles.cache.find((r) => r.name === role);

  if (!roleToAdd) {
    return printError(interaction, "Nie można znaleźć roli.");
  }

  if (userRoles.size) {
    logInfo("manageRoles", "User already has a role");
    return await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle(":x: Masz już rolę")
          .setDescription(
            "Masz już przypisaną rolę specjalności. " +
              "Aby zmienić rolę, użyj przycisku \"Usuń\" przed wyborem innej."
          )
      ],
      ephemeral: true
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

  return await interaction.followUp({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setTitle(":white_check_mark: Dodano rolę")
        .setDescription(`Dodano rolę <@&${roleToAdd.id}>.`)
    ],
    ephemeral: true
  });
}

module.exports = { manageRoles };
