const fs = require('fs');
const path = require('path');

const csvPath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access\\25-26 Fuvarok összesítö V2 260617.csv';

// Read file with latin1 or utf8
const content = fs.readFileSync(csvPath, 'latin1');
const lines = content.split(/\r?\n/);

console.log('Total lines:', lines.length);
console.log('Header line 1:', lines[0]);
console.log('Header line 2:', lines[1]);
