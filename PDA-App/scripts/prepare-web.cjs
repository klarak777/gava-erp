const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const source = path.resolve(appRoot, '..', 'PDA UI');
const output = path.join(appRoot, 'www');

// A www kizárólag a webes build eredménye; a teszt- és npm-fájlok nem kerülnek az APK-ba.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

function copyTree(from, to) {
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) copyTree(path.join(from, name), path.join(to, name));
  } else {
    fs.copyFileSync(from, to);
  }
}

for (const name of ['index.html', 'logo.ico', 'css', 'js']) {
  copyTree(path.join(source, name), path.join(output, name));
}
