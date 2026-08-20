const fs = require('fs');
const file = 'Access UI/src/modules/aldi_rendelesek.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "alert('A rendelés sikeresen törölve lett.');\n            renderModule();",
  "alert('A rendelés sikeresen törölve lett.');\n            fetchNapiRendelesek();"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced renderModule with fetchNapiRendelesek');
