const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { logInfo } = require("../functions");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inzynier")
    .setDescription("Odbiera rolę Inżyniera"),
  async execute({ client, interaction }) {
    const allowedChannelId = process.argv.includes("dev")
      ? process.env.DEV_CHANNEL_ID
      : process.env.INZYNIER_ID;
    const unlockDate = new Date("2025-01-29T08:00:00Z");
    const currentDate = new Date();

    if (interaction.channelId !== allowedChannelId) {
      logInfo("inzynier", "Command used in wrong channel");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(
          `Komenda dostępna tylko na kanale <#${allowedChannelId}>.`
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (currentDate < unlockDate) {
      logInfo("inzynier", "Command used before unlock date");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(
          `Komenda odblokuje się dopiero <t:${moment(unlockDate).unix()}:R>.`
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const roleName = "Inżynier";
    const member = interaction.member;

    const role = interaction.guild.roles.cache.find((r) => r.name === roleName);
    if (!role) {
      logInfo("inzynier", "Role not found");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(`Nie znaleziono roli <@&${role.id}>.`);

      return interaction.reply({ embeds: [embed] });
    }

    if (member.roles.cache.has(role.id)) {
      logInfo("inzynier", "Role already assigned");
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
      .setThumbnail(
        "https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg"
      )
      .addFields({
        name: " ",
        value:
          "<:profesor:1045785569239781437> <:konor:1122557089106112675> <:kuchta:1229551359473225738>" +
          "<:dziubdziub:1052315768555061279> <:profdrhabin:1069695060561629284> <:nowicki:1119353299544588318> <:daciuk:1060192736533291060>"
      });

    await interaction.reply({ embeds: [embed] });
  }
};
