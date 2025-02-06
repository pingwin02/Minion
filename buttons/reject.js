const { EmbedBuilder } = require("discord.js");
const utils = require("../utils");

module.exports = {
  name: "reject",
  async execute({ client, interaction }) {
    await interaction.deferUpdate();

    const _user = interaction.message.embeds[0].fields[5].value;
    const _userChannel = await client.users.fetch(_user);

    const spreadsheetId = utils.getCommonConfig().spreadsheetId;
    const values = await utils.fetchSheetData(spreadsheetId, "F2:F");
    const ids = values.map((row) => row[0]);
    const row = ids.indexOf(_user) + 2;

    _serwer = interaction.message.embeds[0].fields[3].value;

    if (row === 1) {
      utils.logInfo("/reject", new Error(`User ${_user} not found`));
      _id = interaction.message.embeds[0].fields[0].value;
      _nick = interaction.message.embeds[0].author.name;
      _name = interaction.message.embeds[0].fields[1].value;
      _surname = interaction.message.embeds[0].fields[2].value;
      _group = interaction.message.embeds[0].fields[4].value;
      _notes = interaction.message.embeds[0].fields[6].value;

      const updateData = [
        _id,
        _name,
        _surname,
        _serwer,
        _group,
        _user,
        _nick,
        _notes,
        "Odrzucony",
        `przez ${interaction.user.username}`
      ];

      await utils.appendRow(spreadsheetId, "A2", updateData);
    } else {
      await utils.appendRow(
        spreadsheetId,
        "I",
        ["Odrzucony", `przez ${interaction.user.username}`],
        row
      );
    }

    await interaction.deleteReply();

    const embed = new EmbedBuilder()
      .setTitle(":x: Wniosek został odrzucony")
      .setColor("Red")
      .setDescription(
        `Twoja prośba o weryfikację na serwer ${_serwer} została odrzucona.\n` +
          "Jeśli chcesz dowiedzieć się więcej, " +
          `napisz do <@${interaction.user.id}>.`
      )
      .setThumbnail(utils.getGuildConfig(interaction.guildId).logo)
      .setFooter({
        text: `Odrzucił ${interaction.user.username}`,
        iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`
      })
      .setTimestamp();
    await _userChannel.send({ embeds: [embed] });

    const responseEmbed = new EmbedBuilder()
      .setTitle(":x: Wniosek został odrzucony")
      .setColor("Red")
      .setDescription(`Wniosek użytkownika <@${_user}> został odrzucony.`)
      .setTimestamp();

    const responseMessage = await interaction.channel.send({
      embeds: [responseEmbed]
    });

    utils.timedDelete(responseMessage, 5000);
  }
};
