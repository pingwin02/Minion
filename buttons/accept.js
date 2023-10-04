const { EmbedBuilder } = require("discord.js");
const { logInfo, timedDelete } = require("../functions");
const { google } = require("googleapis");

module.exports = {
  name: "accept",
  async execute({ client, interaction }) {
    await interaction.deleteReply();

    const _user = interaction.message.embeds[0].fields[4].value;
    const grupa = interaction.message.embeds[0].fields[3].value;

    if (!interaction.guild.members.me.permissions.has("ManageRoles")) {
      throw new Error("Insufficient permissions");
    }

    const member = await interaction.guild.members.fetch(_user);

    if (grupa === "Brak") {
      const role = await interaction.guild.roles.cache.find(
        (r) => r.name === "Obserwator"
      );
      await member.roles.add(role);
    } else {
      const strumien = grupa[1] === "S" ? "Systemiarz" : "Apkowicz";
      await member.roles.add(
        await interaction.guild.roles.cache.find((r) => r.name === "Student")
      );
      await member.roles.add(
        await interaction.guild.roles.cache.find((r) => r.name === strumien)
      );
      await member.roles.add(
        await interaction.guild.roles.cache.find(
          (r) => r.name === "Grupa " + grupa
        )
      );
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
    const ids = values.map((row) => row[0]);
    const row = ids.indexOf(_user) + 2;

    if (row === 1) {
      logInfo("/accept", new Error(`User ${_user} not found`));
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
              "Zaakceptowany",
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
          values: [["Zaakceptowany", `przez ${interaction.user.username}`]],
        },
      });
    }

    const _userChannel = await client.users.fetch(_user);
    const embed = new EmbedBuilder()
      .setTitle(":white_check_mark: Wniosek został zaakceptowany")
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
      .setFooter({
        text: `Zaakceptował ${interaction.user.username}`,
        iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`,
      })
      .setTimestamp();
    await _userChannel.send({ embeds: [embed] });

    const responseEmbed = new EmbedBuilder()
      .setTitle(":white_check_mark: Wniosek został zaakceptowany")
      .setColor("Green")
      .setDescription(`Wniosek użytkownika <@${_user}> został zaakceptowany.`)
      .setTimestamp();

    const responseMessage = await interaction.channel.send({
      embeds: [responseEmbed],
    });

    timedDelete(responseMessage, 5000);
  },
};
