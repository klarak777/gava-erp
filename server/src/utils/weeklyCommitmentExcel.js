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

module.exports = { planForecast, manualOverrides };
