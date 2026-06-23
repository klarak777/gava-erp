# GAVA Access ERP

Logisztikai / fuvarszervezési ERP rendszer. A cél egy régi MS Access-alapú rendszer
webes platformra (PostgreSQL + Node.js + böngészős UI) történő migrálása. A nyelv
végig **magyar** (UI, kommentek, commit üzenetek, dokumentáció).

## Architektúra

Három fő rész, monorepo-szerűen egy mappában:

| Rész | Hely | Mi ez |
|------|------|-------|
| **Backend API** | `server/` | Node.js + Express 5, REST API (`/api/v1/...`) |
| **Frontend** | `Access UI/` | Vanilla JS (ES modulok), **nincs build lépés**, statikusan kiszolgálva |
| **Adatbázis** | PostgreSQL 16 | Knex migrációkkal kezelve |

### Backend (`server/`)
- **Belépési pont:** `server/server.js` (Express app, itt vannak a routerek regisztrálva).
- **Stack:** Express 5, Knex 3, `pg`, JWT auth (`jsonwebtoken` + `bcryptjs`).
- **DOCX kezelés:** dokumentum-generálás `docxtemplater` + `pizzip`; DOCX→HTML előnézet `mammoth`.
- **Útvonalak:** `server/src/routes/` — pl. `transport_orders.js` (Fuvarmegbízások),
  `ekaer.js` (EKAEREK), `shipments.js`, `shipment_lines.js`, `cargo_demands.js`,
  `seasons.js`, `products.js`, `partners.js`, `transporters.js`.
- **DB hozzáférés:** `server/src/db/db.js`, konfiguráció `server/knexfile.js`.
- **Migrációk:** `server/src/db/migrations/` — sorszámozva (`001`...`015`), időbélyeggel
  előtagolva. Új sémamódosítás MINDIG új migrációs fájllal történjen, ne kézi SQL-lel.
- **Konfiguráció:** `server/src/config/transporterConfig.js` — fuvarozónkénti EKAER
  útvonal- és fájlnév-generáló logika.

### Frontend (`Access UI/`)
- **Belépési pont:** `Access UI/src/main.js`; HTML: `Access UI/index.html`.
- **Modulok:** `Access UI/src/modules/*.js` — minden modul egy `renderXxx()` függvényt
  exportál (pl. `fuvarmegbizas.js`, `ekaerek.js`, `rakodas.js`, `kamion_szerkesztes.js`).
- **Komponensek:** `WindowManager.js` (ablakkezelő), `ModuleLauncher.js`.
- **Navigáció:** `Access UI/src/data/nav-structure.js`.
- Az API-t relatív útvonalon hívja: `fetch('/api/v1/...')`.

## Futtatás / Deploy

Az éles környezet **Dockerben** fut (`docker-compose.prod.yml`):
- `gava_erp_prod_db` — PostgreSQL (DB: `gava_erp`, user: `gava_admin`)
- `gava_erp_prod_api` — backend; a Node.js kód **a build során beépül** a képbe
- `gava_erp_prod_frontend` — nginx, az ERP a **3001-es porton** érhető el; `/api/v1/`
  kéréseket reverse proxyként a `gava_api:3000`-re továbbítja (lásd `nginx.conf`)

Fontos deploy-szabály:
- **Backend változás élesítése:** újra kell buildelni az API konténert:
  `docker-compose -f docker-compose.prod.yml up -d --build gava_api`
- **Frontend változás:** a UI bind-mount, így újraépítés nélkül azonnal él.

Lokális fejlesztés:
- `docker-compose.yml` csak az adatbázist indítja.
- Backend: `cd server && npm start` (ez lefuttatja `npm run migrate`-et, majd `node server.js`).
- Migrációk kézzel: `npm run migrate` / `npm run migrate:rollback` (a `server/` mappában).

## Megosztott meghajtó / dokumentumok

A dokumentumok (Fuvarmegbízás DOCX, EKAER) egy hálózati meghajtón vannak
(UNC: `\\192.168.1.5\raktar`), a konténerben `/mnt/raktar` alá mountolva
(`RAKTAR_PATH` env változó). Linux/Docker miatt az útvonalakat platformfüggetlenül
kell kezelni — erre van egy `resolveFilePath` segédfüggvény a route-okban.

**Önjavító útvonalkeresés:** ha egy dokumentum nincs a szabványos helyen, a rendszer
alternatívákat próbál (pl. `LOG341` helyett `LOG341 OK` — régi Access-konvenció), és
ha megtalálja, a háttérben frissíti az adatbázist a helyes elérési úttal.

## Domain fogalmak

- **Szezon (season):** időszak, pl. `25-26`.
- **Fuvar / szállítmány (shipment) + tételek (shipment_lines):** a Rakodás modul ezeket kezeli.
- **Fuvarmegbízás (transport order):** kiküldendő dokumentum, `is_sent` státusszal.
- **EKAER:** EU-s közúti áruszállítási bejelentés, szintén `is_sent` státusszal.
- **Rakodás:** kamionok feltöltése tételekkel; `is_loaded` jelöli a lerakodott szállítmányt.

## Fejlesztési naplók / kontextus

A részletes fejlesztéstörténet a **`02_Wiki/`** mappában van (Obsidian-jegyzetek,
sima `.md` fájlként olvashatók), pl. `Fejlesztesi_Naplo_V0.3.7_*.md`,
`Fejlesztesi_Naplo_V0.4.0_*.md`, `deploy_jegyzet.md`. Új jelentős változás után
érdemes ide is jegyzetet írni.

## Figyelmeztetések / buktatók

- **`Access UI_backup/`** — régi biztonsági mentés, NE ezt szerkeszd; az élő kód az `Access UI/`.
- **`Gava Access ERP Wiki/`** — külön (régebbi) Obsidian vault, nem az aktív `02_Wiki`.
- A `server/` gyökerében sok **egyszeri import-/scratch-script** van
  (`import_*.js`, `scratch_*.js`, `test*.js`, `diagnose_*.js`) — ezek nem a futó
  alkalmazás részei, óvatosan velük.
- A verziószámozás nem szigorúan lineáris (V0.3.7 és V0.4.0 párhuzamosan szerepelnek
  a naplókban) — verziónál érdemes a git historyt és a UI-ban lévő verziószámot egyeztetni.
