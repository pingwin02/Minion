const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  InteractionContextType
} = require("discord.js");
const utils = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("przywroc-wnioski")
    .setDescription("Ponownie wysyła wnioski o statusie \"Oczekujący\"")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild),
  async execute({ client, interaction }) {
    await interaction.deferReply({ ephemeral: true });

    const guildConfig = utils.getGuildConfig(interaction.guild.id);
    const guildName = guildConfig.name;
    const channel = interaction.client.channels.cache.get(
      guildConfig.wnioskiId
    );

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages")
    ) {
      throw new Error("Nie znaleziono kanału WNIOSKI lub brak uprawnień");
    }

    if (interaction.channelId !== channel.id) {
      utils.logInfo("przywroc-wnioski", "Command used in wrong channel");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(`Komenda dostępna tylko na kanale <#${channel.id}>.`);

      return interaction.editReply({ embeds: [embed] });
    }

    const spreadsheetId = utils.getCommonConfig().spreadsheetId;
    const rows = await utils.fetchSheetData(spreadsheetId, "A2:I");

    if (!rows) {
      return utils.printError(interaction, "Brak danych w arkuszu");
    }

    const pendingRequests = rows
      .filter((row) => row[8] === "Oczekujący")
      .filter((row) => row[3] === guildName);

    if (pendingRequests.length === 0) {
      return utils.printError(
        interaction,
        "Brak wniosków o statusie `Oczekujący`"
      );
    }

    for (const request of pendingRequests) {
      const [indeks, imie, nazwisko, serwer, grupa, id, nick, uwagi] = request;

      const embed = new EmbedBuilder()
        .setTitle("Wniosek o weryfikację")
        .setColor("Blue")
        .setAuthor({
          name: `${nick}`,
          iconURL:
            "https://cdn.discordapp.com/avatars/" +
            `${id}/${interaction.user.avatar}.png`
        })
        .addFields(
          { name: "Indeks", value: `${indeks}`, inline: true },
          { name: "Imię", value: imie, inline: true },
          { name: "Nazwisko", value: nazwisko, inline: true },
          { name: "Serwer", value: serwer, inline: true },
          { name: "Grupa", value: grupa, inline: true },
          { name: "Discord ID", value: id, inline: true },
          { name: "Uwagi", value: uwagi },
          { name: "Ping", value: `<@${id}>` }
        )
        .setTimestamp();

      const acceptButton = new ButtonBuilder()
        .setCustomId("accept")
        .setLabel("Akceptuj")
        .setStyle(ButtonStyle.Success);

      const rejectButton = new ButtonBuilder()
        .setCustomId("reject")
        .setLabel("Odrzuć")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(
        acceptButton,
        rejectButton
      );

      await channel.send({ embeds: [embed], components: [row] });
    }

    await interaction.editReply({
      content:
        `Odtworzono **${pendingRequests.length}**` +
        " wniosków o statusie `Oczekujący`"
    });
  }
};
