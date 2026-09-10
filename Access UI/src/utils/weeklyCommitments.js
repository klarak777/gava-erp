export const dayKeys = ['wed', 'thu', 'fri', 'sat', 'sun', 'mon', 'tue'];
export function budapestToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = key => parts.find(p => p.type === key).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function estimatedDistribution(totalAction, totalNormal, period, dates) {
  const normalRates = [.17, .17, .17, .13, .14, .11, .11];
  const result = Object.fromEntries(dayKeys.map((key, i) => [key, Math.round(Number(totalNormal || 0) * normalRates[i])]));
  const actionDays = [];
  if (!period) return { result, actionDays };
  const match = period.match(/(\d{2})\.(\d{2})\.\s*[-–]\s*(\d{2})\.(\d{2})\./);
  if (!match) return { result, actionDays, warning: 'Ismeretlen akciós időszak.' };
  const rates = { 2: [.7, .3], 3: [.4, .4, .2], 4: [.3, .3, .22, .18] };
  // Try adjacent years too: an ALDI week can cross New Year.
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
export function dailyBalance(opening, incoming, actual, estimate) {
  const available = Number(opening || 0) + Number(incoming || 0);
  const consumption = actual == null ? Number(estimate || 0) : Number(actual);
  return { available, shortage: Math.max(0, -available), closing: available - consumption };
}
