# ALDI / OpenText – beérkezési értesítés és Task 4A pontosítása

Dátum: 2026-10-14.

A Gava új igénye szerint a 60 perces rendeléslekérés túl ritka; az új rendelésről, módosításról és törlésről mielőbb értesülni és az üzenetet automatikusan feldolgozni szeretnék. A helyi SFTP tesztlekérőben a gyakoriság állítható (1–1440 egész perc), a 60 perc korábbi alapérték, nem ALDI/OpenText előírás. Kód- és aktív konfigurációmódosítás ebben a tisztázásban nem történt.

Az ALDI onboarding útmutató szerint az SFTP business-partner-initiated. Az AS2 alternatíva az EDI üzenet HTTP POST kézbesítésével külön lekérés nélküli feldolgozást tesz lehetővé, de saját AS2 fogadó még nincs implementálva. Az OpenText általános Trading Grid dokumentációja Arrival Alert szolgáltatást is leír, előfizetési feltételekkel; a Gava ALDI profiljához való elérhetősége, csatornája, esetleges gépi esemény/webhook és késleltetés partneri visszaigazolást igényel. A Task 5 hibaértesítése nem azonos a sikeres rendelés beérkezési értesítésével.

A Task 4A előkészített angol szövege most AS2 push vagy azonnali SFTP-lekérést kiváltó esemény lehetőségét kéri. Csak időzített SFTP esetén a minimális engedélyezett időközt kérdezzük, lehetőleg 1–5 percet, továbbá a várható kézbesítési/értesítési késleltetést. A korábbi GLN-helyesbítést külön hangsúlyozó mondatot elhagytuk a felhasználó preferenciája szerint; a meglévő GLN 5990696117005 és GS1 cégprefix 5999883976 szerepel. A Task 4 mentését és Task 4A megnyitását a felhasználó megerősítette; a portálon nem végeztünk mentést vagy külső üzenetküldést.

Részletes, frissített szöveg: [ALDI OpenText EDI útmutató](../docs/aldi-opentext-edi-test-20261013.md).

A felhasználó kérésére az angol partneri szövegből elhagytuk az órás lekérés elutasítását: ez korábban saját javaslat volt. A végleges megfogalmazás csak a mielőbbi automatikus átvétel igényét és az elérhető kézbesítési/értesítési lehetőségek kérdését tartalmazza. Időzített SFTP esetén a minimális engedélyezett időközt kérdezi, konkrét percérték előírása nélkül.

## CobraConto számlázás és INVOIC elemzés

A felhasználó jelezte, hogy a számlakibocsátás CobraContóban történik. Dokumentáltuk a javasolt folyamatot: ugyanaz a Cobra számla NAV XML adatszolgáltatásban és külön ALDI INVOIC üzenetben kerül továbbításra. A két befogadási státuszt külön kell ellenőrizni; az EDI átalakítás nem hoz létre második számlát. Az eredmény forrásai a NAV és Cobra gyártói dokumentációja, valamint a letöltött ALDI INVOIC követelmények.

A Cobra 2026.3 kiadásában meglévő EDISys ALDI funkcióra találtunk dokumentációt; a Gava verziója/licence és a közvetlen OpenText profilhoz való illeszkedés még nem igazolt. A számlázó megtartását, a használható strukturált export és a magyar módosító bizonylatok ALDI üzenetekkel való megfeleltetésének vizsgálatát javasoltuk.

Részletes elemzés: [CobraConto, ALDI INVOIC és NAV](../docs/aldi-invoic-cobraconto-nav-20261014.md). A teljes Task 4A szöveget egyben adjuk vissza, korrekciós mondat és az órás lekérés elutasítása nélkül. Számlázási kód, éles adat, NAV-/EDI-konfiguráció vagy portál nem módosult.

## Warehouse DESADV a Rakodva jelöléshez

A felhasználó a „Rakodva” pipához kapcsolt ASN-t javasolt. A kódban ellenőriztük, hogy a jelölés teljes kamionhoz tartozik, és a backend az első rakodott állapotba váltást tranzakcióban kezeli. Meglévő kamion-, komissiózási-, rendelés- és SSCC-adatok szolgálhatnak alapul, de az összes kötelező ASN-adat és tényleges raklaplista megfelelősége még nem igazolt.

Elkészült a [Rakodva–Warehouse DESADV megvalósítási terv](../docs/aldi-warehouse-desadv-rakodva-terv-20261014.md): adatellenőrzés, változatlan szállítmányállapot, tartós küldési feladat, háttérküldés és újrapróbálás, duplikáció elkerülése, külön partneri státusz és archiválás. Az ASN-küldő nem készült el, új automatikus küldést nem aktiváltunk.

