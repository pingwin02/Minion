const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require("discord.js");
const { google } = require("googleapis");
const { logInfo, printError, appendRow } = require("../functions");

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
        .setName("grupa")
        .setDescription("Grupa laboratoryjna studenta")
        .addChoices(
          { name: "KASK1", value: "1.KASK" },
          { name: "KASK2", value: "2.KASK" },
          { name: "KASK3", value: "3.KASK" },
          { name: "KAIMS1", value: "1.KAIMS" },
          { name: "KAIMS2", value: "2.KAIMS" },
          { name: "KAIMS3", value: "3.KAIMS" },
          { name: "KISI1", value: "1.KISI" },
          { name: "KISI2", value: "2.KISI" },
          { name: "BD", value: "BD" },
          { name: "TELE", value: "TELE" },
          { name: "GEO", value: "GEO" },
          { name: "Brak", value: "Brak" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("uwagi")
        .setDescription("Dodatkowe uwagi dotyczące wniosku")
    ),
  async execute({ client, interaction }) {
    await interaction.deferReply({ ephemeral: true });
    if (process.env.SUSPEND_VERIFY === "true") {
      return printError(
        interaction,
        "Weryfikacja statusu studenta jest obecnie zawieszona. " +
          "W razie pytań skontaktuj się z administracją."
      );
    }
    const channel = interaction.client.channels.cache.get(
      process.argv.includes("dev")
        ? process.env.DEV_CHANNEL_ID
        : process.env.WNIOSKI_ID
    );

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages")
    ) {
      throw new Error("Nie znaleziono kanału WNIOSKI lub brak uprawnień");
    }

    const id = interaction.user.id;
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
    const grupa = interaction.options.getString("grupa");
    const uwagi = interaction.options.getString("uwagi") || "Brak";

    if (interaction.guild) {
      logInfo("verify", new Error("/verify used in guild"));
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(":x: Komenda dostępna tylko w prywatnej konwersacji")
            .setColor("Red")
        ]
      });
    }
    const result = await interaction.user.send().catch(async (error) => {
      if (error.status === 403) {
        logInfo("verify 403 error", error);
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

    const authJSON = JSON.parse(process.env.GOOGLE_AUTH);

    const auth = new google.auth.GoogleAuth({
      credentials: authJSON,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    const params = {
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "E2:E"
    };

    const response = await sheets.spreadsheets.values.get(params);
    const values = response.data.values;
    if (values) {
      const ids = values.map((row) => row[0]);
      if (ids.includes(id)) {
        logInfo("verify", new Error("User already sent a request"));
        return await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(":x: Wniosek został już wysłany")
              .setColor("Red")
              .setDescription(
                "Skontaktuj się z administracją, jeśli chcesz zmienić dane we wniosku."
              )
              .setThumbnail(
                "https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg"
              )
              .setTimestamp()
          ]
        });
      }
    }

    if (process.env.SPREADSHEET_DATA_ID && process.env.GUILD_ID) {
      const paramAutoVerify = {
        spreadsheetId: process.env.SPREADSHEET_DATA_ID,
        range: "Database!A2:E"
      };

      const responseAutoVerify =
        await sheets.spreadsheets.values.get(paramAutoVerify);
      const valuesAutoVerify = responseAutoVerify.data.values;

      if (valuesAutoVerify) {
        const row = valuesAutoVerify.findIndex(
          (row) =>
            row[2] === indeks.toString() &&
            row[0] === imie &&
            row[1] === nazwisko &&
            row[3] === grupa &&
            row[4] === id
        );

        if (row !== -1) {
          const guild = await interaction.client.guilds.fetch(
            process.argv.includes("dev")
              ? process.env.DEV_GUILD_ID
              : process.env.GUILD_ID
          );
          const member = await guild.members.fetch(id);
          logInfo("Automatically accepted user @" + nick);
          if (grupa === "Brak") {
            logInfo("Added role @Obserwator to user @" + nick);
            await member.roles.add(
              await guild.roles.cache.find((r) => r.name === "Obserwator")
            );
          } else if (!grupa.includes(".")) {
            logInfo("Added role @Student and @" + grupa + " to user @" + nick);
            await member.roles.add(
              await guild.roles.cache.find((r) => r.name === "Student")
            );
            await member.roles.add(
              await guild.roles.cache.find((r) => r.name === grupa)
            );
          } else {
            const katedra = grupa.split(".")[1];
            logInfo(
              "Added role @Student, @" +
                katedra +
                " and @Grupa " +
                grupa +
                " to user @" +
                nick
            );
            await member.roles.add(
              await guild.roles.cache.find((r) => r.name === "Student")
            );
            await member.roles.add(
              await guild.roles.cache.find((r) => r.name === katedra)
            );
            await member.roles.add(
              await guild.roles.cache.find((r) => r.name === "Grupa " + grupa)
            );
          }

          const updateData = [
            indeks,
            imie,
            nazwisko,
            grupa,
            id,
            nick,
            uwagi,
            "Zaakceptowany",
            "Automatycznie"
          ];

          await appendRow(sheets, process.env.SPREADSHEET_ID, "A2", updateData);

          await appendRow(
            sheets,
            process.env.SPREADSHEET_DATA_ID,
            "Database!F",
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
                  "Witamy na nieoficjalnym serwerze kierunku Informatyka na PG!\n" +
                    "Pamiętaj aby przestrzegać regulaminu serwera oraz Discorda. " +
                    `Polecamy zajrzeć na kanał <#${process.env.KIEDY_KOLOS_ID}> ` +
                    "aby dowiedzieć się więcej o zbliżających się egzaminach i " +
                    "nie tylko."
                )
                .setThumbnail(
                  "https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg"
                )
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
      grupa,
      id,
      nick,
      uwagi,
      "Oczekujący"
    ];

    await appendRow(sheets, process.env.SPREADSHEET_ID, "A2", updateData);

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
      .setThumbnail(
        "https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg"
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [responseEmbed] });

    await channel.send({ embeds: [embed], components: [row] });
  }
};
