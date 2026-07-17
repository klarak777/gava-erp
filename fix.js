const fs = require('fs');
let c = fs.readFileSync('Access UI/src/modules/partnerek.js', 'utf8');

const lines = c.split('\n');
const newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("${prtField('prt-f-family-farm', 'Családi gazdaság azonosítója', p.family_farm_id)}") && lines[i].startsWith("        ${prtField('prt-f-family-farm'")) {
    // Only skip if this is the garbage after the function (line ~648)
    // Wait, let's just delete from exactly line index 647 to 661.
  }
}

// Safer approach: splice
lines.splice(647, 15); // removes 648 to 662 (inclusive) since index 647 is line 648

fs.writeFileSync('Access UI/src/modules/partnerek.js', lines.join('\n'));
console.log('Done!');
