# Fejlesztési Napló és Kiadási Jegyzetek - 2026.09.21 (V0.9.3.5)

**Dátum:** 2026. szeptember 21.  
**Verzió:** V0.9.3.5  
**Érintett komponensek:** PDA UI, Access UI (Admin), Backend API (Node.js/Knex), Adatbázis migrációk, ZPL Címkenyomtatás

---

## 📋 Vezetői Összefoglaló

A mai fejlesztési nap során jelentős architektúrális és funkcionális fejlesztések valósultak meg a raktári folyamatok támogatására:
1. **Teljes körű raklap-konszolidáció (Pallet Consolidation):** Létrejött egy új, 4 lépéses kamion-alapú PDA munkafolyamat és a hozzátartozó Master/Tag SSCC címkemodell, szigorú készlet- és kapacitás-ellenőrzésekkel.
2. **SSCC Címkenyomtatás és ZPL Sablon bővítés:** Kiegészítésre kerültek a raklapcímkék a nettó és bruttó súllyal, tétel-/LOT számmal és szállítási dátummal normál és gyűjtő raklapok esetén is.
3. **PDA Terület (Partner) szűrés és címke-hozzárendelés javítása:** A komissiózási tételek szűrése most már szigorúan illeszkedik a kiválasztott területhez (ALDI, Penny, Tesco), megakadályozva a téves tételek listázását.
4. **Verzióváltás és gyorsítótár-kezelés:** Az ERP és PDA felületeken bevezetésre került a **V0.9.3.5** verzió, megelőzve az ügyféloldali cache-elési problémákat.

---

## 🚀 Részletes Fejlesztések és Új Funkciók

### 1. Raklap Konszolidáció (Pallet Consolidation) Modul Újratervezése

- **4 lépéses, kamion-alapú PDA folyamat:**
  - **1. Lépés (Kamion kiválasztása):** A raktáros kiválasztja a célkamiont/fuvart (`#truckSelectPane`).
  - **2. Lépés (Forrás raklapok beolvasása):** Több forrás SSCC beolvasása vonalkódolvasóval vagy kézi bevitellel. A felület valós időben összegzi a kartonmennyiségeket és tételeket (`#sourceScanPane`).
  - **3. Lépés (Master raklap konfigurálás):** Raklaptípus(ok) kiválasztása, tárasúlyok megadása és jóváhagyás (`#configMasterPane`).
  - **4. Lépés (Összegzés és Nyomtatás):** Gyűjtő raklap és új címke generálása (`#summaryPane`).
- **Master / Tag SSCC adatmodell:**
  - A konszolidált forrásraklapok címkéi `is_consolidated = true` státuszt kapnak, és hivatkoznak a szülő gyűjtőraklapra (`master_sscc_id`).
  - Az új gyűjtő raklap megnevezése egységesen: **"Vegyes raklap"**.
- **Admin UI Raklapcímkék modul integráció:**
  - A konszolidált címkék kiemelésre kerülnek (figyelemfelkeltő sárga háttérrel és jelöléssel).
  - A táblázatban és részletezőben azonnal látható, hogy mely címkék vonódtak össze egyetlen egységbe.
- **Közös raklapkezelő komponens (`palletFlow.js`):**
  - Leválasztásra került egy újrahasznosítható raklapválasztó komponens (`PDA UI/js/components/palletFlow.js`), amely biztosítja a tárasúlyok és raklapok egységes kezelését a komissiózás és a konszolidáció között.

---

### 2. Szigorú Készletellenőrzés és Lokáció Kapacitás

- **Duplikációk és párhuzamos műveletek védelme (`consolidationStock.js`):**
  - A backend most már szigorúan ellenőrzi, hogy egy adott raklap nincs-e folyamatban lévő komissiózásban, nincs-e nyitott provizórikus (ideiglenes) címkéje, illetve nincs-e már konszolidálva.
  - A generálás ideje alatt a PDA felületen a gombok inaktívvá (disabled) válnak, kivédve a többszörös beküldést.
- **Globális lokáció-kapacitás korrekció (`locations.js` és `pda.js`):**
  - A konszolidált forrás SSCC-k fizikai értelemben egy raklapra kerülnek, így a tárolóhely (lokáció) kapacitásszámításánál a rendszer a gyűjtő raklapot és annak tételeit globálisan **1 fizikai raklapként** veszi figyelembe, megelőzve a virtuális túlterhelést a raktártérképen.

---

### 3. Címkenyomtatás (ZPL) és Adatbázis Bővítések

- **Új adatbázis mezők az `sscc_labels` táblában:**
  - `net_weight` (DECIMAL / FLOAT) – Nettó terméksúly
  - `gross_weight` (DECIMAL / FLOAT) – Bruttó súly a raklaptárákkal együtt
  - `lot_number` (VARCHAR) – Tételszám / Sarzs
  - `delivery_date` (DATE / VARCHAR) – Szállítási dátum
