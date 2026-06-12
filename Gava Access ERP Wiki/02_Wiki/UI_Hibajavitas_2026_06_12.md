# UI és Adatbázis Hibajavítások (2026. 06. 12.)

## 1. Kamion szerkesztés modul (`kamion_szerkesztes.js`)
- **Termék hozzáadása mezők lokalizációja:** A korábbi magyar nyelvű mezőnevek frissítve lettek a kért angol megfelelőikre pontosan a kért sorrendben (pl. *N° Euro Palets, N° Normal Palets, Products, Reference, Customer, Destination, Comment, Gross weight (kg), Price (EUR), Price BCN (EUR), Unit, Reloading/plt, Transport BCN/plt, Customer order N°*).
- **Total Palets számítás:** A fuvarok összesítőjében alkalmazott logika alapján beépítettük a váltószám (`conversionMap`) szerinti átváltást. A normál raklapok súlyozottan kerülnek átszámításra Euro raklapra az adott tételnél.
- **Fejadatok betöltési hibája és üres táblázat (TDZ hiba):** 
  - A korábbi dátum- és elem-leképezési (időzóna parse) hiba elhárítása után a tételek táblázata még mindig üres maradt a Temporal Dead Zone (TDZ) hiba miatt. Mivel a modul aszinkron `Init` blokkja (a fuvarozók, termékek és meglévő kamion betöltése) a kód közepén volt elhelyezve, a `loadExistingShipment` már azelőtt lefutott és meghívta a `renderTable -> calculateLineTotals` függvényeket, mielőtt a JavaScript parser elérte volna a `const conversionMap` deklarációját a fájl alján. Ez egy csendes `ReferenceError: Cannot access 'conversionMap' before initialization` hibát dobott a renderelőben.
  - **Megoldás:** Az aszinkron `Init` blokkot áthelyeztük a `openKamionSzerkesztesWindow` modul callback függvényének a legvégére, így az összes funkció (pl. `renderTable`, `calculateLineTotals`) és blokk-szintű állandó (pl. `conversionMap`) biztonságosan és maradéktalanul inicializálódik a betöltődés előtt.
  - Továbbá a rendszer mostantól részletesebb hibaüzenetet (`err.message`) is megjelenít az alert ablakban, ha bármi gond adódna a jövőben.

## 2. Rakodás modul (`rakodas.js`)
- **Dátumválasztó szélesség:** A `Rakodás` fülön a dátum szűrők (`rak-date-from` és `rak-date-to`) szélességét megnöveltük `160px`-re, így az utolsó karakter is tökéletesen kifér.
- **Dátumra szűrés javítása:** A dátumok UTC vs. Lokális időzóna elcsúszásából adódóan (pl. egy `2026. 05. 20.`-i rakodás UTC-ben `19`-ére eshetett éjfélkor), a "tól-ig" szűrők nem adtak találatot a pontos napokra. Ezt a `Date` objektum lokális komponenseinek (év, hónap, nap) manuális kinyerésével orvosoltuk. A szűrés mostantól hajszálpontosan működik.

## 3. Adatbázis és Fuvarozók (Backend & Scripts)
- **Karakterkódolási javítások:** A magyar specifikus hosszú karakterek (pl. "ő", "é") hibás megjelenését okozó kódolási hibákat (amik " ?" formában jelentek meg) egy adatbázis normalizáló script segítségével kijavítottuk.
- **Fuvarozó duplikációk:** A "2 Twins Trasport" és egyéb feleslegesen számmal ("2") prefixált, duplikált fuvarozó rekordokat eltávolítottuk, a hivatkozásaikat konszolidáltuk. Ezzel a `Fuvarozó: ` vezérlő legördülő listája ismét rendezett és letisztult lett az összes felületen.

## 4. Egyedi Azonosító Alapú Fuvar-szerkesztés (Szezon-ütközések elkerülése)
- **Probléma leírása:** A korábbi rendszer a szerkesztés megnyitásakor a kamionszámot (pl. `GHU 195`) használta kulcsként. Mivel a kamionszámok szezonról szezonra ismétlődnek, a backend (`by-order` API) mindig a legújabb szezont adta vissza, ami üres táblázatot vagy hibás adatokat eredményezett régebbi szezonbeli azonos számú fuvarok megnyitásakor (illetve fordítva).
- **Megoldás:** 
  - **Backend API:** Bevezettünk egy új, kizárólag numerikus ID-t fogadó `GET /api/v1/shipments/:id` végpontot, amely közvetlenül az egyedi adatbázis-azonosító alapján kéri le a fejlécet és a hozzá tartozó tételeket.
  - **Frontend Módosítások:** 
    - A `fuvar.js` és `rakodas.js` modulokban a szerkesztés indításakor a kamionszám szövege helyett a rekord valódi adatbázis `id`-ját adjuk át.
    - A `kamion_szerkesztes.js` modul `loadExistingShipment` függvénye mostantól intelligensen felismeri, ha numerikus ID-t kap, és az új végpontot hívja (megtartva a korábbi kamionszám alapú visszaeső/fallback kompatibilitást).
    - Betöltés után a szerkesztőablak fejléce dinamikusan frissül a kamion szöveges számára (pl. `Kamion szerkesztése: GHU 195`), így a felhasználó számára továbbra is a megszokott, olvasható formátum jelenik meg.

