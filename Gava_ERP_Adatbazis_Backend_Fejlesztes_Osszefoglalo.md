# Gava Hungria ERP – Adatbázis és Backend Fejlesztés Összefoglaló

**Projekt:** Gava Hungria ERP rendszer modernizálása  
**Időszak:** 2026. május – 2026. június  
**Verziószám:** v1.0 – Aktív fejlesztés alatt

---

## 1. Projekt Célja

A meglévő MS Access + Excel alapú ERP rendszert egy modern, szerverre telepíthető **relációs adatbázisra (PostgreSQL)** és **REST API-ra (Node.js + Express)** cseréljük le. A cél egy webes és mobil alkalmazásból is elérhető, stabil, bővíthető platform kialakítása, amely megőrzi az összes jelenlegi munkafolyamatot, de kiváltja a manuális Excel-kezelést.

---

## 2. Technológiai Stack

| Réteg | Technológia | Indoklás |
|---|---|---|
| **Frontend** | HTML5 + Vanilla JavaScript | Meglévő Access UI alapja |
| **Backend** | Node.js + Express.js | Közös JS nyelv frontendel, egyszerű telepítés |
| **Adatbázis** | PostgreSQL 16 | Ingyenes, nyílt forráskódú, RDBMS |
| **ORM / Migráció** | Knex.js | SQL-szerű szintaxis, beépített séma verziózás |
| **Hitelesítés** | JWT (JSON Web Token) | Felhasználónév + jelszó alapú belépés |

---

## 3. Rendszerarchitektúra

> ⚠️ **Fontos változás:** Az alkalmazás a jövőben **nem webes böngészőből** lesz elérhető, hanem **saját letölthető natív alkalmazásként** – Windows asztali alkalmazásként és Android mobilalkalmazásként.

```
┌─────────────────────────────────┐
│  Windows asztali alkalmazás     │  ← Electron (vagy WebView2)
│  Android mobilalkalmazás        │  ← Android WebView / React Native
└────────────┬────────────────────┘
             │  HTTP REST API (JSON)
             │  OpenVPN titkosított csatorna
             ▼
   ┌──────────────────────────┐
   │  Node.js / Express szerver│
   │  (192.168.1.5, port 3001) │
   └──────────┬───────────────┘
              │  Knex.js query builder
              ▼
   ┌──────────────────────────┐
   │  PostgreSQL adatbázis    │
   │  (gava_erp)              │
   └──────────────────────────┘
```

**Kapcsolódás módja:**
- A szerver a vállalati belső hálózaton fut (192.168.1.5)
- Az alkalmazás **OpenVPN** csatornán keresztül csatlakozik a szerverhez
- Az adatbázis nem érhető el közvetlenül az internetről
- A backend REST API-n keresztül kommunikál az alkalmazással (JSON)

**Tervezett platform támogatás:**

| Platform | Technológia | Leírás |
|---|---|---|
| **Windows** | Electron.js | Az Access UI HTML/JS kód natív Windows .exe alkalmazásba csomagolva |
| **Android** | Android WebView / React Native | Mobilra optimalizált felület, APK telepítőként terjeszthető |
| **Backend** | Node.js + Express | Változatlan – platform-független REST API |

---

## 4. Teljes Relációs Adatbázis Séma

Az adatbázis **11 relációs táblát** tartalmaz, 4 migrációs fájlban szervezve. A táblaszerkezet az Excel/Access forrásdokumentumok pontos leképezése.

### Összes tábla – gyors áttekintés

| # | Tábla neve | Magyar neve | Excel/Access forrás |
|---|---|---|---|
| 1 | `seasons` | Szezonok | Manuális seed |
| 2 | `transporters` | Fuvarozók | Manuális seed |
| 3 | `products` | Termékek | Excel – egyedi értékek |
| 4 | `partners` | Partnerek (Vevők/Szállítók) | Excel – egyedi értékek |
| 5 | `users` | Felhasználók | Manuális seed |
| 6 | `pallet_conversion` | Raklap Váltótábla | Raklap váltó.txt |
| 7 | `shipments` | Fuvarok (fejléc) | Transportistas Excel lap |
| 8 | `shipment_lines` | Fuvar tételsorok | Fuvarok összesítő Excel lap |
| 9 | `loading_events` | Rakodási események | Access Form_Rakodás |
| 10 | `transport_orders` | Fuvarmegbízások | Access Form_Fuvarmegbízás |
| 11 | `ekaer_records` | EKAER bejelentések | Access Form_EKAEREK |
| 12 | `product_demands` | Áruigények | Access Áru igény |
| — | `v_shipment_costs` | Számított fuvarköltségek nézete | PostgreSQL VIEW |

