# ALDI fuvarok, rakodás és heti lekötés – fejlesztés ellenőrzése

Dátum: 2026. október 7.

Ez az első ellenőrzés állapotát rögzíti. A későbbi módosítások aktuális értékelése: [ALDI módosítások ismételt átvizsgálása](ALDI_modositasok_ismetelt_atvizsgalasa_2026_10_07.md).

## Vizsgálati alap és hatókör

- `docs/aldi-fuvarok-es-rakodas-jegyzet-20261007.md`.
- A projektben található `implementation_plan_heti_lekotes.md` jelenleg 0 bájt, nem olvasható belőle fejlesztési terv. A Heti lekötés összevetése ezért az `implementation_plan_heti_lekotes_v2.md`, a `walkthrough Heti lekötés V3`, a `Gava_ERP_V0.8.7_Heti_Lekotes_Modositasok.md` és a későbbi százalékbeállítási dokumentáció alapján történt. A felhasználó által említett pontos című terv azonosítása még nyitott.
- A munkakönyvtárban lévő, még nem commitolt fuvarfejlesztést és a jelenlegi heti lekötési kódot vizsgáltam. Az alkalmazás kódját nem módosítottam. Éles adatbázis, megosztott hálózati mappa és éles szerver módosítása nem történt.

## A fuvaros jegyzet követelményeinek állapota

| Követelmény | Megállapítás |
| --- | --- |
| Megerősítés a Rakodva jelölés előtt | Megvalósult. A mentés hibakezelése viszont hiányos. |
| Rakodott kamion eltűnik a Rakodás listából | Megvalósult az `is_loaded` szűréssel. Sikertelen HTTP-válasznál is eltűnik. |
| Rakodott kamion megjelenik az összesítőben és a belföldi fuvarokban | Mindkét nézet az `aldi_trucks.is_loaded` alapján olvas, nincs szükség rekordmásolásra. A megjelenés sikeres adatbázismentést és a nézet adatbetöltését igényli. |
| ALDI logó és új összesítő-fejléc | Megvalósult. |
| Átlagos nettó súly pontos kamion/tétel párosítással | Részben valósult meg: azonos nevű, külön tételeknél összekeverednek a súlyok. |
| Szélesebb, szerkeszthető komment | Megvalósult; a mentési hibák jelzése hiányzik. |
| Dinamikus szezonválasztó | Az opciók létrejönnek, a szűrés egyik nézetben sem működik. |
| Központi fuvarozólista | Mindkét nézet a meglévő `/api/v1/transporters` végpontot használja. Az ADMIN felület a szerepkörös partnerlistát olvassa; a fuvarozó végpont ezt szinkronizálja a `transporters` táblába. Nem külön, kézzel karbantartott lista. |
| Oszlopbeállítások és localStorage | Megvalósult az összesítőben, a meglévő `createModal` használatával. |
| Belföldi crossdocking raklapszám és komment szerkesztése | A mezők és az API-kezelés megvalósult. A `crossdock_pallets` név egyezik a migrációval. Hibás mentésnél nincs visszajelzés. |
| Fuvarszámla feltöltése kamionszám szerinti almappába | Az alapfolyamat megvalósult. Fájlnévütközés, útvonal- és rekordellenőrzés, valamint letöltés tekintetében javítás szükséges. |

## Javítandó hibák

A P1 besorolás adatvesztési, adatösszekeverési vagy hibás számítási problémát jelöl; P2 a funkció működését akadályozó hibát.

### 1. P1 – A súlyok összekeverednek azonos nevű kamiontételeknél

Forrás: `server/src/routes/aldi_fuvarok.js:12–14`.

Az új összesítő a komissiós sorokat kamionazonosító és terméknév alapján kapcsolja a kamiontételekhez. Nem használja a rendelkezésre álló `aldi_commission_lines.aldi_truck_line_id` kapcsolatot. Ha ugyanazon a kamionon két külön rendelési tételnek ugyanaz a neve, mindkét sor megkapja az összes ilyen nevű komissió súlyát.

