const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} = require("discord.js");
const { google } = require("googleapis");
const { printError } = require("../functions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("restore-requests")
    .setDescription('Ponownie wysyła wnioski o statusie "Oczekujący"')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute({ client, interaction }) {
    await interaction.deferReply({ ephemeral: true });

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

    const authJSON = JSON.parse(process.env.GOOGLE_AUTH);

    const auth = new google.auth.GoogleAuth({
      credentials: authJSON,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    const params = {
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "A2:H"
    };

    const response = await sheets.spreadsheets.values.get(params);
    const rows = response.data.values;

    if (!rows) {
      return printError(interaction, "Brak danych w arkuszu");
    }

    const pendingRequests = rows.filter((row) => row[7] === "Oczekujący");

    if (pendingRequests.length === 0) {
      return printError(interaction, "Brak wniosków o statusie `Oczekujący`");
    }

    for (const request of pendingRequests) {
      const [indeks, imie, nazwisko, grupa, id, nick, uwagi] = request;

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
          { name: "Uwagi", value: uwagi || "Brak" },
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
      content: `Odtworzono **${pendingRequests.length}** wniosków o statusie \`Oczekujący\``
    });
  }
};
