const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

/**
 * Helper to construct a Word XML table cell content
 */
function createTableCellContent(doc, text) {
  const wp = doc.createElement('w:p');
  const wr = doc.createElement('w:r');
  const wt = doc.createElement('w:t');
  wt.appendChild(doc.createTextNode(text || ''));
  wr.appendChild(wt);
  wp.appendChild(wr);
  return wp;
}

/**
 * Generate Fuvarmegbizas Docx
 * @param {string} templatePath - Path to the template
 * @param {string} outputPath - Path to save the output
 * @param {object} data - Data to fill placeholders
 * @param {Array} linesData - Array of objects for the table rows
 */
function generateOrderDocx(templatePath, outputPath, data, linesData) {
  // 1. Read template
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  // 2. Manipulate table XML manually
  let xmlString = zip.file('word/document.xml').asText();
  const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
  
  const tables = doc.getElementsByTagName('w:tbl');
  if (tables.length > 0) {
    const table = tables[0];
    const rows = table.getElementsByTagName('w:tr');
    
    // Assuming row 0 is header, row 1 is the template data row
    if (rows.length > 1) {
      const templateRow = rows[1];
      
      // We will clone the template row to keep any existing styling (like borders)
      for (const line of linesData) {
        const newRow = templateRow.cloneNode(true);
        const cells = newRow.getElementsByTagName('w:tc');
        
        // Table columns expected: 0: Euro Pallets, 1: Normal Pallets, 2: Products, 3: Reference, 4: Customer Order
        const values = [
          line.euroPallets,
          line.normalPallets,
          line.products,
          line.reference,
          line.customerOrder
        ];

        for (let i = 0; i < Math.min(cells.length, values.length); i++) {
          const cell = cells[i];
          // Clear existing paragraphs in the cell
          while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
          }
          // Add our new text
          // In w:tc we must have at least one w:p
          const wp = createTableCellContent(doc, values[i]);
          cell.appendChild(wp);
        }
        
        table.appendChild(newRow);
      }
      
      // Remove the original empty template row
      table.removeChild(templateRow);
    }
  }

  // Update the XML in zip
  const serializer = new XMLSerializer();
  const modifiedXml = serializer.serializeToString(doc);
  zip.file('word/document.xml', modifiedXml);

  // 3. Process placeholders with docxtemplater
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

  docx.render(data);

  // 4. Save file
  const buf = docx.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, buf);
  return outputPath;
}

module.exports = {
  generateOrderDocx
};
