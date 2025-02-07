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

module.exports = { msToTime };
