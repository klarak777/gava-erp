const fs = require('fs');
const file = 'Access UI/src/modules/aldi_rendelesek.js';
let content = fs.readFileSync(file, 'binary');
content = content.replace(
  '<button class="aldi-view-order-btn"',
  '<button class="aldi-delete-order-btn" data-id="${o.id}" style="background:none; border:none; cursor:pointer; font-size:16px; margin-right:8px;" title="T\xF6rl\xE9s">\uD83D\uDDD1\uFE0F</button>\n                  <button class="aldi-view-order-btn"'
);
fs.writeFileSync(file, content, 'binary');
console.log('Button added.');
