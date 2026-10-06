# ALDI rendelési felületek külön ablakokban

Dátum: 2026. október 6.

## Felhasználói működés

Az ALDI menü legördülő listájában megmarad a **Rendelések** menüpont. Rámutatásra vagy kattintásra jobb oldalon kinyílik a négy almenüpont:

- Napi rendelés
- Heti lekötés
- Heti árak
- Komissió utasítás

Az almenüpont kiválasztása nyitja meg a saját felületét az alkalmazás meglévő ablakkezelőjében. A Rendelések szülőpontra kattintás csak az almenüt nyitja ki. A négy ablak egyszerre is nyitva lehet, külön mozgatható, jobb alsó sarkánál átméretezhető, teljes méretre állítható, bezárható vagy az alkalmazás tálcájára helyezhető.

Rámutatás esetén az almenü nyitva marad, amíg a kurzor a szülőponton vagy az almenüben van. Kattintásra nyitva marad a kiválasztásig vagy a menün kívüli kattintásig. Az Escape bezárja az almenüt; a szülőpont billentyűzettel is megnyitható.

Ugyanarra a menüpontra ismét kattintva a már nyitott ablak kerül előre; tálcán lévő ablak esetén az visszaáll. Ez nem nyit új példányt, és megőrzi az adott ablak szűrőit és kiválasztásait. Bezárás után újranyitva új példány indul.

## A módosítás határa

A változtatás a frontend menü és megjelenítés szervezésére korlátozódik. A négy ablak továbbra is az `aldi_rendelesek.js` meglévő felületeit, eseménykezelőit és adatlekérő függvényeit használja. Az önálló nézet a korábbi fül gombjának meglévő kattintáskezelőjével indul, a belső fülsáv pedig rejtett. A PDA Android alkalmazását nem érinti, ezért APK-build nem szükséges és nem készült.

Az API-végpontok, adatfeldolgozás, számítások, feltöltés, mentés, export, adatbázis és backend vezérlők nem változtak. A meglévő közös inicializálás és a heti lekötés frissítése is megmaradt. A korábbi `aldi_rendelesek` navigációs azonosító kompatibilitási célból továbbra is elérhető.

Érintett frontend fájlok:

- `Access UI/src/data/aldi-order-views.js`: a négy nézet közös menüadatai.
- `Access UI/src/data/nav-structure.js`: a Rendelések szülőpont és négy almenüpontja.
- `Access UI/src/main.js`: a jobbra nyíló almenü kezelése, valamint a külön ablakok megnyitása a meglévő WindowManager használatával.
- `Access UI/src/style.css`: a jobbra nyíló almenü elhelyezése és megjelenése.
- `Access UI/src/modules/aldi_rendelesek.js`: választható önálló nézet és rejtett belső fülsáv.
- `Access UI/index.html`: a módosított belépőmodul gyorsítótár-verziója.

## Ellenőrzés

A `server/tests/aldiOrderWindows.test.js` Chromium böngészőben az alkalmazás tényleges HTML-jét, menüjét, frontend moduljait és ablakkezelőjét futtatja; a bejelentkezés és az API-válaszok tesztadatokat használnak.

Ellenőrzi a Rendelések szülőpont megtartását, a négy almenüpontot, a jobbra nyílást rámutatásra és kattintásra, az almenübe történő átvezetést, a menün kívüli kattintást, az Escape/Enter használatát, az egyidejű ablaknyitást és a háttérfelület megőrzését. Vizsgálja a napi rendelési szűrőt, a heti lekötés hétválasztását, a heti árak évválasztását, a komissió dátumszűrőjét és a hozzájuk tartozó változatlan API-hívásokat. Továbbá tényleges egérművelettel vizsgálja az átméretezést, a teljes méretre váltást, mind a négy ablak tálcára helyezését, a visszaállítást, az ismételt megnyitásnál az állapot megőrzését és a bezárás utáni újranyitást. A menü és a szűrők használata során nincs adatmentési kérés.

Eredmény: a teljes `npm test` futásban **66 sikeres teszt, 0 hiba**, 2 PostgreSQL-integrációs teszt adatbázis hiányában kihagyva. A `git diff --check` is hibamentes.

A friss frontend betöltéséhez szükség esetén **Ctrl+F5** használható.