---

### 4.1. Referencia Táblák (001_create_reference_tables)

#### `seasons` – Szezonok
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | Egyedi azonosító |
| `code` | VARCHAR UNIQUE | Szezon kódja, pl. `25-26` |
| `start_date` | DATE | Szezon kezdete |
| `end_date` | DATE | Szezon vége |
| `created_at` | TIMESTAMP | Létrehozás ideje |
| `updated_at` | TIMESTAMP | Módosítás ideje |

#### `transporters` – Fuvarozók
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | Egyedi azonosító |
| `name` | VARCHAR | Fuvarozó neve, pl. `KÓNYA`, `STI`, `BILEK` |
| `code` | VARCHAR | Rövid kód |
| `is_active` | BOOLEAN | Aktív-e |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `products` – Termékek
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | VARCHAR | Termék neve, pl. `PEACH 7KG`, `NECTARIN 10*1KG` |
| `category` | VARCHAR | Kategória |
| `reference` | VARCHAR | Gyártó/szállító referencia, pl. `VERMION FRESH` |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `partners` – Partnerek (Vevők / Szállítók / Felrakók)
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | VARCHAR | Partner neve, pl. `ALDI`, `SPAR` |
| `type` | VARCHAR | `vevő`, `szállító`, `felrakó` |
| `address` | VARCHAR | Cím |
| `contact` | VARCHAR | Kapcsolattartó |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `users` – Felhasználók
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `username` | VARCHAR UNIQUE | Bejelentkezési név |
| `password_hash` | VARCHAR | Bcrypt jelszókivonat |
| `full_name` | VARCHAR | Teljes név |
| `role` | VARCHAR | `Admin`, `Iroda1`, `Iroda2`, `Iroda3` |
| `computer_name` | VARCHAR | Régi Access kompatibilitáshoz |
| `is_active` | BOOLEAN | |
| `last_login` | DATETIME | Utolsó belépés ideje |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `pallet_conversion` – Raklap Váltótábla
| Mező | Típus | Leírás |
|---|---|---|
| `normal_count` | INTEGER PK | Normál raklapok száma (1–26) |
| `euro_equivalent` | INTEGER | Euró raklapban kifejezett egyenérték |

> Ez a tábla a `Raklap váltó.txt` forrás alapján lett feltöltve. A `Total Palets` kalkuláció erre az arányrendszerre épül. Ha a fuvar normál raklapjainak száma meghaladja a 26-ot, extrapoláció történik (33/26 arány).

---

### 4.2. Központi Tranzakciós Táblák (002_create_shipments_tables)

#### `shipments` – Fuvarok (Fő fejléc tábla)

Az Excel `Transportistas` munkalap adatait tartalmazza. Minden fuvar egy egyedi szezon + kamionszám párral azonosítható.

| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `order_number` | VARCHAR | Kamionszám, pl. `GHU 240`, `LOG149`, `BEL015` |
| `truck_type` | VARCHAR | Típus kód: `BEL`, `EX`, `GHU`, `H`, `LOG` |
| `truck_seq_number` | INTEGER | Sorszám, pl. `240` |
| `season_id` | INTEGER FK → seasons | Szezon hivatkozás |
| `transporter_id` | INTEGER FK → transporters | Fuvarozó hivatkozás |
| `plate_number` | VARCHAR | Rendszám |
| `loading_place` | VARCHAR | Felrakóhely |
| `loading_date` | DATE | Felrakás dátuma |
| `unloading_date` | DATE | Lerakás dátuma |
| `arrival_date` | DATE | Megérkezés dátuma |
| `transport_price` | DECIMAL(14,2) | Fuvardíj (EUR) |
| `transport_currency` | VARCHAR | Pénznem, alapértelmezett: `EUR` |
| `invoice_amount_eur` | DECIMAL(14,2) | Számla összege EUR-ban |
| `invoice_amount_huf` | DECIMAL(14,2) | Számla összege HUF-ban |
| `invoice_number` | VARCHAR | Számlaszám |
| `payment_date` | DATE | Fizetési határidő |
| `comment` | VARCHAR | Megjegyzés |
| `file_path` | VARCHAR | `.xlsm` fájl elérési útja a szerveren |
| `is_receipted` | BOOLEAN | Bevételezve jelzés |
| `kb` | DECIMAL(14,2) | KB mező (Transportistas) |
| `b` | DECIMAL(14,2) | B mező (Transportistas) |
| `t` | DECIMAL(14,2) | T mező – Transport price (Transportistas) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

