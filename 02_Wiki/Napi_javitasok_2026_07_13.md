# GAVA ERP - Napi javítások és fejlesztések (2026-07-13)
**Verzió:** V0.5.0

## Adatbázis & Háttérfolyamatok
- **AGROPONIENTE partnerek adatbázis-szintű összevonása:**
  - Létrehoztunk egy új adatbázis migrációt (`20260713000000_022_merge_agroponiente_partners.js`), amely az összes "AGROPONIENTE"-vel kezdődő duplikált partnert (pl. *AGROPONIENTE NATURAL*, *AGROPONIENTE NIJAR*, *AGROPONIENTE GUARDIAS* stb.) átirányítja az egyetlen fő és aktív `AGROPONIENTE` partner ID-jára (ID: 27) a `shipment_lines` táblában (összesen 485 sor frissült).
  - A felesleges duplikált partnereket deaktiváltuk (`is_active = false`) és megjelöltük a nevükben (`(MERGED TO ID 27)`), hogy tisztán látható legyen a változás és ne jelenjenek meg a legördülőkben.
- **CSV Importálási logika felkészítése:**
  - Frissítettük az összes importáló szkriptet (`import_csv.js`, `import_updates.js`, `import_new_lines.js`, `import_history_lines.js`, `import_25_26_v2.js`), hogy ha a beolvasott CSV-ben "AGROPONIENTE"-vel kezdődő Reference (szállító) szerepel, az automatikusan a fő `AGROPONIENTE` ID-jára képződjön le, megelőzve az újabb duplikált partnerek létrejöttét.
