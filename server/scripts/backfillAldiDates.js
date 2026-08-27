const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const knex = require('knex');
const knexConfig = require('../knexfile');
const { validateAldiPeriod } = require('../src/utils/aldiWeeklyDates');
const fs = require('fs');

const db = knex(knexConfig[process.env.NODE_ENV || 'development']);

async function runBackfill() {
  const isApply = process.argv.includes('--apply');
  console.log(`ALDI Heti árak - Biztonságos Dátum validáció backfill script (V2)`);
  console.log(`Mód: ${isApply ? 'APPLY (Mentés az adatbázisba tranzakcióval)' : 'DRY RUN (Nincs mentés, használd a --apply kapcsolót a mentéshez)'}\n`);

  let totalLinesProcessed = 0;
  let linesModified = 0;
  let totalCurrencyPeriodsModified = 0;
  let totalCurrencyPeriodsArchived = 0;
  
  let reportLines = [];
  reportLines.push(['Heti_Ar_ID', 'Sor_ID', 'Termek', 'Regi_Kezdes', 'Regi_Vege', 'Uj_Statusz', 'Uj_Kezdes', 'Uj_Vege', 'DevizaPeriodus_ID', 'Muvelet'].join(','));

  try {
    const weeks = await db('aldi_weekly_prices').select('*');
    console.log(`Összesen ${weeks.length} heti ár rekord található.`);

    await db.transaction(async (trx) => {
      for (const week of weeks) {
        // Idempotency: only fetch lines where original_period_start IS NULL
        const lines = await trx('aldi_weekly_price_lines')
          .where('weekly_price_id', week.id)
          .whereNull('original_period_start');

        if (lines.length > 0) {
            console.log(`\n--- Hét feldolgozása: ID ${week.id} - ${week.year} / ${week.week_number} ---`);
        }

        for (const line of lines) {
          totalLinesProcessed++;
          const originalStart = line.delivery_period_start;
          const originalEnd = line.delivery_period_end;

          let newStatus = 'valid';
          let newStart = originalStart;
          let newEnd = originalEnd;

          const originalStartStr = originalStart ? new Date(originalStart).toISOString().split('T')[0] : null;
          const originalEndStr = originalEnd ? new Date(originalEnd).toISOString().split('T')[0] : null;

          if (originalStartStr && originalEndStr) {
            const val = validateAldiPeriod(originalStartStr, originalEndStr, week.year, week.week_number);
            newStatus = val.status;
            if (val.boundaries && val.status === 'clamped') {
              newStart = Math.max(new Date(originalStartStr).getTime(), new Date(val.boundaries.start).getTime());
              newEnd = Math.min(new Date(originalEndStr).getTime(), new Date(val.boundaries.end).getTime());
              newStart = new Date(newStart).toISOString().split('T')[0];
              newEnd = new Date(newEnd).toISOString().split('T')[0];
            } else if (val.status === 'invalid_outside') {
               newStart = originalStartStr;
               newEnd = originalEndStr;
            } else if (val.status === 'valid') {
               newStart = originalStartStr;
               newEnd = originalEndStr;
            }
          } else {
             newStatus = 'invalid_format';
          }

          const updateData = {
              original_period_start: originalStartStr || null,
              original_period_end: originalEndStr || null,
              period_status: newStatus,
              delivery_period_start: newStart,
              delivery_period_end: newEnd
          };

          linesModified++;
          console.log(`  Sor ID ${line.id} (${line.xlsx_product_name}): ${originalStartStr} - ${originalEndStr} => Státusz: ${newStatus}, Új: ${newStart} - ${newEnd}`);
          reportLines.push([week.id, line.id, `"${line.xlsx_product_name || ''}"`, originalStartStr, originalEndStr, newStatus, newStart, newEnd, '', 'UPDATE_LINE'].join(','));
          
          if (isApply) {
            await trx('aldi_weekly_price_lines').where('id', line.id).update(updateData);
          }

          // Currency periods feldolgozása a sorhoz
          const cPeriods = await trx('aldi_price_currency_periods').where('price_line_id', line.id);
          for (const cp of cPeriods) {
             const cpStartStr = cp.period_start ? new Date(cp.period_start).toISOString().split('T')[0] : null;
             const cpEndStr = cp.period_end ? new Date(cp.period_end).toISOString().split('T')[0] : null;

             if (cpStartStr && cpEndStr) {
                 const cpVal = validateAldiPeriod(cpStartStr, cpEndStr, week.year, week.week_number);
                 if (cpVal.status === 'clamped') {
                    let cpNewStart = Math.max(new Date(cpStartStr).getTime(), new Date(cpVal.boundaries.start).getTime());
                    let cpNewEnd = Math.min(new Date(cpEndStr).getTime(), new Date(cpVal.boundaries.end).getTime());
                    cpNewStart = new Date(cpNewStart).toISOString().split('T')[0];
                    cpNewEnd = new Date(cpNewEnd).toISOString().split('T')[0];

                    if (cpNewStart !== cpStartStr || cpNewEnd !== cpEndStr) {
                        console.log(`    Deviza periódus ID ${cp.id} (Clamped): ${cpStartStr} - ${cpEndStr} => ${cpNewStart} - ${cpNewEnd}`);
                        totalCurrencyPeriodsModified++;
                        reportLines.push([week.id, line.id, `"${line.xlsx_product_name || ''}"`, cpStartStr, cpEndStr, 'clamped', cpNewStart, cpNewEnd, cp.id, 'UPDATE_CP'].join(','));
                        
                        if (isApply) {
                            await trx('aldi_price_currency_periods').where('id', cp.id).update({
                                period_start: cpNewStart,
                                period_end: cpNewEnd
                            });
                        }
                    }
                 } else if (cpVal.status === 'invalid_outside' || cpVal.status === 'invalid_reversed' || cpVal.status === 'invalid_format') {
                    console.log(`    Deviza periódus ID ${cp.id} ARCHIVÁLÁSRA KERÜL (${cpVal.status}): ${cpStartStr} - ${cpEndStr}`);
                    totalCurrencyPeriodsArchived++;
                    reportLines.push([week.id, line.id, `"${line.xlsx_product_name || ''}"`, cpStartStr, cpEndStr, cpVal.status, '', '', cp.id, 'ARCHIVE_DELETE'].join(','));
                    
                    if (isApply) {
                        // 1. Mentés az archív táblába
                        await trx('aldi_price_currency_periods_archive').insert({
                            original_id: cp.id,
                            price_line_id: cp.price_line_id,
                            currency_code: cp.currency_code,
                            period_start: cpStartStr,
                            period_end: cpEndStr,
                            crate_cost: cp.crate_cost,
                            unit_cost: cp.unit_cost,
                            note: cp.note,
                            original_created_at: cp.created_at || null,
                            original_updated_at: cp.updated_at || null,
                            deleted_reason: cpVal.status
                        });
                        // 2. Törlés az eredeti táblából
                        await trx('aldi_price_currency_periods').where('id', cp.id).delete();
                    }
                 }
             }
          }
        }
      }
      
      if (!isApply) {
         // Ha dry-run, visszagörgetjük a tranzakciót biztonságból (bár nem is módosítottunk semmit)
         throw new Error('DRY_RUN_ROLLBACK');
      }
    });

    console.log(`\n=== ÖSSZEGZÉS ===`);
    console.log(`Feldolgozott sorok (ahol original_period_start IS NULL): ${totalLinesProcessed}`);
    console.log(`Módosított ársorok (státusz/dátum/eredeti mentés): ${linesModified}`);
    console.log(`Módosított (csonkolt) deviza periódusok: ${totalCurrencyPeriodsModified}`);
    console.log(`Archivált (és törölt) deviza periódusok: ${totalCurrencyPeriodsArchived}`);
    
    // Riport kiírása
    const reportFilename = `backfill_report_${new Date().getTime()}.csv`;
    fs.writeFileSync(path.join(__dirname, reportFilename), reportLines.join('\n'));
    console.log(`\nRiport elkészítve: server/scripts/${reportFilename}`);

    if (!isApply) {
      console.log(`\nEz egy DRY RUN volt. Futtasd '--apply' kapcsolóval a módosítások véglegesítéséhez.`);
    } else {
      console.log(`\nA módosítások SIKERESEN elmentve az adatbázisba (Tranzakció lezárva).`);
    }

    process.exit(0);

  } catch (e) {
    if (e.message === 'DRY_RUN_ROLLBACK') {
        console.log(`\n=== ÖSSZEGZÉS ===`);
        console.log(`Feldolgozott sorok (ahol original_period_start IS NULL): ${totalLinesProcessed}`);
        const reportFilename = `backfill_report_${new Date().getTime()}.csv`;
        fs.writeFileSync(path.join(__dirname, reportFilename), reportLines.join('\n'));
        console.log(`\nRiport elkészítve: server/scripts/${reportFilename}`);
        console.log(`\nEz egy DRY RUN volt (Tranzakció visszagörgetve biztonságosan). Futtasd '--apply' kapcsolóval a módosítások véglegesítéséhez.`);
        process.exit(0);
    } else {
        console.error('Hiba történt a futtatás során, a tranzakció visszagörgetésre került:', e);
        process.exit(1);
    }
  } finally {
    db.destroy();
  }
}

runBackfill();
