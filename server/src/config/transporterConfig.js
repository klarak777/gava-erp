/**
 * Központi fuvarozó konfiguráció.
 * 
 * folderMap:  Transporter rövid név → mappa név a Fuvarmegbízás útvonalhoz.
 *             Minta: \\192.168.1.5\raktar\Fuvarok\Fuvarmegbízás\{szezon}\{folderMap}\{docName}
 * 
 * companyMap: Transporter rövid név → teljes cégnév a dokumentum fejlécéhez.
 * 
 * docNameMap: Transporter rövid név → a fájlnévben használt prefix.
 *             Minta: "{docNameMap} {orderNumber}.docx"
 * 
 * A FileMapDatabase CSV-ből és a 24-25 szezon mintáiból kinyerve.
 */

const folderMap = {
  'BOGNÁR': 'BOGNÁR TRANS',
  'BOGNAR': 'BOGNAR TRANS',
  'BVT': 'BVT TRANS',
  'BILEK': 'BILEK',
  'CHAMPION': 'CHAMPION FRUIT',
  'CROSS': 'CROSS CARGO',
  'CSACSI': 'LOGISTIC HOME',
  'DERBY': 'DERBY TRANS',
  'DERBY TRANS': 'DERBY TRANS',
  'DIANIA': 'DIANIA',
  'DINAMO': 'DINAMO TRANS',
  'DORI': 'GREEN ARROW',
  'FER TRANS': 'FER TRANS',
  'FRIGOSPED': 'FRIGOSPED SK',
  'FRUCTUS': 'FRUCTUS TRADE',
  'GAVA': 'GAVA',
  'GAVA POLSKA': 'GAVA POLSKA',
  'HANKA': 'HANKA SPED',
  'HILLTOP': 'HILLTOP',
  'HRT': 'HRT SPEDITION',
  'HZ LOGISTICS': 'HZ LOGISTICS',
  'IMANOV': 'IMANOV',
  'INTERTRANS': 'INTERTRANS',
  'JUICE': 'JUICE',
  'KÁDÁR': 'KÁDÁR',
  'KADAR': 'KÁDÁR',
  'KERMOR': 'KERMOR',
  'KESSEC': 'KESSEC',
  'KIJUTO': 'KI-JU-TO',
  'KI-JU-TO': 'KI-JU-TO',
  'KÓNYA': 'KÓNYA . TRANS',
  'KONYA': 'KÓNYA . TRANS',
  'KOPFSALAT': 'KOPFSALAT',
  'KUONI': 'KUONI TRADE',
  'KUSEK': 'KUSEK',
  'LIVIU': 'LIVIU',
  'LOGISTICHOME': 'LOGISTICHOME',
  'LUI': 'FRIGO LUI',
  'MASEVERDE': 'MESAVERDE',
  'MESAVERDE': 'MESAVERDE',
  'MEG-RAK-LAK': 'MEG-RAK-LAK KFT',
  'MK FRESH': 'MK FRESH',
  'ORANGE': 'ORANGE TRANS',
  'PAP': 'PAP',
  'PANNONFRUIT': 'PANNON FRUIT',
  'RAINBOW': 'RAINBOW LOGISTIC SRO',
  'RENACRIS': 'RENACRIS TRANS',
  'RONI': 'RONI CARGO',
  'S-TRANSPORT': 'S-TRANSPORT',
  'SCANTRANS': 'SCANTRANS',
  'SEED': 'SEED TRANS',
  'SERGIO': 'SERGIO',
  'SOOS': 'SOOS TRANS',
  'STI': 'STI',
  'S.T.I': 'STI',
  'SWISS': 'SWISS TEMP',
  'SZENTI': 'SZENTI TRANS',
  'THERMO': 'THERMO FRUCHT',
  'VASKO': 'VASKO',
  'VERMION': 'VERMION',
  'VIRAG': 'VIRAG MARKET',
  'VITAFRUIT': 'VITAFRUIT',
  'WABERERS': 'WABERERS',
  "WABERER'S": 'WABERERS',
  'WINDBAHN': 'WINDBAHN',
  'ZERO': 'ZERO',
};

