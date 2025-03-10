const { EmbedBuilder } = require("discord.js");
const utils = require("../utils");

module.exports = {
  name: "accept",
  async execute({ client, interaction }) {
    await interaction.deferUpdate();

    const _user = interaction.message.embeds[0].fields[4].value;
    const _group = interaction.message.embeds[0].fields[3].value;
    const _nick = interaction.message.embeds[0].author.name;

    const guild = interaction.guild;
    const guildConfig = utils.getGuildConfig(guild.id);

    if (!guild.members.me.permissions.has("ManageRoles")) {
      throw new Error("Insufficient permissions");
    }

    const member = await guild.members.fetch(_user);
    await utils.cleanPermissions([member], guild);

    if (_group === "Gość") {
      await member.roles.add(
        await guild.roles.cache.find((r) => r.name === "Gość")
      );
      utils.logInfo(`Added role @Gość to user @${_nick}`);
    } else {
      await member.roles.add(
        await guild.roles.cache.find((r) => r.name === "Student")
      );
      utils.logInfo(`Added role @Student to user @${_nick}`);
      await member.roles.add(
        await guild.roles.cache.find((r) => r.name === _group)
      );
      utils.logInfo(`Added role @${_group} to user @${_nick}`);
    }

    const spreadsheetId = utils.getCommonConfig().spreadsheetId;
    const ranges = ["D2:D", "F2:F"];
    const [guildNames, ids] = await utils.fetchSheetData(spreadsheetId, ranges);

    const guildName = guildConfig.name;
    const row =
      ids.findIndex(
        (idRow, index) =>
          idRow[0] === _user && guildNames[index]?.[0] === guildName
      ) + 2;

    if (row === 1) {
      utils.logInfo("/accept", new Error(`User ${_user} not found`));
      const _id = interaction.message.embeds[0].fields[0].value;
      const _fullName = interaction.message.embeds[0].fields[1].value;
      const _server = interaction.message.embeds[0].fields[2].value;
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
        "Accepted",
        `by ${interaction.user.username}`
      ];

      await utils.appendRow(spreadsheetId, "A2", updateData);
    } else {
      await utils.appendRow(
        spreadsheetId,
        "I",
        ["Accepted", `by ${interaction.user.username}`],
        row
      );
    }

    await interaction.deleteReply();
    const _userChannel = await client.users.fetch(_user);
    const embed = new EmbedBuilder()
      .setTitle(":white_check_mark: Request has been accepted")
      .setColor("Green")
      .setDescription(
        "Welcome to the unofficial server for the " +
          `**Computer Science ${guildConfig.name} degree ` +
          "at Gdansk Tech!**\n" +
          "- Please read the server rules available on " +
          `<#${guildConfig.regulaminId}>.\n` +
          `- Check out <#${guildConfig.kiedyKolosId}> ` +
          "to stay updated on upcoming exams and more."
      )
      .setThumbnail(guildConfig.logo)
      .setFooter({
        text: `Accepted by ${interaction.user.username}`,
        iconURL:
          "https://cdn.discordapp.com/avatars/" +
          `${interaction.user.id}/${interaction.user.avatar}.png`
      })
      .setTimestamp();
    await _userChannel.send({ embeds: [embed] });

    const responseEmbed = new EmbedBuilder()
      .setTitle(":white_check_mark: Request has been accepted")
      .setColor("Green")
      .setDescription(`The request from user <@${_user}> has been accepted.`)
      .setTimestamp();

    const responseMessage = await interaction.channel.send({
      embeds: [responseEmbed]
    });

    utils.timedDelete(responseMessage, 5000);
  }
};
