const fs = require('fs');
let c = fs.readFileSync('Access UI/src/modules/admin.js', 'utf8');
c = c.replace(/\\\`/g, '\`');
fs.writeFileSync('Access UI/src/modules/admin.js', c, 'utf8');
