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
function getNormalRatesForContext(actionUiDays, config) {
  const actionSet = new Set(actionUiDays);
  const normal = profileFractions(config, 'normal', { wed:17, thu:17, fri:17, sat:13, sun:14, mon:11, tue:11 });
  if (!actionSet.size || actionSet.size === 7) {
    return normal;
  }
  const nonActionDays = dayKeys.filter(d => !actionSet.has(d));
  const profiles = {
    3: profileFractions(config, 'off_three', { sun:20, mon:30, tue:50 }),
    4: profileFractions(config, 'off_four', { wed:25, thu:25, fri:25, sat:25 }),
    5: profileFractions(config, 'off_five', { wed:25, thu:25, sun:15, mon:15, tue:20 })
  };
  const profile = profiles[nonActionDays.length];
  if (profile) {
    const fractions = Object.values(profile);
    return Object.fromEntries(nonActionDays.map((day,index) => [day,fractions[index]]));
  }
  const sum = nonActionDays.reduce((total, day) => total + normal[day], 0);
  return Object.fromEntries(nonActionDays.map(day => [day, sum ? normal[day] / sum : 1 / nonActionDays.length]));
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
export function estimatedDistribution(totalAction, totalNormal, period, dates, dailyValues = null, rateConfig = null) {
  // --- Normál típus (Keresleti Excel): változatlan logika ---
  if (!dailyValues) {
    const normal = profileFractions(rateConfig, 'normal', { wed: 17, thu: 17, fri: 17, sat: 13, sun: 14, mon: 11, tue: 11 });
    const normalRates = dayKeys.map(key => normal[key]);
    const result = Object.fromEntries(dayKeys.map((key, i) => [key, Math.round(Number(totalNormal || 0) * normalRates[i])]));
    const actionDays = [];
    if (!period) return { result, actionDays };
    const match = period.match(/(\d{2})\.(\d{2})\.\s*[-–]\s*(\d{2})\.(\d{2})\./);
    if (!match) return { result, actionDays, warning: 'Ismeretlen akciós időszak.' };
    const rates = actionRateArrays(rateConfig);
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
    const normal = profileFractions(rateConfig, 'normal', { wed: 17, thu: 17, fri: 17, sat: 13, sun: 14, mon: 11, tue: 11 });
    const normalRates = dayKeys.map(key => normal[key]);
    const normalTotal = Number(totalNormal || totalAction || 0);
    dayKeys.forEach((k, i) => { result[k] = Math.round(normalTotal * normalRates[i]); });
    return { result, actionDays, actionTotal: 0, normalTotal };
  }

  const match = period.match(/(\d{2})\.(\d{2})\.(?:(\d{4}))?\s*[-–]\s*(\d{2})\.(\d{2})\.(?:(\d{4}))?/);
  if (!match) return { result, actionDays, warning: 'Ismeretlen akciós időszak.' };
  if (!dates[0]) return { result, actionDays, actionTotal: 0, normalTotal: Number(totalAction || 0) };

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
  const excelToUi = ACTION_EXCEL_TO_UI;

  // Akciós időszak dátumainak meghatározása
  const year = Number(dates[0]?.slice(0, 4));
  let actionStartStr = null, actionEndStr = null;
  const candidateYears = match[3] ? [Number(match[3])] : match[6]
    ? [Number(match[6]) - (match[5] + match[4] < match[2] + match[1] ? 1 : 0)]
    : [year - 1, year, year + 1];
  for (const y of candidateYears) {
    const start = `${y}-${match[2]}-${match[1]}`;
    const endYear = match[6] ? Number(match[6]) : (match[5] + match[4] < match[2] + match[1] ? y + 1 : y);
    const end = `${endYear}-${match[5]}-${match[4]}`;
    // Az akció átfedi-e az Excel napok dátumait? (beleértve a következő szerdát)
    const excelDates = Object.values(excelKeyToDate);
    if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || end < start ||
        new Date(start).toISOString().slice(0,10) !== start || new Date(end).toISOString().slice(0,10) !== end) continue;
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
  const actionRates = actionRateArrays(rateConfig);
  const duration = uiActionDays.length;
  const rates = actionRates[duration];
  if (rates && actionSum > 0) {
    uiActionDays.forEach((uiKey, i) => { result[uiKey] = Math.round(actionSum * rates[i]); });
  }

  // Nem-akciós UI napok értékei: a nem-akciós összeg × kontextus-alapú százalékok
  const nonActionRates = getNormalRatesForContext(uiActionDays, rateConfig);
  for (const [uiKey, rate] of Object.entries(nonActionRates)) {
    if (!uiActionDays.includes(uiKey)) {
      result[uiKey] = Math.round(normalSum * rate);
    }
  }

  return { result, actionDays, actionTotal: actionSum, normalTotal: normalSum };
}

// One model supplies the table and its editor, including unchanged Excel defaults.
export function buildWeeklyProducts(items, dates, rateConfig = null) {
  const groups = {};
  const quantity = value => Math.max(0, Number(value) || 0);
  const json = value => {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return null; }
  };
  for (const item of items) {
    const key = String(item.display_name);
    const group = groups[key] ||= {
      product_id: item.product_id, display_name: key, product_name: item.product_name,
      demandTotal: 0, plans: {}, manualNormal: null, manualAction: null, manualDays: null
    };
    if (item.product_name) group.product_name = item.product_name;
    if (item.manual_normal_demand != null) group.manualNormal = quantity(item.manual_normal_demand);
    if (item.manual_action_demand != null) group.manualAction = quantity(item.manual_action_demand);
    const selectedDays = json(item.action_days_json);
    if (Array.isArray(selectedDays) && selectedDays.length) group.manualDays = dayKeys.filter(day => selectedDays.includes(day));
    if (item.type !== 'action') {
      group.demandTotal += quantity(item.total_forecast_cartons);
      continue;
    }
    const period = item.action_period || '';
    const plan = group.plans[period] ||= { total: 0, daily: null };
    const daily = json(item.daily_values);
    plan.total += quantity(item.total_forecast_cartons ?? (daily && Object.values(daily).reduce((sum, value) => sum + quantity(value), 0)));
    if (daily && typeof daily === 'object' && !Array.isArray(daily)) {
      plan.daily ||= Object.fromEntries(dayKeys.map(day => [day, 0]));
      for (const day of dayKeys) plan.daily[day] += quantity(daily[day]);
    }
  }
  for (const group of Object.values(groups)) {
    const actionValues = Object.fromEntries(dayKeys.map(day => [day, 0]));
    const normalValues = { ...actionValues };
    const originalDays = new Set();
    let planTotal = 0, originalAction = 0;
    const add = (values, total, fractions) => {
      for (const [day, fraction] of Object.entries(fractions)) values[day] += total * fraction;
    };
    const actionFractions = days => {
      const rates = actionRateArrays(rateConfig)[days.length];
      if (rates) return Object.fromEntries(days.map((day, index) => [day, rates[index]]));
      // A partial or user-selected period must still use the configured daily weights.
      const normal = profileFractions(rateConfig, 'normal', { wed:17, thu:17, fri:17, sat:13, sun:14, mon:11, tue:11 });
      const sum = days.reduce((total, day) => total + normal[day], 0);
      return Object.fromEntries(days.map(day => [day, sum ? normal[day] / sum : 1 / days.length]));
    };
    for (const [period, plan] of Object.entries(group.plans)) {
      planTotal += plan.total;
      const daily = plan.daily || Object.fromEntries(dayKeys.map(day => [day, 0]));
      const split = estimatedDistribution(plan.total, 0, period || null, dates, daily, rateConfig);
      // Old imports may have no daily values: retain a usable promotion forecast.
      let action = split.actionTotal ?? (split.actionDays.length ? plan.total : 0);
      if (!Object.values(daily).some(value => value > 0) && split.actionDays.length) action = plan.total;
      action = Math.min(plan.total, action);
      originalAction += action;
      split.actionDays.forEach(day => originalDays.add(day));
      add(actionValues, action, actionFractions(split.actionDays));
      add(normalValues, plan.total - action, getNormalRatesForContext(split.actionDays, rateConfig));
    }
    const defaultDays = dayKeys.filter(day => originalDays.has(day));
    const defaultWeekly = Math.max(planTotal, group.demandTotal);
    const excessDemand = defaultWeekly - planTotal;
    // Higher demand increases the promotion base; its off-period forecast stays intact.
    const defaultAction = originalAction + (defaultDays.length ? excessDemand : 0);
    const defaultNormal = defaultWeekly - defaultAction;
    if (!defaultDays.length) add(normalValues, excessDemand, getNormalRatesForContext(defaultDays, rateConfig));
    const actionDays = group.manualDays || defaultDays;
    const actionTotal = group.manualAction ?? defaultAction;
    const normalTotal = group.manualNormal ?? defaultNormal;
    const scale = (values, total, base, fallback) => base > 0
      ? Object.fromEntries(dayKeys.map(day => [day, values[day] * total / base]))
      : Object.fromEntries(dayKeys.map(day => [day, total * (fallback[day] || 0)]));
    const effectiveAction = group.manualDays
      ? Object.fromEntries(dayKeys.map(day => [day, actionTotal * (actionFractions(actionDays)[day] || 0)]))
      : scale(actionValues, actionTotal, originalAction, actionFractions(actionDays));
    const effectiveNormal = group.manualDays
      ? Object.fromEntries(dayKeys.map(day => [day, normalTotal * (getNormalRatesForContext(actionDays, rateConfig)[day] || 0)]))
      : scale(normalValues, normalTotal, defaultNormal, getNormalRatesForContext(actionDays, rateConfig));
    Object.assign(group, {
      action_period: Object.keys(group.plans).filter(Boolean).join(', '),
      defaultNormal, defaultAction, defaultDays,
      normalTotal, actionTotal, actionDays, weeklyTotal: normalTotal + actionTotal,
      distribution: Object.fromEntries(dayKeys.map(day => [day, Math.round(effectiveAction[day] + effectiveNormal[day])]))
    });
  }
  return groups;
}

export function dailyBalance(opening, incoming, actual, estimate, fulfilled = null) {
  const available = Number(opening || 0) + Number(incoming || 0);
  // A reported zero is valid: fulfilled > ordered > estimated by presence.
  const consumption = Number(fulfilled ?? actual ?? estimate ?? 0);
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

// Persisted percentages are converted to fractions only at calculation time.
function profileFractions(config, id, defaults) {
  return Object.fromEntries(Object.keys(defaults).map(key => [key, Number(config?.[id]?.[key] ?? defaults[key]) / 100]));
}
function actionRateArrays(config) {
  return {
    2: Object.values(profileFractions(config, 'action_two', { fri: 70, sat: 30 })),
    3: Object.values(profileFractions(config, 'action_three', { sun: 40, mon: 40, tue: 20 })),
    4: Object.values(profileFractions(config, 'action_four', { wed: 30, thu: 30, fri: 22, sat: 18 }))
  };
}
