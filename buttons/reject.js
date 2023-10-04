const { EmbedBuilder } = require("discord.js");
const { timedDelete, logInfo } = require("../functions");
const { google } = require("googleapis");

module.exports = {
  name: "reject",
  async execute({ client, interaction }) {
    await interaction.deleteReply();

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
    const ids = values.map((row) => row[0]);
    const row = ids.indexOf(_user) + 2;

    if (row === 1) {
      logInfo("/reject", new Error(`User ${_user} not found`));
      _id = interaction.message.embeds[0].fields[0].value;
      _nick = interaction.message.embeds[0].author.name;
      _name = interaction.message.embeds[0].fields[1].value;
      _surname = interaction.message.embeds[0].fields[2].value;
      _group = interaction.message.embeds[0].fields[3].value;
      _notes = interaction.message.embeds[0].fields[5].value;

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: "A2",
        valueInputOption: "RAW",
        resource: {
          values: [
            [
              _id,
              _name,
              _surname,
              _group,
              _user,
              _nick,
              _notes,
              "Odrzucony",
              `przez ${interaction.user.username}`,
            ],
          ],
        },
      });
    } else {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `H${row}`,
        valueInputOption: "RAW",
        resource: {
          values: [["Odrzucony", `przez ${interaction.user.username}`]],
        },
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(":x: Wniosek został odrzucony")
      .setColor("Red")
      .setDescription(
        "Twoja prośba o weryfikację została odrzucona.\nJeśli chcesz dowiedzieć się więcej, " +
          `napisz do <@${interaction.user.id}>.`
      )
      .setThumbnail(
        "https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg"
      )
      .setFooter({
        text: `Odrzucił ${interaction.user.username}`,
        iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`,
      })
      .setTimestamp();
    await _userChannel.send({ embeds: [embed] });

    const responseEmbed = new EmbedBuilder()
      .setTitle(":x: Wniosek został odrzucony")
      .setColor("Red")
      .setDescription(`Wniosek użytkownika <@${_user}> został odrzucony.`)
      .setTimestamp();

    const responseMessage = await interaction.channel.send({
      embeds: [responseEmbed],
    });

    timedDelete(responseMessage, 5000);
  },
};
