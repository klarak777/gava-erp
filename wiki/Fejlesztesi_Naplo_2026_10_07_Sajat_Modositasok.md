# Fejlesztési napló – Gava ERP ALDI Heti lekötés és RAKODVA teljeskörű frissítés (V0.9.8)

Dátum: 2026. október 7.

Ebben a jegyzetben a tegnapi és a mai nap során végrehajtott **összes fejlesztést és pontosítást** foglaljuk össze, beleértve mind a Heti lekötés logikájának átalakítását (felhasználói és fejlesztői oldalon), mind a Rakodás modul (RAKODVA) új készletkezelését. A módosítások hatására a rendszer verziószáma **V0.9.8**-ra frissült.

## 1. ALDI Heti lekötés: Megjelenítés és Szerkesztés (Mai felhasználói UI/UX módosítások)
A Heti lekötés kezelőfelülete (`aldi_rendelesek.js`, `commitmentRatesEditor.js`) átesett egy ergonómiai és logikai frissítésen:
- **Különválasztott mezők az akciós státusz alapján:** 
  - Az **akciós időszakkal rendelkező** terméksorok szerkesztőjében immár két jól elkülönülő mező jelenik meg: **Akciós időszak** és **Akciós időszakon kívüli**.
  - Az **akció nélküli** terméksorok esetében a letisztultság érdekében kizárólag a **Normál** mező jelenik meg.
- **Tájékoztató szöveg frissítése:** A felületen egyértelműsítve lett, hogy a beállított profil/százalék *"ettől a héttől érvényes, a múltbéli adatokon nem módosít. Minden időszak összege külön 100% legyen."*
- **Felesleges gombok eltávolítása:** Eltávolítottuk az "Alapértékek visszaállítása" gombot a felületről, leegyszerűsítve ezzel a beállítások mentését.

## 2. Heti lekötés: Mennyiségek elosztása és számítása (Közös logikai fejlesztések)
A backend és frontend szintjén egységesítettük, miként kezelje a rendszer az akciós alapot és a normál kartonszámokat a felhasználó által elvárt szabályok mentén.

- **Keresleti többlet átcsoportosítása:** Ha az importált keresleti Excel adat (Becsült mennyiség) magasabb a Rendelési terv heti előrejelzésénél, akkor a **pozitív különbözet teljes egészében az akciós alapot (Akciós időszak) növeli**, miközben az akción kívüli (Normál) alap változatlan marad.
- **Szerkesztő viselkedése:**
  - A szerkesztőben előre kiszámolt Normál és Akciós/Akción kívüli kartonszámok jelennek meg, az eredeti akciós napok kipipálásával.
  - A mentett kézi összeg felülírja az alapértékeket, a kézi nulla is érvényes. 
- **Készletlista prioritások:** A levonások sorrendje a valósághoz igazodott.
  1. *Becsült*, ha nincs konkrétabb.
  2. *Rendelt*, ha érkezett.
  3. *Teljesített*, ami mindent felülír.

## 3. RAKODVA jelölés és Lokációs Készlettisztítás (Backend bugfix és automatizáció)
Megvalósult az az elvárás, hogy a felrakott kamionok termékei azonnal eltűnjenek a rendszer lokációiról.

- **Készlet eltüntetése:** A `server/src/routes/aldi_cross_docking.js` végpontban implementáltuk, hogy amennyiben egy kamion az ALDI Rakodás táblában "Rakodva" állapotba kerül (`is_loaded = true`), a rendszer azonosítja a hozzá tartozó komissió és fuvar sorokat (`aldi_commission_lines`, `aldi_truck_lines`).
- Az adatbázis `aldi_stock_locations` táblájából a megfelelő sorok fizikailag **törlésre kerülnek** (ellenőrizve mind a `commission_line_id`, mind a `truck_line_id` kapcsolatot). Ezáltal a termék azonnal eltűnik a megadott lokációról.
- **Tranzakcióbiztonság:** A folyamat egy tranzakcióban történik. Hiba vagy ismételt kattintás esetén nem duplikálódik a teljesített mennyiség (dedikált `!wasLoaded` ellenőrzés), ami megoldotta a korábban tapasztalt (pl. 10 -> 20 karton) bugot.

## 4. Fantomkészletek tisztítása (Adatbázis Migráció)
Több korábban már elindított és rakodottá nyilvánított kamionnál (pl. **AL02**) észleltük, hogy a régi rendszer miatt jelentős mennyiségű készlet (pl. 70 karton) maradt "beragadva" a lokációkon.
- Ehhez készítettem egy migrációs scriptet: `20261007000002_cleanup_loaded_trucks_stock.js`.
- A script automatikusan azonosította az összes, már rakodott státuszú kamiont, és tisztította hozzájuk tartozó elárvult `aldi_stock_locations` sorokat. Ezzel **3 db beragadt készletsor** (köztük a 70 kartonos is) maradéktalanul törlődött.

## 5. Ellenőrzés, Tesztelés és Verzióváltás
- A kódfrissítések (beleértve az új ui-modelleket és teszteket) a teljes tesztcsomag futtatásával (82 zöld teszt) validálásra kerültek.
- A szoftver mind felületi, mind package szinten a **V0.9.8** verzióra frissült.
- Az összes fenti változtatás (saját és közös) sikeresen véglegesítésre (commit) és feltöltésre (push) került a központi repóba.
