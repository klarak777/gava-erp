/**
 * Migration 040: Sync partner_identifiers from apply_overrides.js and fix_broken_force.js
 *
 * This migration replicates the manual data changes that were applied to the local DB
 * via apply_overrides.js and fix_broken_force.js scripts, so the DO production server
 * gets the same partner role assignments (Customer, Reference, Transporter) and name fixes.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {

  // Build a set of all valid partner IDs on this server for safe lookups
  const allPartners = await knex('partners').select('id');
  const validIds = new Set(allPartners.map(p => p.id));

  // Helper: insert or update a partner_identifier record
  // Silently skips if the partner_id doesn't exist on this server.
  async function upsertIdentifier(partnerId, idType, value) {
    if (!partnerId) return;
    if (!validIds.has(partnerId)) {
      console.log(`[040] Skipping ${idType} "${value}" - partner ID ${partnerId} not found on this server.`);
      return;
    }
    const existing = await knex('partner_identifiers')
      .where({ partner_id: partnerId, id_type: idType })
      .first();

    if (existing) {
      await knex('partner_identifiers')
        .where('id', existing.id)
        .update({ value: value, updated_at: new Date() });
    } else {
      await knex('partner_identifiers').insert({
        partner_id: partnerId,
        id_type: idType,
        value: value,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  // =========================================================================
  // STEP 1: Fix broken/garbled character values in partner_identifiers
  // (from fix_broken_force.js)
  // =========================================================================
  await knex('partner_identifiers').where('value', 'like', 'ANTON D%RBECK').update({ value: 'ANTON DÜRBECK', updated_at: new Date() });
  await knex('partner_identifiers').where('value', 'like', 'GY%M%LCS%RT').update({ value: 'GYÜMÖLCSÉRT', updated_at: new Date() });
  await knex('partner_identifiers').where('value', 'like', 'K%NYA').andWhereNot('value', 'KÓNYA').update({ value: 'KÓNYA', updated_at: new Date() });
  await knex('partner_identifiers').where('value', 'like', 'SZ%KESI').update({ value: 'SZÉKESI', updated_at: new Date() });
  await knex('partner_identifiers').where('value', 'like', 'T%TH FRIGO').update({ value: 'TÓTH FRIGO', updated_at: new Date() });
  await knex('partner_identifiers').where('value', 'like', 'M%LLER').andWhereNot('value', 'MÜLLER').update({ value: 'MÜLLER', updated_at: new Date() });

  // =========================================================================
  // STEP 2: Rename RONI (ID 2999) to proper name (from apply_overrides.js)
  // =========================================================================
  if (validIds.has(2999)) {
    await knex('partners').where('id', 2999).update({ name: 'Roni Cargo Kft.' });
  }

  // =========================================================================
  // STEP 3: Customer role assignments (from apply_overrides.js manual overrides)
  // Short name => partner_id
  // =========================================================================
  const customerAssignments = [
    { name: 'GAVA',                  pid: 62 },
    { name: 'KOPFSALAT',             pid: 5  },
    { name: 'ALDI AT',               pid: 158 },
    { name: 'CASAS ROYES',           pid: 3  },
    { name: 'CORD',                  pid: 16 },
    { name: 'EUROGROUP ESPANA',      pid: 31 },
    { name: 'EXOTIC FRESH',          pid: 33 },
    { name: 'GHU',                   pid: 8  },
    { name: 'GLOBAL BERRY',          pid: 6  },
    { name: 'GREENCOOP',             pid: 83 },
    { name: 'GREENYARD',             pid: 66 },
    { name: 'HOFER',                 pid: 176 },
    { name: 'IDEAL FRUITS',          pid: 29 },
    { name: 'KV LOGISTIKA',          pid: 180 },
    { name: 'LEHMANN & TROOST',      pid: 76 },
    { name: 'LEVENTE',               pid: 73 },
    { name: 'OLYMPIC FRUIT',         pid: 14 },
    { name: 'R&M',                   pid: 15 },
    { name: 'SPAR HU',               pid: 12 },
    { name: 'SYLVAN',                pid: 1  },
    { name: 'VILLAFRUT',             pid: 190 },
    { name: 'GYÜMÖLCSÉRT',           pid: 18 },
    { name: 'ANTON DÜRBECK',         pid: 47 },
  ];

  for (const { name, pid } of customerAssignments) {
    await upsertIdentifier(pid, '(Customer) Vevők', name);
  }

  // =========================================================================
  // STEP 4: Reference (Szállítók) role assignments
  // =========================================================================
  const referenceAssignments = [
    { name: 'AGROPONIENTE',          pid: 27 },
    { name: 'BILEK',                 pid: 11 },
    { name: 'VEGACANADA',            pid: 49 },
    { name: 'VERMION',               pid: 85 },
    { name: 'TOMATO-AL',             pid: 36 },
    { name: 'SHEBA',                 pid: 42 },
    { name: 'R&M',                   pid: 15 },
    { name: 'LEVENTE',               pid: 73 },
    { name: 'KUSEK',                 pid: 2  },
    { name: 'SMART',                 pid: 17 },
    { name: 'MALENO',                pid: 52 },
    { name: 'KOPFSALAT',             pid: 5  },
    { name: 'KÓNYA',                 pid: 25 },
    { name: 'GREENYARD',             pid: 66 },
    { name: 'FRANIAL',               pid: 9  },
    { name: 'AXARFRUIT',             pid: 34 },
    { name: 'CASI',                  pid: 41 },
    { name: 'CASI PARTIDORES',       pid: 45 },
    { name: 'CLARA',                 pid: 13 },
    { name: 'ESCOFRESH',             pid: 46 },
    { name: 'EXPOALMA',              pid: 40 },
    { name: 'AGRONERVION',           pid: 51 },
    { name: 'AGROPONIENTE NATURAL',  pid: 27 },
    { name: 'BERTIPACK',             pid: 71 },
    { name: 'DELGAFRUITS',          pid: 20 },
    { name: 'DG69',                  pid: 1007 },
    { name: 'ECOINVER BIO',          pid: 84 },
    { name: 'ESCOBAR',               pid: 56 },
    { name: 'ESMAR',                 pid: 288 },
    { name: 'EUROGROUP DEUTSCHLAND', pid: 4685 },
    { name: 'EUROGROUP ESPANA',      pid: 23 },
    { name: 'EXOTIC FRESH',          pid: 33 },
    { name: 'FRUBALMED',             pid: 4  },
    { name: 'CRETAN ROOT',           pid: 86 },
    { name: 'GYÜMÖLCSÉRT',           pid: 18 },
  ];

  for (const { name, pid } of referenceAssignments) {
    await upsertIdentifier(pid, '(Reference) Szállítók', name);
  }

  // =========================================================================
  // STEP 5: Fuvarozók (Transporter) role assignments
  // =========================================================================
  const transporterAssignments = [
    { name: 'VERMION',               pid: 85   },
    { name: 'TRANS-SPED',            pid: 3456 },
    { name: 'THERMO FRUCHT',         pid: 3372 },
    { name: 'STI',                   pid: 3923 },
    { name: 'KUSEK',                 pid: 2    },
    { name: 'SHEBA',                 pid: 42   },
    { name: 'RONI',                  pid: 2999 },
    { name: 'MÜLLER',                pid: 2535 },
    { name: 'MANDERSLOOT',           pid: 68   },
    { name: 'SAN NICOLA',            pid: 77   },
    { name: 'CRETAN ROOT',           pid: 86   },
    { name: 'GAVA',                  pid: 62   },
    { name: 'FRUBALMED',             pid: 4    },
    { name: 'KOPFSALAT',             pid: 5    },
    { name: 'KÓNYA',                 pid: 25   },
  ];

  for (const { name, pid } of transporterAssignments) {
    await upsertIdentifier(pid, 'Fuvarozók', name);
  }

  // =========================================================================
  // STEP 6: Remove duplicate MÜLLER partner (ID 3880) if still present
  // =========================================================================
  try {
    await knex('partner_identifiers').where('partner_id', 3880).del();
    await knex('partners').where('id', 3880).del();
  } catch(err) {
    // Ignore if not present or referenced by FK
  }

  // =========================================================================
  // STEP 7: Delete "NE HASZNÁLD" partners (excluding 2999)
  // =========================================================================
  const badPartners = await knex('partners')
    .where(function() {
      this.where('name', 'ilike', '%NE HASZNÁLD%')
          .orWhere('name', 'ilike', '%NE HASZNALD%')
          .orWhere('name', 'ilike', '%NE HASZN%');
    })
    .andWhere('id', '!=', 2999);

  for (const p of badPartners) {
    try {
      await knex('partner_identifiers').where('partner_id', p.id).del();
      await knex('partners').where('id', p.id).del();
    } catch(err) {
      // Skip if referenced by FK
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // This migration is data-only and not reversible in a simple way.
  // No structural changes were made.
};
