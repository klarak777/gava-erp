const express = require('express');
const router = express.Router();
const knex = require('../db/db');

// GET all loaded trucks and their lines for Fuvarok összesítő
router.get('/', async (req, res) => {
  try {
    const { kamion_szam, termek, partner, szezon, fuvarozo_ceg } = req.query;

    let query = knex('aldi_truck_lines as tl')
      .join('aldi_trucks as t', 't.id', 'tl.aldi_truck_id')
      .leftJoin('aldi_commission_lines as cl', function() {
        this.on('cl.aldi_truck_line_id', '=', 'tl.id')
            .orOn(function() {
                this.on('cl.aldi_truck_id', '=', 't.id')
                    .andOn('cl.product_name', '=', 'tl.product_name')
                    .andOnNull('cl.aldi_truck_line_id');
            });
      })
      .where('t.is_loaded', true)
      .select(
        'tl.id',
        'tl.aldi_truck_id',
        'tl.pallets as raklap',
        'tl.product_name as termek',
        'tl.order_type as partner',
        'tl.komment',
        'tl.fuvar_koltseg',
        'tl.raklap_ar',
        't.delivery_date as szallitasi_nap',
        't.truck_number as kamionszam',
        't.transporter as fuvarozo_ceg',
        't.license_plate_1',
        't.license_plate_2'
      )
      .sum('cl.gross_weight as brutto_kg')
      .sum('cl.net_weight as netto_kg')
      .sum('cl.cartons as total_cartons')
      .groupBy(
        'tl.id',
        'tl.aldi_truck_id',
        'tl.pallets',
        'tl.product_name',
        'tl.order_type',
        'tl.komment',
        'tl.fuvar_koltseg',
        'tl.raklap_ar',
        't.delivery_date',
        't.truck_number',
        't.transporter',
        't.license_plate_1',
        't.license_plate_2'
      )
      .orderBy('t.delivery_date', 'desc')
      .orderBy('t.truck_number', 'asc');

    if (kamion_szam) {
      query = query.where('t.truck_number', 'ilike', `%${kamion_szam}%`);
    }
    if (termek) {
      query = query.where('tl.product_name', 'ilike', `%${termek}%`);
    }
    if (partner) {
      query = query.where('tl.order_type', 'ilike', `%${partner}%`);
    }
    if (fuvarozo_ceg) {
      query = query.where('t.transporter', 'ilike', `%${fuvarozo_ceg}%`);
    }
    if (szezon) {
      const m = szezon.match(/Season (\d+)-(\d+)/i);
      if (m) {
        const y1 = 2000 + parseInt(m[1], 10);
        const y2 = 2000 + parseInt(m[2], 10);
        query = query.where('t.delivery_date', '>=', `${y1}-09-01`)
                     .where('t.delivery_date', '<', `${y2}-09-01`);
      }
    }

    const rows = await query;

    const formatted = rows.map(r => {
      const netto = parseFloat(r.netto_kg) || 0;
      const cartons = parseInt(r.total_cartons) || 0;
      const atlag_suly = cartons > 0 ? (netto / cartons).toFixed(2) : 0;
      
      const rendszamParts = [];
      if (r.license_plate_1) rendszamParts.push(r.license_plate_1);
      if (r.license_plate_2) rendszamParts.push(r.license_plate_2);

      return {
        id: r.id,
        raklap: r.raklap,
        termek: r.termek,
        partner: r.partner || 'ALDI',
        komment: r.komment || '',
        brutto_kg: parseFloat(r.brutto_kg) || 0,
        netto_kg: netto,
        atlag_suly: parseFloat(atlag_suly),
        szallitasi_nap: r.szallitasi_nap,
        kamionszam: r.kamionszam,
        fuvarozo_ceg: r.fuvarozo_ceg,
        rendszam: rendszamParts.join(' / '),
        fuvar_koltseg: r.fuvar_koltseg || 0,
        raklap_ar: r.raklap_ar || 0
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error in GET /aldi-fuvarok:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update fuvar fields
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { komment, fuvar_koltseg, raklap_ar } = req.body;

    await knex('aldi_truck_lines')
      .where('id', id)
      .update({
        komment,
        fuvar_koltseg,
        raklap_ar
      });

    res.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /aldi-fuvarok/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
