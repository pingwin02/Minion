const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder
} = require("discord.js");
const moment = require("moment-timezone");
const _ = require("lodash");
moment.tz.setDefault("Europe/Warsaw");
const utils = require("../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kiedy-kolos")
    .setDescription("Aktualizuje kalendarz kolokwiów")
    .setContexts(InteractionContextType.Guild),
  async execute({ client, interaction }) {
    await interaction.deferReply({ ephemeral: true });

    const guildConfig = utils.getGuildConfig(interaction.guild.id);
    const channel = interaction.client.channels.cache.get(
      guildConfig.kiedyKolosId
    );

    if (
      !channel ||
      !channel.permissionsFor(client.user).has("ViewChannel") ||
      !channel.permissionsFor(client.user).has("SendMessages")
    ) {
      throw new Error("Nie znaleziono kanału KIEDY_KOLOS lub brak uprawnień");
    }

    const allowedChannelId = guildConfig.allowedKiedyKolosId;

    if (interaction.channelId !== allowedChannelId) {
      utils.logInfo("kiedy-kolos", "Command used in wrong channel");
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(":x: Błąd")
        .setDescription(
          `Komenda dostępna tylko na kanale <#${allowedChannelId}>.`
        );

      return interaction.editReply({ embeds: [embed] });
    }

    const fetchedMessages = await channel.messages.fetch({ limit: 10 });
    const mainMessage = fetchedMessages.find(
      (msg) => msg.author.id === client.user.id && msg.editable
    );

    const currentUnix = moment().unix();
    const currentFormatted = `<t:${currentUnix}:R>`;

    const events = await utils.fetchCalendarEvents(guildConfig.calendarId);

    const eventGroups = {
      EGZAMINY: [],
      POPRAWY: [],
      PROJEKTY: [],
      INNE: []
    };

    const categoryGroups = {
      WSPÓLNE: _.cloneDeep(eventGroups),
      UM: _.cloneDeep(eventGroups),
      SK: _.cloneDeep(eventGroups),
      ISI: _.cloneDeep(eventGroups),
      ISINT: _.cloneDeep(eventGroups),
      PRZ: _.cloneDeep(eventGroups),
      TGM: _.cloneDeep(eventGroups),
      ATI: _.cloneDeep(eventGroups),
      PRZEDAWNIONE: _.cloneDeep(eventGroups)
    };

    if (events.length === 0) {
      categoryGroups["WSPÓLNE"]["INNE"].push(
        ":tropical_drink: Brak nadchodzących wydarzeń w kalendarzu."
      );
    }

    events.forEach((event) => {
      let startUnix, startFormatted;
      const summary = event.summary.toLowerCase();

      if (event.start.dateTime) {
        // When event has specific start time
        startUnix = moment(event.start.dateTime).unix();
        startFormatted = `<t:${startUnix}:f>`;
      } else {
        // When event is all-day
        if (summary.includes("{mid}")) {
          startUnix = moment(event.start.date).unix();
          startFormatted = `<t:${startUnix}:d>`;
        } else {
          startUnix = moment(event.end.date).unix() - 1;
          startFormatted = `<t:${startUnix}:d>`;
        }
      }

      const countDownFormatted = `<t:${startUnix}:R>`;
      const location = event.location || "Brak sali";

      if (!event.summary) {
        event.summary = "Brak nazwy wydarzenia";
      }

      let eventType = "INNE"; // Default event type "INNE"
      let category = "WSPÓLNE"; // Default category "WSPÓLNE"

      if (summary.includes("popraw")) {
        eventType = "POPRAWY";
      } else if (
        summary.includes("egzamin") ||
        summary.includes("kolo") ||
        summary.includes("zal")
      ) {
        eventType = "EGZAMINY";
      } else if (summary.includes("projekt")) {
        eventType = "PROJEKTY";
      }

      if (summary.includes("[um]")) {
        category = "UM";
      } else if (summary.includes("[sk]")) {
        category = "SK";
      } else if (summary.includes("[isi]")) {
        category = "ISI";
      } else if (summary.includes("[isint]")) {
        category = "ISINT";
      } else if (summary.includes("[prz]")) {
        category = "PRZ";
      } else if (summary.includes("[tgm]")) {
        category = "TGM";
      } else if (summary.includes("[ati]")) {
        category = "ATI";
      } else if (summary.includes("[p]")) {
        category = "PRZEDAWNIONE";
      }

      event.summary = event.summary
        .replace(/\[.*\]/, "")
        .replace("{mid}", "")
        .trim();

      categoryGroups[category][eventType].push(
        `:calendar_spiral: ${startFormatted} ` +
          `- ${event.summary} **${location}** (${countDownFormatted})`
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
    const preLength = formattedMessage.length;

    if (formattedMessage.length > 2000) {
      tooLongFlag = true;
      formattedMessage = formattedMessage.replace(/ \(<t:(\d+):R>\)/g, "");
    }

    if (formattedMessage.length > 2000) {
      throw new Error(
        `Wiadomość jest za długa! (${formattedMessage.length} > 2000)` +
          "\nSpróbuj usunąć niektóre wydarzenia z kalendarza " +
          "lub zmniejszyć ilość znaków w nazwach wydarzeń."
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
        "Zaktualizowano kalendarz kolokwiów. Przejdź, " +
        `by zobaczyć zmiany: ${mainMessage?.url || newMessage?.url}` +
        `\n\n:calendar_spiral: Ilość wydarzeń: ${events.length}` +
        "\n:writing_hand: Długość wiadomości: " +
        `${formattedMessage.length}/2000` +
        (tooLongFlag ? ` *(po kompresji z ${preLength} znaków)*` : "")
    });
  }
};
