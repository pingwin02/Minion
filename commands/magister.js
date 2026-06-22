const {
  SlashCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags
} = require("discord.js");
const utils = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("magister")
    .setDescription("Przypisuje rolę Magistra")
    .setContexts(InteractionContextType.Guild),
  async execute({ interaction }) {
    const guildConfig = utils.getGuildConfig(interaction.guildId);
    const allowedChannelId = guildConfig.magisterId;

    if (!allowedChannelId) {
      utils.logInfo("magister", "Command used in wrong guild");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription("Komenda nie jest dostępna na tym serwerze.");

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    }

    if (interaction.channelId !== allowedChannelId) {
      utils.logInfo("magister", "Command used in wrong channel");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(
          `Komenda dostępna tylko na kanale <#${allowedChannelId}>.`
        );

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    }

    const roleName = "Magister";
    const member = interaction.member;

    const role = interaction.guild.roles.cache.find((r) => r.name === roleName);
    if (!role) {
      throw new Error(`Role "${roleName}" not found`);
    }

    if (member.roles.cache.has(role.id)) {
      utils.logInfo("magister", "Role already assigned");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(`Masz już rolę <@&${role.id}>.`);

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    }

    await member.roles.add(role);

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Gratulacje!")
      .setDescription(
        "Gratulujemy zdania egzaminu magisterskiego! " +
          `Pomyślnie przypisano rolę <@&${role.id}>.`
      )
      .setThumbnail(guildConfig.logo)
      .addFields({
        name: " ",
        value:
          "<:armata:1423312596999737344>" +
          "<:ez:1380538306672197632>" +
          "<:jarnul:1371903240651935874>" +
          "<:obszar:1346228519700533269>"
      });

    await interaction.reply({ embeds: [embed] });
    const reply = await interaction.fetchReply();
    await reply.react("🎉");
  }
};
