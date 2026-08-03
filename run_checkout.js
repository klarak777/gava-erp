const fs = require('fs');

let c = fs.readFileSync('Access UI/src/modules/admin.js', 'utf8');

// First revert to clean master
// Let's run git checkout programmatically if needed or just replace the corrupted block