A Task 4A előkészített szövegében az első ütem kérését ORDERS + Warehouse DESADV-ra bővítettük, a még hiányzó küldő egyértelmű megjelölésével. A tervezett első ütem jóváhagyása, a MIG változat és a tényleges képesség-visszaigazolás továbbra is szükséges; a portálon nem módosítottunk választást.

## Warehouse DESADV / ASN megvalósítása

A felhasználó kérésére elkészült az LPN and Item Level Warehouse DESADV 2.4 AHEAD előállítása, az első Rakodva mentéshez kapcsolt rögzítés, változatlan forrás-/üzenetarchívum, eseménynapló és tartós SFTP küldési sor. Fizikai rakodottság és EDI átviteli/befogadási állapot külön szerepel. Hiányzó vagy eltérő kötelező adatok blokkolt ASN-t eredményeznek, ismételt kamionmentés nem dupláz teljesítést vagy üzenetet. Összeemelt raklapnál a végleges master SSCC és az összes tagtétel szerepel; célraktáranként külön értesítő készül.

A meglévő kamion/komissió/SSCC adatokat auditáltuk. 4 kamion, 5 kamionsor, 10 komissiózási sor, 7 címke (6 végleges), 11 rendeléstétel szerepelt a helyi ERP-ben. Mind az 5 kamionsor célraktára üres, a 11 régi rendeléstételnél az eredeti LI nem volt elmentve, a 6 végleges címke nem a Gava licencelt prefixével készült; címkehiány és mennyiségi eltérés is található. A jelenlegi adatok nem elegendők küldhető ASN-hez. Az ALDI UNB/NAD célprofil még nincs visszaigazolva.

Az új PDF-feltöltések megőrzik az eredeti tételsorszámot; eltérő eredeti LI-ket összevonó mennyiségnél nem mentünk hamis egyetlen hivatkozást. Új ASN adatlapon megadható a célraktár/eredeti tételhivatkozás, partnerprofil és feltételes BBD/expiry adatok. A normál és összeemelt PDA SSCC-generálás alapértéke a licencelt 5999883976 prefix; a meglévő címkéket nem számoztuk át. A DATE mezők explicit SQL szövegként, az üzenetlétrehozás Budapest szerint készül; a tesztben talált UTC miatti napeltolódás javítva.

Valódi izolált PostgreSQL, HTTP és böngésző ellenőrizte a Rakodva/ASN működést. Saját valódi SSH/SFTP szerverre bájtpontos DESADV továbbítás és hibás hostkulcs elutasítása sikerült. Átviteli hiba, ugyanazon üzenet ismétlése, bizonytalan átnevezés, nem továbbított ASN újraépítése és az archívum változatlansága is tesztelt. Az ASN-csomag 20 sikeres ellenőrzést adott; a módosított PDF-rendelésverziózás külön regressziója is sikeres, csak tesztadatbázisban használt sorszámokkal.

A helyi adatbázisban az új ASN migráció külön lefutott, 135. csomagként. Külső és éles ASN-küldés letiltva maradt, OpenText-végpontot nem használtunk, DO-ra nem telepítettünk. A Task 4A tervezet a már belsőleg tesztelt ASN-ről és a még hiányzó partneri profil/elfogadásról szól. [Részletes megvalósítás és adatellenőrzés](../docs/aldi-asn-megvalositas-es-adatellenorzes-20261014.md).

A végső teljes szervertesztben 147 ellenőrzésből 144 sikeres, 0 hibás és 3 környezetfüggően kihagyott próba szerepelt. A kihagyott ALDI PDF-verziózást külön dedikált `edi_test` adatbázison is lefuttattuk, sikeresen. A 3000-es port korábban elindított helyi Node folyamata ellenőrzött újraindítással betöltötte az új kódot. ASN státusz/lista/kamionaudit HTTP 200; a helyi éles üzleti adatokhoz nem hoztunk létre próba-ASN-t. Az SFTP és éles küldés tiltva maradt. A teljes tesztnapló `scratch/aldi-asn-full-tests-20261014.log`, az ASN felülete oldalfrissítés után elérhető.

Források: a letöltött ALDI onboarding és EDI Guideline dokumentumok; [AS2 RFC 4130](https://datatracker.ietf.org/doc/html/rfc4130); [OpenText Messaging Service Alerts and Options](https://tradinggrid.opentext.com/TGOHelpContent/CommonHelp/en/Account%20Manager.12.46.html).