> **Egyedi kulcs (Composite UNIQUE Constraint):** `UNIQUE(order_number, season_id)` – Garantálja, hogy ugyanaz a kamionszám csak egyszer szerepelhet egy szezonban. Ez biztosítja az idempotens CSV importálást is (upsert logika).

---

#### `shipment_lines` – Fuvar Tételsorok (Fuvarok összesítő tábla)

Az Excel `Fuvarok összesítő` munkalap adatait tartalmazza. Minden fuvarhoz (`shipment_id`) több tétel tartozhat (termék, vevő, raklap adat).

| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `shipment_id` | INTEGER FK → shipments | Fuvar hivatkozás (CASCADE DELETE) |
| `product_id` | INTEGER FK → products | Termék hivatkozás (SET NULL) |
| `partner_id` | INTEGER FK → partners | Partner/Vevő hivatkozás (SET NULL) |
| `customer` | VARCHAR | Vevő neve, pl. `GHU`, `FRUBALMED` |
| `destination` | VARCHAR | Célállomás, pl. `ALDI`, `SPAR HU ÜLLŐ` |
| `euro_palets` | INTEGER | Euró raklapok száma |
| `normal_palets` | INTEGER | Normál raklapok száma |
| `total_palets` | DECIMAL(10,2) | **Számított** – Raklap váltó V2 logika alapján |
| `gross_weight_kg` | DECIMAL(10,2) | Bruttó súly (kg) |
| `price_eur` | DECIMAL(10,2) | Egységár EUR-ban |
| `price_bcn_eur` | DECIMAL(10,2) | BCN ár EUR-ban |
| `unit` | VARCHAR | Mértékegység |
| `reloading_per_plt` | DECIMAL(10,2) | Átrakodási díj / raklap |
| `transport_bcn_per_plt` | DECIMAL(10,2) | BCN fuvardíj / raklap |
| `albaran_number` | VARCHAR | Albaran szám |
| `transport_cost` | DECIMAL(10,2) | Teljes fuvarköltség (Total Transport Cost) |
| `transport_cost_product` | DECIMAL(10,2) | Fuvarköltség / termék (Transport Cost / product) |
| `comment` | VARCHAR | Megjegyzés |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### 4.3. Kiegészítő Táblák (003_create_details_tables)

#### `loading_events` – Rakodási Események
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `shipment_id` | INTEGER FK → shipments | Fuvar hivatkozás (CASCADE) |
| `loading_date` | DATE | Rakodás dátuma |
| `loading_place` | VARCHAR | Rakodóhely |
| `is_loaded` | BOOLEAN | Rakodva jelölés (checkbox) |
| `loaded_at` | DATETIME | Rakodás pontos időpontja (webhook trigger) |
| `created_by` | INTEGER FK → users | Rögzítő felhasználó |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `transport_orders` – Fuvarmegbízások
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `shipment_id` | INTEGER FK → shipments | Fuvar hivatkozás (CASCADE) |
| `season_id` | INTEGER FK → seasons | Szezon hivatkozás |
| `transporter_id` | INTEGER FK → transporters | Fuvarozó hivatkozás |
| `document_name` | VARCHAR | Dokumentum neve, pl. `KONYA TRANS GHU 240.DOCX` |
| `file_path` | VARCHAR | Dokumentum elérési útja a szerveren |
| `loading_date` | DATE | Felrakás dátuma |
| `is_sent` | BOOLEAN | Kiküldve jelölés |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `ekaer_records` – EKAER Bejelentések
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `shipment_id` | INTEGER FK → shipments | Fuvar hivatkozás (CASCADE) |
| `season_id` | INTEGER FK → seasons | Szezon hivatkozás |
| `transporter_id` | INTEGER FK → transporters | Fuvarozó hivatkozás |
| `ekaer_file_name` | VARCHAR | EKAER fájl neve |
| `file_path` | VARCHAR | Fájl elérési útja |
| `load_date` | DATE | Felrakás dátuma |
| `is_sent` | BOOLEAN | Kiküldve jelölés |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `product_demands` – Áruigények
| Mező | Típus | Leírás |
|---|---|---|
| `id` | INTEGER PK | |
| `loading_event_id` | INTEGER FK → loading_events | Rakodási esemény hivatkozás (CASCADE) |
| `product_id` | INTEGER FK → products | Termék hivatkozás |
| `partner_id` | INTEGER FK → partners | Partner hivatkozás |
| `customer_name` | VARCHAR | Vevő neve |
| `pallet_count` | INTEGER | Raklapok száma |
| `is_sent_to_truck` | BOOLEAN | Kamionra küldve (piros→zöld gomb) |
| `sent_at` | DATETIME | Küldés időpontja |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### 4.4. Adatbázis VIEW (004_create_views)

