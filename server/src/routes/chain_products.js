const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/chain-products?chain=ALDI
router.get('/', async (req, res) => {
  try {
    const { chain = 'ALDI', search } = req.query;
    let query = db('chain_products')
      .where('is_active', true)
      .whereRaw('LOWER(chain) = ?', [chain.toLowerCase()]);

    if (search) {
      const s = `%${search.toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw('LOWER(product_name) LIKE ?', [s])
            .orWhereRaw('LOWER(article_number) LIKE ?', [s])
            .orWhereRaw('LOWER(gtin) LIKE ?', [s])
            .orWhereRaw('LOWER(ean) LIKE ?', [s])
            .orWhereRaw('LOWER(label) LIKE ?', [s]);
      });
    }

    const rows = await query.orderBy('id', 'asc');
    res.json(rows);
  } catch (err) {
    console.error('Hiba a lánc termékek lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// POST /api/v1/chain-products/sync (Batch save products for a chain on Mentés click)
router.post('/sync', async (req, res) => {
  try {
    const { chain = 'ALDI', products = [] } = req.body;
    const chainUpper = (chain || 'ALDI').toUpperCase();

    await db.transaction(async trx => {
      // Get existing active products
      const existing = await trx('chain_products')
        .where({ chain: chainUpper, is_active: true });
      
      const existingMap = new Map(existing.map(e => [e.id, e]));
      const incomingIds = new Set();

      for (const p of products) {
        const pName = p.name || p.product_name || '';
        const pArticle = p.articleNo || p.article_number || '';
        const pGtin = p.gtin || '';
        const pEan = p.ean || '';
        const pLabel = p.label || '';

        if (!pName && !pArticle) continue; // Skip empty rows

        if (p.id && !String(p.id).startsWith('tmp-') && existingMap.has(Number(p.id))) {
          incomingIds.add(Number(p.id));
          await trx('chain_products')
            .where('id', p.id)
            .update({
              product_name: pName,
              article_number: pArticle,
              gtin: pGtin,
              ean: pEan,
              label: pLabel,
              updated_at: new Date()
            });
        } else {
          // Insert new
          const [ins] = await trx('chain_products').insert({
            chain: chainUpper,
            product_name: pName,
            article_number: pArticle,
            gtin: pGtin,
            ean: pEan,
            label: pLabel,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }).returning('id');
          if (ins) incomingIds.add(ins.id || ins);
        }
      }

      // Deactivate items removed in UI
      for (const item of existing) {
        if (!incomingIds.has(item.id)) {
          await trx('chain_products')
            .where('id', item.id)
            .update({ is_active: false, updated_at: new Date() });
        }
      }
    });

    const updatedList = await db('chain_products')
      .where({ chain: chainUpper, is_active: true })
      .orderBy('id', 'asc');

    // Automatikusan azonosítjuk a korábban feltöltött Heti Árak tételeket az új GTIN-ek alapján
    if (chainUpper === 'ALDI') {
      await db.raw(`
        UPDATE aldi_weekly_price_lines
        SET chain_product_id = cp.id,
            is_gtin_matched = true
        FROM chain_products cp
        WHERE aldi_weekly_price_lines.chain_product_id IS NULL
          AND aldi_weekly_price_lines.gtin = cp.gtin
          AND cp.chain = 'ALDI'
          AND cp.is_active = true
      `);
    }

    res.json({ success: true, products: updatedList });
  } catch (err) {
    console.error('Hiba a lánc termékek szinkronizálásakor:', err);
    res.status(500).json({ error: 'Belső szerverhiba a mentés során' });
  }
});

// POST /api/v1/chain-products
router.post('/', async (req, res) => {
  try {
    const {
      chain = 'ALDI', product_name, name, article_number, articleNo, gtin, ean, label,
      label_class, label_size, label_origin, label_lot, label_gln, label_net_weight_carton, label_net_weight_unit, label_custom_texts
    } = req.body;
    const finalName = product_name || name;

    if (!finalName) {
      return res.status(400).json({ error: 'A termék megnevezése kötelező!' });
    }

    const [inserted] = await db('chain_products').insert({
      chain: (chain || 'ALDI').toUpperCase(),
      product_name: finalName,
      article_number: article_number || articleNo || '',
      gtin: gtin || '',
      ean: ean || '',
      label: label || '',
      label_class: label_class || '',
      label_size: label_size || '',
      label_origin: label_origin || '',
      label_lot: label_lot || '',
      label_gln: label_gln || '',
      label_net_weight_carton: label_net_weight_carton || '',
      label_net_weight_unit: label_net_weight_unit || '',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    if (inserted && inserted.chain === 'ALDI') {
      await db.raw(`
        UPDATE aldi_weekly_price_lines
        SET chain_product_id = cp.id,
            is_gtin_matched = true
        FROM chain_products cp
        WHERE aldi_weekly_price_lines.chain_product_id IS NULL
          AND aldi_weekly_price_lines.gtin = cp.gtin
          AND cp.id = ?
      `, [inserted.id]);
    }

    res.status(201).json(inserted);
  } catch (err) {
    console.error('Hiba az új lánc termék létrehozásakor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// PUT /api/v1/chain-products/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name, name, article_number, articleNo, gtin, ean, label, is_active,
      label_class, label_size, label_origin, label_lot, label_gln, label_net_weight_carton, label_net_weight_unit, label_custom_texts
    } = req.body;

    const updateData = {
      updated_at: new Date()
    };

    if (product_name !== undefined || name !== undefined) updateData.product_name = product_name || name;
    if (article_number !== undefined || articleNo !== undefined) updateData.article_number = article_number !== undefined ? article_number : articleNo;
    if (gtin !== undefined) updateData.gtin = gtin;
    if (ean !== undefined) updateData.ean = ean;
    if (label !== undefined) updateData.label = label;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (label_class !== undefined) updateData.label_class = label_class;
    if (label_size !== undefined) updateData.label_size = label_size;
    if (label_origin !== undefined) updateData.label_origin = label_origin;
    if (label_lot !== undefined) updateData.label_lot = label_lot;
    if (label_gln !== undefined) updateData.label_gln = label_gln;
    if (label_net_weight_carton !== undefined) updateData.label_net_weight_carton = label_net_weight_carton;
    if (label_net_weight_unit !== undefined) updateData.label_net_weight_unit = label_net_weight_unit;
    if (label_custom_texts !== undefined) updateData.label_custom_texts = typeof label_custom_texts === "string" ? label_custom_texts : JSON.stringify(label_custom_texts);

    const [updated] = await db('chain_products')
      .where('id', id)
      .update(updateData)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'A megadott termék nem található!' });
    }

    if (updated.chain === 'ALDI') {
      await db.raw(`
        UPDATE aldi_weekly_price_lines
        SET chain_product_id = cp.id,
            is_gtin_matched = true
        FROM chain_products cp
        WHERE aldi_weekly_price_lines.chain_product_id IS NULL
          AND aldi_weekly_price_lines.gtin = cp.gtin
          AND cp.id = ?
      `, [updated.id]);
    }

    res.json(updated);
  } catch (err) {
    console.error('Hiba a lánc termék frissítésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// DELETE /api/v1/chain-products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db('chain_products')
      .where('id', id)
      .update({ is_active: false, updated_at: new Date() })
      .returning('*');

    if (!deleted) {
      return res.status(404).json({ error: 'A megadott termék nem található!' });
    }

    res.json({ success: true, message: 'Termék sikeresen inaktiválva/törölve' });
  } catch (err) {
    console.error('Hiba a lánc termék törlésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});




const HTMLToDocx = require('html-to-docx');

// GET /api/v1/chain-products/:id/label
router.get('/:id/label', async (req, res) => {
    try {
        const product = await db('chain_products').where('id', req.params.id).first();
        if (!product) return res.status(404).json({ error: 'Nincs ilyen termék' });

        let texts = {};
        if (product.label_custom_texts) {
            try {
                texts = typeof product.label_custom_texts === 'string' ? JSON.parse(product.label_custom_texts) : product.label_custom_texts;
            } catch(e) {}
        }
        
        const c_pieza = texts.title_pieza || 'pieza:';
        const c_caja = texts.title_caja || 'CAJA:';
        const c_class = texts.lbl_class || 'oszt.';
        const c_size = texts.lbl_size || 'Méret:';
        const c_origin = texts.lbl_origin || 'Származási hely:';
        const c_company = texts.lbl_company || 'GAVA-Hungria Kft.';
        const c_address = texts.lbl_address || 'H-1239 Budapest, Nagykőrösi út 353.';
        const c_lot = texts.lbl_lot || 'LOT:';
        const c_gln = texts.lbl_gln || 'GLN:';
        const c_weight = texts.lbl_weight || 'Nettó tömeg:';
        const c_ean = texts.lbl_ean || 'EAN 13:';
        const p_name = texts.product_name || product.product_name || '';

        const html = `
        <div style="font-family: Arial, sans-serif; font-size: 11pt;">
            <!-- PIEZA (EGYSÉG) -->
            <p>${c_pieza}</p>
            <table style="width: 100%; border: 1pt solid black; border-collapse: collapse; text-align: center;">
                <tr>
                    <td style="border: 1px solid black; padding: 12pt;">
                        <p style="font-size: 14pt; margin-bottom: 12pt;"><strong>${p_name.toUpperCase()}</strong></p>
                        <p style="margin-bottom: 12pt;">${product.label_class || 'I.'} ${c_class} ${c_size} ${product.label_size || ''}</p>
                        <p style="margin-bottom: 12pt;">${c_origin} ${product.label_origin || ''}</p>
                        <p style="margin-bottom: 4pt;">${c_company}</p>
                        <p style="margin-bottom: 12pt;">${c_address}</p>
                        <p style="margin-bottom: 12pt;">${c_lot} ${product.label_lot || ''} ${c_gln} ${product.label_gln || ''}</p>
                        <p style="margin-bottom: 12pt;">${c_weight} ${product.label_net_weight_unit || ''}</p>
                        <p><strong>${c_ean} ${product.ean || ''}</strong></p>
                    </td>
                </tr>
            </table>

            <br/><br/><br/>

            <!-- CAJA (KARTON) -->
            <p>${c_caja}</p>
            <table style="width: 100%; border: 1pt solid black; border-collapse: collapse; text-align: center;">
                <tr>
                    <td style="border: 1px solid black; padding: 12pt;">
                        <p style="font-size: 14pt; margin-bottom: 12pt;"><strong>${p_name.toUpperCase()}</strong></p>
                        <p style="margin-bottom: 12pt;">${product.label_class || 'I.'} ${c_class} ${c_size} ${product.label_size || ''}</p>
                        <p style="margin-bottom: 12pt;">${c_origin} ${product.label_origin || ''}</p>
                        <p style="margin-bottom: 4pt;">${c_company}</p>
                        <p style="margin-bottom: 12pt;">${c_address}</p>
                        <p style="margin-bottom: 12pt;">${c_lot} ${product.label_lot || ''} ${c_gln} ${product.label_gln || ''}</p>
                        <p><strong>${c_weight} ${product.label_net_weight_carton || ''}</strong></p>
                    </td>
                </tr>
            </table>
        </div>`;

        const fileBuffer = await HTMLToDocx(html, null, {
            table: { row: { cantSplit: true } },
            footer: false,
            pageNumber: false
        });

        const safeFileName = (product.product_name || 'Cimke').replace(/\*/g, 'x').replace(/[^a-zA-Z0-9_\-]/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}.docx"`);
        res.send(fileBuffer);
    } catch (error) {
        console.error('Hiba DOCX generálásakor:', error);
        res.status(500).json({ error: 'DOCX generálási hiba' });
    }
});


module.exports = router;
