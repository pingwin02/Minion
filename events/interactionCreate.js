const { Events } = require("discord.js");

const { printMessage } = require("../index.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    printMessage(interaction);

    const channel = interaction.client.channels.cache.get(
      interaction.channelId
    );
    if (
      interaction.guild &&
      (!channel.permissionsFor(interaction.client.user).has("SendMessages") ||
        !channel.permissionsFor(interaction.client.user).has("ViewChannel"))
    ) {
      return interaction.reply({
        content:
          ":x: Nie mam uprawnień do wysyłania wiadomości lub nie widzę tego kanału",
        ephemeral: true,
      });
    }

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
    }
  },
};
