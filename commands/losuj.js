const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("losuj")
    .setDescription("Ze 100% skutecznością podaje twój wynik z najbliższego kolosa.")
    .addIntegerOption(option =>
		option.setName('zasięg')
			.setDescription('Zasięg losowania wyniku kolosa')
            .setMinValue(1)
            .setRequired(true)),
  async execute(interaction) {
    const random = Math.floor(Math.random() * (interaction.options.getInteger('zasięg') + 1))
    await interaction.reply(`:game_die: ${random}`);
  },
};