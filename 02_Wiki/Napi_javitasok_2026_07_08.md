# Napi javítások - 2026.07.08 (V0.4.9)

## Menedzser Pénzügyi Modul Fejlesztése

### 1. Adatbázis módosítások
- Létrejött az új `finance_truck_types` (Pénzügyi Kamion Típusok) tábla.
- A `products` tábla kiegészült a `code` (Code Prod) oszloppal.
- A `shipments` és `shipment_lines` táblák megkapták az összes kért pénzügyi mezőt (Invoice, Exchange rate, Tax, Amount stb.).

### 2. Backend API
- Új végpont készült: `PUT /api/v1/shipments/:id/finance` a pénzügyi adatok célzott, biztonságos mentéséhez.
- A `GET /api/v1/shipments/:id` most már támogatja a partner szerinti szűrést (`?ref_name=...`) és automatikusan pótolja a hiányzó/régi `total_palets` értékeket dinamikus kalkulációval.

### 3. Admin UI
- Beépítésre került a **Type Truck (Pénzügyi)** szerkesztő menüpont.
- A **Products** (Termékek) admin felülete kibővült a **Code Prod** mezővel.

### 4. Új Menedzser UI: `menedzser_kamion_szerkesztes.js` (Pénzügyi Kamion Szerkesztő)
- Létrejött egy teljesen új felugró ablak, masszív pénzügyi szerkesztőfelülettel.
- **Kalkulációk:** Automatikus JavaScript kalkulációk számolják a "Nettó Amnt", a "Tax", a "Totals" értékeket és a "Tot Invoice A" összesítőket.
- Csak az adott partnerhez tartozó tételek jelennek meg (per fuvar alapú nézet).
- Kényelmesen lehet új, üres sorokat beszúrni a táblázatba az automatikus számolások megőrzésével.

### 5. Menedzser Modul (`menedzser.js`)
- Bekerült az **Invoice number** (Számlaszám) oszlop a legszélére.
- Az "Order Number"-re való kattintáskor a hagyományos Rakodás nézet helyett már automatikusan az **Új Pénzügyi Kamion Szerkesztő** nyílik meg.
