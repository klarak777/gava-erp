# Fejlesztési napló – Gava ERP ALDI Rendszer Teljeskörű Frissítés (V0.9.8)

Dátum: 2026. október 7.

Ebben a naplóban a tegnapi és a mai nap során elvégzett **összes fejlesztést, hibajavítást és működési szabályt** rögzítjük. A fejlesztések a Heti lekötés számítási modelljét, az ALDI Fuvarok összesítőt, a Belföldi fuvarok modult, valamint az ALDI Rakodás (RAKODVA) valós raktári készletmozgását érintik. A rendszer verziószáma **V0.9.8**-ra frissült.

---

## 1. ALDI – Fuvarok összesítő fejlesztése

Az ALDI Fuvarok összesítő felülete és backendje jelentős stabilitási és funkcionális fejlesztésen esett át:

- **Knex lekérdezés és 500-as hiba javítása:** Megszüntettük a korábbi hibás Knex metódushívást a lekérdezésben, amely bizonyos szűréseknél vagy kapcsolásoknál belső szerverhibát (HTTP 500) okozott.
- **Átlagos nettó súly (kg/karton) pontos számítása:** A tételenkénti átlagos nettó súly számítása közvetlenül a kamionhoz tartozó komissió adatokból (`aldi_commission_lines.aldi_truck_line_id`) történik. Ezzel kiküszöböltük az azonos nevű terméktételek súlyainak összekeveredését és a bruttó/nettó értékek többszöröződését.
- **Modern felület és ALDI arculat:** Új, letisztult táblázatfejléc ALDI logóval, optimalizált oszlopelrendezéssel.
- **Testreszabható oszlopnézet (localStorage mentéssel):** A felhasználók modális ablakban szabadon beállíthatják, mely oszlopokat kívánják látni. A rendszer a beállított oszloppreferenciákat a böngésző helyi tárában (`localStorage`) megőrzi.
- **Széles, közvetlenül szerkeszthető megjegyzés mező:** A fuvarokhoz tartozó kommentek helyben szerkeszthetők, és az érték azonnal perzisztálódik az adatbázisban.
- **Dinamikus szezonválasztó:** A fuvarok szezonális szűrése (szeptember 1. – következő augusztus 31. intervallumok alapján) dinamikusan választható és összekapcsolható az egyéb dátumszűrőkkel.
- **Központi fuvarozólista integráció:** A modul a központi partner- és fuvarozótörzsből (`transporters`) olvassa a fuvarozókat, biztosítva az adategyezőséget a partnertörzzsel.

---

## 2. Belföldi fuvarok modul fejlesztése

- **Automatikus kamion-megjelenítés (`is_loaded` alapján):** Amikor egy kamion az ALDI – Rakodás modulban "Rakodva" állapotot kap (`is_loaded = true`), azonnal megjelenik a Belföldi fuvarok listájában anélkül, hogy külön rekordmásolásra vagy manuális rögzítésre lenne szükség.
- **Belföldi cross-docking adatok kezelése:** A cross-docking raklapszám (`crossdock_pallets`) és a kapcsolódó fuvarozási megjegyzés a felületen közvetlenül szerkeszthető és azonnal mentődik az API-n keresztül.
- **Fuvarszámlák digitális feltöltése és almappás tárolása:**
  - A csatolt fuvarszámlák és igazolások automatikusan a megfelelő kamionszámhoz rendelt almappába (`ERP ALDI/Fuvarszámlák/<kamionszám>`) kerülnek feltöltésre.
  - Párhuzamos feltöltésvédelem és fájlnév-ütközésvédelem: a fájlok tárolása és az adatbázis-referenciák frissítése tranzakcióbiztos módon történik, megelőzve a fájlok felülírását vagy referenciák elvesztését.
  - Számlaletöltés és -megtekintés biztonságos kiszolgálása a hitelesített végponton keresztül.

---

## 3. ALDI – Rakodás modul: A RAKODVA jelölés és valós készletmozgás működése

A felhasználói elvárásnak megfelelően a felrakott áru többé nem maradhat bent a raktári lokációkon:

- **Megerősítő figyelmeztetés:** A RAKODVA pipa bejelölésekor megerősítő párbeszédablak jelenik meg a téves kattintások kivédésére.
- **Készlet fizikális törlése a lokációról:**
  - A `server/src/routes/aldi_cross_docking.js` végpontban megvalósult: amint egy kamion RAKODVA státuszt kap (`is_loaded = true`), a rendszer azonosítja a kamionhoz tartozó komissió- és fuvarsorokat (`aldi_commission_lines`, `aldi_truck_lines`).
  - Az adatbázis `aldi_stock_locations` táblájából a hozzájuk tartozó készletsorok **azonnal és fizikailag törlésre kerülnek** (ellenőrizve mind a `commission_line_id`, mind a `truck_line_id` kapcsolatot).
  - A termék így azonnal eltűnik az adott raktári lokációról, tükrözve, hogy az áru fizikailag fel lett rakva a kamionra és elszállításra került.
