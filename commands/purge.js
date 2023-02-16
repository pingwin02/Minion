const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Kasuje wiadomości.")
    .addIntegerOption(option =>
		option.setName('ilość')
			.setDescription('Ilość wiadomości do wykasowania')
            .setMaxValue(99)
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    await interaction.deferReply();
    const amount = interaction.options.getInteger('ilość') + 1;
    await interaction.channel.bulkDelete(amount);

    const msg = `Usunięto **${amount-1}** wiadomości.`;
    interaction.channel.send(msg).then((msg) => {
        setTimeout(() => msg.delete(), 3000)});
  }
}