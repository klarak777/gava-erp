export const dayKeys = ['wed', 'thu', 'fri', 'sat', 'sun', 'mon', 'tue'];

export function budapestToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = key => parts.find(p => p.type === key).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * Nap-eltolás: A Rendelési terv (action) Excel F-L oszlopai Csü→Sze napokat fedik,
 * de a UI-ban Sze→Kedd sorrendben jelennek meg, eggyel eltolva.
 * Excel kulcs → UI kulcs: thu→wed, fri→thu, sat→fri, sun→sat, mon→sun, tue→mon, wed→tue
 */
const ACTION_EXCEL_TO_UI = { thu: 'wed', fri: 'thu', sat: 'fri', sun: 'sat', mon: 'sun', tue: 'mon', wed: 'tue' };

/**
 * Akción kívüli napi százalékok az akciós időszak típusa alapján.
 * A kulcs az akciós napok neve (UI kulcsok, szerdával kezdve).
 * A visszaadott százalékok a MARADÉK napokra vonatkoznak.
 */
function getNormalRatesForContext(actionUiDays) {
  const actionSet = new Set(actionUiDays);

  // Ha az akció szerda-csüt-péntek-szombat napokat fed le
  const isSzeCSuPeSzo = ['wed','thu','fri','sat'].every(d => actionSet.has(d));
  if (isSzeCSuPeSzo) {
    // Maradék: vasárnap, hétfő, kedd
    return { sun: 0.20, mon: 0.30, tue: 0.50 };
  }

  // Ha az akció vasárnap-hétfő-kedd napokat fed le
  const isVasHetKed = ['sun','mon','tue'].every(d => actionSet.has(d));
  if (isVasHetKed) {
    // Maradék: szerda, csütörtök, péntek, szombat
    return { wed: 0.25, thu: 0.25, fri: 0.25, sat: 0.25 };
  }

  // Ha az akció péntek-szombat napokat fed le
  const isPeSzo = actionSet.has('fri') && actionSet.has('sat') && actionSet.size === 2;
  if (isPeSzo) {
    // Maradék: szerda, csütörtök, vasárnap, hétfő, kedd
    return { wed: 0.25, thu: 0.25, sun: 0.15, mon: 0.15, tue: 0.20 };
  }

  // Alapértelmezett: egyenlő elosztás a nem akciós napokra
  const nonActionDays = dayKeys.filter(d => !actionSet.has(d));
  const rate = nonActionDays.length > 0 ? 1 / nonActionDays.length : 0;
  return Object.fromEntries(nonActionDays.map(d => [d, rate]));
}

/**
 * estimatedDistribution - Elosztási számítás
 *
 * @param {number} totalAction - Akciós összes karton (normal típusnál: 0)
 * @param {number} totalNormal - Normál összes karton
 * @param {string|null} period - Akciós időszak szöveg (pl. "03.09.-06.09.")
 * @param {string[]} dates - A hét 7 dátuma (ISO, sze→kedd)
 * @param {object|null} dailyValues - Rendelési terv Excel naponta kinyert értékei
 *   Kulcsok: thu, fri, sat, sun, mon, tue, wed (Excel F→L)
 *   Ha null: normál típus, nincs nap-eltolás
 */