- **Kamion állapotváltása és fuvarlisták frissülése:** A kamion kikerül a nyitott rakodási listából, és átkerül a rakodott státuszba, ezáltal azonnal megjelenik a Belföldi fuvarok és a Fuvarok összesítő felületén.
- **Teljesített rendelési mennyiségek (`fulfilled_cartons`) növelése:** A komissiózott és felrakott kartonszám hozzáadódik a rendelési sor teljesítéséhez.
- **Tranzakcióbiztonság és duplikációvédelem:** A lokációtörlés, a kamionstátusz és a teljesítés növelése egyetlen adatbázis-tranzakcióban (`trx`) hajtódik végre. Ismételt jelölés vagy szerverhiba esetén sem keletkezhet duplikáció (pl. korábban tapasztalt 10 -> 20 karton hiba).
- **Beragadt fantomkészletek tisztítása (Adatbázis migráció):**
  - A korábbi hiányos működés miatt régebben rakodott kamionoknál (pl. **AL02**) a raktári lokációkon beragadt tételek maradtak (pl. 70 karton).
  - A `20261007000002_cleanup_loaded_trucks_stock.js` migrációs script segítségével az összes korábban már rakodott kamionhoz tartozó árva `aldi_stock_locations` sor törlésre került, teljesen kitisztítva a fantomkészleteket.

---

## 4. ALDI – Heti lekötés: Mennyiségek, Napi bontás és Akciós/Normál számítás javítása

A Heti lekötés modelljében megszüntettük az akción kívüli időszak nullázódását és pontosítottuk a szerkesztő működését:

- **A 0 kartonos akción kívüli hiba megszüntetése:**
  - **A hiba oka:** Korábban hiányzó vagy nem kinyert napi Excel-bontás (`daily_values`) esetén a számítás a teljes heti előrejelzést (pl. 2994 kartont) akciósnak vette, így a normál (akción kívüli) alapra 0 karton jutott, és a táblázatban is 0 lett az akción kívüli napok becsült értéke.
  - **A javítás:** A rendszer mostantól az archivált heti tervből automatikusan és megbízhatóan pótolja a hiányzó napi bontást. Amennyiben az archívum nem elérhető vagy nem párosítható, a felület és a szerver egyértelmű figyelmeztetéssel jelzi a hiányzó adatot ahelyett, hogy hamis 0-t számolna.
- **Különválasztott szerkesztőmezők az akciós státusz alapján:**
  - **Akciós időszakkal rendelkező tételeknél:** két mező jelenik meg a kiszámolt részösszegekkel: **Akciós időszak** és **Akciós időszakon kívüli**, az érintett akciós napok előzetes bepipálásával.
  - **Akció nélküli tételeknél:** kizárólag a **Normál** mező jelenik meg, akciós napválasztó nélkül.
  - A szerkesztő külön jelzi, ha a megjelenített mennyiség korábbi kézi felülírásból származik.
- **Keresleti többlet átcsoportosítása:** Ha a Keresleti adatok heti kartonszáma meghaladja a Rendelési terv heti előrejelzését, a **pozitív különbözet teljes egészében az akciós alaphoz adódik**, miközben az akción kívüli (Normál) alap változatlan marad.
- **Készletlista prioritási sorrendje:**
  1. *Becsült*, ha nincs rendelési vagy teljesítési adat.
  2. *Rendelt*, ha beérkezett tényleges rendelés (felülírja a becsültet).
  3. *Teljesített (Tel.)*, amely legmagasabb prioritásúként felülírja a rendelt és becsült értékeket is.
- **Tájékoztató szöveg és felületi tisztítás:**
  - Egyértelműsítettük: a beállított százalékprofil *"ettől a héttől érvényes, a múltbéli adatokon nem módosít. Minden időszak összege külön 100% legyen."*
  - Az "Alapértékek visszaállítása" gomb eltávolításra került a beállítások dialógusból.

---

## 5. Tesztelés, Minőségbiztosítás és Git feltöltés

- **Automatizált tesztek:** A teljes tesztcsomag futtatása során **87 tesztből 85 sikeresen lefutott** (0 hibás, 2 PostgreSQL-specifikus teszt szándékosan kihagyva).
- **Verziózás:** A rendszer verziószáma mind a szerver, mind a kliens felületen **V0.9.8**-ra emelkedett.
- **Git:** A projekt összes módosítása véglegesítésre és feltöltésre került a GitHub tárolóba.
