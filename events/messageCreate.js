const fs = require("fs");
const { Events, OverwriteType } = require("discord.js");
const { logInfo, timedDelete } = require("../functions");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.content === "!clear") {
        fs.writeFile(
          process.argv.includes("dev") ? "logs/dev.log" : "logs/log.log",
          "",
          (err) => {
            if (err) {
              logInfo("!!clear command", err);
            }
          }
        );
        logInfo(`Log file cleared by @${message.author.username}`);
        const channel = message.client.channels.cache.get(
          message.channelId.toString()
        );
        const toDelete = [];
        const messages = await channel.messages.fetch({ limit: 100 });

        messages.forEach((msg) => {
          if (msg.author.id === message.client.user.id) toDelete.push(msg.id);
        });
        if (toDelete.length === 0) {
          const msg1 = await message.reply({
            content: "Nie znaleziono żadnych wiadomości do usunięcia"
          });
          timedDelete(msg1);
        } else {
          toDelete.forEach((msg) => {
            timedDelete(channel.messages.cache.get(msg), 0);
          });

          const msg2 = await message.reply({
            content: `Usunąłem **${toDelete.length}** moich wiadomości`
          });
          timedDelete(msg2);
        }
        if (message.guild) timedDelete(message);
      } else if (message.content === "student") {
        await message.reply("debil <:dziubdziub:1052315768555061279>");
      } else if (
        message.content === "avatar_update" &&
        message.author.id === process.env.ADMIN_ID
      ) {
        await message.react("⌚");
        message.client.user.setAvatar("img/bot_logo_anim.gif");
        message.client.user.setBanner("img/bot_banner_anim.gif");
        await message.reactions.removeAll();
        await message.react("✅");
      } else if (
        message.content === "remove_all_roles" &&
        message.guild &&
        message.author.id === process.env.ADMIN_ID
      ) {
        await message.react("⌚");
        const members = await message.guild.members.fetch();
        members.forEach((member) => {
          member.roles.cache.forEach((role) => {
            if (
              role.position < message.guild.members.me.roles.highest.position &&
              role.name !== "@everyone" &&
              role.managed === false
            ) {
              setTimeout(() => {
                logInfo(
                  `Removing role @${role.name} from @${member.user.username}`
                );
                member.roles.remove(role).catch((err) => {
                  logInfo(
                    `Error while removing role @${role.name} from @${member.user.username}`,
                    new Error(err.message)
                  );
                });
              }, 20);
            }
          });
        });
        const channels = await message.guild.channels.fetch();
        channels.forEach((channel) => {
          channel.permissionOverwrites.cache.forEach((perm) => {
            if (perm.type === OverwriteType.Member) {
              const memberUsername = message.guild.members.cache.get(perm.id)
                .user.username;
              setTimeout(() => {
                logInfo(
                  `Removing @${memberUsername} permissions from #${channel.name}`
                );
                channel.permissionOverwrites.delete(perm.id).catch((err) => {
                  logInfo(
                    `Error while removing @${memberUsername} permissions from #${channel.name}`,
                    new Error(err.message)
                  );
                });
              }, 20);
            }
          });
        });
        await message.reactions.removeAll();
        await message.react("✅");
      }
    } catch (err) {
      logInfo(`${message.content} message`, err);
    }
  }
};
