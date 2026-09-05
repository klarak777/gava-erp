# GAVA ERP – Fejlesztési Összefoglaló és Változásjegyzék (V0.8.5)

**Dátum:** 2026. szeptember 4–5.  
**Verzió:** V0.8.5  
**Környezet:** DigitalOcean (Production) / Local  
**Fejlesztési időszak:** ~12 óra (2026-09-04 15:00 – 2026-09-05 03:00)

---

## Összefoglaló

Ebben a verzióban két fő fejlesztési ág futott párhuzamosan:

1. **ADMIN – LOKÁCIÓK modul** (új teljes modul): Raktárhelyek kezelése, barcode generálás, vonalkód nyomtatás.
2. **PDA – Komissió javítások**: Kamion oszlop eltávolítása, és a kartonszám mező feliratának cseréje az adatbázisból érkező db/PLT értékre.

---

## Részletes Módosítások

### 1. ADMIN – LOKÁCIÓK modul (új modul)

Teljesen új modul az Admin menüben, amely a raktár tárhely-adatokat kezeli.

#### 1.1 Felső panel – Lista nézet

- **Kereső mező** terméknév/kód alapú szűréshez.
- **Állapot szűrő** legördülő (Aktív, Zárolt).
- **+ ÚJ LOKÁCIÓ** gomb – új lokáció létrehozásához modal.
- **Tábla oszlopok**: Lokáció kód, Lokáció név, Típus, Állapot, Foglaltság.
- 10 sor/oldal pagináció. Sorban kattintva az alsó panel betölti a részleteket.

#### 1.2 Alsó panel – Három részre bontva

**LOKÁCIÓ RÉSZLETEI panel (bal)**
- Lokáció kód, Lokáció név, Típus (Raklap/Komissió), Foglaltság %, Állapot, Vonalkód, Megjegyzés, Létrehozva.
- Vonalkód mező: nyomtató ikonra kattintva JsBarcode alapú vonalkód generálódik (CODE128), a lokáció nevét tartalmazza. A vonalkód felett a lokáció neve jelenik meg. Közvetlen böngésző print ablakból nyomtatható.

**ÖSSZESÍTÉS panel (közép)**
- Összes lokáció, Aktív lokáció, Foglaltság átlag (%), Teljes kapacitás, Aktuális készlet (karton), Szabad kapacitás.

**KÉSZLET panel (jobb)**
- Adott lokációhoz rendelt aktuális árukészlet listája.

#### 1.3 Lokáció szerkesztési modal

- Mezők: Lokáció kód, Lokáció név.
- **Típus legördülő**: Raklap, Komissió.
- Kapacitás (hány raklap/egység fér el).
- Állapot (Aktív / Zárolt).
- Megjegyzés szövegmező.

---

### 2. Adatbázis módosítások (migrációk)

#### 2.1 `aldi_locations` tábla létrehozása
**Fájl:** `server/src/db/migrations/20260903140309_create_aldi_locations.js`

Mezők: id, name, barcode (UNIQUE), type_code, building_num, row_num, aisle_num, location_num, cooling_type, created_at, updated_at.

#### 2.2 `aldi_locations` tábla bővítése + `aldi_stock_locations` létrehozása
**Fájl:** `server/src/db/migrations/20260905000000_update_aldi_locations.js`

Új mezők az `aldi_locations` táblán: `status` (Aktív/Zárolt), `location_type` (Raklap/Komissió), `capacity` (INT, default 1), `notes` (TEXT).

Új tábla `aldi_stock_locations`: location_id (FK), order_line_id (FK), quantity_cartons, timestamps.

#### 2.3 `aldi_truck_lines` bővítése
**Fájl:** `server/src/db/migrations/20260903000000_add_is_picked_to_aldi_truck_lines.js`

Új mezők: `is_picked` (BOOLEAN, default false), `picked_cartons` (INTEGER, nullable).

---

### 3. PDA – Komissió modul javítások

#### 3.1 Kamion (Truck) oszlop eltávolítása
Az ALDI PDA Komissió lista nézetéből eltávolításra került a **Kamion** oszlop.

**Fájl:** `PDA UI/js/views/commission.js`

#### 3.2 Kartonszám mező felirat – db/PLT megjelenítése