#### `v_shipment_costs` – Számított fuvarköltségek nézete

Ez a PostgreSQL VIEW a `Total Palets` és `Transport Cost` értékeket számolja ki SQL szinten a Raklap Váltótábla alapján. Az éles rendszerben a számítás Node.js szinten (V2 logika) történik, de a VIEW referencia számításként megmarad.

```sql
CREATE VIEW v_shipment_costs AS
WITH shipment_totals AS (
    SELECT
        sl.shipment_id,
        SUM(sl.euro_palets) AS sum_euro,
        SUM(sl.normal_palets) AS sum_normal,
        COALESCE(pc.euro_equivalent, 0) AS converted_normal_to_euro
    FROM shipment_lines sl
    LEFT JOIN pallet_conversion pc ON pc.normal_count = (
        SELECT SUM(sl2.normal_palets) FROM shipment_lines sl2
        WHERE sl2.shipment_id = sl.shipment_id
    )
    GROUP BY sl.shipment_id, pc.euro_equivalent
),
shipment_grand AS (
    SELECT
        shipment_id,
        sum_euro,
        sum_normal,
        converted_normal_to_euro,
        (sum_euro + converted_normal_to_euro) AS grand_total_palets
    FROM shipment_totals
)
SELECT
    sl.id AS line_id,
    sl.shipment_id,
    s.order_number,
    CASE
        WHEN sg.sum_normal = 0 THEN sl.euro_palets
        ELSE sl.euro_palets + (sg.converted_normal_to_euro * (sl.normal_palets::numeric / NULLIF(sg.sum_normal, 0)))
    END AS calculated_total_palets,
    CASE
        WHEN sg.grand_total_palets = 0 THEN 0
        ELSE s.transport_price * (
            CASE
                WHEN sg.sum_normal = 0 THEN sl.euro_palets
                ELSE sl.euro_palets + (sg.converted_normal_to_euro * (sl.normal_palets::numeric / NULLIF(sg.sum_normal, 0)))
            END / sg.grand_total_palets
        )
    END AS calculated_transport_cost
FROM shipment_lines sl
JOIN shipments s ON s.id = sl.shipment_id
JOIN shipment_grand sg ON sg.shipment_id = sl.shipment_id;
```

---

## 5. ER Diagram – Táblakapcsolatok

```
seasons ──────────────────────────────────────────┐
    │ 1:N                                          │
    ├──► shipments ◄── transporters               │
    │        │ 1:N                                 │
    │        ├──► shipment_lines ◄── products      │
    │        │                  ◄── partners       │
    │        ├──► loading_events                   │
    │        │        │ 1:N                        │
    │        │        └──► product_demands         │
    │        ├──► transport_orders ◄──────────────-┤
    │        └──► ekaer_records ◄─────────────────-┘
    │
pallet_conversion (referencia, nincs FK)
users (önálló, loading_events.created_by FK)
```

**Idegen kulcsok szabályai:**
- `ON DELETE CASCADE` – Ha egy fuvar törlésre kerül, törlődnek a tételsorai, rakodásai, fuvarmegbízásai és EKAER bejegyzései is
- `ON DELETE SET NULL` – Ha egy fuvarozó vagy termék törlésre kerül, a hivatkozások NULL-ra állnak (az adatsor megmarad)

---

## 6. API Végpontok (REST)

**Alap URL:** `http://192.168.1.5:3001/api/v1`

### Fuvarok (Shipments)
| Metódus | Végpont | Leírás |
|---|---|---|
| `GET` | `/shipments` | Összes fuvar (kapcsolt szezon + fuvarozó névvel) |
| `GET` | `/shipments/:id` | Egy fuvar részletei |
| `POST` | `/shipments` | Új fuvar létrehozása |
| `PUT` | `/shipments/:id` | Fuvar módosítása |
| `DELETE` | `/shipments/:id` | Fuvar törlése |

