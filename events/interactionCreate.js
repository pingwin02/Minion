const { Events } = require("discord.js");
const { logInfo } = require("..");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const user = interaction.author || interaction.user;
    const client = interaction.client;

    if (interaction.guild === null)
      logInfo(`${user.username} used ${interaction} in DMs`);
    else if (interaction.isButton()) {
      logInfo(
        `${user.username} ${interaction.customId}ed in #${interaction.channel.name} at ${interaction.guild.name}`
      );
    } else
      logInfo(
        `${user.username} used ${interaction} in #${interaction.channel.name} at ${interaction.guild.name}`
      );

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

    const collection = interaction.isCommand()
      ? client.slashcommands
      : client.buttoncommands;
    const commandName = interaction.commandName || interaction.customId;

    const cmd = collection.get(commandName);

    if (!cmd) {
      logInfo("Unknown command/button", new Error(commandName));
      return;
    }

    try {
      await cmd.execute({ client, interaction });
    } catch (err) {
      logInfo(`/${commandName} command`, err);
      if (err.status != 404) {
        const msg = `:x: Wystąpił nieoczekiwany błąd: \`${err}\``;
        if (interaction.deferred || interaction.replied) {
          interaction.editReply(msg);
        } else {
          interaction.reply(msg);
        }
      }
    }
  },
};
