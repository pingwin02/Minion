const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  InteractionContextType
} = require("discord.js");
const utils = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Sends a request to verify student status")
    .addIntegerOption((option) =>
      option
        .setName("index")
        .setDescription("Index number")
        .setMinValue(100000)
        .setMaxValue(999999)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("first_name")
        .setDescription("First name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("last_name").setDescription("Last name").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("specialization")
        .setDescription("Student specialization")
        .setRequired(true)
        .setChoices([
          { name: "Uczenie maszynowe [UM]", value: "UM" },
          { name: "Inżynieria systemów informacyjnych [ISI]", value: "ISI" },
          { name: "Sieci komputerowe [SK]", value: "SK" },
          {
            name: "Inteligentne systemy informatyczne [ISINT]",
            value: "ISINT"
          },
          {
            name:
              "Przetwarzanie wysokiej wydajności " +
              "i inteligencja obliczeniowa [PWWIO]",
            value: "PWWIO"
          },
          {
            name: "Technologie geoinformatyczne i mobilne [TGM]",
            value: "TGM"
          },
          { name: "Algorytmy i technologie internetowe [ATI]", value: "ATI" },
          { name: "Informatics in English [English]", value: "English" },
          { name: "Guest", value: "Gość" }
        ])
    )
    .addStringOption((option) =>
      option
        .setName("degree")
        .setDescription("Current studies degree")
        .addChoices(utils.getGuildIdsAndNames())
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("remarks")
        .setDescription("Additional remarks regarding the request")
    )
    .setContexts(InteractionContextType.BotDM),
  async execute({ client, interaction }) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const guildId = interaction.options.getString("degree");
    const guild = await interaction.client.guilds.fetch(guildId);
    const guildConfig = utils.getGuildConfig(guildId);
    const requestChannel = interaction.client.channels.cache.get(
      guildConfig.wnioskiId
    );

    const username =
      interaction.user.username +
      (interaction.user.discriminator !== "0"
        ? `#${interaction.user.discriminator}`
        : "");

    const firstNameRaw = interaction.options.getString("first_name");
    const lastNameRaw = interaction.options.getString("last_name");

    const firstName =
      firstNameRaw.charAt(0).toUpperCase() +
      firstNameRaw.slice(1).toLowerCase();
    const lastName =
      lastNameRaw.charAt(0).toUpperCase() + lastNameRaw.slice(1).toLowerCase();

    const indexNumber = interaction.options.getInteger("index");
    const serverName = guildConfig.name;
    const group = interaction.options.getString("specialization");

    if (!guild.roles.cache.find((r) => r.name === group)) {
      return utils.printError(
        interaction,
        "Selected specialization does not exist for " +
          "the selected degree of studies. " +
          "Please contact the administration for further assistance."
      );
    }

    let remarks = interaction.options.getString("remarks") || "None";

    if (process.env.SUSPEND_VERIFY === "true") {
      return utils.printError(
        interaction,
        "Student status verification is currently suspended. " +
          "For questions, please contact the administration."
      );
    }

    const result = await interaction.user.send().catch(async (error) => {
      if (error.status === 403) {
        utils.logInfo("verify 403 error", error);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(":x: Unable to send direct messages")
              .setDescription(
                "Make sure you have enabled direct messages " +
                  "in your server privacy settings. More info: " +
                  "https://support.discord.com/hc/en-us/articles/360060145013"
              )
              .setColor("Red")
              .setFooter({ text: `Error: ${error.message}` })
          ]
        });
        return false;
      }
      return true;
    });

    if (!result) return;

    let member;
    try {
      member = await guild.members.fetch(userId);
    } catch (error) {
      if (error.status === 404) {
        return utils.printError(
          interaction,
          "You are not on the server you are sending the request to. " +
            `To join, use [this invite](${guildConfig.inviteLink}).`
        );
      }
      throw error;
    }

    if (
      !requestChannel ||
      !requestChannel.permissionsFor(client.user).has("ViewChannel") ||
      !requestChannel.permissionsFor(client.user).has("SendMessages")
    ) {
      throw new Error("Requests channel not found or missing permissions");
    }

    const spreadsheetId = utils.getCommonConfig().spreadsheetId;
    const spreadsheetDataId = utils.getCommonConfig().spreadsheetDataId;

    const ranges = ["D2:D", "F2:F"];
    const [guildNames, ids] = await utils.fetchSheetData(spreadsheetId, ranges);

    if (ids && ids.length > 0) {
      const matchingRequests = ids
        .map((idRow, index) => ({
          id: idRow[0],
          guildName: guildNames[index] ? guildNames[index]?.[0] : null
        }))
        .filter(
          (request) =>
            request.id === userId && request.guildName === guildConfig.name
        );

      if (matchingRequests.length > 0) {
        utils.logInfo("verify", new Error("User already sent a request"));

        return await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(":x: Request already submitted")
              .setColor("Red")
              .setDescription(
                "Contact the administration if you need to update your request."
              )
              .setThumbnail(guildConfig.logo)
              .setTimestamp()
          ]
        });
      }
    }

    if (guildConfig.autoVerify) {
      const autoVerifyData = await utils.fetchSheetData(
        spreadsheetDataId,
        "Database!A2:F"
      );

      if (autoVerifyData) {
        const rowIndex = autoVerifyData.findIndex(
          (row) =>
            row[0] === indexNumber.toString() &&
            row[1] === firstName &&
            row[2] === lastName &&
            row[3] === serverName &&
            row[4] === group &&
            row[5] === userId
        );

        if (rowIndex !== -1) {
          if (remarks === "None") {
            await member.roles.add(
              await guild.roles.cache.find((r) => r.name === "Student")
            );
            utils.logInfo(`Added role @Student to user @${username}`);
            await member.roles.add(
              await guild.roles.cache.find((r) => r.name === group)
            );
            utils.logInfo(`Added role @${group} to user @${username}`);
            utils.logInfo(`User @${username} verified automatically`);

            const updateData = [
              indexNumber,
              firstName,
              lastName,
              serverName,
              group,
              userId,
              username,
              remarks,
              "Accepted",
              "Automatically"
            ];

            await utils.appendRow(spreadsheetId, "A2", updateData);

            return await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(":white_check_mark: Request automatically accepted")
                  .setColor("Green")
                  .setDescription(
                    "Welcome to the unofficial server for the " +
                      `**Computer Science ${serverName} degree ` +
                      "at Gdańsk Tech!**\n" +
                      "- Please read the server rules available on " +
                      `<#${guildConfig.regulaminId}>.\n` +
                      `- Check out <#${guildConfig.kiedyKolosId}> ` +
                      "to stay updated on upcoming exams and more."
                  )
                  .setThumbnail(guildConfig.logo)
                  .setTimestamp()
              ]
            });
          }
          remarks =
            "User would have been automatically accepted, " +
            "but additional remarks were added:\n" +
            remarks;
        }
      }
    }

    const updateData = [
      indexNumber,
      firstName,
      lastName,
      serverName,
      group,
      userId,
      username,
      remarks,
      "Pending"
    ];

    await utils.appendRow(spreadsheetId, "A2", updateData);

    const embed = new EmbedBuilder()
      .setTitle("Verification Request")
      .setColor("Blue")
      .setAuthor({
        name: `${username}`,
        iconURL:
          "https://cdn.discordapp.com/avatars/" +
          `${userId}/${interaction.user.avatar}.png`
      })
      .addFields(
        { name: "Index", value: `${indexNumber}`, inline: true },
        { name: "Full name", value: `${firstName} ${lastName}`, inline: true },
        { name: "Server", value: serverName, inline: true },
        { name: "Group", value: group, inline: true },
        { name: "Discord ID", value: userId, inline: true },
        { name: "Remarks", value: remarks },
        { name: "Ping", value: `<@${userId}>` }
      )
      .setTimestamp();

    const acceptButton = new ButtonBuilder()
      .setCustomId("accept")
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
      .setCustomId("reject")
      .setLabel("Reject")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(
      acceptButton,
      rejectButton
    );

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(":incoming_envelope: Request Sent")
          .setColor("Blue")
          .setDescription(
            "Your request has been submitted for verification. " +
              "Please wait for a response."
          )
          .setThumbnail(guildConfig.logo)
          .setTimestamp()
      ]
    });

    await requestChannel.send({ embeds: [embed], components: [row] });
  }
};
