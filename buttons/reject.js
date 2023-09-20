const { EmbedBuilder } = require("discord.js");
const { logInfo } = require("..");

module.exports = {
  name: "reject",
  async execute({ client, interaction }) {
    interaction.deferUpdate();
    try {
      const _user = interaction.message.embeds[0].fields[4].value;
      const _userChannel = await client.users.fetch(_user);
      const embed = new EmbedBuilder()
        .setTitle(`:x: Wniosek został odrzucony`)
        .setColor("Red")
        .setDescription(
          `Twoja prośba o weryfikację została odrzucona.\n\nJeśli chcesz dowiedzieć się więcej, \
        napisz do <@${interaction.user.id}>.`
        )
        .setThumbnail(
          `https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg`
        )
        .setFooter({
          text: `Odrzucił ${interaction.user.username}`,
          iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`,
        })
        .setTimestamp();
      await _userChannel.send({ embeds: [embed] });

      const responseEmbed = new EmbedBuilder()
        .setTitle(`:x: Wniosek został odrzucony`)
        .setColor("Red")
        .setDescription(`Wniosek użytkownika <@${_user}> został odrzucony.`)
        .setTimestamp();

      interaction.channel
        .send({ embeds: [responseEmbed] })
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 5000);
        })
        .catch((err) => logInfo(err, 1));
      interaction.message.delete().catch((err) => logInfo(err, 1));
    } catch (error) {
      logInfo(error, 1);
    }
  },
};
