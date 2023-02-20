const { Events } = require("discord.js");

const { printMessage, sendError } = require("../index.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.content === "!clear") {
      printMessage(message);
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
              setTimeout(
                () =>
                  msg.delete().catch((err) => {
                    sendError("Kasowanie wiadomości", err, message);
                  }),
                3000
              );
            });
        } else {
          message.client.channels.fetch(message.channelId).then((chl) => {
            toDelete.forEach((msgid) => {
              chl.messages.delete(msgid).catch((err) => {
                sendError("Kasowanie wiadomości", err, message);
              });
            });

            message
              .reply({
                content: `Usunąłem **${toDelete.length}** moich wiadomości`,
                ephemeral: true,
              })
              .then((msg) => {
                setTimeout(
                  () =>
                    msg.delete().catch((err) => {
                      sendError("Kasowanie wiadomości", err, message);
                    }),
                  3000
                );
              });
          });
        }
        if (message.guild)
          setTimeout(
            () =>
              message.delete().catch((err) => {
                sendError("Kasowanie wiadomości", err, message);
              }),
            4000
          );
      });
    } else if (message.content === "student") {
      printMessage(message);
      message.reply("debil <:dziubdziub:1052315768555061279>");
    }
  },
};
