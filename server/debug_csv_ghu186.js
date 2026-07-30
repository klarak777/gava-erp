const fs = require('fs');
const csvPath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access\\25-26 Fuvarok összesítö V2 260617.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split(/\r?\n/);

// Fejléc kiírás
const header = lines[0].split(';');
console.log('=== CSV FEJLÉC ===');
header.forEach((h, i) => console.log(`  [${i}] "${h}"`));

// GHU 186 keresése
console.log('\n=== GHU 186 SOROK ===\n');
let count = 0;
for (let i = 1; i < lines.length; i++) {
  if (lines[i].includes('GHU 186')) {
    const cols = lines[i].split(';');
    // Az összes oszlopot kiírjuk értékekkel
    if (count === 0) {
      console.log('--- Első GHU 186 sor teljes tartalma ---');
      header.forEach((h, j) => {
        if (cols[j] && cols[j].trim()) console.log(`  [${j}] ${h} = "${cols[j].trim()}"`);
      });
      console.log('---');
    }
    const ref = cols[4] || '';  // Reference idx=4
    const cust = cols[5] || ''; // Customer idx=5
    const loadDate = cols[16] || ''; // Loading date
    console.log(`  Sor ${i}: GHU 186 | Ref="${ref.trim()}" | Customer="${cust.trim()}" | LoadDate="${loadDate.trim()}" | cols[0..3]="${cols[0]?.trim()}|${cols[1]?.trim()}|${cols[2]?.trim()}|${cols[3]?.trim()}"`);
    count++;
  }
}
console.log(`\nÖsszesen ${count} GHU 186 sor a CSV-ben`);
