const knex = require('knex')(require('../../knexfile').development);

async function run() {
  try {
    const transporters = await knex('transporters').select('id', 'name').orderBy('name');
    const partners = await knex('partners').select('id', 'name', 'type');

    // Normalize for matching
    const normalize = (name) => {
      if (!name) return '';
      return name.toUpperCase().replace(/\s+/g, ' ').trim();
    };

    const partnerMap = new Map();
    for (const p of partners) {
      partnerMap.set(normalize(p.name), p);
    }

    let matched = 0;
    let inserted = 0;

    for (const t of transporters) {
      const normT = normalize(t.name);
      
      // Try exact match
      let partner = partnerMap.get(normT);

      // Try prefix matching (word boundary, min 4 chars)
      if (!partner && normT.length >= 4) {
        for (const [normP, p] of partnerMap) {
          if (normP.length < 4) continue;
          if (normT === normP || normT.startsWith(normP + ' ') || normP.startsWith(normT + ' ')) {
            partner = p;
            break;
          }
        }
      }

      if (partner) {
        // Update type to fuvarozó (don't overwrite existing type if already set to something more specific)
        const updates = { type: 'fuvarozó' };
        // If already vevő or szállító, keep that but we mark as fuvarozó too – 
        // For simplicity, set to fuvarozó (transport companies are usually not customers/suppliers)
        await knex('partners').where('id', partner.id).update(updates);
        console.log(`MATCH: Transporter "${t.name}" => Partner "${partner.name}" (ID:${partner.id}, prev type:${partner.type})`);
        matched++;
      } else {
        // Insert new partner as fuvarozó
        await knex('partners').insert({
          name: t.name,
          type: 'fuvarozó',
          is_active: true,
          is_inactive: false,
          is_natural_person: false,
        });
        console.log(`NEW: Transporter "${t.name}" inserted as new partner`);
        inserted++;
      }
    }

    console.log(`\n===== EREDMÉNY =====`);
    console.log(`Fuvarozó típussal párosítva meglévő partnerrel: ${matched}`);
    console.log(`Új fuvarozó partner beillesztve: ${inserted}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
