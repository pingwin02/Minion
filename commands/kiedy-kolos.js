const { SlashCommandBuilder } = require("discord.js");
const { google } = require("googleapis");
const moment = require("moment");
const { logInfo } = require("..");

require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kiedy-kolos")
    .setDescription("Aktualizuje kalendarz kolokwiów"),
  async execute({ client, interaction }) {
    // Pobierz ostatnią wiadomość z kanału
    const channel = interaction.client.channels.cache.get(
      process.env.kiedykolosID
    );
    const fetchedMessages = await channel.messages.fetch({ limit: 10 });
    const mainMessage = fetchedMessages.last();

    if (mainMessage && mainMessage.editable) {
      // Sprawdź datę ostatniej edycji wiadomości
      const lastEditTime = moment(
        mainMessage.editedAt || mainMessage.createdAt
      );
      const currentTime = moment();

      // Jeśli wiadomość została zmieniona w ciągu ostatnich 5 minut, nie rób nic
      const editThreshold = 1; // Czas w minutach
      if (currentTime.diff(lastEditTime, "minutes") <= editThreshold) {
        await interaction.reply({
          content:
            ":stopwatch: Aktualizacja przeprowadzona niedawno. Spróbuj ponownie za chwilę.",
          ephemeral: true,
        });
        return;
      }
    }

    const authJSON = JSON.parse(process.env.googleAuth);

    const auth = new google.auth.GoogleAuth({
      credentials: authJSON,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const params = {
      calendarId: process.env.calendarID,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    };

    try {
      const response = await calendar.events.list(params);

      const currentUnix = moment().unix();
      const currentFormatted = `<t:${currentUnix}:R>`;

      const events = response.data.items;

      const eventGroups = {
        "EGZAMINY/KOLOKWIA": [],
        POPRAWY: [],
        PROJEKTY: [],
        INNE: [],
      };

      if (events.length === 0) {
        eventGroups.INNE.push(
          ":tropical_drink: Brak nadchodzących wydarzeń w kalendarzu."
        );
      }

      events.forEach((event) => {
        let startUnix, startFormatted;

        if (event.start.dateTime) {
          startUnix = moment(event.start.dateTime).unix();
          startFormatted = `<t:${startUnix}:f>`;
        } else {
          startUnix = moment(event.start.date).unix();
          startFormatted = `<t:${startUnix}:d>`;
        }

        const countDownFormatted = `<t:${startUnix}:R>`;
        const location = event.location || "Brak sali";

        let eventType = "INNE"; // Domyślnie typ "INNE"
        if (!event.summary) {
          event.summary = "Brak nazwy wydarzenia";
        }
        if (event.summary.toLowerCase().includes("egzamin")) {
          eventType = "EGZAMINY/KOLOKWIA";
        } else if (event.summary.toLowerCase().includes("projekt")) {
          eventType = "PROJEKTY";
        } else if (event.summary.toLowerCase().includes("poprawa")) {
          eventType = "POPRAWY";
        }

        eventGroups[eventType].push(
          `:calendar_spiral: ${startFormatted} - ${event.summary} **${location}** (${countDownFormatted})`
        );
      });

      let formattedMessage = `# TERMINY EGZAMINÓW, KOLOKWIÓW, PROJEKTÓW I INNE (akt. ${currentFormatted})
### *podane godziny są orientacyjne, zawsze lepiej przyjść ~15 minut wcześniej*`;

      Object.entries(eventGroups).forEach(([eventType, events]) => {
        if (events.length > 0) {
          formattedMessage += `\n## ${eventType}\n${events.join("\n")}`;
        }
      });

      if (mainMessage && mainMessage.editable) {
        await mainMessage.edit(formattedMessage);
      } else {
        await channel.send(formattedMessage);
      }

      await interaction.reply({
        content: `Zaktualizowano kalendarz kolokwiów. Przejdź do kanału <#${process.env.kiedykolosID}> aby zobaczyć.`,
        ephemeral: true,
      });
    } catch (error) {
      logInfo(`${error}`, 1);
      await interaction.reply({
        content: ":x: Wystąpił błąd podczas pobierania wydarzeń.",
        ephemeral: true,
      });
    }
  },
};