### Fuvar Tételsorok (Shipment Lines)
| Metódus | Végpont | Leírás |
|---|---|---|
| `GET` | `/shipment-lines` | Összes tételsor (V2 kalkulációval) |
| `POST` | `/shipments/:id/lines` | Új tételsor hozzáadása |
| `PUT` | `/shipment-lines/:lineId` | Tételsor módosítása |

### Referencia Adatok
| Metódus | Végpont | Leírás |
|---|---|---|
| `GET` | `/seasons` | Szezonok listája |
| `GET` | `/transporters` | Fuvarozók listája |
| `GET` | `/products` | Termékek listája |
| `GET` | `/partners` | Partnerek listája |
| `GET` | `/pallet-conversion` | Raklap váltótábla |

### Tervezett (nem yet implementált) Végpontok
| Metódus | Végpont | Leírás |
|---|---|---|
| `GET/POST/DELETE` | `/transport-orders` | Fuvarmegbízások |
| `GET/POST/DELETE` | `/ekaer` | EKAER bejelentések |
| `GET/POST` | `/loading-events` | Rakodások |
| `PUT` | `/loading-events/:id/loaded` | Rakodva trigger (webhook) |
| `GET/PUT` | `/product-demands` | Áruigények |
| `POST` | `/auth/login` | JWT bejelentkezés |

---

## 7. Fejlesztési Fázisok és Elvégzett Munkák

### ✅ 1. Fázis – Tervezés és Architektúra (2026. május)
- Az MS Access/Excel alapú rendszer elemzése
- Technológiai stack meghatározása (Node.js, PostgreSQL, Knex.js)
- Teljes relációs séma megtervezése ER-diagram alapján
- VPN-alapú hálózati architektúra meghatározása (192.168.1.5)
- `ERP – Relációs Adatbázis és Backend Terv.docx` dokumentum elkészítése

### ✅ 2. Fázis – Backend Infrastruktúra kiépítése (2026. május–június)
- `server/` mappa struktúra létrehozása (`routes`, `middleware`, `services`, `db`)
- Függőségek telepítése: Express, Knex.js, pg (PostgreSQL driver), bcrypt, jsonwebtoken
- `server.js` – Express belépési pont, CORS, JSON parser
- `knexfile.js` – Adatbázis kapcsolati konfiguráció
- `.env` – Titkos változók (DB_HOST, DB_USER, DB_PASS, JWT_SECRET)

### ✅ 3. Fázis – Adatbázis Migrációk (2026. június 3.)
- **001:** Referencia táblák: `seasons`, `transporters`, `products`, `partners`, `users`, `pallet_conversion`
- **002:** Központi táblák: `shipments` (UNIQUE composite key), `shipment_lines`
- **003:** Kiegészítő táblák: `loading_events`, `transport_orders`, `ekaer_records`, `product_demands`
- **004:** `v_shipment_costs` PostgreSQL VIEW

### ✅ 4. Fázis – Seed Adatok (Kezdeti Adatbetöltés)
- Raklap Váltótábla feltöltése (`pallet_conversion`) – 1–26 normál raklap → euró egyenérték
- Szezonok: `19-20`, `20-21`, `21-22`, `22-23`, `23-24`, `24-25`, `25-26`
- Fuvarozók: KÓNYA, STI, BILEK, stb.
- Alapértelmezett admin felhasználó (bcrypt jelszókivonattal)

### ✅ 5. Fázis – CSV Import (import_csv.js)
- Excel `Fuvarok összesítő` adatok importálása PostgreSQL-be
- **Pontos oszlopfejléc-egyeztetés** (nem pozíció alapú) – így a rövid fejlécű oszlopok (`T`, `B`) nem keverednek össze a `Loading date`, `Albaran` és hasonló oszlopokkal
- Upsert logika: `ON CONFLICT (order_number, season_id)` – duplikáció elkerülése
- Importált pénzügyi mezők: `gross_weight_kg`, `price_eur`, `price_bcn_eur`, `unit`, `reloading_per_plt`, `transport_bcn_per_plt`, `albaran_number`, `transport_cost`, `transport_cost_product`

