const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.content.startsWith("!clear")) {
      console.log(
        `${message.author.username}#${message.author.discriminator} (${message.author.id}) used !clear command in ${message.channel.name} (${message.channel.id})`
      );
      const channel = message.client.channels.cache.get(
        message.channelId.toString()
      );

      const toDelete = [];

      channel.messages.fetch({ limit: 100 }).then((messages) => {
        messages.forEach((element) => {
          if (element.author.id === message.client.user.id)
            toDelete.push(element.id);
        });
        if (toDelete.length === 0) {
          message
            .reply({
              content: `Nie znaleziono żadnych wiadomości do usunięcia`,
              ephemeral: true,
            })
            .then((msg) => {
              setTimeout(() => msg.delete(), 3000);
            });
          return;
        }
        message.client.channels.fetch(message.channelId).then((chl) => {
          toDelete.forEach((msgid) => {
            chl.messages.delete(msgid);
          });

          message
            .reply({
              content: `Usunąłem **${toDelete.length}** moich wiadomości`,
              ephemeral: true,
            })
            .then((msg) => {
              setTimeout(() => msg.delete(), 3000);
            });
        });
      });
    } else if (message.content === "student") {
      console.log(
        `${message.author.username}#${message.author.discriminator} (${message.author.id}) used student command in ${message.channel.name} (${message.channel.id})`
      );
      message.reply("debil <:dziubdziub:1052315768555061279>");
    }
  },
};
