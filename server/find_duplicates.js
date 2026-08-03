const db = require('./src/db/db');

async function findDuplicates() {
    try {
        const activeIdentifiers = await db('partner_identifiers as pi')
            .join('partners as p', 'p.id', 'pi.partner_id')
            .where(function() {
                this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
            })
            .select('pi.id as pi_id', 'p.id as p_id', 'pi.id_type', 'pi.value', 'p.name as p_name')
            .orderBy('pi.value', 'asc');

        const map = {};
        for (const i of activeIdentifiers) {
            const key = `${i.id_type}::${(i.value || '').toUpperCase().trim()}`;
            if (!map[key]) map[key] = [];
            map[key].push(i);
        }

        const duplicates = [];
        for (const [key, items] of Object.entries(map)) {
            if (items.length > 1) {
                duplicates.push({ key, items });
            }
        }

        console.log("Found", duplicates.length, "duplicate active roles:");
        console.log(JSON.stringify(duplicates, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}

findDuplicates();
