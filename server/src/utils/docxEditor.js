'use strict';

/**
 * docxEditor.js
 * 
 * DOCX szöveg szerkesztése közvetlenül az XML szinten.
 * A w:t (szöveg) tartalmát frissítjük, az összes w:rPr (betűméret, bold, betűtípus) érintetlen marad.
 * A pizzip és @xmldom/xmldom csomagokat használja, amelyek már telepítve vannak.
 */

const fs = require('fs');
const PizZip = require('pizzip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * A főfüggvény: betölti a DOCX-ot, összehasonlítja a bekezdéseket az
 * editált HTML-lel, és csak a megváltozott szövegrészeket módosítja az XML-ben.
 * Az összes formázási elem (w:rPr) megmarad.
 * 
 * @param {string} docxPath - Az eredeti .docx fájl elérési útja
 * @param {string} editedHtml - A szerkesztett HTML (innerHTML)
 * @returns {Buffer} - A frissített .docx fájl buffer-je
 */
function applyHtmlEditsToDocx(docxPath, editedHtml) {
  // 1. Betöltjük a ZIP-et
  const content = fs.readFileSync(docxPath);
  const zip = new PizZip(content);

  // 2. Kinyerjük a word/document.xml-t
  const docXmlStr = zip.files['word/document.xml'].asText();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXmlStr, 'text/xml');

  // 3. Az HTML-ből kinyerjük a bekezdésszövegeket (blokk-szintenként)
  const newParaTexts = extractHtmlBlockTexts(editedHtml);

  // 4. Megkapjuk az összes Word-bekezdést (w:p) – táblázatcellákon belülieket is
  const wParagraphs = xmlDoc.getElementsByTagName('w:p');

  let htmlIdx = 0;

  for (let i = 0; i < wParagraphs.length; i++) {
    if (htmlIdx >= newParaTexts.length) break;

    const para = wParagraphs[i];

    // Az összes w:t elem ebben a bekezdésben
    const wTElements = para.getElementsByTagName('w:t');
    if (wTElements.length === 0) {
      // Üres bekezdés – ha az HTML-ben is üres sor van, lépjünk
      if (newParaTexts[htmlIdx] === '') htmlIdx++;
      continue;
    }

    // Eredeti szöveg összefűzve
    let originalText = '';
    for (let j = 0; j < wTElements.length; j++) {
      originalText += (wTElements[j].textContent || '');
    }

    const newText = newParaTexts[htmlIdx];
    htmlIdx++;

    if (newText === undefined || newText === null) break;
    if (originalText === newText) continue; // nincs változás

    // Frissítjük a futásokat (run-okat), formázás megőrzésével
    updateParagraphRuns(wTElements, originalText, newText);
  }

  // 5. Visszaírjuk a módosított XML-t
  const serializer = new XMLSerializer();
  const newXmlStr = serializer.serializeToString(xmlDoc);
  zip.file('word/document.xml', newXmlStr);

  // 6. Legenerálunk egy DOCX buffert
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/**
 * Frissíti a bekezdés w:t elemeit úgy, hogy csak a megváltozott szövegrész változik.
 * A formázás (w:rPr) érintetlen marad – a futások struktúrája megmarad.
 *
 * Stratégia:
 * - Megkeressük a közös prefixet és suffixet (ami nem változott)
 * - Csak a változott tartományba eső futásokat frissítjük
 * - Az első érintett futásba kerül az összes új szöveg, a többi érintett futás törlődik
 */
function updateParagraphRuns(wTElements, originalText, newText) {
  if (!wTElements || wTElements.length === 0) return;
  if (originalText === newText) return;

  // Közös prefix hossza
  let prefixLen = 0;
  const minLen = Math.min(originalText.length, newText.length);
  while (prefixLen < minLen && originalText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }

  // Közös suffix hossza (nem fedi át a prefixet)
  let suffixLen = 0;
  const maxSuffix = Math.min(originalText.length - prefixLen, newText.length - prefixLen);
  while (suffixLen < maxSuffix &&
    originalText[originalText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]) {
    suffixLen++;
  }

  const changedOrigStart = prefixLen;
  const changedOrigEnd = originalText.length - suffixLen;
  const changedNewText = suffixLen > 0
    ? newText.slice(prefixLen, newText.length - suffixLen)
    : newText.slice(prefixLen);

  // Futásokat karakterpozícióhoz rendeljük
  let charPos = 0;
  let firstChangedRun = -1;

  for (let i = 0; i < wTElements.length; i++) {
    const runText = wTElements[i].textContent || '';
    const runStart = charPos;
    const runEnd = charPos + runText.length;

    const overlaps = runEnd > changedOrigStart && runStart < changedOrigEnd;

    if (overlaps) {
      if (firstChangedRun === -1) firstChangedRun = i;

      const keepBefore = runStart < changedOrigStart
        ? originalText.slice(runStart, changedOrigStart) : '';
      const keepAfter = runEnd > changedOrigEnd
        ? originalText.slice(changedOrigEnd, runEnd) : '';

      let newRunText;
      if (i === firstChangedRun) {
        newRunText = keepBefore + changedNewText + keepAfter;
      } else {
        newRunText = keepAfter; // csak a változáson kívüli rész marad
      }

      wTElements[i].textContent = newRunText;

      // xml:space="preserve" szóköz megőrzéséhez
      if (newRunText !== newRunText.trim()) {
        wTElements[i].setAttribute('xml:space', 'preserve');
      }
    }

    charPos += runText.length;
  }

  // Fallback: ha nem találtuk meg a változott tartomány futásait
  if (firstChangedRun === -1) {
    wTElements[0].textContent = newText;
    if (newText !== newText.trim()) {
      wTElements[0].setAttribute('xml:space', 'preserve');
    }
    for (let i = 1; i < wTElements.length; i++) {
      wTElements[i].textContent = '';
    }
  }
}

/**
 * Kinyeri a blokk-szintű elemek (p, h1-h6, td, th, li) szövegét az HTML-ből.
 * Megtartja a sorrend, a belső tagokat eltávolítja.
 */
function extractHtmlBlockTexts(html) {
  const texts = [];

  // Blokk-lezáró tagok helyére null-karaktert teszünk, majd szétvágjuk
  let processed = html
    .replace(/<\/(?:p|h[1-6]|td|th|li)>/gi, '\x00')
    .replace(/<(?:p|h[1-6]|td|th|li)(?:\s[^>]*)?>/gi, '')
    .split('\x00');

  for (const block of processed) {
    let text = block
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    text = decodeHtmlEntities(text);
    texts.push(text);
  }

  // Eltávolítjuk a trailing üres elemet (utolsó split eredménye)
  while (texts.length > 0 && texts[texts.length - 1] === '') {
    texts.pop();
  }

  return texts;
}

/**
 * HTML entitások dekódolása
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

module.exports = { applyHtmlEditsToDocx };
