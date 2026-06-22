const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const templatePath = '\\\\192.168.1.5\\raktar\\MI Teszt\\Minta dokuk\\Fuvarmegbízás minta.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const docx = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  delimiters: { start: '{{', end: '}}' },
  parser: function(tag) {
    return {
      get: function(scope, context) {
        return scope[tag.trim()];
      }
    };
  }
});

const data = {
  "Transport company": "TEST TRANSPORT",
  "Order number": "TEST ORDER",
  "Temp": "TEST TEMP"
};

docx.render(data);

const outXml = docx.getZip().file('word/document.xml').asText();
console.log("Is TEST TRANSPORT in output?:", outXml.includes("TEST TRANSPORT"));
console.log("Is TEST ORDER in output?:", outXml.includes("TEST ORDER"));
console.log("Is TEST TEMP in output?:", outXml.includes("TEST TEMP"));