const companyMap = {
  'BOGNÁR': 'BOGNÁR TRANSPORT KFT',
  'BOGNAR': 'BOGNÁR TRANSPORT KFT',
  'BVT': 'BVT TRANS KFT',
  'BILEK': 'BILEK TRANS KFT',
  'CHAMPION': 'CHAMPION FRUIT KFT',
  'CROSS': 'CROSS CARGO KFT',
  'CSACSI': 'LOGISTIC HOME KFT',
  'DERBY': 'DERBY TRANS KFT',
  'DERBY TRANS': 'DERBY TRANS KFT',
  'DIANIA': 'DIANIA KFT',
  'DINAMO': 'DINAMO TRANS KFT',
  'DORI': 'GREEN ARROW KFT',
  'FER TRANS': 'FER TRANS KFT',
  'FRIGOSPED': 'FRIGOSPED SK',
  'FRUCTUS': 'FRUCTUS TRADE',
  'GAVA': 'GAVA HUNGRIA KFT',
  'GAVA POLSKA': 'GAVA POLSKA',
  'HANKA': 'HANKA SPED KFT',
  'HILLTOP': 'HILLTOP KFT',
  'HRT': 'HRT SPEDITION KFT',
  'HZ LOGISTICS': 'HZ LOGISTICS KFT',
  'IMANOV': 'IMANOV SRO',
  'INTERTRANS': 'FRIGO INTERTRANS KFT',
  'JUICE': 'JUICE KFT',
  'KÁDÁR': 'KÁDÁR TRANS KFT',
  'KADAR': 'KÁDÁR TRANS KFT',
  'KERMOR': 'KERMOR KFT',
  'KESSEC': 'KESSEC KFT',
  'KIJUTO': 'KI-JU-TO KFT',
  'KI-JU-TO': 'KI-JU-TO KFT',
  'KÓNYA': 'KÓNYA TRANS KFT',
  'KONYA': 'KÓNYA TRANS KFT',
  'KOPFSALAT': 'KOPFSALAT KFT',
  'KUONI': 'KUONI TRADE KFT',
  'KUSEK': 'KUSEK TRANS KFT',
  'LIVIU': 'LIVIU KFT',
  'LOGISTICHOME': 'LOGISTICHOME KFT',
  'LUI': 'FRIGO LUI KFT',
  'MASEVERDE': 'MESAVERDE KFT',
  'MESAVERDE': 'MESAVERDE KFT',
  'MEG-RAK-LAK': 'MEG-RAK-LAK KFT',
  'MK FRESH': 'MK FRESH PRODUCT KFT',
  'ORANGE': 'ORANGE TRANS KFT',
  'PAP': 'PAP TRANS KFT',
  'PANNONFRUIT': 'PANNON FRUIT KFT',
  'RAINBOW': 'RAINBOW LOGISTIC SRO',
  'RENACRIS': 'RENACRIS TRANS',
  'RONI': 'RONI CARGO KFT',
  'S-TRANSPORT': 'S-TRANSPORT KFT',
  'SCANTRANS': 'SCANTRANS KFT',
  'SEED': 'SEED KFT',
  'SERGIO': 'SERGIO KFT',
  'SOOS': 'S.O.S TRANS KFT',
  'STI': 'STI HUNGARY KFT',
  'S.T.I': 'STI HUNGARY KFT',
  'SWISS': 'SWISS TEMP',
  'SZENTI': 'SZENTI TRANS KFT',
  'THERMO': 'THERMO FRUCHT',
  'VASKO': 'VASKO KFT',
  'VERMION': 'VERMION FRESH KFT',
  'VIRAG': 'VIRAG MARKET KFT',
  'VITAFRUIT': 'VITAFRUIT KFT',
  'WABERERS': 'WABERERS KFT',
  "WABERER'S": 'WABERERS KFT',
  'WINDBAHN': 'WINDBAHN KFT',
  'ZERO': 'ZERO TRADE KFT',
};

/**
 * A Fuvarmegbízás fájlnévben használt prefix.
 * Ha a szállító neve nem szerepel itt, a companyMap vagy a folderMap értéket használjuk.
 * Minta: "{docNamePrefix} {orderNumber}.docx"
 */
