const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder,
  MessageFlags
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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildConfig = utils.getGuildConfig(interaction.guildId);
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

    const eventTypeLabels = {
      ENGLISH: {
        EGZAMINY: "EXAMS",
        POPRAWY: "RETAKES",
        PROJEKTY: "PROJECTS",
        INNE: "OTHER"
      }
    };

    const categoryGroups = {
      WSPÓLNE: _.cloneDeep(eventGroups),
      SK: _.cloneDeep(eventGroups),
      ATI: _.cloneDeep(eventGroups),
      PWWIO: _.cloneDeep(eventGroups),
      ISI: _.cloneDeep(eventGroups),
      ISINF: _.cloneDeep(eventGroups),
      UM: _.cloneDeep(eventGroups),
      TGM: _.cloneDeep(eventGroups),
      ENGLISH: _.cloneDeep(eventGroups),
      PRZEDAWNIONE: _.cloneDeep(eventGroups)
    };

    if (events.length === 0) {
      categoryGroups["WSPÓLNE"]["INNE"].push(
        ":tropical_drink: Brak nadchodzących wydarzeń"
      );
    }

    events.forEach((event) => {
      let startUnix, startFormatted;
      let countDownFormatted = "";
      const summary = event.summary?.toLowerCase() || "brak nazwy wydarzenia";

      if (event.start.dateTime) {
        // When event has specific start time
        startUnix = moment(event.start.dateTime).unix();
        startFormatted = `<t:${startUnix}:f>`;
      } else {
        // When event is all-day
        const startDate = moment(event.start.date);
        const endDate = moment(event.end.date).subtract(1, "days");
        const startUnixRange = startDate.hour(0).minute(0).second(0).unix();
        const endUnixRange = endDate.hour(23).minute(59).second(59).unix();
        const nowUnix = moment().unix();
        if (endDate.isAfter(startDate, "day")) {
          // Event lasts more than one day
          startFormatted = `<t:${startUnixRange}:d> - <t:${endUnixRange}:d>`;
          startUnix = nowUnix > startUnixRange ? endUnixRange : startUnixRange;
          countDownFormatted = nowUnix > startUnixRange ? "koniec " : "start ";
        } else if (summary.includes("{mid}")) {
          startUnix = startUnixRange;
          startFormatted = `<t:${startUnix}:d>`;
        } else {
          startUnix = endUnixRange;
          startFormatted = `<t:${startUnix}:d>`;
        }
      }

      countDownFormatted += `<t:${startUnix}:R>`;
      const location = event.location ? `**${event.location}** ` : "";

      let eventType = "INNE"; // Default event type "INNE"
      let category = "WSPÓLNE"; // Default category "WSPÓLNE"

      if (summary.includes("popraw") || summary.includes("retake")) {
        eventType = "POPRAWY";
      } else if (
        summary.includes("egz") ||
        summary.includes("kolo") ||
        summary.includes("zal") ||
        summary.includes("exam")
      ) {
        eventType = "EGZAMINY";
      } else if (summary.includes("proj") || summary.includes("deadline")) {
        eventType = "PROJEKTY";
      }

      if (summary.includes("[sk]")) category = "SK";
      else if (summary.includes("[ati]")) category = "ATI";
      else if (summary.includes("[pwwio]")) category = "PWWIO";
      else if (summary.includes("[isi]")) category = "ISI";
      else if (summary.includes("[isinf]")) category = "ISINF";
      else if (summary.includes("[um]")) category = "UM";
      else if (summary.includes("[tgm]")) category = "TGM";
      else if (summary.includes("[english]")) category = "ENGLISH";
      else if (summary.includes("[p]")) category = "PRZEDAWNIONE";

      const cleanSummary = event.summary
        .replace(/\[.*\]/, "")
        .replace("{mid}", "")
        .trim();

      categoryGroups[category][eventType].push(
        `:calendar_spiral: ${startFormatted} — ${cleanSummary} ` +
          `${location}(${countDownFormatted})`
      );
    });

    let formattedMessage = `# :date: TERMINARZ (akt. ${currentFormatted})\n`;

    Object.entries(categoryGroups).forEach(([category, eventGroups]) => {
      const categoryContent = [];

      Object.entries(eventGroups).forEach(([eventType, events]) => {
        if (events.length > 0) {
          const eventTypeLabel =
            eventTypeLabels[category]?.[eventType] || eventType;

          categoryContent.push(
            `### **${eventTypeLabel}**\n${events.join("\n")}`
          );
        }
      });

      if (categoryContent.length > 0) {
        formattedMessage +=
          `## **${category}**\n` + `${categoryContent.join("\n")}\n`;
      }
    });

    const preTruncLength = formattedMessage.length;
    let wasTruncated = false;

    if (formattedMessage.length > 4096) {
      wasTruncated = true;
      formattedMessage = formattedMessage.replace(/ \(<t:(\d+):R>\)/g, "");
    }

    if (formattedMessage.length > 4096) {
      throw new Error(
        `Wiadomość jest za długa! (${formattedMessage.length} > 4096)` +
          "\nSpróbuj usunąć niektóre wydarzenia z kalendarza " +
          "lub zmniejszyć ilość znaków w nazwach wydarzeń."
      );
    }

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setDescription(formattedMessage);

    let messageToSend;
    if (mainMessage) {
      await mainMessage.edit({ content: null, embeds: [embed] });
      messageToSend = mainMessage;
    } else {
      messageToSend = await channel.send({ embeds: [embed] });
    }

    await interaction.editReply({
      content:
        ":white_check_mark: Zaktualizowano terminarz.\n" +
        `Przejdź, by zobaczyć zmiany: ${messageToSend.url}` +
        `\n\n:calendar_spiral: Ilość wydarzeń: ${events.length}` +
        `\n:writing_hand: Długość wiadomości: ${formattedMessage.length}/4096` +
        (wasTruncated ? ` *(po kompresji z ${preTruncLength} znaków)*` : "")
    });
  }
};
