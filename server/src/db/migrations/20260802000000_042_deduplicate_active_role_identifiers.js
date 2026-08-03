/**
 * Migration 042: Aktív szerepkör-azonosítók duplikációjának megszüntetése
 *
 * Szabály: egy szerepkör-kategórián belül (Szállítók / Vevők / Fuvarozók) egy adott
 * név csak EGYETLEN aktív azonosítóként létezhet a rendszerben. Ugyanazon a partneren
 * belül több alias megengedett (pl. CASI / CASI AIRPORT / CASI AEROPORTO), de két
 * KÜLÖNBÖZŐ partner nem viselheti ugyanazt az aktív szerepkör-nevet.
 *
 * A duplikátumokat nem töröljük, csak inaktiváljuk — így az Archív partnerek modulban
 * megmaradnak és bármikor visszaállíthatók.
 *
 * A megtartott oldal minden esetben az, amelyik a névhez ténylegesen illő, adatokban
 * gazdagabb partnerhez tartozik (adószám / közösségi adószám / telephely megléte alapján).
 */

const ROLE_TYPES = ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'];

// [inaktiválandó pi.id, várt partner_id, várt value, indoklás]
const TO_DEACTIVATE = [
  // (A) Ugyanaz a cég kétszer felvéve — a gazdagabb rekord marad aktív
  [5845, 6836, 'AXARFRUIT',             'a 34 AXARFRUIT rekordnál van közösségi adószám (ESB93225811)'],
  [5895, 6898, 'CRETAN ROOT',           'a 86 CRETAN ROOT rekordnál van közösségi adószám (EL997248968)'],
  [5894, 6898, 'CRETAN ROOT',           'a 86 CRETAN ROOT rekordnál van közösségi adószám (EL997248968)'],
  [5898, 6900, 'TOMATO-AL',             'a 36 TOMATO-AL rekordnál van közösségi adószám (L33417001K) és cím'],
  [5900, 6953, 'PAP JÓZSEFNÉ',          'a 321 PAP JÓZSEFNÉ rekordnál van adószám (71863900-2-26) és cím'],
  [5575, 22,   'GAVA POLSKA',           'a 4796 Gava Polska Sp. z o.o. rekordnál van PL adószám, telephely és fuvarozó szerepkör'],
  [5621, 52,   'MALENO',                'a 67 Maleno Y Torres Exportación S.L. rekordnál van közösségi adószám (ESB04820395)'],

  // (B) Idegen partnerhez csúszott referencia — a névhez illő gazdához tartozó marad
  [5683, 288,  'ESMAR',                 'az ESMAR a 184 Esmar Frutas Imp-Exp. SL partnerhez tartozik, nem a JOKER-hez'],
  [5707, 4685, 'EUROGROUP DEUTSCHLAND', 'az EUROGROUP DEUTSCHLAND a 232 Eurogroup Deutschland Gmbh partnerhez tartozik, nem a FŐSPED 2000 KFT.-hez'],
  [5705, 2592, 'NATURINDA',             'a NATURINDA a 2603 NATURINDA, SLNE partnerhez tartozik; a 2592 NANDOPAL,S.L. CCW kódja NANDO'],
  [5317, 3456, 'TRANS-SPED',            'a TRANS-SPED a 365 Trans-Sped Kft. partnerhez tartozik; a 3456 TRIO FRUTTA KFT. CCW kódja TRIOF'],
];

const INDEX_NAME = 'ux_partner_identifiers_active_role_value';

exports.up = async function (knex) {
  // 1. A konkrét, kézzel felülvizsgált duplikátumok inaktiválása.
  //    Csak akkor nyúlunk a rekordhoz, ha pontosan az, amire számítunk — így a
  //    migráció nem tesz kárt eltérő adatállapotú adatbázisban.
  for (const [id, partnerId, value, reason] of TO_DEACTIVATE) {
    const row = await knex('partner_identifiers').where('id', id).first();
    if (!row) {
      console.log(`[042] Kihagyva: a(z) ${id} azonosító nem létezik.`);
      continue;
    }
    if (row.partner_id !== partnerId || (row.value || '').trim().toUpperCase() !== value) {
      console.log(`[042] Kihagyva: a(z) ${id} azonosító nem a várt rekord ` +
        `(partner_id=${row.partner_id}, value="${row.value}").`);
      continue;
    }
    if (row.is_inactive) continue;

    await knex('partner_identifiers').where('id', id).update({ is_inactive: true, updated_at: new Date() });
    console.log(`[042] Inaktiválva #${id} "${value}" (partner ${partnerId}) — ${reason}`);
  }

  // 2. Biztonsági háló: ha a fenti lista után is maradt ütköző aktív név, a
  //    legkésőbb létrehozott (legnagyobb id-jú) példányt inaktiváljuk. Enélkül a
  //    3. lépés egyedi indexe nem tudna létrejönni.
  const remaining = await knex('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereIn('pi.id_type', ROLE_TYPES)
    .andWhere('pi.is_inactive', false)
    .select('pi.id', 'pi.id_type', 'pi.value', 'pi.partner_id', 'p.name');

  const groups = new Map();
  for (const r of remaining) {
    const key = `${r.id_type}::${(r.value || '').trim().toUpperCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    rows.sort((a, b) => a.id - b.id);
    const keep = rows[0];
    const drop = rows.slice(1);
    await knex('partner_identifiers').whereIn('id', drop.map(r => r.id))
      .update({ is_inactive: true, updated_at: new Date() });
    console.log(`[042] Automatikus feloldás "${key}": megtartva #${keep.id} (${keep.name}), ` +
      `inaktiválva ${drop.map(r => `#${r.id} (${r.name})`).join(', ')}`);
  }

  // 3. Adatbázis-szintű védelem: azonos szerepkör-kategórián belül egy név csak
  //    egyszer lehet aktív. A nem szerepkör típusú azonosítókra (Adószám,
  //    CCW + Kód, FELIR stb.) szándékosan NEM vonatkozik — ott létezik legitim
  //    ismétlődés, és az üzleti szabály sem tiltja.
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS ${INDEX_NAME}
    ON partner_identifiers (id_type, UPPER(TRIM(value)))
    WHERE is_inactive = false
      AND id_type IN ('(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók')
  `);
};

exports.down = async function (knex) {
  await knex.raw(`DROP INDEX IF EXISTS ${INDEX_NAME}`);

  const ids = TO_DEACTIVATE.map(([id]) => id);
  await knex('partner_identifiers').whereIn('id', ids).update({ is_inactive: false });
};
