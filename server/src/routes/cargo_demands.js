const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/cargo-demands
// Összes áru igény tétel, termék névvel együtt
router.get('/', async (req, res) => {
  try {
    const rows = await db('cargo_demands')
      .orderBy('id', 'asc');
    res.json(rows);
  } catch (err) {
    console.error('Hiba a cargo_demands lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// POST /api/v1/cargo-demands
// Új áru igény tétel hozzáadása
router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      partner_name,
      customer_name,
      euro_palets,
      normal_palets,
      notes,
      source_shipment_line_id,
      albaran_number,
      destination,
      gross_weight_kg,
      price_eur,
      price_bcn_eur,
      unit,
      reloading_per_plt,
      transport_bcn_per_plt,
      customer_order_no,
      comment
    } = req.body;

    if (!product_name || product_name.trim() === '') {
      return res.status(400).json({ error: 'A termék neve kötelező mező.' });
    }
    if ((parseInt(euro_palets) || 0) === 0 && (parseInt(normal_palets) || 0) === 0) {
      return res.status(400).json({ error: 'Legalább egy raklap típusnál 0-nál nagyobb értéket kell megadni.' });
    }

    const [newId] = await db('cargo_demands').insert({
      product_id: product_id || null,
      product_name: product_name.trim(),
      partner_name: partner_name ? partner_name.trim() : null,
      customer_name: customer_name ? customer_name.trim() : null,
      euro_palets: parseInt(euro_palets) || 0,
      normal_palets: parseInt(normal_palets) || 0,
      notes: notes ? notes.trim() : null,
      is_fulfilled: false,
      source_shipment_line_id: source_shipment_line_id || null,
      albaran_number: albaran_number ? albaran_number.trim() : null,
      destination: destination ? destination.trim() : null,
      gross_weight_kg: parseFloat(gross_weight_kg) || 0,
      price_eur: parseFloat(price_eur) || 0,
      price_bcn_eur: parseFloat(price_bcn_eur) || 0,
      unit: unit ? unit.trim() : null,
      reloading_per_plt: parseFloat(reloading_per_plt) || 0,
      transport_bcn_per_plt: parseFloat(transport_bcn_per_plt) || 0,
      customer_order_no: customer_order_no ? customer_order_no.trim() : null,
      comment: comment ? comment.trim() : (notes ? notes.trim() : null)
    }).returning('id');

    const id = typeof newId === 'object' ? newId.id : newId;
    const created = await db('cargo_demands').where('id', id).first();
    res.status(201).json(created);
  } catch (err) {
    console.error('Hiba a cargo_demands létrehozásakor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});

// PATCH /api/v1/cargo-demands/:id/fulfill
// Áru igény tétel kamionra küldése (részleges vagy teljes)
// Body: { shipment_id, euro_palets, normal_palets }
router.patch('/:id/fulfill', async (req, res) => {
  try {
    const { id } = req.params;
    const { shipment_id, euro_palets, normal_palets } = req.body;

    if (!shipment_id) {
      return res.status(400).json({ error: 'A célkamion (shipment_id) megadása kötelező.' });
    }

    const demand = await db('cargo_demands').where('id', id).first();
    if (!demand) {
      return res.status(404).json({ error: 'Az áru igény tétel nem található.' });
    }

    const sendEuro = Math.min(parseInt(euro_palets) || 0, demand.euro_palets);
    const sendNormal = Math.min(parseInt(normal_palets) || 0, demand.normal_palets);

    if (sendEuro === 0 && sendNormal === 0) {
      return res.status(400).json({ error: 'Legalább 1 raklapot meg kell adni.' });
    }

    const remainEuro = demand.euro_palets - sendEuro;
    const remainNormal = demand.normal_palets - sendNormal;
    const isFulfilled = (remainEuro === 0 && remainNormal === 0);

    const trx = await db.transaction();
    try {
      // 1. Célkamion meglévő tételeinek betöltése (az átvált számításhoz)
      const targetShipment = await trx('shipments').where('id', shipment_id).first();
      if (!targetShipment) throw new Error('A célkamion nem található.');

      // 2. Új sor hozzáadása a célkamionhoz
      await trx('shipment_lines').insert({
        shipment_id: shipment_id,
        product_id: demand.product_id || null,
        customer: demand.customer_name || '',
        euro_palets: sendEuro,
        normal_palets: sendNormal,
        total_palets: sendEuro + sendNormal,
        gross_weight_kg: demand.gross_weight_kg || 0,
        price_eur: demand.price_eur || 0,
        price_bcn_eur: demand.price_bcn_eur || 0,
        unit: demand.unit || '',
        reloading_per_plt: demand.reloading_per_plt || 0,
        transport_bcn_per_plt: demand.transport_bcn_per_plt || 0,
        albaran_number: demand.albaran_number || '',
        customer_order_no: demand.customer_order_no || '',
        comment: demand.comment || demand.notes || '',
        truck_number_per: 0,
        transport_cost_product: 0,
        transport_cost: 0
      });

      // Mivel a products tábla name mezőjét nem tárolhatjuk shipment_lines-ban productName-ként,
      // de a product_id-n keresztül lekérhető, ez rendben van.

      // 3. Áru igény tétel frissítése
      if (isFulfilled) {
        await trx('cargo_demands').where('id', id).update({
          is_fulfilled: true,
          fulfilled_at: new Date(),
          fulfilled_shipment_id: shipment_id
        });
      } else {
        // Részleges küldés: csökkentjük a mennyiséget
        await trx('cargo_demands').where('id', id).update({
          euro_palets: remainEuro,
          normal_palets: remainNormal
        });
      }

      await trx.commit();
      res.json({
        success: true,
        fulfilled: isFulfilled,
        remainEuro,
        remainNormal,
        message: isFulfilled
          ? 'Az összes tétel sikeresen kamionra küldve.'
          : `Részleges küldés sikeres. Maradék: ${remainEuro} Euró + ${remainNormal} Normál raklap.`
      });
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Hiba a cargo_demands fulfill-kor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});

// DELETE /api/v1/cargo-demands/:id
// Áru igény tétel törlése
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('cargo_demands').where('id', id).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Az áru igény tétel nem található.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Hiba a cargo_demands törlésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
