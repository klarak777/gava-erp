const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/finance-transport-lines?shipment_id=X&ref_name=Y
router.get('/', async (req, res) => {
  try {
    const { shipment_id, ref_name } = req.query;
    if (!shipment_id) return res.status(400).json({ error: 'shipment_id megadása kötelező' });

    let query = db('finance_transport_lines')
      .leftJoin('partners', 'finance_transport_lines.partner_id', 'partners.id')
      .leftJoin('currencies', 'finance_transport_lines.currency_id', 'currencies.id')
      .where('finance_transport_lines.shipment_id', shipment_id)
      .select(
        'finance_transport_lines.*',
        'partners.name as partner_name',
        'currencies.code as currency_code'
      )
      .orderBy('finance_transport_lines.line_order', 'asc')
      .orderBy('finance_transport_lines.id', 'asc');

    if (ref_name) {
      query = query.where('finance_transport_lines.ref_name', ref_name);
    }

    const lines = await query;
    res.json(lines);
  } catch (err) {
    console.error('Hiba a transport sorok lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// POST /api/v1/finance-transport-lines – batch mentés (teljes felülírás az adott shipment+ref_name alá)
router.post('/', async (req, res) => {
  try {
    const { shipment_id, ref_name, lines } = req.body;
    if (!shipment_id) return res.status(400).json({ error: 'shipment_id megadása kötelező' });
    if (!Array.isArray(lines)) return res.status(400).json({ error: 'lines tömbnek kell lennie' });

    await db.transaction(async trx => {
      // Töröljük a meglévő sorokat ennél a szállítmánynál és alfuvarnál
      const deleteQuery = trx('finance_transport_lines').where('shipment_id', shipment_id);
      if (ref_name) deleteQuery.where('ref_name', ref_name);
      await deleteQuery.del();

      // Üres sorok szűrése
      const validLines = lines.filter(l => l.amount || l.description || l.partner_name);
      if (validLines.length === 0) return;

      // Partner ID feloldás
      const partnerCache = {};
      const allPartners = await trx('partners').select('id', 'name');
      allPartners.forEach(p => { partnerCache[p.name.toUpperCase()] = p.id; });

      // Currency ID feloldás
      const currCache = {};
      const allCurrencies = await trx('currencies').select('id', 'code');
      allCurrencies.forEach(c => { currCache[c.code.toUpperCase()] = c.id; });

      const rows = validLines.map((l, idx) => {
        const amount = parseFloat(l.amount) || 0;
        const taxPct = parseFloat(l.tax_percent) || 0;
        const taxAmount = amount * (taxPct / 100);
        const totInvoice = amount + taxAmount;
        const exchRt = parseFloat(l.exchange_rate) || 0;
        const totalInvLocal = totInvoice * exchRt;

        return {
          shipment_id,
          ref_name: ref_name || '',
          line_order: idx,
          date_entry: l.date_entry || null,
          type_supp: l.type_supp || '',
          partner_id: l.partner_name ? (partnerCache[(l.partner_name || '').toUpperCase()] || null) : null,
          invoice_number: l.invoice_number || '',
          type_a: l.type_a || '',
          description: l.description || '',
          amount,
          tax_percent: taxPct,
          tax_amount: taxAmount,
          tot_invoice: totInvoice,
          currency_id: l.currency_code ? (currCache[(l.currency_code || '').toUpperCase()] || null) : null,
          exchange_rate: exchRt,
          total_inv_local: totalInvLocal,
          id_empr: l.id_empr || '',
          season: l.season || '',
          truck_nr: l.truck_nr || ''
        };
      });

      await trx('finance_transport_lines').insert(rows);
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Hiba a transport sorok mentésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});

module.exports = router;
