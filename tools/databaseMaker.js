require("dotenv").config({ path: "../.env" });
const { google } = require("googleapis");

// Parsowanie danych z GOOGLE_AUTH z pliku .env
const authJSON = JSON.parse(process.env.GOOGLE_AUTH);
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SPREADSHEET_DATA_ID = process.env.SPREADSHEET_DATA_ID;

// Konfiguracja Google Sheets API
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    credentials: authJSON,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  return auth.getClient();
}

async function getDataFromSheet(auth, spreadsheetId, range) {
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });
  return response.data.values;
}

async function updateDataInSheet(auth, spreadsheetId, range, values) {
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    resource: { values }
  });
}

async function dataBaseMaker() {
  const auth = await authenticate();

  // Pobieranie danych z arkusza 'Database' w SPREADSHEET_DATA_ID (kolumny A, B, C od wiersza 2)
  const databaseData = await getDataFromSheet(
    auth,
    SPREADSHEET_DATA_ID,
    "Database!A2:C"
  );

  // Pobieranie danych z arkusza 'Semestr 6' w SPREADSHEET_ID (kolumny A, B, C, E)
  const semestrData = await getDataFromSheet(
    auth,
    SPREADSHEET_ID,
    "Semestr 6!A2:E"
  );

  // Mapowanie danych z 'Database' i wyszukiwanie odpowiedniego indeksu w 'Semestr 6'
  const updatedData = [];

  for (const [imie, nazwisko, indeks] of databaseData) {
    const row = semestrData.find(
      ([sIndeks, sImie, sNazwisko]) =>
        sIndeks === indeks && sImie === imie && sNazwisko === nazwisko
    );

    if (row && row[4]) {
      const userId = row[4]; // Kolumna E (indeks 4) zawiera ID użytkownika
      updatedData.push([userId]);
    } else {
      updatedData.push([""]); // Brak ID użytkownika, pozostaw puste
    }
  }

  // Aktualizacja kolumny E w arkuszu 'Database'
  if (updatedData.length > 0) {
    await updateDataInSheet(
      auth,
      SPREADSHEET_DATA_ID,
      `Database!E2:E${updatedData.length + 1}`,
      updatedData
    );
  }

  console.log("Database updated with user IDs!");
}

dataBaseMaker().catch((err) => console.error("Error: ", err));
