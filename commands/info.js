const { SlashCommandBuilder } = require("discord.js");

function activeMembersCounter(guild) {
  return guild.members.cache.filter((m) => m.presence?.status == "online").size;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Uzyskaj informacje o użytkowniku lub serwerze")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Informacje o użytkowniku")
        .addUserOption((option) =>
          option.setName("nick").setDescription("Nick użytkownika")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("server").setDescription("Informacje o serwerze")
    )
    .setDMPermission(false),
  async execute({ client, interaction }) {
    if (interaction.options.getSubcommand() === "user") {
      const user = interaction.options.getUser("nick");
      if (user) {
        await interaction.reply({
          content: `Nick: **${user.username}**\nID: **${user.id}**`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `Twój nick: **${interaction.user.username}**\nTwoje ID: **${interaction.user.id}**`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "server") {
      await interaction.reply({
        content: `Nazwa serwera: **${interaction.guild.name}**\nStworzony: **${
          interaction.guild.createdAt
        }**\nIlość użytkowników: **${
          interaction.guild.memberCount
        }** (w tym **${activeMembersCounter(interaction.guild)}** aktywnych)`,
        ephemeral: true,
      });
    }
  },
};
