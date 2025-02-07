const { EmbedBuilder } = require("discord.js");
const utils = require("../utils");

module.exports = {
  name: "accept",
  async execute({ client, interaction }) {
    await interaction.deferUpdate();

    const _user = interaction.message.embeds[0].fields[5].value;
    const _grupa = interaction.message.embeds[0].fields[4].value;
    const _nick = interaction.message.embeds[0].author.name;

    const guild = interaction.guild;
    const guildConfig = utils.getGuildConfig(guild.id);

    if (!guild.members.me.permissions.has("ManageRoles")) {
      throw new Error("Insufficient permissions");
    }

    const member = await guild.members.fetch(_user);

    if (_grupa === "Brak") {
      utils.logInfo("Added role @Obserwator to user @" + _nick);
      await member.roles.add(
        await guild.roles.cache.find((r) => r.name === "Obserwator")
      );
    } else {
      utils.logInfo("Added role @Student to user @" + _nick);
      await member.roles.add(
        await guild.roles.cache.find((r) => r.name === "Student")
      );
    }

    const spreadsheetId = utils.getCommonConfig().spreadsheetId;
    const ranges = ["D2:D", "F2:F"];
    const [guildNames, ids] = await utils.fetchSheetData(spreadsheetId, ranges);

    const guildName = guildConfig.name;
    const row =
      ids.findIndex(
        (idRow, index) =>
          idRow[0] === _user && guildNames[index][0] === guildName
      ) + 2;

    if (row === 1) {
      utils.logInfo("/accept", new Error(`User ${_user} not found`));
      const _id = interaction.message.embeds[0].fields[0].value;
      const _name = interaction.message.embeds[0].fields[1].value;
      const _surname = interaction.message.embeds[0].fields[2].value;
      const _serwer = interaction.message.embeds[0].fields[3].value;
      const _notes = interaction.message.embeds[0].fields[6].value;

      const updateData = [
        _id,
        _name,
        _surname,
        _serwer,
        _grupa,
        _user,
        _nick,
        _notes,
        "Zaakceptowany",
        `przez ${interaction.user.username}`
      ];

      await utils.appendRow(spreadsheetId, "A2", updateData);
    } else {
      await utils.appendRow(
        spreadsheetId,
        "I",
        ["Zaakceptowany", `przez ${interaction.user.username}`],
        row
      );
    }

    await interaction.deleteReply();
    const _userChannel = await client.users.fetch(_user);
    const embed = new EmbedBuilder()
      .setTitle(":white_check_mark: Wniosek został zaakceptowany")
      .setColor("Green")
      .setDescription(
        "Witamy na nieoficjalnym serwerze kierunku " +
          `Informatyka stopień ${guildConfig.name} na PG!\n` +
          "- Zapoznaj się z regulaminem serwera dostępnym " +
          `na kanale <#${guildConfig.regulaminId}>.\n` +
          `- Zajrzyj na kanał <#${guildConfig.kiedyKolosId}> ` +
          "aby dowiedzieć się więcej o zbliżających się egzaminach " +
          "i nie tylko."
      )
      .setThumbnail(guildConfig.logo)
      .setFooter({
        text: `Zaakceptował ${interaction.user.username}`,
        iconURL:
          "https://cdn.discordapp.com/avatars/" +
          `${interaction.user.id}/${interaction.user.avatar}.png`
      })
      .setTimestamp();
    await _userChannel.send({ embeds: [embed] });

    const responseEmbed = new EmbedBuilder()
      .setTitle(":white_check_mark: Wniosek został zaakceptowany")
      .setColor("Green")
      .setDescription(`Wniosek użytkownika <@${_user}> został zaakceptowany.`)
      .setTimestamp();

    const responseMessage = await interaction.channel.send({
      embeds: [responseEmbed]
    });

    utils.timedDelete(responseMessage, 5000);
  }
};
