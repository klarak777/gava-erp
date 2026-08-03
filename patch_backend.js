const fs = require('fs');

let backendContent = fs.readFileSync('server/src/routes/partners_extended.js', 'utf8');

// 1. Modify /active/search endpoint
backendContent = backendContent.replace(
    /const partners = await db\('partners'\)\s*\.where\(b => b\.where\('is_inactive', false\)\.orWhereNull\('is_inactive'\)\)\s*\.andWhere\('name', 'like', `\$\{q\}%`\)\s*\.select\('id', 'name'\)\s*\.limit\(50\);/,
    `const includeInactive = req.query.include_inactive === 'true';
        let query = db('partners');
        
        if (!includeInactive) {
            query = query.where(b => b.where('is_inactive', false).orWhereNull('is_inactive'));
        }
        
        const partners = await query
            .andWhereRaw('LOWER(name) LIKE ?', [\`\${q.toLowerCase()}%\`])
            .select('id', 'name', 'is_inactive')
            .limit(50);`
);

// 2. Update /identifiers/:id/reassign validation logic
backendContent = backendContent.replace(
    `        if (!identifier.is_inactive && targetPartner.is_inactive) {
            return res.status(400).json({ error: 'Aktív azonosítót nem lehet inaktív partnerhez rendelni!' });
        }

        if (!identifier.is_inactive && ROLE_ID_TYPES.includes(identifier.id_type)) {
            const conflict = await db('partner_identifiers as pi')
                .join('partners as p', 'p.id', 'pi.partner_id')
                .where('pi.id_type', identifier.id_type)
                .whereRaw('UPPER(TRIM(pi.value)) = ?', [normalizeIdentifierValue(identifier.value)])
                .andWhere('pi.is_inactive', false)
                .andWhereNot('pi.id', identifier.id)
                .select('p.name as partner_name')
                .first();

            if (conflict) {
                return res.status(400).json({
                    error: \`Ilyen névvel ("\${identifier.value}") már van aktív azonosító a "\${identifier.id_type}" \` +
                           \`szerepkörben, a(z) "\${conflict.partner_name}" partnerhez rendelve!\`
                });
            }
        }`,
    `        if (!identifier.is_inactive && targetPartner.is_inactive) {
            return res.status(400).json({ error: 'Aktív azonosítót nem lehet inaktív partnerhez rendelni!' });
        }

        if (ROLE_ID_TYPES.includes(identifier.id_type)) {
            if (!identifier.is_inactive) {
                // Aktív azonosító -> Globális ütközés vizsgálat
                const conflict = await db('partner_identifiers as pi')
                    .join('partners as p', 'p.id', 'pi.partner_id')
                    .where('pi.id_type', identifier.id_type)
                    .whereRaw('UPPER(TRIM(pi.value)) = ?', [normalizeIdentifierValue(identifier.value)])
                    .andWhere('pi.is_inactive', false)
                    .andWhereNot('pi.id', identifier.id)
                    .select('p.name as partner_name')
                    .first();

                if (conflict) {
                    return res.status(400).json({
                        error: \`Ilyen névvel ("\${identifier.value}") már van aktív azonosító a "\${identifier.id_type}" \` +
                               \`szerepkörben, a(z) "\${conflict.partner_name}" partnerhez rendelve!\`
                    });
                }
            } else {
                // Inaktív azonosító -> Lokális ütközés vizsgálat a célpartneren
                const conflict = await db('partner_identifiers')
                    .where('partner_id', target_partner_id)
                    .where('id_type', identifier.id_type)
                    .whereRaw('UPPER(TRIM(value)) = ?', [normalizeIdentifierValue(identifier.value)])
                    .andWhereNot('id', identifier.id)
                    .first();

                if (conflict) {
                    return res.status(400).json({
                        error: \`A kiválasztott partnernél már létezik "\${identifier.value}" nevű azonosító a "\${identifier.id_type}" szerepkörben (aktív vagy inaktív formában)!\`
                    });
                }
            }
        }`
);

fs.writeFileSync('server/src/routes/partners_extended.js', backendContent, 'utf8');
console.log('partners_extended.js updated successfully!');
