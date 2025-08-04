const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("losuj")
    .setDescription(
      "Z 99.99% skutecznością podaje twój wynik z najbliższego kolosa"
    ),
  async execute({ client, interaction }) {
    await interaction.deferReply();
    const random = Math.round(Math.random() * 100);
    let msg = `<:profesor:1045785569239781437> ${random}%`;
    if (random >= 90) msg = `<:howdyhat:1045769374428053504> ${random}%`;
    else if (random >= 75) msg = `<:ez:1122644572380606626> ${random}%`;
    else if (random >= 50) msg = `<:dziubdziub:1052315768555061279> ${random}%`;

    await interaction.editReply(`${msg}`);
  }
};
