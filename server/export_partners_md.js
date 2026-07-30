const fs = require('fs');

const csvPath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access\\25-26 Fuvarok összesítö V2 260617.csv';

let content = fs.readFileSync(csvPath, 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

const lines = content.split(/\r?\n/);
const header = lines[0].split(';');

const refIdx = header.indexOf('Reference');
const custIdx = header.indexOf('Customer');
const transIdx = header.indexOf('Transport company');

const isValidPartner = (val) => {
  if (!val) return false;
  const v = val.trim();
  if (v === '' || v === '-' || v === '0' || v === '0,00' || v === '#N/A') return false;
  return true;
};

const references = new Set();
const customers = new Set();
const transporters = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split(';');
  
  if (refIdx !== -1 && isValidPartner(cols[refIdx])) {
    references.add(cols[refIdx].trim());
  }
  
  if (custIdx !== -1 && isValidPartner(cols[custIdx])) {
    customers.add(cols[custIdx].trim());
  }
  
  if (transIdx !== -1 && isValidPartner(cols[transIdx])) {
    transporters.add(cols[transIdx].trim());
  }
}

const sortedRef = Array.from(references).sort((a, b) => a.localeCompare(b, 'hu'));
const sortedCust = Array.from(customers).sort((a, b) => a.localeCompare(b, 'hu'));
const sortedTrans = Array.from(transporters).sort((a, b) => a.localeCompare(b, 'hu'));

let md = `# Partner Lista - 25-26 Fuvarok összesítő V2 (260617)\n\n`;
md += `A(z) \`25-26 Fuvarok összesítö V2 260617.csv\` alapján kinyert egyedi partner nevek kategóriák szerint.\n\n`;

md += `## 1. Reference (Szállítók) (${sortedRef.length} partner)\n\n`;
md += `| # | Reference Név |\n|---|---| \n`;
sortedRef.forEach((r, idx) => {
  md += `| ${idx + 1} | ${r} |\n`;
});

md += `\n## 2. Customer (Vevők) (${sortedCust.length} partner)\n\n`;
md += `| # | Customer Név |\n|---|---|\n`;
sortedCust.forEach((c, idx) => {
  md += `| ${idx + 1} | ${c} |\n`;
});

md += `\n## 3. Transport Company (Fuvarozó cégek) (${sortedTrans.length} partner)\n\n`;
md += `| # | Fuvarozó Cég Név |\n|---|---|\n`;
sortedTrans.forEach((t, idx) => {
  md += `| ${idx + 1} | ${t} |\n`;
});

const outputPath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access\\Partner_Lista_25-26_Fuvarok_V2.md';
fs.writeFileSync(outputPath, md, 'utf8');
console.log('Cleaned MD saved to:', outputPath);