```
Régi felirat:  Kartonszám (max. 20 db)
Új felirat:    Kartonszám (10 db/plt)
```

A tartalék felirat (`Kartonszám (max. X db)`) akkor jelenik meg, ha az adott tételhez nincs `plt` érték az adatbázisban.

#### 3.3 Backend API – `plt` mező hozzáadása
**Fájl:** `server/src/routes/pda.js`

A `GET /api/v1/pda/commission-lines` lekérdezésébe bekerült: `aldi_truck_lines.cartons_per_pallet as plt`.

#### 3.4 Cache-buster frissítések (v=8)
- `PDA UI/index.html`
- `PDA UI/js/app.js`
- `Access UI/src/modules/pda_emulator.js`

---

## Érintett Fájlok

| Fájl | Változás |
|------|---------|
| `Access UI/index.html` | Verziószám: V0.8.5 |
| `Access UI/src/modules/lokaciok.js` | ÚJ modul |
| `Access UI/src/modules/admin.js` | LOKÁCIÓK regisztrálva |
| `Access UI/src/modules/pda_emulator.js` | Cache v=8, iframe mindig frissül |
| `PDA UI/index.html` | Cache v=8 |
| `PDA UI/js/app.js` | Cache v=8 |
| `PDA UI/js/views/commission.js` | Kamion oszlop törölve, db/PLT felirat |
| `server/src/routes/pda.js` | cartons_per_pallet as plt a SELECT-ben |
| `server/src/routes/locations.js` | ÚJ – CRUD API lokációkhoz |
| `server/src/db/migrations/20260903000000_add_is_picked_to_aldi_truck_lines.js` | ÚJ migráció |
| `server/src/db/migrations/20260903140309_create_aldi_locations.js` | ÚJ migráció |
| `server/src/db/migrations/20260905000000_update_aldi_locations.js` | ÚJ migráció |

---

## DigitalOcean – Élesítési Lépések

### SSH csatlakozás és könyvtár

```bash
ssh root@<DO_SZERVER_IP>
cd /opt/gava-erp   # vagy ahol a projekt található
```

### 1. Forráskód frissítése

```bash
git pull origin main
```

Ha nincs git-alapú deploy, töltsd fel SCP/SFTP-vel a fenti táblázatban szereplő összes módosított fájlt.

### 2. Adatbázis migrációk futtatása

```bash
docker compose -f docker-compose.prod.yml exec gava_api npm run migrate
```

Elvárt kimenet:
```
Using environment: production
Batch 1 run: 3 migrations
  20260903000000_add_is_picked_to_aldi_truck_lines
  20260903140309_create_aldi_locations
  20260905000000_update_aldi_locations
```

### 3. Backend container újraindítása

```bash
docker compose -f docker-compose.prod.yml restart gava_api
```

### 4. Nginx újratöltése (frontend statikus fájlok)

```bash
docker compose -f docker-compose.prod.yml exec gava_frontend nginx -s reload
```

### 5. Ellenőrzés

```bash
# Migrációk állapota
docker compose -f docker-compose.prod.yml exec gava_api npx knex migrate:status --knexfile knexfile.js

# API ellenőrzés (JWT token szükséges)
curl http://localhost:3000/api/v1/pda/commission-lines \
  -H "Authorization: Bearer <TOKEN>"
# Elvárt: minden sorban szerepel a "plt" mező
```

### 6. Böngésző cache törlése

Az ERP felületen: **Ctrl + Shift + Del** → Gyorsítótár törlése, majd **Ctrl + F5**.

---

## Ellenőrzési Lista (QA)

- [ ] ADMIN → LOKÁCIÓK megjelenik a menüben
- [ ] Lokáció lista töltődik, keresés és állapot szűrés működik
- [ ] + ÚJ LOKÁCIÓ gombra modal nyílik, Típus: Raklap / Komissió
- [ ] Vonalkód nyomtató ikonra kattintva megjelenik a vonalkód a lokáció nevével
- [ ] PDA Komissió listában nincs Kamion oszlop
- [ ] PDA Komissió tételre kattintva felirat: `Kartonszám (10 db/plt)` (Nektarin esetén)

---

*Minden migráció visszagörgethető: `npm run migrate:rollback`. Az ALDI adatok nem sérültek.*
