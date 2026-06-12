const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/shipment-lines
// V2 logika: a Total Palets számítása Javascriptben történik a Raklap váltó alapján.
// Szezon + Order Number szinten összegzünk, egyszer váltunk, arányosan osztunk vissza.
router.get('/', async (req, res) => {
  try {
    // 1. Raklapváltó tábla betöltése
    const conversions = await db('pallet_conversion').select('normal_count', 'euro_equivalent');
    const conversionMap = {};
    conversions.forEach(c => { conversionMap[c.normal_count] = c.euro_equivalent; });

    // 2. Fuvaronkénti összesítők: sum_euro, sum_normal - pontosan shipment_id szerint
    const shipmentTotalsRaw = await db('shipment_lines')
      .select('shipment_id')
      .sum('euro_palets as sum_euro')
      .sum('normal_palets as sum_normal')
      .groupBy('shipment_id');

    const shipmentTotals = {};
    shipmentTotalsRaw.forEach(st => {
      shipmentTotals[st.shipment_id] = {
        sum_euro: parseFloat(st.sum_euro) || 0,
        sum_normal: parseFloat(st.sum_normal) || 0
      };
    });

    // 3. Sorok lekérdezése - ÖSSZES mező
    const lines = await db('shipment_lines')
      .select(
        'shipment_lines.id as line_id',
        'shipment_lines.shipment_id',
        'shipment_lines.euro_palets as euro',
        'shipment_lines.normal_palets as norm',
        'shipment_lines.customer as cust',
        'shipment_lines.destination as dest',
        'shipment_lines.comment',
        // Részletes mezők
        'shipment_lines.gross_weight_kg',
        'shipment_lines.price_eur',
        'shipment_lines.price_bcn_eur',
        'shipment_lines.unit',
        'shipment_lines.reloading_per_plt',
        'shipment_lines.transport_bcn_per_plt',
        'shipment_lines.albaran_number',
        'shipment_lines.transport_cost',          // CSV-ből: "Total Transport cost"
        'shipment_lines.transport_cost_product',  // CSV-ből: "Transport Cost / product"

        // Termék és partner
        'products.name as prod',
        'partners.name as ref',

        // Fuvar fejléc adatok (shipments táblából)
        'shipments.order_number',
        'shipments.loading_place',
        'shipments.loading_date',
        'shipments.arrival_date',
        'shipments.transport_price',
        'shipments.plate_number',
        'shipments.invoice_number',
        'shipments.invoice_amount_huf',
        'shipments.invoice_amount_eur',
        'shipments.payment_date',
        'shipments.kb',
        'shipments.b',
        'shipments.t',

        // Kapcsolt táblák
        'seasons.code as season_code',
        'transporters.name as transport_company'
      )
      .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
      .leftJoin('products', 'shipment_lines.product_id', 'products.id')
      .leftJoin('partners', 'shipment_lines.partner_id', 'partners.id')
      .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
      .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id')
      .orderBy('shipments.loading_date', 'desc')
      .limit(15000);

    // 4. Javascript alapú Total Palets számítás (V2 logika a Wiki alapján)
    lines.forEach(line => {
      const st = shipmentTotals[line.shipment_id] || { sum_euro: 0, sum_normal: 0 };
      const sumNormal = st.sum_normal;
      const sumEuro = st.sum_euro;

      // Egyszeri átváltás az egész fuvar normál összegére
      let convertedNormal = 0;
      if (sumNormal > 0) {
        const roundedNormal = Math.round(sumNormal);
        if (conversionMap[roundedNormal] !== undefined) {
          convertedNormal = conversionMap[roundedNormal];
        } else {
          // Extrapoláció ha > 26 (33/26 arány a táblázat alapján)
          convertedNormal = sumNormal * (33.0 / 26.0);
        }
      }

      const grandTotal = sumEuro + convertedNormal;

      const lineEuro = parseFloat(line.euro) || 0;
      const lineNorm = parseFloat(line.norm) || 0;

      // V2: Total Palets = sor Euro + (átváltott normál összeg × sor normál aránya)
      let lineTotal = lineEuro;
      if (sumNormal > 0 && lineNorm > 0) {
        lineTotal += convertedNormal * (lineNorm / sumNormal);
      }

      // Transport Cost per sor számítása (ha nincs CSV-ből adat)
      let calcTransportCost = 0;
      const transportPrice = parseFloat(line.transport_price) || 0;
      if (grandTotal > 0 && transportPrice > 0) {
        calcTransportCost = transportPrice * (lineTotal / grandTotal);
      }

      // 2 tizedesjegyre kerekítés
      line.tot = lineTotal.toFixed(2);
      // Ha a CSV-ből van transport_cost_product érték, azt használjuk; egyébként a számítottat
      if (!line.transport_cost_product || parseFloat(line.transport_cost_product) === 0) {
        line.transport_cost_product = calcTransportCost.toFixed(2);
      } else {
        line.transport_cost_product = parseFloat(line.transport_cost_product).toFixed(2);
      }

      // Shipment_id belső mező törlése
      delete line.shipment_id;
    });

    res.json(lines);
  } catch (err) {
    console.error('Hiba a fuvar részletek lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
