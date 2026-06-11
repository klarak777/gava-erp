---
title: "Access ERP: Backend Architektúra és Adatbázis"
aliases: ["Backend", "PostgreSQL", "API"]
tags: [wiki, access, erp, nodejs, postgresql]
created: 2026-06-03
updated: 2026-06-03
---

# Gava ERP Backend Architektúra

Az Access alapú ERP rendszer lecserélésére a Gava Hungria Kft. egy modern REST API és relációs adatbázis alapú backendet alkalmaz. Mivel az alkalmazás végső formája egy Windows és Android kliens (pl. Electron/Tauri vagy WebView alapú alkalmazás) lesz, az adatokat egy központi szerveren (IP: `192.168.1.5`, OpenVPN eléréssel) biztosítjuk.

## 1. Technológiai Stack

- **Szerver operációs rendszer:** Windows Server (OpenVPN beállítással)
- **Adatbázis:** PostgreSQL 16 (Natív Windows telepítés vagy Docker, a lehetőségektől függően)
- **Backend keretrendszer:** Node.js + Express.js
- **ORM / Query Builder:** Knex.js
- **Autentikáció:** JWT (JSON Web Token) felhasználónév + jelszó alapon (leváltja az `Environ$("COMPUTERNAME")` alapú beléptetést).

## 2. Adatbázis Séma (PostgreSQL)

Az adatbázis sémát a Knex migrációk (`server/src/db/migrations/`) hozzák létre. 

### Főbb Táblák:
- **`shipments`**: A fuvarok alaptáblája. Egyedi azonosító a `order_number` + `season_id` páros (pl. GHU 240 a 25-26-os szezonban).
- **`shipment_lines`**: A "Fuvarok összesítő" Excel sorait reprezentálja. Tartalmazza a termékeket, partnereket, valamint a normál és euro raklap számokat.
- **`loading_events`**: Rakodási események (`Form_Rakodás`). A `is_loaded` checkbox triggereli a webhook folyamatokat (`loaded_at` időbélyeggel).
- **`transport_orders`**: Fuvarmegbízások és hozzájuk tartozó `.docx` dokumentumok metaadatai.
- **`ekaer_records`**: EKAER fájlok és bejelentések.
- **`product_demands`**: "Áru igény" tábla a rakodás űrlapról.

### Referencia Táblák:
- `seasons` (Szezonok: 19-20, ..., 25-26)
- `transporters` (KÓNYA, STI, RONI, stb.)
- `products`, `partners`, `users`
- **`pallet_conversion`**: A fix átváltási logikát (Normál → Euro) tartalmazó referencia tábla. Ezt használják a Transport Cost számítási SQL VIEW-k.

## 3. Transport Cost (V2) Adatbázisban

A korábbi VBA makrók (`KalkulaldOsszPalettat` és `CalcSorTotalPalets`) lecserélésre kerültek a **`v_shipment_costs`** SQL VIEW-ra.
Ez a VIEW:
1. Kiszámolja a fuvar összes normál raklapját (`sum_normal`).
2. A `pallet_conversion` táblából kiveszi a megfelelő Euro átváltást.
3. Kiszámítja az arányos Total Palets és Transport Cost értékeket minden egyes sorra.

Így a backendnek és a frontendnek már nem kell manuálisan iterálnia és osztogatnia, a VIEW automatikusan biztosítja a valós idejű eredményeket az adatok bevitelekor.

## 4. Hálózat és Elérés

- Az adatbázis szerver és az API lokális hálózaton / VPN-en fut.
- Nincs szükség nyilvános domain-re (pl. HTTPS a `gavaapi.live` felé csak kifele irányuló webhook küldésre szolgál az n8n irányába). A kliens a hálózaton lévő belső IP-hez csatlakozik (pl. `http://192.168.1.5:3000`).

## 5. Mappa Struktúra

A kód a `server/` mappában található:
- `server.js`: Az Express szerver belépési pontja.
- `knexfile.js`: Adatbázis konfigurációk.
- `.env`: Környezeti változók (Adatbázis jelszó, JWT titkos kulcs stb.)
- `src/db/migrations/`: Az adatbázis tábláit létrehozó szkriptek.
- `src/db/seeds/`: Az alapértelmezett adatokat (szezonok, fuvarozók, váltótábla) betöltő szkriptek.

## 6. Következő Lépések az API felépítésénél
1. Az API végpontok (Routes & Controllers) kidolgozása a `server/src/routes/` mappában.
2. Hitelesítés és hibakezelés middleware-ek implementálása.
3. Adatbetöltés (migráció a meglévő Excel adatokból).