const docNameMap = {
  'BOGNÁR': 'BOGNÁR TRANS',
  'BOGNAR': 'BOGNAR TRANS',
  'BVT': 'BVT TRANS',
  'BILEK': 'BILEK',
  'CHAMPION': 'CHAMPION FRUIT',
  'CROSS': 'CROSS CARGO',
  'CSACSI': 'LOGISTIC HOME',
  'DERBY': 'DERBY TRANS',
  'DERBY TRANS': 'DERBY TRANS',
  'DIANIA': 'DIANIA',
  'DINAMO': 'DINAMO TRANS',
  'DORI': 'GREEN ARROW',
  'FER TRANS': 'FER TRANS',
  'FRIGOSPED': 'FRIGOSPED SK',
  'FRUCTUS': 'FRUCTUS TRADE SRO',
  'GAVA': 'GAVA',
  'GAVA POLSKA': 'GAVA POLSKA',
  'HANKA': 'HANKA SPED',
  'HILLTOP': 'HILLTOP',
  'HRT': 'HRT SPED',
  'HZ LOGISTICS': 'HZ LOGISTICS',
  'IMANOV': 'IMANOV SRO',
  'INTERTRANS': 'FRIGO INTERTRANS',
  'JUICE': 'JUICE',
  'KÁDÁR': 'KÁDÁR',
  'KADAR': 'KÁDÁR',
  'KERMOR': 'KERMOR',
  'KESSEC': 'KESSEC',
  'KIJUTO': 'KI-JU-TO',
  'KI-JU-TO': 'KI-JU-TO',
  'KÓNYA': 'KÓNYA TRANS',
  'KONYA': 'KÓNYA TRANS',
  'KOPFSALAT': 'KOPFSALAT',
  'KUONI': 'KUONI TRADE',
  'KUSEK': 'KUSEK',
  'LIVIU': 'LIVIU',
  'LOGISTICHOME': 'LOGISTICHOME',
  'LUI': 'FRIGO LUI',
  'MASEVERDE': 'MESAVERDE KFT',
  'MESAVERDE': 'MESAVERDE KFT',
  'MEG-RAK-LAK': 'MEG-RAK-LAK',
  'MK FRESH': 'MK FRESH',
  'ORANGE': 'ORANGE TRANS',
  'PAP': 'PAP',
  'PANNONFRUIT': 'PANNON FRUIT',
  'RAINBOW': 'RAINBOW LOGISTIC',
  'RENACRIS': 'RENACRIS TRANS',
  'RONI': 'RONI CARGO',
  'S-TRANSPORT': 'S-TRANSPORT',
  'SCANTRANS': 'SCANTRANS',
  'SEED': 'SEED KFT',
  'SERGIO': 'SERGIO',
  'SOOS': 'S.O.S TRANS',
  'STI': 'STI KFT',
  'S.T.I': 'STI KFT',
  'SWISS': 'SWISS TEMP',
  'SZENTI': 'SZENTI TRANS',
  'THERMO': 'THERMO FRUCHT',
  'VASKO': 'P TRANSZ',
  'VERMION': 'VERMION',
  'VIRAG': 'VIRAG MARKET',
  'VITAFRUIT': 'VITAFRUIT',
  'WABERERS': 'WABERERS',
  "WABERER'S": 'WABERERS',
  'WINDBAHN': 'WINDBAHN',
  'ZERO': 'ZERO TRADE',
};

const folderMap2526 = {
  'ALL FRESH': 'ALL FRESH',
  'BOGNÁR': 'BOGNÁR TRANS',
  'BOGNAR': 'BOGNÁR TRANS',
  'BUGYI': 'BUGYI FERENC',
  'BVT': 'BVT TRANS',
  'DERBY': 'DERBY TRANS',
  'DERBY TRANS': 'DERBY TRANS',
  'ESKADA': 'ESKADA',
  'FER': 'FER TRANS',
  'FER TRANS': 'FER TRANS',
  'FRIGOSPED': 'FRIGOSPED SK',
  'FRUCTUS': 'FRUCTUS TRADE',
  'GAVA POLSKA': 'GAVA POLSKA',
  'HANKA': 'HANKA',
  'HILLTOP': 'HILLTOP',
  'KERMOR': 'KERMOR',
  'KÓNYA': 'KÓNYA TRANS',
  'KONYA': 'KÓNYA TRANS',
  'CSACSI': 'LOGISTICHOME',
  'LOGISTICHOME': 'LOGISTICHOME',
  'MASEVERDE': 'MESAVERDE KFT',
  'MESAVERDE': 'MESAVERDE KFT',
  'NH CARGO': 'NH CARGO',
  'PAP': 'PAP JÓZSEFNÉ',
  'PET-IMPEX': 'PET-IMPEX',
  'RAINBOW': 'RAINBOW',
  'RENACRIS': 'RENACRIS',
  'RONI': 'RONI CARGO',
  'STI': 'STI',
  'S.T.I': 'STI',
  'SWISS': 'SWISS TEMP',
  'SZÉKESI': 'SZÉKESI KFT',
  'SZEKESI': 'SZÉKESI KFT',
  'THERMO': 'THERMO FRUCHT',
  'TRANS-SPED': 'TRANS-SPED'
};

