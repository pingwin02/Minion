const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { timedDelete, printError } = require("../functions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Kasuje wiadomości, które są młodsze niż 14 dni.")
    .addIntegerOption((option) =>
      option
        .setName("ilość")
        .setDescription("Ilość wiadomości do wykasowania")
        .setMaxValue(99)
        .setRequired(true)
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute({ client, interaction }) {
    const amount = interaction.options.getInteger("ilość") + 1;
    await interaction.channel.bulkDelete(amount, true).catch((err) => {
      printError(interaction.channel, "Nie można usunąć wiadomości", err);
    });

    const msg = await interaction.channel.send(
      `Usunięto około **${amount - 1}** wiadomości.`
    );
    timedDelete(msg);
    await interaction.deleteReply();
  }
};
