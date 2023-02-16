const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Kasuje wiadomości.")
    .addIntegerOption(option =>
		option.setName('ilość')
			.setDescription('Ilość wiadomości do wykasowania')
            .setMaxValue(100)
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {

    const amount = interaction.options.getInteger('ilość');

    await interaction.channel.bulkDelete(amount);
    await interaction.reply(`Usunięto **${amount}** wiadomości.`);
    setTimeout(() => interaction.deleteReply(), 3000);

  }
}