/**
 * Visszaadja a szállító mappa nevét a Fuvarmegbízás útvonalhoz.
 * @param {string} transporterName - A szállító neve (pl. "KONYA")
 * @param {string} [seasonCode] - Opcionális szezon (pl. "25-26")
 * @returns {string} A mappa neve
 */
function getFolderName(transporterName, seasonCode) {
  if (!transporterName) return '';
  const key = transporterName.trim().toUpperCase();
  
  if (seasonCode === '25-26') {
    if (folderMap2526[key]) return folderMap2526[key];
    if (folderMap2526[transporterName]) return folderMap2526[transporterName];
    const found2526 = Object.keys(folderMap2526).find(k => k.toUpperCase() === key);
    if (found2526) return folderMap2526[found2526];
  }

  // Fallback a régihez
  if (folderMap[key]) return folderMap[key];
  if (folderMap[transporterName]) return folderMap[transporterName];
  const found = Object.keys(folderMap).find(k => k.toUpperCase() === key);
  if (found) return folderMap[found];
  return transporterName;
}

/**
 * Visszaadja a szállító teljes cégnevét.
 * @param {string} transporterName
 * @returns {string}
 */
function getCompanyName(transporterName) {
  if (!transporterName) return '';
  const key = transporterName.trim().toUpperCase();
  if (companyMap[key]) return companyMap[key];
  if (companyMap[transporterName]) return companyMap[transporterName];
  const found = Object.keys(companyMap).find(k => k.toUpperCase() === key);
  if (found) return companyMap[found];
  return transporterName;
}

/**
 * Visszaadja a Fuvarmegbízás fájlnévben használt prefixet.
 * @param {string} transporterName
 * @returns {string}
 */
function getDocNamePrefix(transporterName) {
  if (!transporterName) return '';
  const key = transporterName.trim().toUpperCase();
  if (docNameMap[key]) return docNameMap[key];
  if (docNameMap[transporterName]) return docNameMap[transporterName];
  const found = Object.keys(docNameMap).find(k => k.toUpperCase() === key);
  if (found) return docNameMap[found];
  return transporterName;
}

/**
 * Rendszámból EKAER fájlnevet generál.
 * Bemenet: "AI HK 730 / AA ID 874" vagy "AALE051/WFC666"
 * Kimenet: "AI HK 730 - AA ID 874.docx"
 * @param {string} plateNumber
 * @returns {string|null} A generált fájlnév, vagy null ha nincs rendszám
 */
function generateEkaerFileName(plateNumber) {
  if (!plateNumber || plateNumber.trim() === '') return null;
  
  // Rendszám kettéválasztása a "/" jel mentén
  const parts = plateNumber.split('/');
  if (parts.length < 2) return null;
  
  // Hagyjuk meg a szóközöket, csak a feleslegeseket távolítsuk el, és formázzuk " - " elválasztóval
  const part1 = parts[0].trim();
  const part2 = parts[1].trim();
  
  if (!part1 || !part2) return null;
  
  return `${part1} - ${part2}.docx`;
}

/**
 * Szezon kódból teljes EKAER szezon mappa nevet generál.
 * Bemenet: "24-25"
 * Kimenet: "EKAEREK 2024-2025"
 * @param {string} seasonCode
 * @returns {string}
 */