Reprodukció: egy kamion két „Korte” sora, az elsőhöz 100 kg nettó/10 karton, a másodikhoz 300 kg nettó/10 karton. A jelenlegi lekérdezés mindkét összesítősorban **400 kg nettót és 20 kg/karton átlagot** ad vissza. A helyes tételenkénti érték **100 kg / 10 kg/karton**, illetve **300 kg / 30 kg/karton**. A bruttó súlyok is duplán szerepelnek a két sor összegében.

Javítás: az összesítést kamiontétel-azonosító szerint kell kapcsolni. A régi, tételkapcsolat nélküli komissióadatokhoz egyértelmű külön visszaesési szabály szükséges. A meglévő Komissió megtekintése végpont régi adatokhoz kamiontételből képzett helyettesítő sorokat is ad; az új összesítő ezt jelenleg nem veszi figyelembe.

### 2. P1 – Az azonos nevű számlafájl felülírja a korábbi dokumentumot

Forrás: `server/src/routes/uploads.js:189`, `:206`, `:226`.

A célútvonal csak a kamionszámból és az eredeti fájlnévből készül. A `writeFileSync` felülírja az előző fájlt, miközben az adatbázisban újabb referencia kerül a listába ugyanazzal az útvonallal.

Reprodukció: két `invoice.pdf` feltöltése ugyanahhoz a kamionhoz. Az adatbázisban két fájlbejegyzés van, fizikailag egy fájl marad, a második tartalmával. Ugyanez külön kamionrekordok között is előfordulhat, ha azonos kamionszámot és fájlnevet használnak.

Javítás: egyedi tárolási fájlnév vagy külön feltöltési almappa szükséges; a felhasználónak az eredeti fájlnév maradhat megjelenítve. A fájl- és adatbázismentés hibáinál rendezni kell a félbemaradt állapotot. A jelenlegi fájllista olvasás–bővítés–visszaírás menete párhuzamos feltöltéskor is elveszíthet referenciákat.

### 3. P1 – HTTP 500 után is mentett állapot látszik a felületen

Forrás: `Access UI/src/modules/aldi_rakodas.js:284–296`, `Access UI/src/modules/aldi_belfoldi_fuvarok.js:253–263`, `Access UI/src/modules/aldi_fuvarok_osszesito.js:213–223`.

A mentési `fetch` válaszainál nincs `response.ok` ellenőrzés. A `fetch` HTTP 400/500 esetén sem dob kivételt. Így a Rakodva mező hiba esetén is eltünteti a kamiont a listából, a szerver pedig változatlanul rakodatlanként tárolja. A belföldi és az összesítő szerkeszthető mezőinél is látszólag megmarad a nem mentett érték.

Reprodukció Chromiumban: a Rakodva megerősítése után a PUT végpont 500-at adott; a kamion eltűnt a Rakodás listából, a tesztadatforrásban az `is_loaded` továbbra is `false` maradt.

Javítás: a válasz állapotának ellenőrzése, látható hibajelzés, majd a korábbi érték visszaállítása vagy az adatok újralekérése szükséges.

### 4. P1 – A számlafeltöltés nem ellenőrzi biztonságosan a kamiont és a célútvonalat

Forrás: `server/src/routes/uploads.js:189`, `:219–233`.

A kliens által megadott `truckNumber` közvetlenül útvonalelem lesz. Nincs az alapkönyvtáron belül maradást ellenőrző vizsgálat, és a kamion létezését csak a fájlírás után kérdezi le a kód. A nem létező kamionhoz tartozó feltöltés is sikeres választ kap, mert a nulla módosított rekordot nem ellenőrzi.

Reprodukció, kizárólag memóriában helyettesített fájlrendszerrel: `..\\..\\escape-review` esetén a cél kikerült az `ERP ALDI/Fuvarszámlák` könyvtárból. Nem létező truckId esetén is `200 / success: true` lett a válasz, egy elmentett fájllal és nulla tényleges kamionfrissítéssel.

Javítás: előbb ellenőrizni kell a kamionrekordot, a könyvtár nevét ebből meghatározni, ellenőrizni a feloldott célútvonalat, és csak ezt követően írni fájlt. A PDF/kép típuskorlátozást jelenleg a frontend `accept` attribútuma jelzi; a végpont nem ellenőrzi a megengedett fájltípusokat.

### 5. P2 – A számlaletöltési gomb nem létező végpontra mutat

