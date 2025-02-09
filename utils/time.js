const { logInfo } = require("./logger");

/**
 * Converts a number of milliseconds to a human-readable time format.
 * @param {number} ms - Number of milliseconds to convert.
 * @returns {string} Human-readable time format.
 */
function msToTime(ms) {
  const seconds = (ms / 1000).toFixed(1);
  const minutes = (ms / (1000 * 60)).toFixed(1);
  const hours = (ms / (1000 * 60 * 60)).toFixed(1);
  const days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);

  if (seconds < 60) return seconds + " sekund";
  else if (minutes < 60) return minutes + " minut";
  else if (hours < 24) return hours + " godzin";
  return days + " dni";
}

/**
 * Deletes a message after a specified delay.
 *
 * @param {Message} message - The Discord message to be deleted.
 * @param {number} [timeout=3000] - Time in milliseconds
 * before the message is deleted (default: 3000ms).
 * @returns {void}
 */
function timedDelete(message, timeout = 3000) {
  setTimeout(async () => {
    try {
      await message.delete();
    } catch (err) {
      logInfo("timedDelete", err.status === 404 ? err.message : err);
    }
  }, timeout);
}

module.exports = { msToTime, timedDelete };
