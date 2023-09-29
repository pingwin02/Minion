const fs = require("fs");
const { Events } = require("discord.js");
const { logInfo, sendError } = require("../index.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.content === "!clear") {
      fs.writeFile("logs/log.log", "", (err) => {
        if (err) {
          console.error("Error clearing log file:", err);
        }
      });
      logInfo(`Log file cleared by @${message.author.username}`);
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
      message.reply("debil <:dziubdziub:1052315768555061279>");
    } else if (
      message.content === "remove_all_roles" &&
      message.guild &&
      message.author.id === process.env.ADMIN_ID
    ) {
      await message.react("⌚");
      await message.guild.members.fetch().then((members) => {
        members.forEach((member) => {
          member.roles.cache.forEach((role) => {
            if (
              role.position < message.guild.members.me.roles.highest.position &&
              role.name !== "@everyone"
            ) {
              setTimeout(() => {
                console.log(
                  `Trying to remove role ${role.name} from ${member.user.username}`
                );
                member.roles.remove(role).catch((err) => {
                  console.error(
                    `Error while removing role ${role.name} from ${member.user.username}: ${err}`
                  );
                });
              }, 20);
            }
          });
        });
      });
      await message.reactions.removeAll();
      await message.react("✅");
    }
  },
};
