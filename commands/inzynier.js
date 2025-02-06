const {
  SlashCommandBuilder,
  EmbedBuilder,
  InteractionContextType
} = require("discord.js");
const utils = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inzynier")
    .setDescription("Odbiera rolę Inżyniera")
    .setContexts(InteractionContextType.Guild),
  async execute({ client, interaction }) {
    const guildConfig = utils.getGuildConfig(interaction.guildId);
    const guildName = guildConfig.name;

    if (guildName !== "inżynierski") {
      utils.logInfo("inzynier", "Command used in wrong guild");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(`Komenda nie jest dostępna na tym serwerze.`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const allowedChannelId = guildConfig.inzynierId;

    if (interaction.channelId !== allowedChannelId) {
      utils.logInfo("inzynier", "Command used in wrong channel");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(
          `Komenda dostępna tylko na kanale <#${allowedChannelId}>.`
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const roleName = "Inżynier";
    const member = interaction.member;

    const role = interaction.guild.roles.cache.find((r) => r.name === roleName);
    if (!role) {
      throw new Error(`Role "${roleName}" not found`);
    }

    if (member.roles.cache.has(role.id)) {
      utils.logInfo("inzynier", "Role already assigned");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(`Masz już rolę <@&${role.id}>.`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await member.roles.add(role);

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Gratulacje!")
      .setDescription(
        `Gratulujemy zdania egzaminu inżynierskiego! Pomyślnie przypisano rolę <@&${role.id}>.`
      )
      .setThumbnail(guildConfig.logo)
      .addFields({
        name: " ",
        value:
          "<:profesor:1045785569239781437> <:konor:1122557089106112675> <:kuchta:1229551359473225738>" +
          "<:dziubdziub:1052315768555061279> <:profdrhabin:1069695060561629284> <:nowicki:1119353299544588318> <:daciuk:1060192736533291060>"
      });

    await interaction.reply({ embeds: [embed] });
  }
};
