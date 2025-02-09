const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  InteractionContextType
} = require("discord.js");
const utils = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wybor-specek")
    .setDescription("Wysyła embed z przyciskami do wyboru specjalizacji")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("kanał")
        .setDescription("Kanał, na który wysłać embed")
        .setRequired(true)
    )
    .setContexts(InteractionContextType.Guild),
  async execute({ client, interaction }) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel("kanał");

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages") ||
      channel.type !== ChannelType.GuildText
    ) {
      return utils.printError(
        interaction,
        "Nie znaleziono wybranego kanału, " +
          "brak uprawnień lub niepoprawny typ kanału."
      );
    }

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Wybór specjalizacji")
      .setDescription(
        "Wybierz specjalizację, klikając odpowiedni przycisk. " +
          "Możesz wybrać maksymalnie **jedną** specjalizację. " +
          "Jeśli chcesz zmienić wybór, " +
          "użyj przycisku \"Usuń\" przed wyborem innej."
      );

    const rows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("spec#UM")
          .setLabel("Uczenie maszynowe [UM]")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#ISI")
          .setLabel("Inżynieria systemów informacyjnych [ISI]")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#SK")
          .setLabel("Sieci komputerowe [SK]")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#ISINT")
          .setLabel("Inteligentne systemy interaktywne [ISINT]")
          .setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("spec#PRZ")
          .setLabel(
            "Przetwarzanie wysokiej wydajności " +
              "i inteligencja obliczeniowa [PRZ]"
          )
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#TGM")
          .setLabel("Technologie geoinformatyczne i mobilne [TGM]")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#ATI")
          .setLabel("Algorytmy i technologie internetowe [ATI]")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("spec#DELETE")
          .setLabel("Usuń")
          .setStyle(ButtonStyle.Danger)
      )
    ];

    await channel.send({ embeds: [embed], components: rows });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle(":white_check_mark: Wysłano")
          .setDescription(
            "Wysłano embed z przyciskami do wyboru specjalizacji."
          )
      ]
    });
  }
};
