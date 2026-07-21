# Partner Modul - Adatbázis és Logika Fejlesztések
**Dátum:** 2026.07.21.

## 1. Partnerek Deduplikációja
- Sikeresen lefutott a deduplikációs folyamat a `merged_partners_review` CSV alapján.
- **Eredmények:**
  - Összevont csoportok száma (Adószám alapján): 203
  - Törölt duplikált partnerek (Adószám alapján): 224
  - Összevont csoportok száma (Név alapján): 88
  - Törölt duplikált partnerek (Név alapján): 95
- A korábban észlelt címeltérések (pl. *Kopfsalat Trade Sl* és *KOPFSALAT TRADE SL.*) figyelembevételre kerültek, és csak a teljesen megegyező partnerek kerültek automatikus összevonásra.

## 2. Megjelenített Név (Rövidített Név) Kezelése
- Javításra került az a logikai hiba, ami miatt a partner táblázat a rövidített nevet jelenítette meg a teljes név helyett.
- **Módosítás:** A `Partner` táblázatban a fő listanézetben mindig az **eredetileg felvitt teljes Név** jelenik meg. A rövidített nevek megmaradtak az "Egyéb adatok, azonosítók" blokkban, de már nem írják felül a táblázatban megjelenő Nevet.

## 3. Adószám és Közösségi Adószám Megjelenítése
- A Partner táblázat kiegészült egy dedikált `Közösségi adószám` oszloppal.
- **Megjelenítési szabályok (szigorított):**
  - Ha a partnernek csak magyar adószáma van, az kizárólag az `Adószám` oszlopban jelenik meg.
  - Ha a partnernek csak közösségi adószáma van, az a `Közösségi adószám` oszlopban jelenik meg.
  - Ha mindkettővel rendelkezik, **mindkettő megjelenik** a saját oszlopában.
  - Nincs automatikus átmásolás vagy "fallback" – ha nincs EU adószám, a mező garantáltan üres (`-`) marad.

## 4. VEIS Ellenőrzés (Közösségi Adószám)
- A VEIS ellenőrzés (ABC gomb) pontosítva lett: kizárólag a `Közösségi adószám` mezőben lévő adatokat ellenőrzi. A belföldi (magyar) adószámok ellenőrzését a VEIS rendszer nem támogatja (ahhoz a NAV rendszere szükséges).
- Az *AGROPONIENTE S.A.* és más partnerek hiányzó megjelenítési hibája javítva lett (a backenden a partner_identifiers táblából történő megfelelő adatkinyeréssel).