export function estimatedDistribution(totalAction, totalNormal, period, dates, dailyValues = null) {
  // --- Normál típus (Keresleti Excel): változatlan logika ---
  if (!dailyValues) {
    const normalRates = [.17, .17, .17, .13, .14, .11, .11];
    const result = Object.fromEntries(dayKeys.map((key, i) => [key, Math.round(Number(totalNormal || 0) * normalRates[i])]));
    const actionDays = [];
    if (!period) return { result, actionDays };
    const match = period.match(/(\d{2})\.(\d{2})\.\s*[-–]\s*(\d{2})\.(\d{2})\./);
    if (!match) return { result, actionDays, warning: 'Ismeretlen akciós időszak.' };
    const rates = { 2: [.7, .3], 3: [.4, .4, .2], 4: [.3, .3, .22, .18] };
    const year = Number(dates[0]?.slice(0, 4));
    for (const y of [year - 1, year, year + 1]) {
      const start = `${y}-${match[2]}-${match[1]}`;
      const endYear = match[4] + match[3] < match[2] + match[1] ? y + 1 : y;
      const end = `${endYear}-${match[4]}-${match[3]}`;
      const startMs = Date.parse(start), endMs = Date.parse(end);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || new Date(startMs).toISOString().slice(0,10) !== start || new Date(endMs).toISOString().slice(0,10) !== end) continue;
      if (end < dates[0] || start > dates[6]) continue;
      const duration = (endMs - startMs) / 86400000 + 1;
      if (!rates[duration]) return { result, actionDays, warning: 'Csak 2, 3 vagy 4 napos akció támogatott.' };
      dates.forEach((date, i) => {
        if (date >= start && date <= end) {
          const index = (Date.parse(date) - startMs) / 86400000;
          actionDays.push(dayKeys[i]);
          result[dayKeys[i]] = Math.round(Number(totalAction || 0) * rates[duration][index]);
        }
      });
      break;
    }
    return { result, actionDays };
  }

  // --- Rendelési terv (action) típus: nap-eltolás + összeg-alapú számítás ---
  const result = Object.fromEntries(dayKeys.map(k => [k, 0]));
  const actionDays = [];

  if (!period) {
    // Nincs akciós időszak: minden napra normál elosztás
    const normalRates = [.17, .17, .17, .13, .14, .11, .11];
    dayKeys.forEach((k, i) => { result[k] = Math.round(Number(totalNormal || 0) * normalRates[i]); });
    return { result, actionDays };
  }

  // 1. Az Excel napokhoz tartozó akciós időszak meghatározása dátum alapján
  const match = period.match(/(\d{2})\.(\d{2})\.\s*[-–]\s*(\d{2})\.(\d{2})\./);
  if (!match) return { result, actionDays, warning: 'Ismeretlen akciós időszak.' };

  // Az Excel nap kulcsai: thu, fri, sat, sun, mon, tue, wed → a hét 7 dátumához
  // Dátum párosítás: az Excel napjának megfelelő dátum az ALDI héten belül
  // Excel F=Thu az ALDI hét 2. napja (dates[1]), G=Fri → dates[2], ... L=Wed → dates[0]
  const excelKeyToDatesIdx = { thu: 1, fri: 2, sat: 3, sun: 4, mon: 5, tue: 6, wed: 0 };

  const year = Number(dates[0]?.slice(0, 4));
  let actionStartMs = null, actionEndMs = null;
  for (const y of [year - 1, year, year + 1]) {
    const start = `${y}-${match[2]}-${match[1]}`;
    const endYear = match[4] + match[3] < match[2] + match[1] ? y + 1 : y;
    const end = `${endYear}-${match[4]}-${match[3]}`;
    const sMs = Date.parse(start), eMs = Date.parse(end);
    if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) continue;
    if (end < dates[0] || start > dates[6]) continue;
    actionStartMs = sMs;
    actionEndMs = eMs;
    break;
  }

  // 2. Akciós napok beazonosítása az Excel daily_values kulcsain
  const excelActionKeys = []; // Excel kulcsok (thu, fri, sat...)
  const uiActionDays = [];    // UI kulcsok (wed, thu, fri...)

  if (actionStartMs !== null) {
    for (const [excelKey, datesIdx] of Object.entries(excelKeyToDatesIdx)) {
      const dateStr = dates[datesIdx];
      const dateMs = Date.parse(dateStr);
      if (dateMs >= actionStartMs && dateMs <= actionEndMs) {
        excelActionKeys.push(excelKey);
        const uiKey = ACTION_EXCEL_TO_UI[excelKey];
        uiActionDays.push(uiKey);
        actionDays.push(uiKey);
      }
    }
  }

  // 3. Akciós összeg: az Excel akciós napok értékeinek összege
  const actionSum = excelActionKeys.reduce((s, k) => s + (Number(dailyValues[k]) || 0), 0);

  // 4. Nem-akciós összeg: a maradék Excel napok értékeinek összege
  const excelAllKeys = ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'];
  const nonActionExcelKeys = excelAllKeys.filter(k => !excelActionKeys.includes(k));
  const normalSum = nonActionExcelKeys.reduce((s, k) => s + (Number(dailyValues[k]) || 0), 0);

  // 5. Akciós napok elosztása: az akciós időszak hosszától függő százalékok
  const actionRates = { 2: [0.70, 0.30], 3: [0.40, 0.40, 0.20], 4: [0.30, 0.30, 0.22, 0.18] };
  const duration = uiActionDays.length;
  const rates = actionRates[duration];
  if (rates && actionSum > 0) {
    uiActionDays.forEach((uiKey, i) => {
      result[uiKey] = Math.round(actionSum * rates[i]);
    });
  }

  // 6. Nem-akciós napok elosztása a kontextus-alapú százalékokkal
  const normalRates = getNormalRatesForContext(uiActionDays);
  for (const [uiKey, rate] of Object.entries(normalRates)) {
    if (!uiActionDays.includes(uiKey)) {
      result[uiKey] = Math.round(normalSum * rate);
    }
  }

  return { result, actionDays };
}

export function dailyBalance(opening, incoming, actual, estimate) {
  const available = Number(opening || 0) + Number(incoming || 0);
  const consumption = actual == null ? Number(estimate || 0) : Number(actual);
  return { available, shortage: Math.max(0, -available), closing: available - consumption };
}
