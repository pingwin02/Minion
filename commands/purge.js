const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  InteractionContextType
} = require("discord.js");
const utils = require("../utils");

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
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute({ client, interaction }) {
    await interaction.deferReply({ ephemeral: true });
    const amount = interaction.options.getInteger("ilość") + 1;
    await interaction.channel.bulkDelete(amount, true).catch((err) => {
      utils.printError(interaction.channel, "Nie można usunąć wiadomości", err);
    });

    const msg = await interaction.channel.send(
      `Usunięto około **${amount - 1}** wiadomości.`
    );
    utils.timedDelete(msg);
    await interaction.deleteReply();
  }
};
