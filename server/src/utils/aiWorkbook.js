const xlsx = require('xlsx');

function workbookError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function isWorkbook(filename, mimetype) {
  return /\.(xlsx|xls|csv)$/i.test(filename) || [
    'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ].includes(mimetype);
}

// Inspect before saving or vectorizing: a multi-sheet file needs a user choice.
function readWorkbook(buffer, { worksheets, allWorksheets = false } = {}) {
  if (typeof allWorksheets !== 'boolean' || (worksheets !== undefined &&
      (!Array.isArray(worksheets) || !worksheets.length || worksheets.some(name => typeof name !== 'string')))) {
    throw workbookError('Válasszon legalább egy munkalapot.');
  }
  if (allWorksheets && worksheets !== undefined) throw workbookError('Válassza az összes fület vagy a kijelölt füleket.');
  let workbook;
  try { workbook = xlsx.read(buffer, { type: 'buffer' }); }
  catch (_) { throw workbookError('Az Excel-fájl nem olvasható.'); }
  const names = workbook.SheetNames;
  if (!names.length) throw workbookError('A fájl nem tartalmaz munkalapot.');
  if (worksheets?.some(name => !names.includes(name))) throw workbookError('A kiválasztott munkalap nem található a fájlban.');
  if (names.length > 1 && worksheets === undefined && !allWorksheets) {
    return { selectionRequired: true, worksheets: names };
  }
  const selected = worksheets === undefined ? names : names.filter(name => worksheets.includes(name));
  return { selectionRequired: false, worksheets: selected,
    sections: selected.map(name => ({ name, text: xlsx.utils.sheet_to_csv(workbook.Sheets[name]) })) };
}

module.exports = { isWorkbook, readWorkbook };
