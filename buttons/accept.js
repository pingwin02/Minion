const { EmbedBuilder } = require("discord.js");
const { logInfo } = require("..");
const { google } = require("googleapis");

module.exports = {
  name: "accept",
  async execute({ client, interaction }) {
    interaction.deferUpdate();
    const _user = interaction.message.embeds[0].fields[4].value;
    const grupa = interaction.message.embeds[0].fields[3].value;

    if (!interaction.guild.members.me.permissions.has("ManageRoles")) {
      return logInfo(
        `No permissions to manage roles`,
        new Error("Insufficient permissions")
      );
    }

    const member = await interaction.guild.members.fetch(_user);

    if (grupa === "Brak") {
      const role = interaction.guild.roles.cache.find(
        (r) => r.name === "Obserwator"
      );
      member.roles.add(role).catch((err) => logInfo("Adding role", err));
    } else {
      const strumien = grupa[1] === "S" ? "Systemiarz" : "Apkowicz";
      const roles = [];
      roles.push(
        interaction.guild.roles.cache.find((r) => r.name === "Student")
      );
      roles.push(
        interaction.guild.roles.cache.find((r) => r.name === strumien)
      );
      roles.push(
        interaction.guild.roles.cache.find((r) => r.name === "Grupa " + grupa)
      );

      roles.forEach((role) => {
        member.roles.add(role).catch((err) => logInfo("Adding role", err));
      });
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
      const row = ids.indexOf(_user) + 2;
      const updateData = {
        values: [["Zaakceptowany"]],
      };
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `G${row}`,
        valueInputOption: "RAW",
        resource: updateData,
      });
    }

    const _userChannel = await client.users.fetch(_user);
    const embed = new EmbedBuilder()
      .setTitle(`:white_check_mark: Wniosek został zaakceptowany`)
      .setColor("Green")
      .setDescription(
        `Witamy na nieoficjalnym serwerze kierunku Informatyka na PG!\n \
        Pamiętaj aby przestrzegać regulaminu serwera oraz Discorda. \
        Polecamy zajrzeć na kanał <#${process.env.KIEDY_KOLOS_ID}> \
        aby dowiedzieć się więcej o zbliżających się egzaminach i \
        nie tylko.`
      )
      .setThumbnail(
        `https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg`
      )
      .setFooter({
        text: `Zaakceptował ${interaction.user.username}`,
        iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`,
      })
      .setTimestamp();
    await _userChannel.send({ embeds: [embed] });

    const responseEmbed = new EmbedBuilder()
      .setTitle(`:white_check_mark: Wniosek został zaakceptowany`)
      .setColor("Green")
      .setDescription(`Wniosek użytkownika <@${_user}> został zaakceptowany.`)
      .setTimestamp();

    interaction.channel.send({ embeds: [responseEmbed] }).then((msg) => {
      setTimeout(() => {
        msg.delete().catch((err) => logInfo("Deleting message", err));
      }, 10000);
    });
    interaction.message
      .delete()
      .catch((err) => logInfo("Deleting message", err));
  },
};
