const { SlashCommandBuilder } = require("discord.js");
const { google } = require("googleapis");
const moment = require("moment-timezone");
moment.tz.setDefault("Europe/Warsaw");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kiedy-kolos")
    .setDescription("Aktualizuje kalendarz kolokwiów"),
  async execute({ client, interaction }) {
    // Pobierz ostatnią wiadomość z kanału
    const channel = interaction.client.channels.cache.get(
      process.env.KIEDY_KOLOS_ID
    );

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages")
    ) {
      throw new Error("Nie znaleziono kanału KIEDY_KOLOS lub brak uprawnień");
    }

    const fetchedMessages = await channel.messages.fetch({ limit: 10 });
    const mainMessage = fetchedMessages.last();

    const authJSON = JSON.parse(process.env.GOOGLE_AUTH);

    const auth = new google.auth.GoogleAuth({
      credentials: authJSON,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const params = {
      calendarId: process.env.CALENDAR_ID,
      timeMin: moment().toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    };

    const response = await calendar.events.list(params);

    const currentUnix = moment().unix();
    const currentFormatted = `<t:${currentUnix}:R>`;

    const events = response.data.items;

    const eventGroups = {
      "EGZAMINY/KOLOKWIA": [],
      POPRAWY: [],
      PROJEKTY: [],
      INNE: [],
      PÓŹNIEJSZE: [],
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
      const summary = event.summary.toLowerCase();
      if (summary.includes("egzamin") || summary.includes("kolokwium")) {
        eventType = "EGZAMINY/KOLOKWIA";
      } else if (summary.includes("projekt")) {
        eventType = "PROJEKTY";
      } else if (summary.includes("poprawa")) {
        eventType = "POPRAWY";
      }

      //check if startunix is more than month from now
      if (startUnix - currentUnix > moment.duration(1, "month").asSeconds()) {
        eventType = "PÓŹNIEJSZE";
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

    await interaction.editReply({
      content: `Zaktualizowano kalendarz kolokwiów. Przejdź do kanału <#${process.env.KIEDY_KOLOS_ID}> aby zobaczyć.`,
    });
  },
};
