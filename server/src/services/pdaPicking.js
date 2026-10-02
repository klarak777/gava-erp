const RESERVATION_MS = 5 * 60 * 1000;
const LOT_MAX_AGE_DAYS = 6;

function pickingError(code, message) {
  return Object.assign(new Error(message), { code });
}

function budapestDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const value = type => Number(parts.find(part => part.type === type).value);
  return new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
}

function isoYear(date) {
  const thursday = new Date(date);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  return thursday.getUTCFullYear();
}

function weekOne(year) {
  const date = new Date(Date.UTC(year, 0, 4));
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() || 7) + 1);
  return date;
}

function lotDate(year, week, day) {
  const first = weekOne(year);
  const weeks = Math.round((weekOne(year + 1) - first) / (7 * 86400000));
  if (week > weeks) return null;
  const result = new Date(first);
  result.setUTCDate(first.getUTCDate() + (week - 1) * 7 + day - 1);
  return result;
}

function validateLot(value, now = new Date()) {
  const lot = String(value ?? '').trim();
  if (!/^\d{4}$/.test(lot)) throw pickingError('INVALID_LOT', 'A LOT pontosan négy számjegy (WWDD) legyen.');
  const week = Number(lot.slice(0, 2)), day = Number(lot.slice(2));
  if (week < 1 || week > 53 || day < 1 || day > 7) {
    throw pickingError('INVALID_LOT', 'Érvénytelen LOT: hét 01–53, hét napja 01–07 (hétfő–vasárnap).');
  }
  const today = budapestDay(now);
  const year = isoYear(today);
  const tomorrow = new Date(today.getTime() + 86400000);
  // A LOT-ban nincs év. A V4 szerint a legutóbbi előfordulást használjuk,
  // egy nap jövőbeli toleranciával; csak valóban létező ISO-hetek jelöltek.
  const date = [...new Set([isoYear(tomorrow), year, year - 1])].map(y => lotDate(y, week, day))
    .find(candidate => candidate && candidate <= tomorrow);
  if (!date) throw pickingError('INVALID_LOT', 'A LOT hete a vizsgált ISO-években nem létezik, vagy nem feloldható.');
  const ageDays = Math.round((today - date) / 86400000);
  return {
    lot, lotDate: date.toISOString().slice(0, 10), today: today.toISOString().slice(0, 10),
    ageDays, expired: ageDays >= LOT_MAX_AGE_DAYS, thresholdDays: LOT_MAX_AGE_DAYS
  };
}

function reservationExpiry(label) {
  return label.reservation_expires_at
    ? new Date(label.reservation_expires_at)
    : new Date(new Date(label.created_at).getTime() + RESERVATION_MS);
}

function assertReservation(label, user, sessionId, lineId, now = new Date()) {
  if (!label) throw pickingError('LABEL_EXPIRED', 'A komissiós címke nem található. Kezdd újra a tételt.');
  if (!user || Number(label.picker_user_id) !== Number(user.id) ||
      label.picker_session_id !== user.sessionId || label.pick_session_id !== sessionId ||
      Number(label.aldi_truck_line_id) !== Number(lineId)) {
    throw pickingError('FORBIDDEN', 'A címke nem ehhez a dolgozóhoz, bejelentkezéshez vagy tételhez tartozik.');
  }
  if (label.reservation_cancelled_at || (label.is_provisional && reservationExpiry(label) <= now)) {
    throw pickingError('LABEL_EXPIRED', 'A komissiós munkamenet lejárt vagy vissza lett vonva. Kezdd újra a tételt.');
  }
}

function pickPayload(data) {
  return {
    picked_cartons: Number(data.picked_cartons), gross_weight: Number(data.gross_weight),
    tare_weight: Number(data.tare_weight), packaging_type: String(data.packaging_type ?? ''),
    origin_country: String(data.origin_country ?? ''), lot_number: String(data.lot_number ?? '').trim(),
    pallet_types: (Array.isArray(data.pallet_types) && data.pallet_types.length ? data.pallet_types : [data.pallet_type]).map(Number),
    area: String(data.area ?? '')
  };
}

function assertSamePayload(label, data) {
  const stored = typeof label.pick_payload === 'string' ? JSON.parse(label.pick_payload) : label.pick_payload;
  if (!stored || JSON.stringify(pickPayload(stored)) !== JSON.stringify(pickPayload(data))) {
    throw pickingError('PICK_CHANGED', 'Az adatok eltérnek a már létrehozott címkétől. Lépj vissza és indíts új komissiót.');
  }
}

function emulatorEnabled(env = process.env) {
  return env.NODE_ENV === 'test' && env.PDA_EMULATOR_ENABLED === 'true' && !!env.PDA_TEST_DATABASE_URL;
}

module.exports = { RESERVATION_MS, pickingError, validateLot, reservationExpiry, assertReservation, pickPayload, assertSamePayload, emulatorEnabled };
