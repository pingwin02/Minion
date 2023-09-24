const { EmbedBuilder } = require("discord.js");
const { logInfo } = require("..");
const { google } = require("googleapis");

module.exports = {
  name: "reject",
  async execute({ client, interaction }) {
    interaction.deferUpdate();
    try {
      const _user = interaction.message.embeds[0].fields[4].value;
      const _userChannel = await client.users.fetch(_user);

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
        const row = ids.indexOf(_user) + 2;
        const updateData = {
          values: [["Odrzucony"]],
        };
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SPREADSHEET_ID,
          range: `G${row}`,
          valueInputOption: "RAW",
          resource: updateData,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`:x: Wniosek został odrzucony`)
        .setColor("Red")
        .setDescription(
          `Twoja prośba o weryfikację została odrzucona.\nJeśli chcesz dowiedzieć się więcej, \
        napisz do <@${interaction.user.id}>.`
        )
        .setThumbnail(
          `https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg`
        )
        .setFooter({
          text: `Odrzucił ${interaction.user.username}`,
          iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`,
        })
        .setTimestamp();
      await _userChannel.send({ embeds: [embed] });

      const responseEmbed = new EmbedBuilder()
        .setTitle(`:x: Wniosek został odrzucony`)
        .setColor("Red")
        .setDescription(`Wniosek użytkownika <@${_user}> został odrzucony.`)
        .setTimestamp();

      interaction.channel
        .send({ embeds: [responseEmbed] })
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        })
        .catch((err) => logInfo(err, 1));
      interaction.message.delete().catch((err) => logInfo(err, 1));
    } catch (error) {
      logInfo(error, 1);
    }
  },
};
