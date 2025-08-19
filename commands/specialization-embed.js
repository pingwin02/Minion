const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  InteractionContextType,
  MessageFlags
} = require("discord.js");
const utils = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("specialization-embed")
    .setDescription("Sends an embed with buttons to choose a specialization")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to send the embed to")
        .setRequired(true)
    )
    .setContexts(InteractionContextType.Guild),
  async execute({ client, interaction }) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = interaction.options.getChannel("channel");

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages") ||
      channel.type !== ChannelType.GuildText
    ) {
      return utils.printError(
        interaction,
        "Selected channel not found, missing permissions " +
          "or incorrect channel type."
      );
    }

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Specialization Selection")
      .setDescription(
        "Choose your specialization by clicking the appropriate button. " +
          "You can select **only one** specialization. " +
          "If you want to change your choice, " +
          "use the \"Remove\" button before selecting another."
      )
      .setThumbnail(utils.getGuildConfig(interaction.guildId).logo);

    const rows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("spec#SK")
          .setLabel("[SK] Sieci komputerowe")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#ATI")
          .setLabel("[ATI] Algorytmy i technologie internetowe")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#PWWIO")
          .setLabel(
            "[PWWIO] Przetwarzanie wysokiej wydajności " +
              "i inteligencja obliczeniowa"
          )
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#ISI")
          .setLabel("[ISI] Inteligentne systemy interaktywne")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#ISINF")
          .setLabel("[ISINF] Inżynieria systemów informacyjnych")
          .setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("spec#UM")
          .setLabel("[UM] Uczenie maszynowe")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#TGM")
          .setLabel("[TGM] Technologie geoinformatyczne i mobilne")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#English")
          .setLabel("[English] Distributed Applications and Internet Services")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#Gość")
          .setLabel("Guest")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#REMOVE")
          .setLabel("Remove")
          .setStyle(ButtonStyle.Danger)
      )
    ];

    await channel.send({ embeds: [embed], components: rows });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle(":white_check_mark: Sent")
          .setDescription(
            "Embed with specialization selection buttons has been sent."
          )
      ]
    });
  }
};
