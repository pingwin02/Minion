const { Events } = require("discord.js");
const { logInfo } = require("..");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    let user = interaction.author;
    if (interaction.author === undefined) user = interaction.user;

    let commandName = interaction;

    if (interaction.guild === null)
      logInfo(`${user.username} (${user.id}) used ${commandName} in DMs`, 0);
    else
      logInfo(
        `${user.username} (${user.id}) used ${commandName} in #${interaction.channel.name} at ${interaction.guild.name}`,
        0
      );

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
