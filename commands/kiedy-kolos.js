const { SlashCommandBuilder } = require("discord.js");

const { kiedykolosID } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kiedy-kolos")
    .setDescription("Pokazuje kalendarz kolokwiów"),
  async execute(interaction) {
    const channel = interaction.client.channels.cache.get(kiedykolosID)
    await interaction.reply({ content: `Zajrzyj na ${channel}`, ephemeral: true });
  },
};
