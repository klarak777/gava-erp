const fs = require('fs');
const PizZip = require('pizzip');

const templatePath = '\\\\192.168.1.5\\raktar\\MI Teszt\\Minta dokuk\\Fuvarmegbízás minta.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xmlString = zip.file('word/document.xml').asText();

// A docxtemplater eltávolíthatja az XML tageket a változókon belül.
// Az xmlString-ben a változók így is lehetnek: {{<w:r><w:t>Plate number</w:t></w:r>}}
// Egyszerűbb ha kigyűjtjük a nyers szöveget a <w:t> tagekből, majd megkeressük a {{ }} párokat.
const text = xmlString.replace(/<[^>]+>/g, '');
const matches = text.match(/{{.*?}}/g);

console.log("Found placeholders:", matches);
