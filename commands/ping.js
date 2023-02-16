const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Odpowiada Pong!"),
  async execute(interaction) {
    await interaction.reply({ content: `🏓 Ping wynosi ${Date.now() - interaction.createdTimestamp}ms.`, ephemeral: true });
  },
};
