const { google } = require("googleapis");
const { getGoogleCredentials } = require("./config");
const { retryOnError5xx } = require("./retry");
const moment = require("moment-timezone");
moment.tz.setDefault("Europe/Warsaw");

/**
 * Fetches upcoming events from a specified Google Calendar.
 *
 * @param {string} calendarId
 * - The ID of the Google Calendar to retrieve events from.
 * @returns {Promise<Object[]>}
 * A promise that resolves to an array of calendar events.
 */
async function fetchCalendarEvents(calendarId) {
  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleCredentials(),
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"]
  });

  const calendar = google.calendar({ version: "v3", auth });

  const params = {
    calendarId,
    timeMin: moment().toISOString(),
    singleEvents: true,
    orderBy: "startTime"
  };

  const response = await retryOnError5xx(calendar.events.list.bind(calendar), [
    params
  ]);

  return response.data.items || [];
}

/**
 * Returns an authenticated instance of the Google Sheets API.
 * @returns {sheets_v4.Sheets} An authenticated Google Sheets API instance.
 */
function getSheetsInstance() {
  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * Appends or updates a row in a Google Sheet with retry logic.
 * @param {string} spreadsheetId - The ID of the Google Spreadsheet.
 * @param {string} range - The range to append/update.
 * @param {Array} values - The values to insert.
 * @param {number} [row=null]
 * - The row to update (if provided, updates instead of appending).
 * @returns {Promise<void>}
 * A promise that resolves when the operation is complete.
 */
async function appendRow(spreadsheetId, range, values, row = null) {
  const sheets = getSheetsInstance();

  const updateOrAppend = async () => {
    if (row) {
      return sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${range}${row}`,
        valueInputOption: "RAW",
        resource: { values: [values] }
      });
    }
    return sheets.spreadsheets.values.append({
      spreadsheetId,
      range: range,
      valueInputOption: "RAW",
      resource: { values: [values] }
    });
  };

  await retryOnError5xx(updateOrAppend, []);
}

/**
 * Fetches data from a Google Sheet.
 * @param {string} spreadsheetId - The ID of the Google Spreadsheet.
 * @param {string|string[]} rangeOrRanges - The range(s) to fetch data from.
 * @returns {Promise<Array>} A promise that resolves to the retrieved values.
 */
async function fetchSheetData(spreadsheetId, rangeOrRanges) {
  const sheets = getSheetsInstance();

  const fetchData = async () => {
    if (Array.isArray(rangeOrRanges)) {
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: rangeOrRanges
      });
      return response.data.valueRanges.map((range) => range.values || []);
    }
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rangeOrRanges
    });
    return response.data.values || [];
  };

  return await retryOnError5xx(fetchData, []);
}

module.exports = { fetchCalendarEvents, appendRow, fetchSheetData };
