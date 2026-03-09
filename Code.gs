
/**
 * Madrassah Al-Huda - Backend Controller
 * Dieses Script dient als Webserver und Datenbank-Schnittstelle.
 */

function doGet() {
  // Erstellt die HTML-Ausgabe aus der Datei index.html
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Madrassah Al-Huda Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Verarbeitet die Cloud-Synchronisierung (POST-Requests von der App)
 */
function doPost(e) {
  const adminKey = "HUDA-2026-SECRET";
  const query = e.parameter;
  
  if (query.key !== adminKey) {
    return ContentService.createTextOutput("Unauthorized").setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Beispiel: Speichern in einem Tabellenblatt namens "Backup"
    let sheet = ss.getSheetByName("Backup");
    if (!sheet) {
      sheet = ss.insertSheet("Backup");
    }
    
    sheet.getRange("A1").setValue(JSON.stringify(data));
    sheet.getRange("B1").setValue(new Date());
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Hilfsfunktion zum Einbetten von Dateien (für CSS/JS Splitting in GAS)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
