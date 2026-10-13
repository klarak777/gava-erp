# Fejlesztési napló – 2026. október 13. – ALDI OpenText EDI

## Cél és onboarding

A Task 3 megállapodás elfogadását a felhasználó visszaigazolta. A Task 4 üzenettípus-képességvállalás előkészítése folyamatban. A teljes listát a felhasználó megadta és ellenőriztük; az OpenText kapcsolati adatai még hiányoznak.

Elkészült az ERP külön ORDERS tesztmenüje, az archiválás, változáskövetés és a konfigurálható SFTP tesztlekérő. Ez belső tesztképesség; nem a teljes EDI lista vagy az éles Napi rendelés kapcsolat készültségi igazolása.

## Változások

- ALDI → **EDI teszt és napló**: önálló ERP ablak, fájlfeltöltés, delta/full mód, UNB/NAD profil, eredeti üzenet olvasható nézete és letöltése, verziók, eltérések, törlések, hibanapló és újrapróbálás.
- Négy összetartozó tesztminta: új rendelés, +20/+8 mennyiségi módosítás, tételtörlés és teljes törlés. Külön linkekről letölthetők, UNB tesztjelzéssel és egyedi mintacsomag-azonosítókkal.
- ORDERS 2.4 AHEAD EANCOM D.01B tesztfeldolgozó, szolgálati karakterek helyes kezelése, UNOC/UNOD, boríték- és lezárásellenőrzések. QTY 21/46/27 és LIN műveletkódok; CNT 38E becsült raklapszám külön tárolása.
- Delta módosítás nem törli a kihagyott sorokat. Hiányzó eredeti/köztes verzió blokkolja a módosítást; a hiányzó előzmény beérkezése után SFTP-n automatikus újrapróbálás is történik.
- Az eredeti fájl változatlan PostgreSQL `bytea` formában, SHA-256-tal; külön JSON rendelésverziók és időrendi események. A hibás üzenet is megmarad. Több üzenet egy csomagon belül atomikusan készül el; duplikált tartalom nem dupláz rendelést.
- UPDATE/DELETE/TRUNCATE tiltása adatbázistriggerekkel; nem üres EDI archívumot az automatikus migráció-visszavonás sem törölhet.
- SFTP alapból tiltva; alap lekérési időköz 60 perc. SSH szerverkulcs-lenyomat ellenőrzése, jelszó/kulcs alapú hitelesítés, méretkorlát, hibanapló és kapcsolatlezárás. Távoli törlés/mozgatás nincs a tesztprofilban.
- Új `ssh2-sftp-client` függőség és titok nélküli `.env.aldi-edi.example` beállítási minta.
- Menü és frontend importok verziójelölése frissítve, a meglévő menüteszt az új ablak megnyitását is ellenőrzi.

## Ellenőrzés

A teljes szerverteszt-csomagban 120 sikeres, 0 hibás és 2 más modulhoz tartozó, környezeti változó hiányában kihagyott teszt szerepelt. Az EDI adatbázis- és böngészőtesztek külön PostgreSQL 16 `edi_test` adatbázissal ténylegesen futottak. A további EDI pontosításokat az érintett tesztekkel külön ellenőriztük.

Az adatbázis-próbák az eredeti bájtok megőrzését, verziókat, +20/+8 eltérést, törlést, hibák megőrzését, tranzakciós visszagörgetést, ismételt/párhuzamos fogadás kiszűrését és a módosítás/törlés elleni triggereket ellenőrizték. Böngészőben a valódi feltöltési API-val végigment a folyamat. SFTP-n szimulált klienssel történt a technikai ellenőrzés; OpenText végponttal még nem.

## Bevezetési állapot és hátralévő munka

Az új táblákhoz a `20261013000001_create_aldi_edi_test_archive.js` migráció és a backend újraindítása szükséges. DO telepítés és valós OpenText kapcsolat aktiválása nem történt. A próbák az éles Napi rendelés/Rakodás üzleti adatait nem érintették.

