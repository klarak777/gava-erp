require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware-ek beállítása
app.use(cors());
app.use(express.json());

// Szolgáljuk ki a statikus frontend fájlokat
const path = require('path');
  app.use((req, res, next) => {
    // JS/CSS file cache disable
    if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // API route cache disable
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
app.use(express.static(path.join(__dirname, '../Access UI')));
app.use('/pda', express.static(path.join(__dirname, '../PDA UI')));
app.use('/documents', express.static(path.join(__dirname, 'documents')));

// Útvonalak (Routes) importálása
const seasonsRouter = require('./src/routes/seasons');
const shipmentsRouter = require('./src/routes/shipments');
const shipmentLinesRouter = require('./src/routes/shipment_lines');
const transportersRouter = require('./src/routes/transporters');
const productsRouter = require('./src/routes/products');
const partnersRouter = require('./src/routes/partners_extended');
const cargoDemandsRouter = require('./src/routes/cargo_demands');
const transportOrdersRouter = require('./src/routes/transport_orders');
const ekaerRouter = require('./src/routes/ekaer');
const adminRouter = require('./src/routes/admin');
const financeTransportLinesRouter = require('./src/routes/finance_transport_lines');
const financeUnitCostLinesRouter = require('./src/routes/finance_unit_cost_lines');
const partnersByRoleRouter = require('./src/routes/partners_by_role');
const uploadsRouter = require('./src/routes/uploads');
const aiRouter = require('./src/routes/ai');
const chainProductsRouter = require('./src/routes/chain_products');
const aldiWeeklyPricesRouter = require('./src/routes/aldi_weekly_prices');
const aldiDailyOrdersRouter = require('./src/routes/aldi_daily_orders');
const aldiWeeklyCommitmentsRouter = require('./src/routes/aldi_weekly_commitments');
const aldiCrossDockingRouter = require('./src/routes/aldi_cross_docking');
const pdaRouter = require('./src/routes/pda');
const locationsRouter = require('./src/routes/locations');

// Egyszerű teszt végpont
app.get('/api/v1/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Gava ERP Backend fut!',
    environment: process.env.NODE_ENV
  });
});

// Végpontok regisztrálása
app.use('/api/v1/seasons', seasonsRouter);
app.use('/api/v1/shipments', shipmentsRouter);
app.use('/api/v1/shipment-lines', shipmentLinesRouter);
app.use('/api/v1/transporters', transportersRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/partners', partnersRouter);
app.use('/api/v1/cargo-demands', cargoDemandsRouter);
app.use('/api/v1/transport-orders', transportOrdersRouter);
app.use('/api/v1/ekaer-records', ekaerRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/finance-transport-lines', financeTransportLinesRouter);
app.use('/api/v1/finance-unit-cost-lines', financeUnitCostLinesRouter);
app.use('/api/v1/partners-by-role', partnersByRoleRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/chain-products', chainProductsRouter);
app.use('/api/v1/aldi-weekly-prices', aldiWeeklyPricesRouter);
app.use('/api/v1/aldi-daily-orders', aldiDailyOrdersRouter);
app.use('/api/v1/aldi-weekly-commitments', aldiWeeklyCommitmentsRouter);
app.use('/api/v1/aldi-cross-docking', aldiCrossDockingRouter);
app.use('/api/v1/pda', pdaRouter);
app.use('/api/v1/locations', locationsRouter);

// Szerver indítása
app.listen(PORT, () => {
  console.log(`[SERVER] A backend API elindult a http://localhost:${PORT} címen`);
  
  // Időszakos takarítás: elinduláskor és 6 óránként törli az 1 napnál régebbi ideiglenes MI fájlokat
  const aiService = require('./src/services/aiService');
  aiService.cleanupOldTemporaryDocuments(24);
  setInterval(() => {
    aiService.cleanupOldTemporaryDocuments(24);
  }, 6 * 60 * 60 * 1000);
});
