const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("losuj")
    .setDescription(
      "Ze 100% skutecznością podaje twój wynik z najbliższego kolosa."
    ),
  async execute({ client, interaction }) {
    const random = Math.round(Math.random() * 100);
    let msg = `<:profesor:1045785569239781437> ${random}%`;
    if (random > 75) msg = `:sunglasses: ${random}%`;
    else if (random > 50) msg = `<:dziubdziub:1052315768555061279> ${random}%`;

    await interaction.channel.send(`<@${interaction.user.id}>\n${msg}`);
    await interaction.deleteReply();
  }
};