A helyi `127.0.0.1:5432/gava_erp` adatbázis ellenőrzése után az egyetlen függőben lévő, új EDI migráció lefutott. A 3000-es port helyi ERP szerverét újraindítottuk. A státusz, fájllista és napló API-ja HTTP 200 választ ad; a helyi tesztarchívum üres, az SFTP nincs aktiválva. Oldalfrissítés után a menü helyben használható. A végső EDI tesztfutásban 22 ellenőrzés sikerült, kihagyás és hiba nélkül.

A Task 4 lista, a Task 6 routing/SFTP adatok és a valós tesztminták után szükséges a Napi rendelés éles adaptere, GTIN/csomagolás és raktár megfeleltetés, Document Check, végpontok közötti teszt, megőrzési/mentési üzemeltetés, valamint a ténylegesen kijelölt DESADV/INVOIC/RECADV fejlesztések.

Részletes jelentések, kitöltési szöveg és útmutató: [ALDI OpenText Task 4 és EDI tesztkörnyezet](../docs/aldi-opentext-edi-test-20261013.md).

## Kiegészítő tisztázás és valódi SFTP próba

Az ALDI EDI Guideline 1.4 alapján saját GLN helyett kétoldalúan egyeztetett ZZ azonosító vagy DUNS is használható. A Gava nem tervez GS1 regisztrációt, ezért a ZZ profil jóváhagyását kell kérni az UNB/NAD azonosítókkal és minősítőkkel együtt. A Task 4 üzenettípus-képesség megerősítése és a Task 8/9 partneri teszt/élesítés külön lépések; a korábbi túl szigorú időrendi megfogalmazást pontosítottuk.

Valódi helyi SSH/SFTP szerverrel sikeres ORDERS letöltést, nem GLN formájú tesztazonosítókat és hibás szerverkulcs elutasítását ellenőriztük (`aldiEdiSftpConnection.test.js`, 1 sikeres teszt). A próba végén a saját ideiglenes szerver leállt; az OpenText kapcsolatot nem aktiváltuk. A helyi Termék adattábla 16 aktív ALDI termékénél minden GTIN mező ki van töltve, mindegyik 13 jegyű.

## Task 4 teljes lista és Full PO Change

A felhasználó megadta a Task 4 teljes űrlapját. Mind a hat sor előválasztott Yes: ORDERS Create; ORDERS Change/Cancellation; DESADV Dropship; DESADV Warehouse; RECADV Goods Receipt; INVOIC Commercial, jóváírási lehetőséggel. A lista ellenőrzése ezzel megtörtént; a teljes kör műszaki támogatása még nincs kész.

Az alapértelmezett rendelésmódosítás Full PO Change; Delta-only külön ALDI egyeztetést igényel. Az ERP tesztűrlap, a mintacsomag és a környezeti beállítási minta Full-ra frissült. A korábban már törölt nulla soroknak nem kell minden későbbi Full üzenetben újra szerepelniük; a történeti nulla állapotukat megtartjuk. A belső tesztek ezt is ellenőrzik.

Az útmutató tartalmazza az alsó megerősítéshez javasolt No döntés indoklását, a Business Partner Notes kész angol szövegét, az első ORDERS ütem kérelmét, a Dropship alkalmazhatóságának kérdését, a raktári DESADV változatát, ZZ azonosító és SFTP adatok egyeztetését. Portálművelet nem történt.

A Full mód pontosítása után 13 parser/SFTP ellenőrzés és 10 külön PostgreSQL/HTTP/böngészős ellenőrzés sikerült, hiba és kihagyás nélkül. A tesztminták Full sorrendje új rendelés → módosítás → tételtörlés változatlan sorral → teljes törlés. A helyi backend újraindítása a pontosítás betöltéséhez megtörtént; az OpenText SFTP kapcsolat letiltva maradt.
