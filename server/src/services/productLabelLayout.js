const PizZip = require('pizzip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function children(node, name) {
  return Array.from(node.childNodes).filter(child => child.namespaceURI === WORD_NS && child.localName === name);
}

function property(doc, parent, name, attributes = {}) {
  let element = children(parent, name)[0];
  if (!element) {
    element = doc.createElementNS(WORD_NS, `w:${name}`);
    parent.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttributeNS(WORD_NS, `w:${key}`, String(value)));
  return element;
}

function borders(doc, parent, name, visibleSides) {
  const element = property(doc, parent, name);
  while (element.firstChild) element.removeChild(element.firstChild);
  for (const side of ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']) {
    property(doc, element, side, visibleSides.includes(side)
      ? { val: 'single', sz: 8, space: 0, color: '000000' }
      // Explicit white borders keep internal edges invisible on a white label
      // even if the document's table style supplies default borders.
      : { val: 'single', sz: 2, space: 0, color: 'FFFFFF' });
  }
}

function orderProperties(parent, names) {
  // Word property elements must follow their OOXML schema order.
  names.forEach(name => children(parent, name).forEach(element => parent.appendChild(element)));
}

// html-to-docx emits equal columns for percentage widths and even writes sz="none"
// for CSS border:none. Set the final Word layout explicitly so Word cannot restore
// the internal lines or grow the logo column through automatic table sizing.
function formatProductLabelTables(buffer, hasBioLabel) {
  const zip = new PizZip(buffer);
  const doc = new DOMParser().parseFromString(zip.file('word/document.xml').asText(), 'application/xml');
  const body = doc.getElementsByTagNameNS(WORD_NS, 'body')[0];
  for (const table of children(body, 'tbl')) {
    const rows = children(table, 'tr');
    if (rows.length !== 1) continue;
    const cells = children(rows[0], 'tc');
    if (cells.length !== (hasBioLabel ? 3 : 1)) continue;

    const tableProperties = property(doc, table, 'tblPr');
    const tableWidth = property(doc, tableProperties, 'tblW');
    const width = Number(tableWidth.getAttributeNS(WORD_NS, 'w'));
    if (!(width > 0)) throw new Error('Invalid product label table width');
    tableWidth.setAttributeNS(WORD_NS, 'w:type', 'dxa');
    property(doc, tableProperties, 'tblLayout', { type: 'fixed' });
    property(doc, tableProperties, 'jc', { val: 'center' });
    borders(doc, tableProperties, 'tblBorders', ['top', 'left', 'bottom', 'right']);

    // The requested 25:55:22 weights total 102; preserve their proportions while
    // keeping the columns within the document's available table width.
    const leftWidth = Math.round(width * 25 / 102);
    const rightWidth = Math.round(width * 22 / 102);
    const widths = hasBioLabel ? [leftWidth, width - leftWidth - rightWidth, rightWidth] : [width];
    const grid = property(doc, table, 'tblGrid');
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    widths.forEach(cellWidth => {
      const column = doc.createElementNS(WORD_NS, 'w:gridCol');
      column.setAttributeNS(WORD_NS, 'w:w', String(cellWidth));
      grid.appendChild(column);
    });

    cells.forEach((cell, index) => {
      const cellProperties = property(doc, cell, 'tcPr');
      property(doc, cellProperties, 'tcW', { type: 'dxa', w: widths[index] });
      const visibleSides = ['top', 'bottom'];
      if (index === 0) visibleSides.push('left');
      if (index === cells.length - 1) visibleSides.push('right');
      borders(doc, cellProperties, 'tcBorders', visibleSides);
      property(doc, cellProperties, 'vAlign', { val: hasBioLabel && index === 2 ? 'center' : 'top' });

      const margins = property(doc, cellProperties, 'tcMar');
      const horizontalMargin = hasBioLabel && index !== 1 ? 60 : 240;
      for (const side of ['left', 'right', 'top', 'bottom']) {
        property(doc, margins, side, { type: 'dxa', w: ['left', 'right'].includes(side) ? horizontalMargin : 120 });
      }
      orderProperties(margins, ['top', 'start', 'left', 'bottom', 'end', 'right']);
      orderProperties(cellProperties, ['cnfStyle', 'tcW', 'gridSpan', 'hMerge', 'vMerge', 'tcBorders', 'shd', 'noWrap', 'tcMar', 'textDirection', 'tcFitText', 'vAlign', 'hideMark', 'headers', 'cellIns', 'cellDel', 'cellMerge', 'tcPrChange']);
      for (const paragraph of Array.from(cell.getElementsByTagNameNS(WORD_NS, 'p'))) {
        let paragraphProperties = children(paragraph, 'pPr')[0];
        if (!paragraphProperties) {
          paragraphProperties = doc.createElementNS(WORD_NS, 'w:pPr');
          paragraph.insertBefore(paragraphProperties, paragraph.firstChild);
        }
        property(doc, paragraphProperties, 'jc', { val: 'center' });
      }
    });
    orderProperties(tableProperties, ['tblStyle', 'tblpPr', 'tblOverlap', 'bidiVisual', 'tblStyleRowBandSize', 'tblStyleColBandSize', 'tblW', 'jc', 'tblCellSpacing', 'tblInd', 'tblBorders', 'shd', 'tblLayout', 'tblCellMar', 'tblLook', 'tblCaption', 'tblDescription', 'tblPrChange']);
  }
  zip.file('word/document.xml', new XMLSerializer().serializeToString(doc));
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { formatProductLabelTables };
