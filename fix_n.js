const fs = require('fs');

let adminContent = fs.readFileSync('Access UI/src/modules/admin.js', 'utf8');

// fix the stupid \n error that I just made
adminContent = adminContent.replace(/\\n/g, '\n');

fs.writeFileSync('Access UI/src/modules/admin.js', adminContent, 'utf8');