Forrás: `Access UI/src/modules/aldi_belfoldi_fuvarok.js:378`, `server/server.js:67–92`.

A gomb `/api/v1/documents?path=...` címet nyit meg, de ilyen végpont nincs regisztrálva. A `/documents` statikus könyvtár ettől eltérő útvonalon, más könyvtárból szolgál ki fájlokat. A meglévő `/api/v1/uploads/invoice/file` végpont pedig `shipments` rekordokhoz tartozik, nem ALDI kamionokhoz.

Javítás: ALDI kamionhoz tartozó, adatbázisból ellenőrzött számlaletöltési végpont és ennek megfelelő gombhivatkozás kell.

### 6. P2 – A szezonválasztó egyik fuvaros nézetben sem szűr

Forrás: `Access UI/src/modules/aldi_fuvarok_osszesito.js:152–169`, `:190–197`, `:410–438`; `server/src/routes/aldi_fuvarok.js:8`; `Access UI/src/modules/aldi_belfoldi_fuvarok.js:266–289`.

Az összesítőben a szezonválasztóhoz nincs change eseménykezelő, nincs szezonparaméter a lekérésben, és a backend sem alkalmazza a kiolvasott `szezon` paramétert. A belföldi nézetben a kiválasztás bekerül az állapotba, de a táblázat szűréséből kimarad.

Reprodukció Chromiumban: egy 2025.09.10-i és egy 2026.09.10-i rakodott kamion közül a „Season 26-27” kiválasztása után **mindkettő látható maradt**, mindkét nézetben. Az összesítőben új lekérés sem történt.

Javítás: közös, dátumalapú szezonhatárok alkalmazása: szeptember 1. inclusive – következő szeptember 1. exclusive. A meglevő dátumszűrővel együtt kell működnie, és a Szűrők törlése gombnak a szezonválasztást is törölnie kell. A jelenlegi opciólista csak három szezont kínál; régebbi adatokhoz bővítés szükséges lehet.

### 7. P1 – A Heti lekötés fejlécből számolt éve hibás az évhatáron

Forrás: `server/src/routes/aldi_weekly_commitments.js:127–140`.

A kód az Excel kezdődátumából egy napot visszalép, majd a szerdához tartozó **naptári évet** párosítja az ISO hét számával. Az ISO hét éve évváltáskor eltérhet a szerdai dátum naptári évétől.

Reprodukció a tényleges upload-kezelővel, adatbázis-írás előtt megállítva: a `01.01.2026 - 07.01.2026` előrejelzési fejléc és ugyanezt tartalmazó Rendelési terv fájlnév **2025 / KW01** rekordot keres. A helyes **2026 / KW01**, amelynek ALDI kezdőszerdája 2025.12.31. A mostani eredmény ezért nem egyszerűen előző évi könyvtárba mentene, hanem másik, közel egy évvel korábbi hetet választana.

Javítás: az ISO hét évét és számát együtt kell képezni. A fejlécben szereplő explicit évszámot is meg kell őrizni; jelenleg a fejléc dátumregexe azt nem használja a `headerDateStr` kialakításakor.

### 8. P1 – Több akciós időszak esetén az utolsó felülírja az előző napi számítását

Forrás: `Access UI/src/modules/aldi_rendelesek.js:631–644`, különösen `Object.assign(distribution, estimate.result)`.

Egy termék több külön akciós periódusát a felület ugyanabba a sorba csoportosítja. `daily_values` esetén azonban minden periódus a teljes hétnapos eredményt felülírja. Az utoljára feldolgozott periódus így eltünteti a korábbi periódus számítását.

Reprodukció a tényleges heti táblázatrenderelővel: ugyanaz a termék 400 kartonos `03.09.-06.09.` és 200 kartonos `07.09.-08.09.` periódussal szerepel. Nyitókészlet és érkezés nélkül a zárókészlet **-200**, a bemeneti sorok sorrendjét megfordítva **-400**. Ugyanazokból az adatokból a sorok sorrendje nem változtathatja meg a napi becslést és a készletet.

Javítás: termékenként/periódusonként definiált, sorrendtől független összesítés kell. Azonos periódus többsoros adatai jelenleg megfelelően összeadódnak; a külön periódusok kombinálása hiányos. Az átfedő akciós napok és az egyes tervsorok akción kívüli értékeinek összevonását külön kell rögzíteni, hogy javításkor ne keletkezzen dupla beszámítás.

