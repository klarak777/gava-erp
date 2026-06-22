# Fejlesztési Napló – V0.4.0 – 2026-06-20

## Összefoglalás
A **Fuvarmegbízások** és az **EKAEREK** modulok összekötése a valós PostgreSQL adatbázissal (a korábbi statikus `mockData` tesztadatok teljes eltávolításával). Az adatbázis sémájának bővítése, az importált adatok konzisztenciájának javítása, valamint a frontend-backend közötti kétirányú adatkapcsolat megvalósítása (GET és PUT végpontok).

---

## Változtatások

### 1. Adatbázis séma bővítése (Migráció)
- **Fájl:** `server/src/db/migrations/20260620000001_013_add_file_date_to_documents.js`
- Új migráció létrehozása, amely hozzáadja a `file_date` (dátum) mezőt a `transport_orders` és `ekaer_records` táblákhoz.
- Ez a mező tárolja az eredeti Excel/CSV importból származó dokumentum kiállítási dátumokat (`Fuvarm_FileDate` és `EKAER_FileDate`).

### 2. Új Backend API végpontok
- **Modul 1 (Fuvarmegbízások):** `server/src/routes/transport_orders.js`
  - `GET /api/v1/transport-orders`: Lekéri a fuvarmegbízásokat, összekapcsolva a szállítmányokkal (`shipments`), a szezonokkal (`seasons`) és a fuvarozókkal (`transporters`). Dátumként elsődlegesen a `file_date` mezőt használja, másodlagosan a `loading_date`-et.
  - `PUT /api/v1/transport-orders/:id`: Lehetővé teszi az `is_sent` (Kiküldve) státusz valós idejű módosítását és mentését az adatbázisba.
- **Modul 2 (EKAEREK):** `server/src/routes/ekaer.js`
  - `GET /api/v1/ekaer-records`: Lekéri az EKAER dokumentumokat, összekapcsolva a szállítmányokkal, a szezonokkal és a fuvarozókkal. Dátumként a `file_date`-et vagy `load_date`-et adja vissza.
  - `PUT /api/v1/ekaer-records/:id`: Lehetővé teszi az `is_sent` (Kiküldve) státusz valós idejű módosítását és mentését az adatbázisba.
- **API regisztráció:** `server/server.js`
  - Regisztráltuk a két új útvonalat az Express szerveren az `/api/v1/transport-orders` és `/api/v1/ekaer-records` utak alatt.

### 3. Frontend UI Bekötés és Refaktor
- **Fájl 1:** `Access UI/src/modules/fuvarmegbizas.js`
  - Eltávolítottuk a statikus `mockData` tömböt.
  - Dinamikus adatlekérdezést implementáltunk a `fetch('/api/v1/transport-orders')` segítségével.
  - A szűrési és keresési logikát a szerverről érkező valós adatszerkezethez igazítottuk.
  - Az `is_sent` (Kiküldve) checkbox módosításakor azonnali `PUT` kérést indítunk a backend felé. Hiba esetén a rendszer értesíti a felhasználót, és visszaállítja a checkbox korábbi állapotát.
  - Dátumformázás frissítése: Az adatbázis dátumait `YYYY. MM. DD.` formátumban jelenítjük meg.
- **Fájl 2:** `Access UI/src/modules/ekaerek.js`
  - Eltávolítottuk a statikus `mockData` tömböt.
  - Dinamikus lekérdezést implementáltunk a `fetch('/api/v1/ekaer-records')` segítségével.
  - A szűrési és keresési logikát a valós adatokhoz igazítottuk.
  - Az `is_sent` (Kiküldve) checkbox módosítását összekötöttük a megfelelő `PUT` API végponttal.

### 4. Adatintegritás és Történelmi Adatok Javítása
- Az új üres PostgreSQL adatbázis feltöltése során észleltük, hogy a fresh indításkor lefutó `011`-es migráció nem jelölte meg a szállítmányokat rakodottként (mivel a CSV importok csak a migrációk után futottak le).
- Emiatt a Rakodás modulban több mint 6500 történelmi szállítmány jelent meg nyitottként.
- **Javítás:** Futtattunk egy adatbázis-szintű frissítést, amely az összes korábbi szezonhoz tartozó történelmi szállítmányt `is_loaded = true` állapotba helyezett, és kizárólag a 25-26-os szezon aktív, nyitott 8 fuvarját hagyta meg rakodásra váró státuszban. Ezzel a Rakodás modul állapota tökéletesen megegyezik a kívánt üzleti logikával.

### 5. Docker Környezet Frissítése
- Mivel a backend Node.js kódja a Docker build során beépül a `gava_erp_prod_api` képbe, a változtatások élesítéséhez újraépítettük és újraindítottuk az API konténert:
  `docker-compose -f docker-compose.prod.yml up -d --build gava_api`
- A frontend bind-mount technológiát használ, így a UI módosítások újraépítés nélkül, azonnal megjelentek.

---

## Érintett fájlok

| Fájl | Módosítás típusa | Leírás |
|------|-----------------|--------|
| `server/server.js` | MODIFY | Új routerek regisztrálása |
| `server/src/routes/transport_orders.js` | NEW | Fuvarmegbízások API (GET és PUT) |
| `server/src/routes/ekaer.js` | NEW | EKAER API (GET és PUT) |
| `server/src/db/migrations/20260620000001_013_add_file_date_to_documents.js` | NEW | `file_date` mezők hozzáadása az adatbázis táblákhoz |
| `Access UI/src/modules/fuvarmegbizas.js` | MODIFY | Statikus adatok eltávolítása, API fetch, valós idejű checkbox mentés és dátumformázás |
| `Access UI/src/modules/ekaerek.js` | MODIFY | Statikus adatok eltávolítása, API fetch, valós idejű checkbox mentés |

---

## Jövőbeli Feladatok és Fejlesztési Irány
- **Fájl letöltés / megnyitás:** A dokumentumok nevére kattintás jelenleg egy figyelmeztető alertet dob ("Backend folyamat..." / "Nem sikerült a dokumentum letöltése"). A valós dokumentumok (Word, PDF) fizikai megnyitását és letöltését egy későbbi fázisban valósítjuk meg, amint a helyi fájlkiszolgáló API végpontjai (a megosztott mappák elérésére) kiépítésre kerülnek.

---

## Verzió
`V0.4.0` (előző: V0.3.6 – 2026-06-18)