### ✅ 6. Fázis – Total Palets V2 Kalkuláció (Node.js)
- A logika áthelyezve a PostgreSQL VIEW-ból a Node.js API rétegbe (`shipment_lines.js`)
- **Fuvar szintű összesítés:** A fuvar összes normál raklapját egyszerre váltja át a Raklap Váltótáblából
- **Arányos visszaosztás:** Az átváltott értéket az egyes tételsorokra az `(adott sor normál raklapjai / fuvar összes normál raklapjai)` arányában osztja vissza
- **26 feletti extrapoláció:** Ha a normál raklapok száma meghaladja 26-ot, `(33/26)` arányú extrapolációt alkalmaz
- **2 tizedesre kerekítés:** `lineTotal.toFixed(2)` – pl. `12.34` nem `2.00000000000000000000`

### ✅ 7. Fázis – Frontend Szűrők Javítása (fuvar.js)
- **Kamionszám (Plate number) szűrő:** Szóköz-normalizálás javítása – a betű + szám kombinációk (pl. `GHU099`) helyesen keresnek
- **Szezon legördülő szűrő:** A `Loading date` mező YYYY-MM-DD formátumból kinyert szezonértékek javítása
- **Loading date formátum:** `202605.06` típusú hibás megjelenítés kijavítása – most `2026.05.06` formátumban jelenik meg

---

## 8. Mappastruktúra

```
ERP Access/
├── Access UI/                ← Frontend (HTML/JS)
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── fuvar.js
│       ├── rakodas.js
│       └── style.css
│
├── server/                   ← Backend (Node.js)
│   ├── package.json
│   ├── server.js             ← Express belépési pont
│   ├── knexfile.js           ← Adatbázis konfiguráció
│   ├── .env                  ← Titkos változók
│   ├── import_csv.js         ← CSV adatimport script
│   └── src/
│       ├── routes/
│       │   ├── shipments.js
│       │   ├── shipment_lines.js
│       │   └── seasons.js
│       ├── middleware/
│       └── db/
│           ├── db.js
│           └── migrations/
│               ├── 001_create_reference_tables.js
│               ├── 002_create_shipments_tables.js
│               ├── 003_create_details_tables.js
│               └── 004_create_views.js
│
└── Gava Access ERP Wiki/     ← Dokumentáció
```

---

## 9. Adatvédelem és Hozzáférés

- A szerver **kizárólag** a vállalati belső hálózaton (LAN) vagy **OpenVPN** kapcsolaton keresztül érhető el – nyilvánosan nem hozzáférhető
- A felhasználók **felhasználónév + jelszó** párossal jelentkeznek be (JWT token alapú session)
- A jelszavak **bcrypt** hash-sel tárolódnak az adatbázisban (nem visszafejthetők)
- Az adatbázisban a meglévő Access `COMPUTERNAME` alapú azonosítást a `users.computer_name` mező rögzíti kompatibilitás céljából
- **Natív alkalmazás előnyei a böngészőhöz képest:**
  - Nincs szükség böngészőre – önálló .exe (Windows) vagy .apk (Android)
  - Az alkalmazás helyi gépen fut, csak az API hívások mennek VPN-en át
  - Lehetőség helyi értesítések, tálca ikon és offline módú cache megjelenítésére

---

## 10. Következő Fejlesztési Lépések

### Backend API
- [ ] Fuvarmegbízás végpontok implementálása (`/transport-orders`)
- [ ] EKAER végpontok implementálása (`/ekaer`)
- [ ] Rakodási esemény végpontok + webhook trigger
- [ ] JWT bejelentkezési rendszer
- [ ] Áruigény kezelés (`/product-demands`)
- [ ] Teljes adatmigráció az összes Excel/Access fájlból
- [ ] Tesztelés (Jest + Supertest egységtesztek)
- [ ] Szerverre telepítés (192.168.1.5 Windows szerver)

### Natív Alkalmazás Csomagolás
- [ ] **Windows:** Electron.js keretrendszer bevezetése – az Access UI HTML/JS kód `.exe` telepítővé csomagolva
- [ ] **Android:** Android WebView wrapper vagy React Native port – `.apk` telepítőként terjeszthető
- [ ] VPN kapcsolat + API elérési konfiguráció az alkalmazásban
- [ ] Bejelentkezési képernyő (login screen) natív UI elemekkel
- [ ] Automatikus frissítési mechanizmus (auto-updater)

---

*Dokumentum generálva: 2026. június 8.*  
*Módosítva: 2026. június 8. – Natív alkalmazás architektúra rögzítve*  
*Fejlesztő: Gava Hungria ERP Fejlesztési Projekt*
