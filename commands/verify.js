const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
} = require("discord.js");
const { google } = require("googleapis");
const moment = require("moment");

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
        .setDescription(
          "Grupa dziekańska studenta (A - aplikacje, S - systemy)"
        )
        .addChoices(
          { name: "Grupa 1A", value: "1A" },
          { name: "Grupa 2A", value: "2A" },
          { name: "Grupa 3A", value: "3A" },
          { name: "Grupa 4A", value: "4A" },
          { name: "Grupa 1S", value: "1S" },
          { name: "Grupa 2S", value: "2S" },
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
    const channel = interaction.client.channels.cache.get(
      process.env.WNIOSKI_ID
    );

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages")
    ) {
      throw new Error("Nie znaleziono kanału WNIOSKI lub brak uprawnień");
    }

    const id = interaction.user.id;
    const imie = interaction.options.getString("imię");
    const nazwisko = interaction.options.getString("nazwisko");
    const indeks = interaction.options.getInteger("indeks").toString();
    const grupa = interaction.options.getString("grupa");
    const uwagi = interaction.options.getString("uwagi") || "Brak";

    if (interaction.guild) {
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(":x: Komenda dostępna tylko w prywatnej konwersacji")
            .setColor("Red"),
        ],
      });
    }
    const result = await interaction.user.send().catch((error) => {
      if (error.status === 403) {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(":x: Brak uprawnień do wysyłania wiadomości prywatnych")
              .setDescription(
                "Upewnij się, że włączyłeś prywatne wiadomości " +
                  "w ustawieniach prywatności serwera. Więcej informacji: " +
                  "https://support.discord.com/hc/pl/articles/360060145013"
              )
              .setColor("Red")
              .setFooter({ text: `Error: ${error.message}` }),
          ],
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
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const params = {
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "E2:E",
    };

    const response = await sheets.spreadsheets.values.get(params);
    const values = response.data.values;
    if (values) {
      const ids = values.map((row) => row[0]);
      if (ids.includes(id)) {
        return await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(":x: Wniosek został już wysłany")
              .setColor("Red")
              .setDescription(
                "Skontaktuj się z administracją, jeśli chcesz zmienić dane w wniosku."
              )
              .setThumbnail(
                "https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg"
              )
              .setTimestamp(),
          ],
        });
      }
    }

    const updateData = {
      values: [
        [
          indeks,
          imie,
          nazwisko,
          grupa,
          id,
          uwagi,
          "Oczekujący",
          moment().format("DD.MM.YYYY HH:mm:ss"),
        ],
      ],
    };

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "A2",
      valueInputOption: "RAW",
      resource: updateData,
    });

    const embed = new EmbedBuilder()
      .setTitle("Wniosek o weryfikację")
      .setColor("Blue")
      .setAuthor({
        name: `${interaction.user.username}`,
        iconURL: `https://cdn.discordapp.com/avatars/${id}/${interaction.user.avatar}.png`,
      })
      .addFields(
        { name: "Indeks", value: indeks, inline: true },
        { name: "Imię", value: imie, inline: true },
        { name: "Nazwisko", value: nazwisko, inline: true },
        { name: "Grupa", value: grupa, inline: true },
        { name: "Discord ID", value: id, inline: true },
        { name: "Uwagi", value: uwagi }
      )
      .setTimestamp();

    const acceptButton = new ButtonBuilder()
      .setCustomId("accept")
      .setLabel("Akceptuj")
      .setStyle("Success");

    const rejectButton = new ButtonBuilder()
      .setCustomId("reject")
      .setLabel("Odrzuć")
      .setStyle("Danger");

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
  },
};
