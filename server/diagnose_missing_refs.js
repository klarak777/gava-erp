const db = require('./src/db/db');

async function findMissingRefs() {
  try {
    // Mely partner_id-k szerepelnek a shipment_lines-ban de nincs Reference azonosítójuk?
    const linesPartners = await db('shipment_lines as sl')
      .join('shipments as s', 'sl.shipment_id', 's.id')
      .join('partners as p', 'sl.partner_id', 'p.id')
      .where('s.is_loaded', true)
      .whereNotNull('sl.partner_id')
      .whereNotExists(function() {
        this.from('partner_identifiers as pi')
          .whereRaw('pi.partner_id = sl.partner_id')
          .where('pi.id_type', '(Reference) Szállítók')
          .where(function() { this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive'); });
      })
      .distinct('sl.partner_id', 'p.name')
      .select('sl.partner_id', 'p.name');
      
    console.log('Partner-ek amelyeknek NINCS aktív Reference azonosítójuk:');
    console.log('Darab:', linesPartners.length);
    linesPartners.forEach(p => {
      console.log('  ID: ' + p.partner_id + ' - ' + p.name);
    });
    
    // Ezen felül: melyek a leggyakrabban előforduló ilyen partner_id-k (legtöbb fuvarban szerepelnek)?
    const freq = await db('shipment_lines as sl')
      .join('shipments as s', 'sl.shipment_id', 's.id')
      .join('partners as p', 'sl.partner_id', 'p.id')
      .where('s.is_loaded', true)
      .whereNotNull('sl.partner_id')
      .whereNotExists(function() {
        this.from('partner_identifiers as pi')
          .whereRaw('pi.partner_id = sl.partner_id')
          .where('pi.id_type', '(Reference) Szállítók')
          .where(function() { this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive'); });
      })
      .groupBy('sl.partner_id', 'p.name')
      .orderBy('cnt', 'desc')
      .select('sl.partner_id', 'p.name', db.raw('COUNT(*) as cnt'));
      
    console.log('\nLegtöbbször szerepló partnerek fuvarokban (amelyeknek hiányzik a Reference):');
    freq.slice(0, 30).forEach(p => {
      console.log('  ' + p.cnt + 'x - ID: ' + p.partner_id + ' - ' + p.name);
    });
    
  } catch (e) {
    console.error(e);
  } finally {
    db.destroy();
  }
}
findMissingRefs();
