const fs = require("fs");
const { inspect } = require("util");
const { EmbedBuilder } = require("discord.js");
const { sheets_v4 } = require("googleapis");

module.exports = {
  logInfo,
  printError,
  msToTime,
  timedDelete,
  appendRow
};

/**
 * Logs information to the console and appends it to a log file.
 * @param {string} info - Information to log.
 * @param {Error} error - Error to log (optional)
 * @returns {void}
 */

function logInfo(info, error) {
  var currentdate = new Date()
    .toLocaleString("pl-PL", {
      timeZone: "Europe/Warsaw",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
    .replace(",", "");

  var logMessage = `[${currentdate}] - `;

  if (error) {
    logMessage += `[ERROR] ${info}: ${inspect(error)}`;
    console.error(logMessage);
  } else {
    logMessage += `[INFO] ${info}`;
    console.log(logMessage);
  }

  fs.appendFile(
    process.argv.includes("dev") ? "logs/dev.log" : "logs/log.log",
    `${logMessage}\n`,
    (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      }
    }
  );
}

/**
 * Sends embed with error message to the interaction channel.
 * If error is passed, interaction must be a TextChannel.
 * @param {CommandInteraction | TextChannel} interaction - Interaction to reply to.
 * @param {string} description - Error message to send.
 * @param {Error} error - Error to log (optional)
 * @returns {void}
 */

async function printError(interaction, description, error = null) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(":x: Błąd")
      .setDescription(description)
      .setColor("Red");

    if (error) {
      const footer = `${error.name || "Error"}: ${error.message || error.response?.statusText} ${error.status ? `(${error.status})` : ""}`;
      embed.setFooter({ text: footer });
    } else {
      logInfo("printError", Error(description));
    }

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed] });
    } else if (!error) {
      await interaction.reply({ embeds: [embed] });
    } else {
      const textChannel = interaction;
      await textChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    logInfo("printError", err);
  }
}

/**
 * Converts a number of milliseconds to a human-readable time format.
 * @param {number} ms - Number of milliseconds to convert.
 * @returns {string} Human-readable time format.
 */

function msToTime(ms) {
  let seconds = (ms / 1000).toFixed(1);
  let minutes = (ms / (1000 * 60)).toFixed(1);
  let hours = (ms / (1000 * 60 * 60)).toFixed(1);
  let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
  if (seconds < 60) return seconds + " sekund";
  else if (minutes < 60) return minutes + " minut";
  else if (hours < 24) return hours + " godzin";
  else return days + " dni";
}

/**
 * Deletes a message after a specified timeout.
 * @param {Message} message - Message to delete.
 * @param {number} timeout - Timeout in milliseconds. (default: 3000)
 * @returns {void}
 */

function timedDelete(message, timeout = 3000) {
  setTimeout(async () => {
    try {
      await message.delete();
    } catch (err) {
      logInfo("timedDelete", err);
    }
  }, timeout);
}

/**
 * Appends or updates row in google spreadsheet.
 * @param {sheets_v4.Sheets} sheets - Google Sheets API instance.
 * @param {string} sheetId - ID of the spreadsheet.
 * @param {string} range - Range to append.
 * @param {Array} values - Values to append.
 * @param {number} row - Row to update (optional). When provided, updates the row instead of appending.
 */

async function appendRow(sheets, sheetId, range, values, row = null) {
  let retryCount = 0;
  const maxRetries = 6;
  const baseDelay = 2000;

  async function appendWithRetry() {
    try {
      if (row) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${range}${row}`,
          valueInputOption: "RAW",
          resource: { values: [values] }
        });
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: range,
          valueInputOption: "RAW",
          resource: { values: [values] }
        });
      }
    } catch (error) {
      if (error.status === 502 && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);
        retryCount++;
        logInfo(
          `appendRow: Error while appending ${values}. Retrying in ${delay / 1000} seconds. ` +
            `${error.name}: ${error.response?.statusText} (${error.status})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        await appendWithRetry();
      } else {
        throw error;
      }
    }
  }

  await appendWithRetry();
}
