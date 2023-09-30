const fs = require("fs");
const { inspect } = require("util");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  logInfo,
  msToTime,
  timedDelete,
  printError,
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
    })
    .replace(",", "");

  var logMessage = `[${currentdate}] - `;

  if (error) {
    logMessage += `[ERROR] ${info}: ${inspect(error)}`;
  } else {
    logMessage += `[INFO] ${info}`;
  }

  console.log(logMessage);

  fs.appendFile("logs/log.log", `${logMessage}\n`, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });
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
 * Sends embed with error message to the interaction channel,
 * then deletes it after 15s. If error is passed interaction must be a TextChannel.
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
      embed.setFooter({ text: `${error}` });
    }

    let reply;

    if (interaction.replied || interaction.deferred) {
      reply = await interaction.followUp({ embeds: [embed] });
    } else if (!error) {
      reply = await interaction.reply({ embeds: [embed] });
    } else {
      const textChannel = interaction;
      reply = await textChannel.send({ embeds: [embed] });
    }

    if (!error) timedDelete(reply, 15000);
  } catch (err) {
    logInfo("printError", err);
  }
}
