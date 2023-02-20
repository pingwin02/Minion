const { SlashCommandBuilder } = require("discord.js");

const { sendError } = require("../index.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Wysyła wniosek o weryfikację statusu studenta")
    .addIntegerOption((option) =>
      option
        .setName("indeks")
        .setDescription("6-cyfrowy numer indeksu")
        .setMinValue(160000)
        .setMaxValue(195000)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("imię").setDescription("Imię studenta").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("nazwisko")
        .setDescription("Nazwisko studenta")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("nr_grupy")
        .setDescription("Nr grupy dziekańskiej studenta, jeśli brak to wpisz 0")
        .setMinValue(0)
        .setMaxValue(5)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("uwagi")
        .setDescription("Dodatkowe uwagi dotyczące wniosku")
    ),
  async execute(interaction) {
    const channel = interaction.client.channels.cache.get(
      process.env.weryfikacjeID
    );
    if (!channel) return console.log("Kanał nie istnieje!");
    const id = interaction.user.id;
    const imie = interaction.options.getString("imię");
    const nazwisko = interaction.options.getString("nazwisko");
    const indeks = interaction.options.getInteger("indeks");
    const nr_grupy = interaction.options.getInteger("nr_grupy");
    uwagi = interaction.options.getString("uwagi");
    if (!uwagi) {
      uwagi = "Brak";
    }

    if (interaction.guild) {
      return await interaction.reply({
        content: "Komenda dostępna tylko w prywatnej konwersacji",
        ephemeral: true,
      });
    }

    const message = await channel.send(
      `WNIOSEK ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})\n${indeks} ${nr_grupy} ${imie} ${nazwisko} Uwagi: ${uwagi}`
    );
    await message.react("✅").then(() => message.react("❌"));

    const filter = (reaction, user) => {
      return ["✅", "❌"].includes(reaction.emoji.name);
    };

    message
      .awaitReactions({ filter, max: 1, time: 60000, errors: ["time"] })
      .then((collected) => {
        const reaction = collected.first();
        message.reactions.removeAll().then(() => {
          if (reaction.emoji.name === "✅") {
            message.react("✅");
            message.reply("Zatwierdzono wniosek!").then((msg) => {
              setTimeout(
                () =>
                  msg.delete().catch((err) => {
                    sendError("Kasowanie wiadomości", err, interaction);
                  }),
                5000
              );
              interaction.client.users.cache
                .get(id)
                .send(
                  "Wniosek został zatwierdzony! Możesz teraz korzystać z kanałów serwera"
                );
            });
          } else {
            message.react("❌");
            message.reply("Odrzucono wniosek!").then((msg) => {
              setTimeout(
                () =>
                  msg.delete().catch((err) => {
                    sendError("Kasowanie wiadomości", err, interaction);
                  }),
                5000
              );
              interaction.client.users.cache
                .get(id)
                .send(
                  "Wniosek został odrzucony! Jeśli uważasz, że jest to błąd, skontaktuj się ze starostą"
                );
            });
          }
        });
      })
      .catch((collected) => {
        message
          .reply(
            ":x: Brak reakcji na wniosek w ciągu 60 sekund. Automatyzacja wyłączona."
          )
          .then((msg) => {
            setTimeout(
              () =>
                msg.delete().catch((err) => {
                  sendError("Kasowanie wiadomości", err, interaction);
                }),
              10000
            );
          });
        message.reactions.removeAll();
      });

    await interaction.reply("Wysłano! Czekaj na odpowiedź od administracji");
  },
};