## Heti lekötés: a tervhez viszonyított állapot

| Tervpont | Jelenlegi állapot |
| --- | --- |
| Tényleges napi rendelés kapcsolása nap és termék szerint | Megvalósult: csak `current` verzió, GTIN–cikkszám összerendelés és naponkénti összesítés. A tényleges nulla rendelés is elsőbbséget kap. |
| Valós terméknév a cikkszám helyett | Megvalósult, ALDI terméktörzs és Excel-név visszaeséssel. |
| Egységes fájlfeltöltés és típusfelismerés | Megvalósult; a HLK/HLA és Keresleti/Terv nevek támogatottak. |
| Hét meghatározása | Automatizált; dátum nélkül KW36-tól indított, hiányzó fájltípust kitöltő vagy új hetet választó menet is van. Az évhatári hibát a 7. pont tartalmazza. A V2 tervben javasolt „Új hét” gomb nem a jelenlegi megoldás. |
| Archivált fájlnevek | A jelenlegi `Keresleti adatok KWxx.xlsx` / `Rendelési terv KWxx.xlsx` megfelel a későbbi V0.8.7 jegyzetnek, de eltér a V2 terv HLK/HLA névjavaslatától. |
| Jövőbeli napok elrejtése és levonás megállítása a mai napnál | A V2 terv és a V3 összefoglaló ezt írja, a jelenlegi kód azonban a teljes hetet mutatja és számolja. Ezt a `stockAtDate` kommentje későbbi felhasználói kérésként rögzíti, és a `weeklyStockDisplay.test.js` is kifejezetten ellenőrzi. Ez dokumentációs eltérés; nem minősítettem automatikusan visszaállítandó hibának. |
| Színkiemelések | A termék zöld hátteret, az akciós periódus sárga hátteret kap. A pontos árnyalatok és a becslések szövegszíne eltérnek a V2 tervtől. |
| Százalékok és tényleges rendelés elsőbbsége | A későbbi százalékbeállítási fejlesztés és tesztjei megvannak; a több külön periódus összevonásánál a 8. pont szerinti hiba áll fenn. |

## Ellenőrzések és korlátok

- Teljes `server` tesztfutás: **68 tesztből 66 sikeres, 0 hibás, 2 PostgreSQL-integrációs teszt kihagyva**.
- Ez a tesztcsomag az új fuvaros hibákat nem fedi le; a sikeres futás ezért nem igazolja a fuvarfejlesztés teljes helyességét.
- Külön ellenőrző script: `scratch/aldi-review-20261007.cjs`; eredmények: `scratch/aldi-review-20261007-results.json`. A scratch mappa git által figyelmen kívül hagyott helyi ellenőrzési anyag.
- A súlyösszesítés ellenőrzése a tényleges Knex lekérdezésből képzett SQL-lel, memóriabeli SQLite táblákon történt. Nem PostgreSQL-integrációs teszt, de az azonos nevű tételsorok hibás kapcsolását és a kétszeri súlybeszámítást közvetlenül reprodukálja.
- A szezonok és a hibás Rakodva mentés Chromiumban, a tényleges frontend modulokkal és helyi tesztválaszokkal futottak.
- A fájlütközés, a célútvonal, a nem létező kamion, valamint a heti feltöltés évhatára a tényleges route-kezelőkkel, helyettesített adatbázissal/fájlrendszerrel lett ellenőrizve. A hálózati megosztásra nem írtam.
- A három új migráció éles lefutását és az éles hálózati hozzáférést nem ellenőriztem.
- A `git diff --check` a meglévő, vizsgált módosításokban sorvégi szóközöket jelez. Ez formázási eltérés, a felsorolt működési hibáktól független.

Elsőként a tételazonosító szerinti súlykapcsolást, a sikertelen mentések kezelését és a számlák megőrzését érdemes javítani, majd a letöltést és a szezonokat. A heti lekötés évhatári és többperiódusos hibái ettől külön kezelhető feladatok. A dokumentáció elavult követelményeit a jelenleg elfogadott üzleti működéshez kell igazítani.