function getEkaerSeasonFolder(seasonCode) {
  if (!seasonCode) return '';
  const parts = seasonCode.split('-');
  if (parts.length < 2) return `EKAEREK ${seasonCode}`;
  const startYear = parseInt(parts[0], 10) + 2000;
  const endYear = parseInt(parts[1], 10) + 2000;
  return `EKAEREK ${startYear}-${endYear}`;
}

/**
 * Fuvarmegbízás teljes fájl elérési útvonalat generál.
 *
 * 25-26-os szezon (2026-06-26-tól):
 *   \\192.168.1.5\raktar\MI Teszt\ERP Fuvarm\25-26\{folderName}\{docName}
 *
 * Régebbi szezonok:
 *   \\192.168.1.5\raktar\Fuvarok\Fuvarmegbízás\{seasonCode}\{folderName}\{docName}
 *
 * @param {string} seasonCode - pl. "24-25" vagy "25-26"
 * @param {string} transporterName - pl. "KONYA" vagy "KÓNYA TRANS"
 * @param {string} orderNumber - pl. "GHU 238"
 * @param {string} [raktarPath] - opcionális alap útvonal
 * @returns {{ fileName: string, filePath: string }}
 */
function generateTransportOrderPath(seasonCode, transporterName, orderNumber, raktarPath) {
  const basePath = raktarPath || '\\\\192.168.1.5\\raktar';
  const folder = getFolderName(transporterName, seasonCode);
  const docPrefix = getDocNamePrefix(transporterName);
  const fileName = `${docPrefix} ${orderNumber}.docx`;

  let filePath;
  if (seasonCode === '25-26') {
    // 2026-06-26-tól az új MI Teszt mappa struktúra
    filePath = `${basePath}\\MI Teszt\\ERP Fuvarm\\25-26\\${folder}\\${fileName}`;
  } else {
    // Korábbi szezonok: régi elérési út
    filePath = `${basePath}\\Fuvarok\\Fuvarmegbízás\\${seasonCode}\\${folder}\\${fileName}`;
  }
  return { fileName, filePath };
}

/**
 * EKAER teljes fájl elérési útvonalat generál.
 *
 * 25-26-os szezon (2026-06-26-tól):
 *   \\192.168.1.5\raktar\MI Teszt\ERP EKAER\EKAEREK 2025-2026\{orderNumber}\{ekaerFileName}
 *   Pl. BEL 001 → BEL001 almappa
 *
 * Régebbi szezonok:
 *   \\192.168.1.5\raktar\Fuvarok\EKAEREK\EKAEREK 2024-2025\{orderNumber}\{ekaerFileName}
 *
 * Az "OK" postfixet NEM adjuk hozzá az útvonalhoz (a fájl keresése majd fallback-kel oldja meg).
 * @param {string} seasonCode - pl. "24-25" vagy "25-26"
 * @param {string} orderNumber - pl. "LOG149" vagy "BEL001"
 * @param {string} plateNumber - pl. "AA LE 051 / WFC 666"
 * @param {string} [raktarPath] - opcionális alap útvonal
 * @returns {{ fileName: string, filePath: string }|null}
 */
function generateEkaerPath(seasonCode, orderNumber, plateNumber, raktarPath) {
  const fileName = generateEkaerFileName(plateNumber);
  if (!fileName) return null;

  const basePath = raktarPath || '\\\\192.168.1.5\\raktar';

  let filePath;
  if (seasonCode === '25-26') {
    // 2026-06-26-tól az új MI Teszt mappa struktúra
    // orderNumber-t biztonságossá tesszük (szóközök eltávolítása)
    const safeOrderNum = orderNumber.replace(/\s+/g, '');
    filePath = `${basePath}\\MI Teszt\\ERP EKAER\\EKAEREK 2025-2026\\${safeOrderNum}\\${fileName}`;
  } else {
    // Korábbi szezonok: régi elérési út
    const ekaerSeasonFolder = getEkaerSeasonFolder(seasonCode);
    filePath = `${basePath}\\Fuvarok\\EKAEREK\\${ekaerSeasonFolder}\\${orderNumber}\\${fileName}`;
  }
  return { fileName, filePath };
}

module.exports = {
  folderMap,
  companyMap,
  docNameMap,
  getFolderName,
  getCompanyName,
  getDocNamePrefix,
  generateEkaerFileName,
  getEkaerSeasonFolder,
  generateTransportOrderPath,
  generateEkaerPath,
};
