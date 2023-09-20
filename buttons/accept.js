const { EmbedBuilder } = require("discord.js");
const { logInfo } = require("..");

module.exports = {
  name: "accept",
  async execute({ client, interaction }) {
    interaction.deferUpdate();
    try {
      const _user = interaction.message.embeds[0].fields[4].value;
      const indeks = interaction.message.embeds[0].fields[0].value;
      const imie = interaction.message.embeds[0].fields[1].value;
      const nazwisko = interaction.message.embeds[0].fields[2].value;
      const grupa = interaction.message.embeds[0].fields[3].value;
      const uwagi = interaction.message.embeds[0].fields[5].value;

      //check bot permissions for role assignment
      if (!interaction.guild.members.me.permissions.has("ManageRoles")) {
        return logInfo(`No permissions to manage roles`, 1);
      }

      const strumien = grupa[1] === "S" ? "Systemiarz" : "Apkowicz";

      const roles = [];
      roles.push(
        interaction.guild.roles.cache.find((r) => r.name === "Student")
      );
      roles.push(
        interaction.guild.roles.cache.find((r) => r.name === strumien)
      );
      roles.push(
        interaction.guild.roles.cache.find((r) => r.name === "Grupa " + grupa)
      );

      const member = await interaction.guild.members.fetch(_user);
      roles.forEach((role) => {
        member.roles.add(role);
      });

      const _userChannel = await client.users.fetch(_user);
      const embed = new EmbedBuilder()
        .setTitle(`:white_check_mark: Wniosek został zaakceptowany`)
        .setColor("Green")
        .setDescription(
          `Pamiętaj aby przestrzegać regulaminu serwera oraz Discorda. \
        Polecamy zajrzeć na kanał  <#${process.env.KIEDY_KOLOS_ID}> \
        aby dowiedzieć się więcej o zbliżających się egzaminach i \
        nie tylko.\n\nSerdecznie zapraszamy,\n\ Administracja.`
        )
        .setThumbnail(
          `https://pg.edu.pl/files/styles/large/public/2021-06/pg_logo_kolor_podstawowa_2.jpg`
        )
        .setFooter({
          text: `Zaakceptował ${interaction.user.username}`,
          iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`,
        })
        .setTimestamp();
      await _userChannel.send({ embeds: [embed] });

      const responseEmbed = new EmbedBuilder()
        .setTitle(`:white_check_mark: Wniosek został zaakceptowany`)
        .setColor("Green")
        .setDescription(`Wniosek użytkownika <@${_user}> został zaakceptowany.`)
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
