# 2026.07.23 - Napi javítások és fejlesztések

## Partnerek modul & Adminisztráció (V0.6.3)

### Partner szerepkörök egyesítése & Adatbázis migrációk
- **Partner szerepkörök és azonosítók szinkronizálása:**
  - Az Adminisztráció modulban a Szállítók/Partnerek (Reference), Vevők (Customer) és Fuvarozó cégek (Transport company) adatai mostantól a központi Partnerek törzsadatbázisból töltődnek be az Azonosítók szekcióban megadott rövidített nevek és szerepkörök alapján.
  - Elvégzésre kerültek a kapcsolódó adatbázis migrációs scriptek (`20260720000000_032_migrate_transporter_codes.js`, `20260721020000_035_delete_empty_partners.js`, `20260722000000_036_fix_kopfsalat_split.js`).
- **Manuális Frissítés gombok eltávolítása:**
  - Az Adminisztrációs felületen a Reference, Customer és Fuvarozó cég modulokból kikerült a felesleges frissítés gomb.

### Felület (UI) & UX Fejlesztések
- **Beépített lenyíló nyilak (▼):**
  - A Kamion szerkesztés és a Rakodás felugró ablakain a *Reference* és *Customer* mezőkhöz kis lenyíló nyilak kerültek. A nyílra kattintva gépelés nélkül is azonnal lenyílik a teljes (első 50) partnerlista.
- **Product modul átmozgatása:**
  - A *Product* termékkezelő modul kikerült az Adminisztrációból, és átkerült a *FUVAROK > Termékek adat tábla* modul alá.
- **Partner szerkesztő felugró ablak elrendezés (Padding / Fehér sáv javítás):**
  - A Partner felugró ablak **Megjegyzés/Kategóriák**, **Csatolmányok**, **Pénzügyi beállítások** és **Események** fülein a táblázatok és beviteli mezők magasságai és görgetései igazításra kerültek. Így a felület méretének megváltoztatása nélkül megszűnt az ablak alján lévő nagy üres rés (fehér sáv).

### Verziószám
- A teljes frontend felületen és az index.html állományban a verziószám **V0.6.3**-ra lett frissítve.
