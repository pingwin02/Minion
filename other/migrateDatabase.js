/* eslint-disable */
const { google } = require("googleapis");
const utils = require("../utils");

async function migrateData() {
  const auth = new google.auth.GoogleAuth({
    credentials: utils.getGoogleCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  const { spreadsheetId, spreadsheetDataId } = utils.getCommonConfig();

  const sourceSheet = "Wnioski";
  const targetSheet = "Database";

  try {
    const sourceResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sourceSheet}!A2:K`
    });

    const sourceData = sourceResponse.data.values || [];
    const filteredData = sourceData.filter((row) => row[8] === "Accepted");

    const targetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetDataId,
      range: `${targetSheet}!A2:F`
    });

    const targetData = targetResponse.data.values || [];
    const updates = [];
    const newEntries = [];

    for (const row of filteredData) {
      const [index, name, surname, server, group, discordId] = row;

      const targetRowIndex = targetData.findIndex(
        (tRow) =>
          tRow[0] === index &&
          tRow[1] === name &&
          tRow[2] === surname &&
          tRow[5] === discordId.replace(/\D/g, "")
      );

      if (targetRowIndex !== -1) {
        const updateRange = `${targetSheet}!D${targetRowIndex + 2}:E${targetRowIndex + 2}`;
        updates.push({
          range: updateRange,
          values: [[server, group]]
        });
      } else {
        newEntries.push([index, name, surname, server, group, discordId]);
      }
    }

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetDataId,
        resource: {
          data: updates,
          valueInputOption: "RAW"
        }
      });
      console.log(`Updated ${updates.length} rows successfully.`);
    }

    if (newEntries.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetDataId,
        range: `${targetSheet}!A:F`,
        valueInputOption: "RAW",
        resource: { values: newEntries }
      });
      console.log(`Added ${newEntries.length} new entries.`);
    }

    if (updates.length === 0 && newEntries.length === 0) {
      console.log("No matching rows found for update or insert.");
    }
  } catch (error) {
    console.error("Error migrating data:", error);
  }
}

migrateData();
