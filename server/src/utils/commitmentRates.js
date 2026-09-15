const RATE_PROFILES = [
  { id: 'action_four', group: 'Akció', label: 'Szerda–csütörtök–péntek–szombat', defaults: { wed: 30, thu: 30, fri: 22, sat: 18 } },
  { id: 'action_three', group: 'Akció', label: 'Vasárnap–hétfő–kedd', defaults: { sun: 40, mon: 40, tue: 20 } },
  { id: 'action_two', group: 'Akció', label: 'Péntek–szombat', defaults: { fri: 70, sat: 30 } },
  { id: 'off_four', group: 'Akción kívüli időszak', label: 'Szerda–csütörtök–péntek–szombat', defaults: { wed: 25, thu: 25, fri: 25, sat: 25 } },
  { id: 'off_three', group: 'Akción kívüli időszak', label: 'Vasárnap–hétfő–kedd', defaults: { sun: 20, mon: 30, tue: 50 } },
  { id: 'off_five', group: 'Akción kívüli időszak', label: 'Szerda–csütörtök–vasárnap–hétfő–kedd', defaults: { wed: 25, thu: 25, sun: 15, mon: 15, tue: 20 } },
  { id: 'normal', group: 'Normál időszak', label: 'Teljes hét', defaults: { wed: 17, thu: 17, fri: 17, sat: 13, sun: 14, mon: 11, tue: 11 } }
];
function defaultRates() {
  return Object.fromEntries(RATE_PROFILES.map(p => [p.id, { ...p.defaults }]));
}
function validateRates(input) {
  const errors = [];
  const rates = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: ['Hiányzó százalékok.'] };
  for (const profile of RATE_PROFILES) {
    const values = input[profile.id];
    const days = Object.keys(profile.defaults);
    if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).length !== days.length) {
      errors.push(`${profile.group}: ${profile.label} – hiányos vagy hibás napok.`);
      continue;
    }
    let total = 0, valid = true;
    rates[profile.id] = {};
    for (const day of days) {
      const value = values[day];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) {
        valid = false;
      } else {
        rates[profile.id][day] = value;
        total += Math.round(value * 100);
      }
    }
    if (!valid) errors.push(`${profile.group}: ${profile.label} – minden érték 0–100% közötti, legfeljebb két tizedesjegyű szám legyen.`);
    else if (total !== 10000) errors.push(`${profile.group}: ${profile.label} – az összeg ${total / 100}%, pontosan 100% szükséges.`);
  }
  if (Object.keys(input).some(id => !RATE_PROFILES.some(p => p.id === id))) errors.push('Ismeretlen időszak.');
  return { rates, errors };
}
module.exports = { RATE_PROFILES, defaultRates, validateRates };
