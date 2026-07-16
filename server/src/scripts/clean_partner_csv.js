const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const inputPath = path.join(__dirname, '../../..', 'Partner.csv');
const outputPath = path.join(__dirname, '../../..', 'Partner_cleaned.csv');

const rawBuffer = fs.readFileSync(inputPath);
const text = iconv.decode(rawBuffer, 'windows-1250');

const lines = text.split(/\r?\n/);
const header = lines[0];
const dataLines = lines.slice(1).filter(l => l.trim() !== '');

console.log(`Összes sor (fejléc nélkül): ${dataLines.length}`);

// 1. Duplikált sorok eltávolítása (teljes sorrra)
const seenRows = new Set();
let removedDups = 0;
const afterDedupe = dataLines.filter(line => {
  if (seenRows.has(line)) {
    removedDups++;
    return false;
  }
  seenRows.add(line);
  return true;
});
console.log(`Duplikált sorok eltávolítva: ${removedDups}`);

// 2. "NE HASZNÁLD" tartalmú sorok törlése
let removedNH = 0;
const afterNH = afterDedupe.filter(line => {
  if (line.toUpperCase().includes('NE HASZNÁLD') || line.toUpperCase().includes('NE HASZN')) {
    removedNH++;
    return false;
  }
  return true;
});
console.log(`"NE HASZNÁLD" sorok eltávolítva: ${removedNH}`);

// 3. Sorok eltávolítása ahol C (Adószám, index 2) ÉS E (Cím, index 4) is üres
// Mezők pontosvesszővel tagolva, de idézőjeles mezőket is kezelni kell
function parseCSVLine(line) {
  const result = [];
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

let removedEmpty = 0;
const afterEmpty = afterNH.filter(line => {
  const cols = parseCSVLine(line);
  const taxId = (cols[2] || '').trim();  // C oszlop = index 2
  const address = (cols[4] || '').trim(); // E oszlop = index 4
  if (taxId === '' && address === '') {
    removedEmpty++;
    return false;
  }
  return true;
});
console.log(`C és E oszlop mindkettő üres sorok eltávolítva: ${removedEmpty}`);
console.log(`\nMaradó sorok száma: ${afterEmpty.length}`);

// Mentés UTF-8-ban (fejléccel)
const outputLines = [header, ...afterEmpty];
const outputText = outputLines.join('\r\n');
fs.writeFileSync(outputPath, iconv.encode(outputText, 'utf-8'));
// BOM hozzáadása az Excel kompatibilitáshoz
const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
const fileContent = fs.readFileSync(outputPath);
fs.writeFileSync(outputPath, Buffer.concat([bom, fileContent]));

console.log(`\nElkészült: ${outputPath}`);
