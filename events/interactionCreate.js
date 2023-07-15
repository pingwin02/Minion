const { Events } = require("discord.js");
const { logInfo } = require("..");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    let user = interaction.author;
    if (interaction.author === undefined) user = interaction.user;

    let commandName = interaction.commandName;
    if (commandName === undefined) commandName = interaction.content;

    if (interaction.guild === null)
      logInfo(
        `${user.username} (${user.id}) used ${commandName} command in DMs`,
        0
      );
    else
      logInfo(
        `${user.username} (${user.id}) used ${commandName} command in #${interaction.channel.name} (${interaction.channel.id}) at ${interaction.guild.name} (${interaction.guild.id})`,
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
      interaction.reply({
        content: `:x: Wystąpił nieoczekiwany błąd: \`${err}\``,
        ephemeral: true,
      });
    }
  },
};
