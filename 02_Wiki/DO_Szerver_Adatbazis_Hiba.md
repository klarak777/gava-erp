# DO Szerver Adatbázis Implementációs Hibák és Megoldások (2026. 07. 16.)

A fejlesztés során az adatbázis tisztítása és a partnerek importálása két lépésben zajlott a lokális fejlesztői gépen, de a DO szerverre történő átvezetés (deploy) során különböző problémák léptek fel.

## 1. Hiba: A duplikációk nem tűntek el az éles szerveren
**A probléma oka:** 
A duplikált partnereket (pl. a `(MERGED TO ID 27)` végződésű sorokat) a fejlesztői gépen külön, kézi scriptekkel töröltük (`delete_merged_partners.js`). Bár a kód felkerült a GitHubra, a szerveren ezek maguktól nem futottak le, így a duplikátumok az éles adatbázisban bent maradtak.
**A megoldás:** 
Készítettünk egy hivatalos adatbázis migrációt (`027_cleanup_and_sync_partners.js` és `028_delete_already_merged_partners.js`), ami a `docker-compose up` indításakor automatikusan (az `npm run migrate` részeként) lefut.
*Állapot: Ez a rész megoldódott, a duplikációk a szerveren eltűntek.*

## 2. Hiba: A "Build" folyamat elszállt a konténer építésekor (npm ci hiba)
**A probléma oka:** 
A CSV importáláshoz szükség volt egy új csomagra (`iconv-lite`). Ezt beírtam a `package.json`-ba, de elmaradt az `npm install` futtatása lokálisan, emiatt a `package-lock.json` szinkronon kívül került. A Docker produkciós építése (build) biztonsági okokból szigorú egyezést vár (az `npm ci` paranccsal), így a build folyamat azonnal megszakadt.
**A megoldás:** 
Lokálisan lefutott az `npm install`, a frissült `package-lock.json` felkerült a GitHubra, így a konténer újraépítése (`--build`) immár sikeresen befejeződött.

## 3. Hiba: Továbbra is hiányoznak az adószámok, címek és a +3500 új partner
**A probléma oka:** 
A felhasználó jogosan várta, hogy az új szerver indulásakor minden adat a helyére kerüljön, akárcsak a duplikációk törlése. Azonban van egy **alapvető architekturális különbség** a két folyamat között:
- A *duplikációk törlése* **Migráció**, ezért az induláskor *automatikusan* lefut.
- A *CSV importálás* egy egyszeri **Adatbetöltő Script** (`import_partner_csv.js`), ami **soha nem fut le magától**, csak ha kézzel manuálisan elindítjuk! 

Mivel a DO szerveren az API konténer sikeresen felépült, a kód és a CSV fájl már bent van a szerver memóriájában, de **senki nem húzta meg a ravaszt**, hogy az importálás ténylegesen el is kezdődjön.

**A megoldás:**
A szerver termináljában (SSH-n belépve) manuálisan el kell indítani a scriptet a konténeren belül a következő paranccsal:
```bash
docker exec -it gava_erp_prod_api node src/scripts/import_partner_csv.js
```
Ez a parancs beolvassa a konténerbe felmásolt `Partner_cleaned.csv` fájlt, és másodpercek alatt befrissíti az adatbázisban a címeket, adószámokat, valamint beszúrja a ~3500 új partnert.

## Összegzés a jövőre nézve:
1. Ha a `package.json` módosul, kötelező a `package-lock.json` frissítése.
2. A produkciós Docker környezetben a kódszintű változások (`git pull`) után kötelező a konténer újraépítése (`docker-compose up --build`).
3. Egyszeri adatbetöltéseket (CSV) sosem migrációkból indítunk, hanem futó konténeren belüli manuális script hívással (`docker exec`).
