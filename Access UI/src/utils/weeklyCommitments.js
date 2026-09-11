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
    // Nincs akciós időszak megadva: normál arányok a totalNormal-ból
    const normalRates = [.17, .17, .17, .13, .14, .11, .11];
    dayKeys.forEach((k, i) => { result[k] = Math.round(Number(totalNormal || 0) * normalRates[i]); });
    return { result, actionDays };
  }

  const match = period.match(/(\d{2})\.(\d{2})\.\s*[-–]\s*(\d{2})\.(\d{2})\./);
  if (!match) return { result, actionDays, warning: 'Ismeretlen akciós időszak.' };

  // Az Excel F-L oszlopai a tényleges naptári napokhoz tartoznak:
  // F=Csütörtök → dates[1], G=Péntek → dates[2], H=Szombat → dates[3],
  // I=Vasárnap → dates[4], J=Hétfő → dates[5], K=Kedd → dates[6],
  // L=Szerda (KÖVETKEZŐ szerda, nem a kezdő!) → dates[0] + 7 nap
  const nextWedStr = new Date(Date.parse(dates[0]) + 7 * 86400000).toISOString().slice(0, 10);
  const excelKeyToDate = {
    thu: dates[1], fri: dates[2], sat: dates[3], sun: dates[4],
    mon: dates[5], tue: dates[6], wed: nextWedStr
  };

  // Excel kulcs → UI cél kulcs (1 nappal eltolva, mert az Excel értéke az előző napra vonatkozik)
  // thu(Csü Excel) → wed(Sze UI), fri(Pé Excel) → thu(Csü UI), stb.
  const excelToUi = { thu: 'wed', fri: 'thu', sat: 'fri', sun: 'sat', mon: 'sun', tue: 'mon', wed: 'tue' };

  // Akciós időszak dátumainak meghatározása
  const year = Number(dates[0]?.slice(0, 4));
  let actionStartStr = null, actionEndStr = null;
  for (const y of [year - 1, year, year + 1]) {
    const start = `${y}-${match[2]}-${match[1]}`;
    const endYear = match[4] + match[3] < match[2] + match[1] ? y + 1 : y;
    const end = `${endYear}-${match[4]}-${match[3]}`;
    // Az akció átfedi-e az Excel napok dátumait? (beleértve a következő szerdát)
    const excelDates = Object.values(excelKeyToDate);
    if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end))) continue;
    if (excelDates.some(d => d >= start && d <= end)) {
      actionStartStr = start;
      actionEndStr = end;
      break;
    }
  }

  // Akciós Excel-napok azonosítása: amelyek tényleges dátuma az akciós időszakba esik
  const excelActionKeys = [];
  const uiActionDays = [];

  if (actionStartStr) {
    for (const [excelKey, excelDate] of Object.entries(excelKeyToDate)) {
      if (excelDate >= actionStartStr && excelDate <= actionEndStr) {
        excelActionKeys.push(excelKey);
        const uiKey = excelToUi[excelKey];
        uiActionDays.push(uiKey);
        actionDays.push(uiKey);
      }
    }
  }

  // Akciós összeg: a daily_values akciós Excel-napjainak összege
  const actionSum = excelActionKeys.reduce((s, k) => s + (Number(dailyValues[k]) || 0), 0);

  // Nem-akciós összeg: a maradék Excel-napok daily_values összege
  const excelAllKeys = ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'];
  const nonActionExcelKeys = excelAllKeys.filter(k => !excelActionKeys.includes(k));
  const normalSum = nonActionExcelKeys.reduce((s, k) => s + (Number(dailyValues[k]) || 0), 0);

  // Akciós UI napok értékei: az akciós összeg × időszak-százalékok
  const actionRates = { 2: [0.70, 0.30], 3: [0.40, 0.40, 0.20], 4: [0.30, 0.30, 0.22, 0.18] };
  const duration = uiActionDays.length;
  const rates = actionRates[duration];
  if (rates && actionSum > 0) {
    uiActionDays.forEach((uiKey, i) => { result[uiKey] = Math.round(actionSum * rates[i]); });
  }

  // Nem-akciós UI napok értékei: a nem-akciós összeg × kontextus-alapú százalékok
  const nonActionRates = getNormalRatesForContext(uiActionDays);
  for (const [uiKey, rate] of Object.entries(nonActionRates)) {
    if (!uiActionDays.includes(uiKey)) {
      result[uiKey] = Math.round(normalSum * rate);
    }
  }

  return { result, actionDays };
}

export function dailyBalance(opening, incoming, actual, estimate) {
  const available = Number(opening || 0) + Number(incoming || 0);
  const consumption = actual == null ? Number(estimate || 0) : Number(actual);
  const closing = available - consumption;
  return { available, shortage: Math.max(0, -closing), closing };
}

// Keep the editable weekly opening separate from the derived stock.
// A felhasználói kérés alapján: a teljes hetet figyelembe kell venni, nem csak a mai napot.
export function stockAtDate(initialStock, dates, closingStocks) {
  let stock = Math.round(Number(initialStock) || 0);
  dates.forEach((date, index) => {
    if (closingStocks[index] != null) stock = Math.round(Number(closingStocks[index]));
  });
  return stock;
}
