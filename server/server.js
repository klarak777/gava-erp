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
app.use(express.static(path.join(__dirname, '../Access UI')));

// Útvonalak (Routes) importálása
const seasonsRouter = require('./src/routes/seasons');
const shipmentsRouter = require('./src/routes/shipments');
const shipmentLinesRouter = require('./src/routes/shipment_lines');
const transportersRouter = require('./src/routes/transporters');
const productsRouter = require('./src/routes/products');
const partnersRouter = require('./src/routes/partners');
const cargoDemandsRouter = require('./src/routes/cargo_demands');

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

// Szerver indítása
app.listen(PORT, () => {
  console.log(`[SERVER] A backend API elindult a http://localhost:${PORT} címen`);
});
