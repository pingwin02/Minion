const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kiedy-kolos")
    .setDescription("Pokazuje kalendarz kolokwiów"),
  async execute(interaction) {
    const channel = interaction.client.channels.cache.get(process.env.kiedykolosID)
    await interaction.reply({ content: `Zajrzyj na ${channel}`, ephemeral: true });
  },
};
