const { EmbedBuilder } = require("discord.js");
const utils = require("../utils");

module.exports = {
  name: "reject",
  async execute({ client, interaction }) {
    await interaction.deferUpdate();

    const _user = interaction.message.embeds[0].fields[4].value;
    const _server = interaction.message.embeds[0].fields[2].value;
    const _userChannel = await client.users.fetch(_user);

    const spreadsheetId = utils.getCommonConfig().spreadsheetId;
    const ranges = ["D2:D", "F2:F"];
    const [guildNames, ids] = await utils.fetchSheetData(spreadsheetId, ranges);

    const guildName = utils.getGuildConfig(interaction.guildId).name;
    const row =
      ids.findIndex(
        (idRow, index) =>
          idRow[0] === _user && guildNames[index]?.[0] === guildName
      ) + 2;

    if (row === 1) {
      utils.logInfo("/reject", new Error(`User ${_user} not found`));
      const _id = interaction.message.embeds[0].fields[0].value;
      const _nick = interaction.message.embeds[0].author.name;
      const _fullName = interaction.message.embeds[0].fields[1].value;
      const _group = interaction.message.embeds[0].fields[3].value;
      const _remarks = interaction.message.embeds[0].fields[5].value;

      const updateData = [
        _id,
        _fullName.split(" ")[0],
        _fullName.split(" ")[1],
        _server,
        _group,
        _user,
        _nick,
        _remarks,
        "Rejected",
        `by ${interaction.user.username}`
      ];

      await utils.appendRow(spreadsheetId, "A2", updateData);
    } else {
      await utils.appendRow(
        spreadsheetId,
        "I",
        ["Rejected", `by ${interaction.user.username}`],
        row
      );
    }

    await interaction.deleteReply();

    const embed = new EmbedBuilder()
      .setTitle(":x: Request has been rejected")
      .setColor("Red")
      .setDescription(
        "Your verification request for the server " +
          `${_server} has been rejected.\n` +
          "If you'd like to know more, " +
          `contact <@${interaction.user.id}>.`
      )
      .setThumbnail(utils.getGuildConfig(interaction.guildId).logo)
      .setFooter({
        text: `Rejected by ${interaction.user.username}`,
        iconURL:
          "https://cdn.discordapp.com/avatars/" +
          `${interaction.user.id}/${interaction.user.avatar}.png`
      })
      .setTimestamp();
    await _userChannel.send({ embeds: [embed] });

    const responseEmbed = new EmbedBuilder()
      .setTitle(":x: Request has been rejected")
      .setColor("Red")
      .setDescription(`The request from user <@${_user}> has been rejected.`)
      .setTimestamp();

    const responseMessage = await interaction.channel.send({
      embeds: [responseEmbed]
    });

    utils.timedDelete(responseMessage, 5000);
  }
};