- **ZPL Sablon frissítések (`server/src/routes/pda.js`):**
  - A normál és a gyűjtő (Master) raklap ZPL címkéire is felkerült a formázott szállítási határidő/dátum (`YYYY.MM.DD`).
  - Helyes nettó súly számítás és megjelenítés a Master címkéken.
- **Adatkarbantartó script (`update_labels_weights.js`):**
  - Létrejött egy háttérszkript a korábban létrejött, súlyadat nélküli címkék visszamenőleges frissítésére az alapbizonylatokból.

---

### 4. Terület (Partner / Célállomás) Szűrés és Dinamikus Fallback

- **PDA Komissiózás "Terület" szűrő logika:**
  - A felhasználói felületen beállított "Terület" (pl. ALDI, TESCO, PENNY, SPAR) szűrés pontosításra került.
  - **Javított működés:** Amennyiben a felhasználó TESCO vagy PENNY területet választ, de a rendszerben csak ALDI tételek léteznek az adott fuvarhoz/kamionhoz, a PDA nem jeleníti meg az ALDI tételeket idegen partner alatt, hanem üres listát mutat.
- **Dinamikus címke-célállomás (`destination`) hozzárendelés:**
  - Címkegeneráláskor a PDA átadja a kiválasztott területet (`area`) a backendnek.
  - Ha a tételsor nem tartalmaz explicit célállomást, a generált SSCC címke alapértelmezett célállomása dinamikusan a kiválasztott terület (pl. TESCO, PENNY vagy ALDI) lesz.

---

### 5. Verziókövetés és Ügyféloldali Cache Kezelés

- **Verziószám egységesítés (V0.9.3.5):**
  - **Access UI:** `index.html` böngészőfül cím (`<title>`), bejelentkezési doboz és oldalsáv logó verziófelirata frissítve **V0.9.3.5**-re.
  - **PDA UI:** A felesleges verziószám eltávolításra került a munkát zavaró Dashboard felületről, a bejelentkező felületen pontosítva.
  - **Backend:** `server/package.json` verziószáma frissítve **0.9.3.5**-re.
- **Cache-Busting bevezetése:**
  - A böngésző gyorsítótárazási hibáinak elkerülésére a fő JavaScript és CSS betöltések verziószámozott lekérdezéssel (`?v=0.9.3.5`) futnak mind az Access UI, mind a PDA felületen.

---

## 📁 Módosított és Létrehozott Fájlok Jegyzéke

### Frontend (PDA & Access UI)
- `Access UI/index.html`: Verziószám frissítése V0.9.3.5-re, cache buster beállítása.
- `Access UI/src/modules/admin.js`: Konszolidált raklapok megjelenítése, súly- és tételszám oszlopok, fallback javítások.
- `PDA UI/js/views/commission.js`: Terület alapú szűrés javítása, terület átadása címkegenerálásnak.
- `PDA UI/js/views/consolidation.js`: 4 lépéses kamion-alapú folyamat, hibakezelés és gomb-zárolások.
- `PDA UI/js/components/palletFlow.js`: Közös komponens a raklap- és táraválasztás kezelésére.
- `PDA UI/js/views/dashboard.js`: Dashboard tisztítás.
- `PDA UI/js/app.js` és `PDA UI/index.html`: Dinamikus cache buster importok.
- `PDA UI/css/pda-style.css`: Konszolidációs UI és értesítési stílusok.

### Backend & Adatbázis
- `server/src/routes/pda.js`: Konszolidációs végpontok, ZPL kiegészítések, súlyok és szállítási dátum kezelése, terület fallback.
- `server/src/routes/admin.js`: Címkék lekérdezésének kiegészítése a szállítási dátummal és súlyokkal.
- `server/src/routes/locations.js`: Lokáció kapacitás számítás korrekciója konszolidált SSCC-knél.
- `server/src/services/consolidationStock.js`: Készlet- és állapot-ellenőrző szerviz a konszolidációhoz.
- `server/migrations/20260921010000_add_consolidation_to_sscc_labels.js`: `is_consolidated` és `master_sscc_id` mezők.
- `server/migrations/20260921220500_add_weight_and_lot_to_sscc_labels.js`: Súly, lot és szállítási dátum mezők.
- `server/scripts/update_labels_weights.js`: Visszamenőleges súlyfeltöltő szkript.
- `server/package.json`: Verzió frissítése 0.9.3.5-re.

### Tesztek
- `server/tests/pdaConsolidation.test.js`: Backend konszolidációs folyamat és validációs egységtesztek.
- `PDA UI/tests/palletFlow.browser.cjs`: Frontend raklapfolyamat és interakciós tesztek.

---

## 🚀 Telepítési és Frissítési Lépések (Élesítéshez)

Az éles szerveren a módosítások érvényesítéséhez a következő lépések szükségesek:

1. **Forráskód letöltése:**
   ```bash
   git pull origin master
   ```

2. **Adatbázis migrációk futtatása (a backend konténerben):**
   ```bash
   docker-compose -f docker-compose.prod.yml exec server npm run migrate
   ```

3. **Konténerek újraindítása (szükség esetén):**
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```
