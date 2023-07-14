const { Events } = require("discord.js");

const { printMessage } = require("../index.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    printMessage(interaction);

    const client = interaction.client;

    const channel = client.channels.cache.get(interaction.channelId);
    if (
      interaction.guild &&
      (!channel.permissionsFor(client.user).has("SendMessages") ||
        !channel.permissionsFor(client.user).has("ViewChannel"))
    ) {
      return interaction.reply({
        content:
          ":x: Nie mam uprawnień do wysyłania wiadomości lub nie widzę tego kanału",
        ephemeral: true,
      });
    }

    const command = interaction.client.slashcommands.get(
      interaction.commandName
    );

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    const slashcmd = client.slashcommands.get(interaction.commandName);
    if (!slashcmd)
      return interaction.reply(
        ":x: Wystąpił nieoczekiwany błąd: `Unknown Command`"
      );

    try {
      await slashcmd.execute({ client, interaction });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: `:x: Wystąpił nieoczekiwany błąd: \`${err}\``,
        ephemeral: true,
      });
    }
  },
};
