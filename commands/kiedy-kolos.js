const { SlashCommandBuilder } = require("discord.js");
const { google } = require("googleapis");
const moment = require("moment-timezone");
const _ = require("lodash");
moment.tz.setDefault("Europe/Warsaw");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kiedy-kolos")
    .setDescription("Aktualizuje kalendarz kolokwiów"),
  async execute({ client, interaction }) {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.client.channels.cache.get(
      process.argv.includes("dev")
        ? process.env.DEV_CHANNEL_ID
        : process.env.KIEDY_KOLOS_ID
    );

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages")
    ) {
      throw new Error("Nie znaleziono kanału KIEDY_KOLOS lub brak uprawnień");
    }

    const fetchedMessages = await channel.messages.fetch({ limit: 10 });
    // Znajdź wiadomość wysłaną przez bota, która jest edytowalna
    const mainMessage = fetchedMessages.find(
      (msg) => msg.author.id === client.user.id && msg.editable
    );

    const authJSON = JSON.parse(process.env.GOOGLE_AUTH);

    const auth = new google.auth.GoogleAuth({
      credentials: authJSON,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"]
    });

    const calendar = google.calendar({ version: "v3", auth });

    const params = {
      calendarId: process.env.CALENDAR_ID,
      timeMin: moment().toISOString(),
      singleEvents: true,
      orderBy: "startTime"
    };

    const response = await calendar.events.list(params);

    const currentUnix = moment().unix();
    const currentFormatted = `<t:${currentUnix}:R>`;

    const events = response.data.items;

    const eventGroups = {
      EGZAMINY: [],
      POPRAWY: [],
      PROJEKTY: [],
      INNE: []
    };

    const categoryGroups = {
      WSPÓLNE: _.cloneDeep(eventGroups),
      APLIKACJE: _.cloneDeep(eventGroups),
      SYSTEMY: _.cloneDeep(eventGroups),
      KASK: _.cloneDeep(eventGroups),
      KAIMS: _.cloneDeep(eventGroups),
      KISI: _.cloneDeep(eventGroups),
      BD: _.cloneDeep(eventGroups),
      TELE: _.cloneDeep(eventGroups),
      GEO: _.cloneDeep(eventGroups),
      PRZEDAWNIONE: _.cloneDeep(eventGroups)
    };

    if (events.length === 0) {
      categoryGroups["WSPÓLNE"]["INNE"].push(
        ":tropical_drink: Brak nadchodzących wydarzeń w kalendarzu."
      );
    }

    events.forEach((event) => {
      let startUnix, startFormatted;

      if (event.start.dateTime) {
        // Jeśli wydarzenie ma godzinę
        startUnix = moment(event.start.dateTime).unix();
        startFormatted = `<t:${startUnix}:f>`;
      } else {
        // Jeśli wydarzenie jest całodniowe
        startUnix = moment(event.end.date).unix() - 1;
        startFormatted = `<t:${startUnix}:d>`;
      }

      const countDownFormatted = `<t:${startUnix}:R>`;
      const location = event.location || "Brak sali";

      if (!event.summary) {
        event.summary = "Brak nazwy wydarzenia";
      }

      let eventType = "INNE"; // Domyślnie typ "INNE"
      let category = "WSPÓLNE"; // Domyślnie kategoria "WSPÓLNE"
      const summary = event.summary.toLowerCase();
      if (summary.includes("popraw")) {
        eventType = "POPRAWY";
      } else if (summary.includes("egzamin") || summary.includes("kolokwium")) {
        eventType = "EGZAMINY";
      } else if (summary.includes("projekt")) {
        eventType = "PROJEKTY";
      }

      if (summary.includes("[kask]")) {
        category = "KASK";
      } else if (summary.includes("[kaims]")) {
        category = "KAIMS";
      } else if (summary.includes("[kisi]")) {
        category = "KISI";
      } else if (summary.includes("[bd]")) {
        category = "BD";
      } else if (summary.includes("[tele]")) {
        category = "TELE";
      } else if (summary.includes("[geo]")) {
        category = "GEO";
      } else if (summary.includes("[p]")) {
        category = "PRZEDAWNIONE";
      }

      event.summary = event.summary.replace(/\[.*\]/, "").trim();

      categoryGroups[category][eventType].push(
        `:calendar_spiral: ${startFormatted} - ${event.summary} **${location}** (${countDownFormatted})`
      );
    });

    let formattedMessage = `# TERMINARZ (akt. ${currentFormatted})`;

    Object.entries(categoryGroups).forEach(([category, eventGroups]) => {
      if (Object.values(eventGroups).every((events) => events.length === 0)) {
        return;
      }
      formattedMessage += `\n## ${category}`;
      Object.entries(eventGroups).forEach(([eventType, events]) => {
        if (events.length > 0) {
          formattedMessage += `\n### ${eventType}\n${events.join("\n")}`;
        }
      });
    });

    let tooLongFlag = false;
    let preLength = formattedMessage.length;

    // Usuń wszystkie odnośniki do dat względnych (np. "za 2 dni") jeśli wiadomość jest za długa
    if (formattedMessage.length > 2000) {
      tooLongFlag = true;
      formattedMessage = formattedMessage.replace(/ \(<t:(\d+):R>\)/g, "");
    }

    // Jeśli wiadomość jest wciąż za długa
    if (formattedMessage.length > 2000) {
      throw new Error(
        `Wiadomość jest za długa! (${formattedMessage.length} > 2000)` +
          "\nSpróbuj usunąć niektóre wydarzenia z kalendarza lub zmniejszyć ilość znaków w nazwach wydarzeń."
      );
    }

    let newMessage;
    if (mainMessage) {
      await mainMessage.edit(formattedMessage);
    } else {
      newMessage = await channel.send(formattedMessage);
    }

    await interaction.editReply({
      content:
        `Zaktualizowano kalendarz kolokwiów. Przejdź, by zobaczyć zmiany: ${
          mainMessage?.url || newMessage?.url
        }` +
        `\n\n:calendar_spiral: Ilość wydarzeń: ${events.length}` +
        `\n:writing_hand: Długość wiadomości: ` +
        `${formattedMessage.length}/2000` +
        (tooLongFlag ? ` *(po kompresji z ${preLength} znaków)*` : "")
    });
  }
};
