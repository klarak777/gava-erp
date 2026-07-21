# 2026.07.21 - Napi javítások és fejlesztések

## Partnerek modul (V0.5.9)

### Adatbázis Tisztítás & CSV Importálás (Phase 1 & 2)
- **CSV adatok deduplikálása és tisztítása:** 
  - A kapott 6 partner adatbázis CSV fájlból kiszűrtük az üres (kizárólag névvel rendelkező, egyéb adat nélküli) rekordokat.
  - Összevontuk az egyező adószámmal rendelkező partnereket még a beolvasás során, a legteljesebb nevet megtartva.
- **Tömeges Adatbázis Import:**
  - Létrehoztunk egy Node.js import scripteket (`import_csv_partners.js`), amellyel biztonságosan feltöltöttük az adatokat mind a helyi, mind az éles DigitalOcean (DO) szerverre.
  - **3019 új partner** került felvitelre, **23 meglévő partner** frissült adószámmal vagy bizonylati névvel, és **4977 új azonosító** (CCW kód, FELIR azonosító, NEBIH, Csoportos és Közösségi adószám) lett összekapcsolva velük.

### Éles Adatbázis Deduplikáció (Deduplicate Script)
- Létrehoztunk és élesítettünk egy adatbázis-szintű tisztító scriptet (`deduplicate_db.js`), amely közvetlenül az SQL (PostgreSQL) adatbázisban tisztította meg a korábbról bent maradt duplikátumokat.
- **DO Szerver eredmények:**
  - **203 csoport** lett összevonva adószám egyezőség alapján (224 törölt duplikátum).
  - **88 csoport** lett összevonva név-egyezőség alapján (95 törölt duplikátum).
  - A script automatikusan átkötötte az összes kapcsolódó adatot (fuvarok, számlák, részletek, telephelyek, bankkártyák stb.) a megmaradó fő partnerre, így **adatvesztés nélkül töröltünk 319 duplikált rekordot**.

### Felület (UI) változások & Bugfixes
- **ABC Ellenőrzés (NAV/VIES):** 
  - Kivezetésre került a manuális sor-kijelölési kötelezettség az ellenőrzésnél. A gomb megnyomásakor a rendszer automatikusan megkeresi az "Adószám" vagy "Közösségi adószám" sort a táblázatban és ellenőrzi azt.
  - Ha nincs megadva adószám a partnernél, a felület figyelmeztetést dob: *"Legyen szíves adószámot felvinni az adott partnerhez az ellenőrzéshez!"*
- **Verziószám:** A frontend felület verziószáma frissítésre került **V0.5.9**-re.
- **Biztonság:** A `.gitignore` fájl kibővítésével biztosítottuk, hogy a helyi adatbázis mentések (`db_backup_*.json`) és nyers import adatok ne kerüljenek fel nyilvános GitHub tárhelyre.
