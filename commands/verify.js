const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  InteractionContextType
} = require("discord.js");
const utils = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Wysyła wniosek o weryfikację statusu studenta")
    .addIntegerOption((option) =>
      option
        .setName("indeks")
        .setDescription("6-cyfrowy numer indeksu")
        .setMinValue(100000)
        .setMaxValue(999999)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("imię").setDescription("Imię studenta").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("nazwisko")
        .setDescription("Nazwisko studenta")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("stopień")
        .setDescription("Wybór stopnia studiów")
        .addChoices(utils.getGuildIdsAndNames())
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("uwagi")
        .setDescription("Dodatkowe uwagi dotyczące wniosku")
    )
    .setContexts(InteractionContextType.BotDM),
  async execute({ client, interaction }) {
    await interaction.deferReply({ ephemeral: true });

    const id = interaction.user.id;

    const guildId = interaction.options.getString("stopień");
    const guild = await interaction.client.guilds.fetch(guildId);
    const guildConfig = utils.getGuildConfig(guildId);
    const channel = interaction.client.channels.cache.get(
      guildConfig.wnioskiId
    );

    const nick =
      interaction.user.username +
      (interaction.user.discriminator != "0"
        ? `#${interaction.user.discriminator}`
        : "");

    const imieRaw = interaction.options.getString("imię");
    const nazwiskoRaw = interaction.options.getString("nazwisko");

    const imie =
      imieRaw.charAt(0).toUpperCase() + imieRaw.slice(1).toLowerCase();
    const nazwisko =
      nazwiskoRaw.charAt(0).toUpperCase() + nazwiskoRaw.slice(1).toLowerCase();

    const indeks = interaction.options.getInteger("indeks");
    const serwer = guildConfig.name;
    const grupa = serwer === "inżynierski" ? "Brak" : "TBD";
    const uwagi = interaction.options.getString("uwagi") || "Brak";

    if (process.env.SUSPEND_VERIFY === "true") {
      return utils.printError(
        interaction,
        "Weryfikacja statusu studenta jest obecnie zawieszona. " +
          "W razie pytań skontaktuj się z administracją."
      );
    }
    const result = await interaction.user.send().catch(async (error) => {
      if (error.status === 403) {
        utils.logInfo("verify 403 error", error);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(":x: Brak uprawnień do wysyłania wiadomości prywatnych")
              .setDescription(
                "Upewnij się, że włączyłeś prywatne wiadomości " +
                  "w ustawieniach prywatności serwera. Więcej informacji: " +
                  "https://support.discord.com/hc/pl/articles/360060145013"
              )
              .setColor("Red")
              .setFooter({ text: `Error: ${error.message}` })
          ]
        });
        return false;
      }
      return true;
    });

    if (!result) {
      return;
    }

    let member;
    try {
      member = await guild.members.fetch(id);
    } catch (error) {
      if (error.status === 404) {
        return utils.printError(
          interaction,
          "Nie znajdujesz się na serwerze, do którego wysyłasz wniosek. " +
            `By dołączyć, użyj [tego zaproszenia](${guildConfig.inviteLink}).`
        );
      }
      throw error;
    }

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages")
    ) {
      throw new Error("Nie znaleziono kanału WNIOSKI lub brak uprawnień");
    }

    const spreadsheetId = utils.getCommonConfig().spreadsheetId;
    const spreadsheetDataId = utils.getCommonConfig().spreadsheetDataId;

    const ranges = ["D2:D", "F2:F"];
    const [guildNames, ids] = await utils.fetchSheetData(spreadsheetId, ranges);

    if (ids && ids.length > 0) {
      const matchingRequests = ids
        .map((idRow, index) => ({
          id: idRow[0],
          guildName: guildNames[index] ? guildNames[index][0] : null
        }))
        .filter(
          (request) =>
            request.id === id && request.guildName === guildConfig.name
        );

      if (matchingRequests.length > 0) {
        utils.logInfo("verify", new Error("User already sent a request"));

        return await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(":x: Wniosek został już wysłany")
              .setColor("Red")
              .setDescription(
                "Skontaktuj się z administracją, jeśli chcesz zmienić dane we wniosku."
              )
              .setThumbnail(guildConfig.logo)
              .setTimestamp()
          ]
        });
      }
    }

    if (guildConfig?.autoVerify && uwagi === "Brak") {
      const valuesAutoVerify = await utils.fetchSheetData(
        spreadsheetDataId,
        "Database!A2:D"
      );

      if (valuesAutoVerify) {
        const row = valuesAutoVerify.findIndex(
          (row) =>
            row[2] === indeks.toString() &&
            row[0] === imie &&
            row[1] === nazwisko &&
            row[3] === id
        );

        if (row !== -1) {
          utils.logInfo("Automatically accepted user @" + nick);
          await member.roles.add(
            await guild.roles.cache.find((r) => r.name === "Student")
          );

          const updateData = [
            indeks,
            imie,
            nazwisko,
            serwer,
            grupa,
            id,
            nick,
            uwagi,
            "Zaakceptowany",
            "Automatycznie"
          ];

          await utils.appendRow(spreadsheetId, "A2", updateData);

          await utils.appendRow(
            spreadsheetDataId,
            "Database!E",
            ["Zaakceptowany"],
            row + 2
          );

          return await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  ":white_check_mark: Wniosek zaakceptowany automatycznie"
                )
                .setColor("Green")
                .setDescription(
                  "Witamy na nieoficjalnym serwerze kierunku Informatyka stopień " +
                    `${serwer} na PG!\n` +
                    "- Zapoznaj się z regulaminem serwera dostępnym na kanale " +
                    `<#${guildConfig.regulaminId}>.\n` +
                    `- Zajrzyj na kanał <#${guildConfig.kiedyKolosId}> ` +
                    "aby dowiedzieć się więcej o zbliżających się egzaminach i " +
                    "nie tylko."
                )
                .setThumbnail(guildConfig.logo)
                .setTimestamp()
            ]
          });
        }
      }
    }

    const updateData = [
      indeks,
      imie,
      nazwisko,
      serwer,
      grupa,
      id,
      nick,
      uwagi,
      "Oczekujący"
    ];

    await utils.appendRow(spreadsheetId, "A2", updateData);

    const embed = new EmbedBuilder()
      .setTitle("Wniosek o weryfikację")
      .setColor("Blue")
      .setAuthor({
        name: `${nick}`,
        iconURL: `https://cdn.discordapp.com/avatars/${id}/${interaction.user.avatar}.png`
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

    const responseEmbed = new EmbedBuilder()
      .setTitle(":incoming_envelope: Wniosek wysłano")
      .setColor("Blue")
      .setDescription(
        "Wniosek został wysłany do weryfikacji.\nCzekaj na odpowiedź."
      )
      .setThumbnail(guildConfig.logo)
      .setTimestamp();

    await interaction.editReply({ embeds: [responseEmbed] });

    await channel.send({ embeds: [embed], components: [row] });
  }
};
