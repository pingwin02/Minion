const { Events, InteractionType } = require("discord.js");
const { logInfo } = require("..");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const user = interaction.author || interaction.user;

    if (interaction.guild === null)
      logInfo(`${user.username} (${user.id}) used ${interaction} in DMs`, 0);
    else if (interaction.isButton()) {
      logInfo(
        `${user.username} (${user.id}) ${interaction.customId}ed in #${interaction.channel.name} at ${interaction.guild.name}`,
        0
      );
    } else
      logInfo(
        `${user.username} (${user.id}) used ${interaction} in #${interaction.channel.name} at ${interaction.guild.name}`,
        0
      );

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

    const collection = interaction.isCommand()
      ? interaction.client.slashcommands
      : interaction.client.buttoncommands;
    const commandName = interaction.commandName || interaction.customId;

    const cmd = collection.get(commandName);

    if (!cmd) {
      logInfo(`Unknown command/button: ${commandName}`, 1);
      return;
    }

    try {
      const client = interaction.client;
      await cmd.execute({ client, interaction });
    } catch (err) {
      logInfo(err, 1);
      const msg = `:x: Wystąpił nieoczekiwany błąd: \`${err}\``;
      if (interaction.deferred || interaction.replied) {
        interaction.editReply(msg);
      } else {
        interaction.reply(msg);
      }
    }
  },
};
