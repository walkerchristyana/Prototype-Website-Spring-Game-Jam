# Immersion Model Website 

This folder contains a static JavaScript website prototype for the immersion study.

- `index.html` - the website layout
- `styles.css` - the visual style
- `data.js` - all imported workbook data
- `app.js` - the dashboard logic, response filters, local storage, and exports

## Data included

The prototype imports the current Excel workbook data:

- 13 players
- 10 games
- 1,040 timeline responses
- 130 exit quiz responses
- 10 exit quiz questions

This includes all workbook responses, not only the Armani and Christopher Spider-Man examples.

## How to open it

1. Unzip the folder.
2. Open `index.html` in a browser.
3. Use the tabs to explore the dashboard, score matrix, responses, exit quiz, prototype concept, and export tools.

## How data is stored

The imported workbook rows live in `data.js` under `IMMERSION_DATA.responses`.
New form entries are saved only in your browser using `localStorage`.

## How to export to Excel

Go to the export tab and click:

- `Download Excel-readable .xls`
- `Download CSV`
- `Download JSON`

The `.xls` file is an HTML-table Excel export. Excel and Google Sheets can open/import it.

## How to deploy

1. Create a GitHub repository.
2. Upload the files from this folder.
3. Go to Settings -> Pages.
4. Choose the main branch and root folder.
5. GitHub will give you a public website link.

## Notes

This is a front-end prototype, not a secure production app. It is designed to show how the study could become a web dashboard and response collection tool.
