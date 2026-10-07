function planForecast(headers, row, dailyTotal) {
    const column = headers.findIndex(header => typeof header === 'string' &&
        header.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('elorejelzes'));
    const raw = column >= 0 ? row[column] : null;
    if (raw == null || (typeof raw === 'string' && raw.trim() === '')) return dailyTotal;
    const value = typeof raw === 'number' ? raw : Number(String(raw).replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) throw new Error('Érvénytelen értékesítési előrejelzés.');
    return value;
}

function manualOverrides(body = {}) {
    const result = {};
    for (const key of ['manual_action_demand', 'manual_normal_demand']) {
        if (!Object.hasOwn(body, key)) continue;
        const raw = body[key];
        if (raw != null && typeof raw !== 'number' && typeof raw !== 'string') throw new Error('Érvénytelen kartonszám.');
        const value = raw == null || String(raw).trim() === '' ? null : Number(raw);
        if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error('A kartonszám nemnegatív szám lehet.');
        result[key] = value;
    }
    if (Object.hasOwn(body, 'action_days_json')) {
        const days = body.action_days_json;
        const validDays = ['wed','thu','fri','sat','sun','mon','tue'];
        if (days !== null && (!Array.isArray(days) || days.some(day => !validDays.includes(day)) || new Set(days).size !== days.length)) {
            throw new Error('Érvénytelen akciós napok.');
        }
        result.action_days_json = days?.length ? JSON.stringify(validDays.filter(day => days.includes(day))) : null;
    }
    if (!Object.keys(result).length) throw new Error('Nincs megadott módosítás.');
    return result;
}

const planDays = ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'];
function hasDailyPlan(item) {
    let daily = item.daily_values;
    if (typeof daily === 'string') {
        try { daily = JSON.parse(daily); } catch { return false; }
    }
    return daily != null && !Array.isArray(daily) && planDays.every(day =>
        daily[day] != null && Number.isFinite(Number(daily[day])) && Number(daily[day]) >= 0
    ) && (Number(item.total_forecast_cartons) === 0 || planDays.some(day => Number(daily[day]) > 0));
}

// Restore old imports from their own archive, without turning Excel defaults into manual edits.
function restoreArchivedDailyPlans(items, buffer, weekDates = null) {
    const xlsx = require('xlsx');
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: null });
    const normalize = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const headerIndex = rows.slice(0, 20).findIndex(row => row.some(cell => normalize(cell).includes('display')));
    if (headerIndex < 0) throw new Error('Az archivált tervből hiányzik a Display oszlop.');
    const headers = rows[headerIndex];
    if (weekDates?.length === 7) {
        const forecastHeader = headers.find(cell => normalize(cell).includes('elorejelzes'));
        const period = String(forecastHeader ?? '').match(/(\d{2})\.(\d{2})\.(?:(\d{4}))?\s*[-–]\s*(\d{2})\.(\d{2})\.(?:(\d{4}))?/);
        if (period) {
            const end = new Date(Date.parse(weekDates[0]) + 7 * 86400000).toISOString().slice(0, 10);
            const matchesDate = (day, month, year, date) => day === date.slice(8, 10) && month === date.slice(5, 7) && (!year || year === date.slice(0, 4));
            if (!matchesDate(period[1], period[2], period[3], weekDates[1]) || !matchesDate(period[4], period[5], period[6], end)) {
                throw new Error('Az archivált terv fejléce másik hétre vonatkozik.');
            }
        }
    }
    const displayIndex = headers.findIndex(cell => normalize(cell).includes('display'));
    const periodIndex = headers.findIndex(cell => normalize(cell).includes('akcios idoszak'));
    const dayNames = ['csutortok', 'pentek', 'szombat', 'vasarnap', 'hetfo', 'kedd', 'szerda'];
    const dayColumns = dayNames.map(name => headers.findIndex(cell => normalize(cell).startsWith(name)));
    if (dayColumns.some(column => column < 0)) throw new Error('Az archivált terv napi oszlopai hiányosak.');
    const keyOf = (display, period) => JSON.stringify([String(display ?? '').trim(), String(period ?? '').replace(/\s/g, '').replace(/[–—]/g, '-')]);
    const sourceGroups = new Map();
    for (const row of rows.slice(headerIndex + 1)) {
        const display = String(row[displayIndex] ?? '').trim();
        if (!display) continue;
        const daily = Object.fromEntries(planDays.map((day, index) => {
            const raw = row[dayColumns[index]];
            const value = raw == null || String(raw).trim() === '' ? 0 : Number(String(raw).replace(/\s/g, '').replace(',', '.'));
            if (!Number.isFinite(value) || value < 0) throw new Error('Érvénytelen napi mennyiség az archivált tervben.');
            return [day, value];
        }));
        const dailyTotal = Object.values(daily).reduce((sum, value) => sum + value, 0);
        const source = { daily_values: daily, total_forecast_cartons: planForecast(headers, row, dailyTotal) };
        const key = keyOf(display, periodIndex >= 0 ? row[periodIndex] : null);
        if (!sourceGroups.has(key)) sourceGroups.set(key, []);
        sourceGroups.get(key).push(source);
    }
    const storedGroups = new Map();
    for (const item of items.filter(item => item.type === 'action')) {
        const key = keyOf(item.display_name, item.action_period);
        if (!storedGroups.has(key)) storedGroups.set(key, []);
        storedGroups.get(key).push(item);
    }
    const restored = new Map();
    for (const [key, stored] of storedGroups) {
        let sources = sourceGroups.get(key) || [];
        if (stored.length === 1 && sources.length > 1) {
            sources = [{
                total_forecast_cartons: sources.reduce((sum, row) => sum + row.total_forecast_cartons, 0),
                daily_values: Object.fromEntries(planDays.map(day => [day, sources.reduce((sum, row) => sum + row.daily_values[day], 0)]))
            }];
        }
        if (stored.length !== sources.length) continue;
        const ordered = [...stored].sort((a, b) => Number(a.id) - Number(b.id));
        // Only use an archive which still describes these stored forecasts.
        if (!ordered.every((item, index) => {
            const source = sources[index], total = Number(item.total_forecast_cartons);
            const dailyTotal = Object.values(source.daily_values).reduce((sum, value) => sum + value, 0);
            return Math.abs(total - source.total_forecast_cartons) < 0.011 || Math.abs(total - dailyTotal) < 0.011;
        })) continue;
        ordered.forEach((item, index) => {
            if (!hasDailyPlan(item) && hasDailyPlan(sources[index])) restored.set(item, {
                ...item, daily_values: sources[index].daily_values, total_forecast_cartons: sources[index].total_forecast_cartons
            });
        });
    }
    return { items: items.map(item => restored.get(item) || item), restored: restored.size };
}

module.exports = { planForecast, manualOverrides, hasDailyPlan, restoreArchivedDailyPlans };
