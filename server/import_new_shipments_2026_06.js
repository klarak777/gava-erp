// import_new_shipments_2026_06.js
// Új fuvarok bevitele: H200 (25-26), LOG357-LOG362, EX023 (25-26)
// 2026-06-18

const knex = require('./knexfile');
const db = require('knex')(knex.development || knex);

async function main() {
  const SEASON_ID = 7; // 25-26 szezon

  // Fuvarozó ID-k
  const tmap = {
    'KUSEK': 7,
    'KÓNYA': 6,
    'DERBY': 71,
    'HZ LOGISTICS': 131,
    'BOGNÁR': 2,
    'HILLTOP': 116,
    'LIVIU': 22,
    'PAP': 134
  };

  // Új fuvarok adatai a kép alapján
  const newShipments = [
    {
      order_number: 'H200',
      truck_type: 'H',
      truck_seq_number: 200,
      season_id: SEASON_ID,
      transporter_id: tmap['KUSEK'],
      plate_number: '€ 2105 HH / E 9135 EE',
      loading_place: 'GÖRÖGORSZÁG',
      loading_date: '2026-06-04',
      arrival_date: '2026-06-07',
      transport_price: 0,
      transport_currency: 'EUR',
      is_loaded: true,
      comment: null
    },
    {
      order_number: 'LOG361',
      truck_type: 'LOG',
      truck_seq_number: 361,
      season_id: SEASON_ID,
      transporter_id: tmap['KÓNYA'],
      plate_number: 'AI HK 728 / AE EX 857',
      loading_place: 'HOLLANDIA',
      loading_date: '2026-06-04',
      arrival_date: '2026-06-08',
      transport_price: 3000,
      transport_currency: 'EUR',
      is_loaded: true,
      comment: null
    },
    {
      order_number: 'LOG362',
      truck_type: 'LOG',
      truck_seq_number: 362,
      season_id: SEASON_ID,
      transporter_id: tmap['DERBY'],
      plate_number: 'AA AV 905 / WAZ 138',
      loading_place: 'HOLLANDIA',
      loading_date: '2026-06-04',
      arrival_date: null,
      transport_price: 2450,
      transport_currency: 'EUR',
      is_loaded: true,
      comment: null
    },
    {
      order_number: 'LOG357',
      truck_type: 'LOG',
      truck_seq_number: 357,
      season_id: SEASON_ID,
      transporter_id: tmap['HZ LOGISTICS'],
      plate_number: null,
      loading_place: 'BELGIUM',
      loading_date: '2026-06-05',
      arrival_date: '2026-06-08',
      transport_price: 418,
      transport_currency: 'EUR',
      is_loaded: true,
      comment: 'SAN NICOLASNAK 500 AT KELL SZÁMLÁZNI'
    },
    {
      order_number: 'LOG358',
      truck_type: 'LOG',
      truck_seq_number: 358,
      season_id: SEASON_ID,
      transporter_id: tmap['BOGNÁR'],
      plate_number: 'NNC 099 / WAF 176',
      loading_place: 'MURCIA',
      loading_date: '2026-06-05',
      arrival_date: '2026-06-08',
      transport_price: 3000,
      transport_currency: 'EUR',
      is_loaded: true,
      comment: 'A FRUSALMÉDNEK 4300 AT KELL SZÁMLÁZNI'
    },
    {
      order_number: 'LOG359',
      truck_type: 'LOG',
      truck_seq_number: 359,
      season_id: SEASON_ID,
      transporter_id: tmap['HILLTOP'],
      plate_number: 'SNA 673 / WDI 280',
      loading_place: 'HOLLANDIA',
      loading_date: '2026-06-05',
      arrival_date: '2026-06-08',
      transport_price: 2450,
      transport_currency: 'EUR',
      is_loaded: true,
      comment: 'OLYMPICNEK 2700 ET KELL SZÁMLÁZNI'
    },
    {
      order_number: 'LOG360',
      truck_type: 'LOG',
      truck_seq_number: 360,
      season_id: SEASON_ID,
      transporter_id: tmap['DERBY'],
      plate_number: 'AA HM 392 / AO RK 848',
      loading_place: 'HOLLANDIA',
      loading_date: '2026-06-05',
      arrival_date: '2026-06-08',
      transport_price: 2470,
      transport_currency: 'EUR',
      is_loaded: true,
      comment: 'OLYMPICNEK 2700 ET KELL SZÁMLÁZNI'
    },
    {
      order_number: 'EX023',
      truck_type: 'EX',
      truck_seq_number: 23,
      season_id: SEASON_ID,
      transporter_id: tmap['LIVIU'],
      plate_number: 'RSJ 409 / WAZ 060',
      loading_place: 'FELSŐPAKONY',
      loading_date: '2026-06-07',
      arrival_date: '2026-06-08',
      transport_price: 0,
      transport_currency: 'EUR',
      is_loaded: true,
      comment: 'EUROGROUP DEUTSCHLAND NAK 2700 ET KELL SZÁMLÁZNI'
    }
  ];

  console.log(`🚀 ${newShipments.length} új fuvar importálása...`);

  // Ellenőrzés – ne duplikáljunk
  for (const s of newShipments) {
    const exists = await db('shipments')
      .where({ order_number: s.order_number, season_id: SEASON_ID })
      .first();

    if (exists) {
      console.log(`⚠️  KIHAGYVA (már létezik 25-26 szezonban): ${s.order_number}`);
      continue;
    }

    const [id] = await db('shipments').insert({
      order_number: s.order_number,
      truck_type: s.truck_type,
      truck_seq_number: s.truck_seq_number,
      season_id: s.season_id,
      transporter_id: s.transporter_id,
      plate_number: s.plate_number || '',
      loading_place: s.loading_place || '',
      loading_date: s.loading_date,
      arrival_date: s.arrival_date || null,
      transport_price: s.transport_price || 0,
      transport_currency: s.transport_currency || 'EUR',
      is_loaded: s.is_loaded ? true : false,
      comment: s.comment || null
    }).returning('id');

    const newId = typeof id === 'object' ? id.id : id;
    console.log(`✅ ${s.order_number} – ID: ${newId} (${s.loading_place}, ${s.loading_date})`);
  }

  // LOG356 is_loaded ellenőrzés
  const log356 = await db('shipments').where('order_number','LOG356').orderBy('id','desc').first();
  if (log356) {
    if (!log356.is_loaded) {
      await db('shipments').where('id', log356.id).update({ is_loaded: true });
      console.log('✅ LOG356 is_loaded=true beállítva');
    } else {
      console.log('ℹ️  LOG356 már is_loaded=true');
    }
  }

  console.log('\n✅ Import kész!');
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Hiba:', e.message);
  process.exit(1);
});
