const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const { sendError } = require("../index");

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
    await interaction.deferReply();
    const amount = interaction.options.getInteger("ilość") + 1;
    await interaction.channel.bulkDelete(amount, true).catch((err) => {
      sendError("Kasowanie wiadomości", err, interaction);
    });

    const msg = `Usunięto około **${amount - 1}** wiadomości.`;
    await interaction.channel.send(msg).then((msg) => {
      setTimeout(
        () =>
          msg.delete().catch((err) => {
            sendError("Kasowanie wiadomości", err, interaction);
          }),
        3000
      );
    });
  },
};
