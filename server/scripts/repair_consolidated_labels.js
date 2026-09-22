const db = require('../src/db/db');

async function repairConsolidatedLabels() {
  console.log('=== Érintett Összeemelt (Master) és Normál SSCC Címkék Helyreállítása ===\n');

  // 1. Összes címke lekérése
  const allLabels = await db('sscc_labels');
  console.log(`Összesen ${allLabels.length} raklapcímke található az adatbázisban.`);

  // 2. Mester SSCC-k azonosítása
  const masterSsccSet = new Set();
  for (const l of allLabels) {
    if (l.is_consolidated_master === true || l.is_consolidated_master === 1) {
      masterSsccSet.add(l.sscc);
    }
    if (l.consolidated_sscc) {
      masterSsccSet.add(l.consolidated_sscc);
    }
    if (l.product_name === 'Vegyes raklap') {
      masterSsccSet.add(l.sscc);
    }
  }

  console.log(`Összesen ${masterSsccSet.size} lehetséges összeemelt (mester) raklap azonosítva.\n`);

  let updatedMastersCount = 0;
  let updatedChildrenCount = 0;

  for (const masterSscc of masterSsccSet) {
    const master = await db('sscc_labels').where('sscc', masterSscc).first();
    if (!master) {
      console.warn(`[FIGYELEM] A(z) ${masterSscc} mester SSCC rekordként nem létezik az sscc_labels táblában!`);
      continue;
    }

    console.log(`----------------------------------------------------------------`);
    console.log(`Mester raklap feldolgozása: ID=${master.id}, SSCC=${master.sscc}, Kamion=${master.truck_number}`);

    // Gyermekek keresése:
    // a) consolidated_sscc = master.sscc
    // b) pallets_json-ban tárolt SSCC-k
    let memberSsccs = [];
    if (master.pallets_json) {
      try {
        const parsed = JSON.parse(master.pallets_json);
        if (Array.isArray(parsed)) {
          memberSsccs = parsed.map(String);
        }
      } catch (_) {}
    }

    const childrenByCons = await db('sscc_labels').where('consolidated_sscc', master.sscc);
    const childrenByJson = memberSsccs.length > 0 ? await db('sscc_labels').whereIn('sscc', memberSsccs) : [];

    // Egyesítés unióként (önmagát kizárva)
    const childMap = new Map();
    for (const c of [...childrenByCons, ...childrenByJson]) {
      if (c.id !== master.id) {
        childMap.set(c.id, c);
      }
    }

    const children = Array.from(childMap.values());
    console.log(`  Csatolt rész-raklapok száma: ${children.length} db`);

    if (children.length > 0) {
      // 1. Minden gyermekre biztosítjuk a consolidated_sscc meglétét
      for (const child of children) {
        if (child.consolidated_sscc !== master.sscc) {
          await db('sscc_labels').where('id', child.id).update({
            consolidated_sscc: master.sscc
          });
          updatedChildrenCount++;
          console.log(`    -> Gyermek ID=${child.id} (${child.sscc}) consolidated_sscc beállítva: ${master.sscc}`);
        }
      }

      // 2. Gyermekek adatainak összegzése
      const sumCartons = children.reduce((s, c) => s + (parseInt(c.picked_cartons, 10) || 0), 0);
      const sumGross = children.reduce((s, c) => s + (parseFloat(c.gross_weight) || 0), 0);
      const sumNet = children.reduce((s, c) => s + (parseFloat(c.net_weight) || 0), 0);

      const deliveryDates = [...new Set(children.map(c => c.delivery_date).filter(Boolean))];
      const finalDeliveryDate = deliveryDates.length > 0 ? deliveryDates[0] : master.delivery_date;

      const updatedPalletsJson = JSON.stringify(children.map(c => c.sscc));

      const updateData = {
        is_consolidated_master: true,
        product_name: master.product_name || 'Vegyes raklap',
        picked_cartons: sumCartons > 0 ? sumCartons : master.picked_cartons,
        gross_weight: sumGross > 0 ? sumGross : master.gross_weight,
        net_weight: sumNet > 0 ? sumNet : master.net_weight,
        delivery_date: finalDeliveryDate,
        pallets_json: updatedPalletsJson
      };

      await db('sscc_labels').where('id', master.id).update(updateData);
      updatedMastersCount++;

      console.log(`  -> Mester rekord sikeresen frissítve:`);
      console.log(`     Termék neve: ${updateData.product_name}`);
      console.log(`     Kartonszám: ${updateData.picked_cartons} #`);
      console.log(`     Bruttó kg: ${updateData.gross_weight} kg`);
      console.log(`     Nettó kg: ${updateData.net_weight} kg`);
      console.log(`     Szállítási dátum: ${updateData.delivery_date}`);
      console.log(`     pallets_json (${children.length} db SSCC): ${updatedPalletsJson}`);
      console.log(`     Összeemelt tételek:`);
      for (const c of children) {
        console.log(`       - Termék neve: ${c.product_name || '-'}, Kartonszám: ${c.picked_cartons || '-'} #, Azonosító: ${c.sscc}`);
      }
    } else {
      console.log(`  [INFO] Ehhez a mesterhez nem található közvetlen gyermek raklap.`);
      if (!master.is_consolidated_master) {
        await db('sscc_labels').where('id', master.id).update({ is_consolidated_master: true });
        console.log(`  -> is_consolidated_master=true beállítva.`);
      }
    }
  }

  // 3. Normál címkék súlyának biztosítása a komissiókból (ha bármelyik még hiányos lenne)
  console.log('\nNormál címkék ellenőrzése és pótlása...');
  const normalLabels = await db('sscc_labels')
    .where(function() {
      this.where('is_consolidated_master', false).orWhereNull('is_consolidated_master');
    })
    .whereNotNull('commission_line_id');

  let normalFixedCount = 0;
  for (const label of normalLabels) {
    if (label.gross_weight == null || label.net_weight == null) {
      const commissionLine = await db('aldi_commission_lines').where('id', label.commission_line_id).first();
      if (commissionLine) {
        await db('sscc_labels').where('id', label.id).update({
          gross_weight: commissionLine.gross_weight !== null ? commissionLine.gross_weight : label.gross_weight,
          net_weight: commissionLine.net_weight !== null ? commissionLine.net_weight : label.net_weight,
          lot_number: commissionLine.lot_number || label.lot_number
        });
        normalFixedCount++;
      }
    }
  }
  console.log(`Pótolt / ellenőrzött normál címkék: ${normalFixedCount} db.`);

  console.log(`\n================================================================`);
  console.log(`KÉSZ! Frissített mester raklapok: ${updatedMastersCount} db.`);
  console.log(`Frissített gyermek raklap kapcsolatok: ${updatedChildrenCount} db.`);
  console.log(`================================================================\n`);

  process.exit(0);
}

repairConsolidatedLabels().catch(err => {
  console.error('Hiba történt a javítás során:', err);
  process.exit(1);
});
