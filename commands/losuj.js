const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("losuj")
    .setDescription(
      "Ze 100% skutecznością podaje twój wynik z najbliższego kolosa."
    )
    .addIntegerOption((option) =>
      option
        .setName("zasięg")
        .setDescription("Zasięg losowania wyniku kolosa")
        .setMinValue(1)
        .setRequired(true)
    ),
  async execute({ client, interaction }) {
    const zasieg = interaction.options.getInteger("zasięg");
    const random = Math.floor(Math.random() * (zasieg + 1));
    if (random > 0.75 * zasieg)
      await interaction.reply(`:sunglasses: ${random}`);
    else if (random > 0.5 * zasieg)
      await interaction.reply(`<:dziubdziub:1052315768555061279> ${random}`);
    else await interaction.reply(`<:profesor:1045785569239781437> ${random}`);
  },
};
