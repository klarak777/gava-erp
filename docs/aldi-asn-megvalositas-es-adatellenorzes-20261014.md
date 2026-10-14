# ALDI Warehouse DESADV / ASN – megvalósítás és ERP-adatellenőrzés

Dátum: 2026-10-14. Megvalósított profil: **LPN and Item Level, Warehouse DESADV 2.4 AHEAD, EANCOM D.01B / EAN008 / 2.0, UNOC vagy UNOD syntax 3**. Variant Level és AS2 fogadó/küldő ebben a változatban nincs implementálva. Az OpenText partnerprofil és végpontok közötti elfogadás még szükséges.

## Elkészült működés

A kamion első, szerveren sikeresen mentett `is_loaded: false → true` átmenete rögzíti az ASN szállítmányát. A rakodottság, a teljesített kartonszám, a lokációból kivétel és az ASN rögzítése egy adatbázis-tranzakcióban történik. Hiányzó üzleti adatnál a fizikai rakodottság menthető, de blokkolt ASN és olvasható hibajegyzék keletkezik; találgatott vagy hiányos üzenet nem készül. Ugyanazon Rakodva állapot ismételt mentése nem ismétli a teljesítést vagy az ASN-t.

Az ASN célraktáranként készül a tényleges komissiózási mennyiségekből. Egy PO-nál fejlécszintű RFF ON, több PO-nál tételszintű PO és eredeti tételhivatkozás szerepel. Nem az ERP verzióutótaggal ellátott rendelési számát használjuk, hanem a család eredeti ALDI számát. A várható érkezés a kamion szállítási dátuma. A dátumokat SQL DATE szövegként olvassuk, a létrehozási dátum és UNB időpont Budapest szerint készül, így nincs UTC miatti napeltolódás.

Raklaponként CPS/PAC/PCI/GIN hierarchia és QTY 12 mennyiségek készülnek. Összeemelt raklapnál a végleges mestercímke SSCC-je egy fizikai egységként szerepel, az összes tag terméke/mennyisége megmarad. Nem csak a legutóbbi címkét olvassuk. Címke–komissió mennyiségeltérés, hiányzó/ideiglenes/többértelmű címke, hiányzó összeemelt tag, vegyes célraktár egy fizikai egységen, túlteljesítés és hibás GS1 azonosító blokkol.

A PDA egy komissiózási munkamenete egy címkézett logisztikai egységet jelenthet több tárahordozóval. Az egyező PDA munkamenet alapján ez egy SSCC; a kézzel több raklapként rögzített, egyetlen címkés mennyiséget nem osztjuk szét feltételezésből. A CNT 38E a tényleges SSCC-egységek száma, nem a tervezett/táraraklapok egyszerű összege.

Lot/gyártási tétel, minőségmegőrzési és lejárati dátum továbbítható. Egy tételnél csak BBD vagy expiry használható; a partnerprofil ezek és a lot kötelezőségét állítja. A lot a MIG szerint legfeljebb 20 karakter. A karakterkészlettel nem ábrázolható szöveg, hibás dátum és a kötelezően kért, hiányzó adat blokkol.

## Adatok a helyi ERP-ben

A read-only vizsgálat a helyi `127.0.0.1:5432/gava_erp` adatbázison történt. 4 kamion, 5 kamionsor, 10 komissiózási sor, 7 SSCC-címke (6 végleges), 11 napi rendeléstétel szerepelt. **A meglévő helyi adatok egyelőre nem elegendők küldhető ASN-hez.** Ez nem a DO adatbázisának auditja.

| ALDI adat / követelmény | Ellenőrzés eredménye és fejlesztés |
| --- | --- |
| Termék GTIN, eredeti PO, tényleges mennyiség | Kapcsolódó rendelés-, kamion- és komissiózási adatok rendelkezésre állnak; a mennyiségi egyezést külön ellenőrizzük |
| Várható szállítási dátum | Meglévő kamionmező; dátumkonverzió javítva |
| Gava UNB/NAD azonosító | Profil kezdőértéke a megadott 5990696117005 GLN |
| ALDI UNB fogadó és NAD BY | Nincs még partnerhez visszaigazolt profil; kezdőértékük üres, a Task 6-ban egyeztetendők |
| Célraktár és címzetti bontás | Az 5 helyi kamionsor célraktára üres; az ASN adatellenőrző lapján megadható |
| Eredeti ALDI tételsorszám | A 11 történeti rendeléstételnél nem volt elmentve. Új feltöltésnél a PDF-ben felismert LI már `edi_line_reference` mezőbe kerül; az ASN adatlapján kamionsoronként ellenőrzött hivatkozás adható meg. Több PO-s ASN-nél kötelező. Több eredeti sort összevonó PDF-adatnál nem tárolunk hamis, egyetlen LI-t |
| Fizikai raklap SSCC | A 6 végleges helyi címke közül egyik sem a licencelt 5999883976 prefixből készült; hiányzó és eltérő mennyiségű címke is van. A jövőbeli normál és összeemelt PDA-címkék új alapértéke a megadott Gava-prefix. A meglévő címkéket nem írjuk át |
| Lot / eltarthatóság | Lot-mezők már voltak; ASN BBD/expiry mezők és adatlap hozzáadva. Az ország/termék/partner szerinti kötelezőséget még egyeztetni kell |
| Variant Level | Nem igazolt vállalati variánsadatok; az elkészült LPN and Item Level profil nem helyettesíti ezt a külön MIG-et |

Az ALDI beszerző/célrégió azonosítóját nem találgatjuk a portál AT partnerkódja vagy a magyar működés alapján. A Warehouse LPN MIG NAD BY/SU mezőket használ; nem adunk hozzá olyan NAD DP szegmenst, amelyet ez a MIG nem ír elő. A célraktár az ERP-ben a szállítmány megfelelő bontását és rendeléshivatkozásait biztosítja. A GTIN és QTY karton-/HU-megfeleltetést a partnerrel vissza kell igazolni.

## Felület és továbbítás

Menü: **ALDI → EDI teszt és napló → Warehouse DESADV – szállítási értesítő (ASN)**. Profiladatok, teszt/éles mód, raktárankénti ALDI címzetti eltérés, adatellenőrzés, eredeti tételhivatkozás/célraktár és eltarthatósági dátumok megadása, ASN elkészítése, eredeti fájl letöltése és teljes eseménynapló elérhető. A „Rakodva” mentése a blokkoló adathiányt is közli.

A küldés a mentés után háttérben történik. Az ASN forrásállapota, profilja, eredeti bájtjai/SHA-256 és eseményei változatlanok; PostgreSQL triggerek tiltják UPDATE/DELETE/TRUNCATE műveleteiket. A küldési sor állapota módosítható, minden lépése külön archivált esemény. ASN-nel összekapcsolt kamion törlése egyértelmű 409 hibával tiltott, a történet nem vész el. Ez adatbázis-védelem, nem DB-tulajdonosi jogosultsággal szembeni WORM tanúsítás.

Az új SFTP küldő a külön `ALDI_ASN_SFTP_*` beállításokat használja; sosem az ORDERS bejövő könyvtárába tölt. Az új környezeti minta alapból tiltja a külső és éles küldést. Küldéshez a profil/MIG/fájlátadás és a GTIN/karton egység egyeztetésének jelzése is szükséges. A szerverkulcs SHA-256 lenyomatát ellenőrizzük, a jelszó/kulcs nem kerül a felületre vagy a hibanaplóba. A partnernek támogatnia kell az ideiglenes `.part` fájl és végleges névre átnevezés folyamatát.

Az üzenet változatlan bájtokkal, először `.part` fájlba, majd végleges névre átnevezve jut a szerverre. Korábbi, azonos végleges fájlt ellenőrzünk, más tartalmat nem írunk felül. Biztosan a publikálás előtt megszakadt továbbítás növekvő várakozással legfeljebb öt alkalommal ismételhető, kézi ismétlés is elérhető. Átnevezés közben megszakadt vagy megszakadt küldőfolyamatnál „kézbesítés ellenőrzendő” állapot keletkezik; nincs automatikus újraküldés. A sikeres SFTP továbbítás **nem** ALDI üzleti befogadási igazolás. Ennek formáját/visszajelzését még partnerrel kell egyeztetni.

A már elkészült, de biztosan még nem továbbított ASN újraépíthető. Az előző állapot és bájtok megmaradnak, a régi küldési feladatot új változat váltja fel. Elküldött vagy bizonytalan kézbesítésű ASN-t nem építünk át; a partnerrel egyeztetett tartalmi korrekciós folyamat még külön szükséges.

## Teszt és helyi előkészítés

Külön helyi `edi_test` PostgreSQL sémákkal ellenőriztük a valódi Rakodva PUT végpontot, egyszeri teljesítést/lokációból kivételt/ASN-rögzítést, adathiány archiválását és javítását, változatlanságot, újraépítést és átviteli ismétlést. Valódi böngészőben az adatlap és a letölthető ASN megjelent. Saját valódi SSH/SFTP szerverre a PostgreSQL-ben archivált DESADV bájtjai sikeresen továbbítódtak; a hibás hostkulcsot a kliens elutasította. Bizonytalan átnevezés és kapcsolatmegszakadás külön esetként tesztelt.

Az ASN tesztfutás 20 sikeres ellenőrzést adott. A módosított PDF-feltöltés/rendelésverziózás külön regressziója is sikeres volt; az ERP-ből csak sémaleírást olvastunk, a teszt adatbázis saját sorszámokat használt. A teljes szerverteszt végső eredménye a napi wiki naplóban és `scratch/aldi-asn-full-tests-20261014.log` fájlban szerepel. Valós OpenText/ALDI végpontot nem használtunk.

A végső teljes szerverteszt: 147 ellenőrzés, 144 sikeres, 0 hibás, 3 környezeti beállítás hiányában kihagyott próba. A három közül az ALDI PDF-verziózási regresszió külön tesztadatbázissal lefutott és sikeres volt; a két fennmaradó kihagyás más PDA PostgreSQL ellenőrzés.

A helyi adatbázisban csak az új `20261014000001_create_aldi_asn.js` migráció futott le (135. csomag). A történeti kamionokat nem jelöltük újra Rakodva állapotúnak, azokhoz nem gyártottunk automatikusan visszamenőleges ASN-t. Az adatellenőrző lap és a hiányjelzés a helyi backend újraindítása után használható; DO-telepítés ebben a munkában nem történt.

A helyi, 3000-es port Node backendje újraindult és betöltötte a fejlesztést. ASN státusz, szállítmánylista és meglévő kamion adatauditja HTTP 200 választ adott. A helyi ASN-archívum üres maradt, a tesztüzenetek külön adatbázisban készültek. A külső és éles küldés letiltva, a partnerprofil nincs visszaigazolva. Oldalfrissítés után a menüben elérhető az ASN adatlap és napló.

Read-only audit a `server` könyvtárból: `node scripts/auditAldiAsnData.js --summary`. Új migráció és újraindítás szükséges minden további környezetben. A tárgyalt partnerprofil (Warehouse MIG változat, UNB/NAD, mennyiségi egység, fájlátadás, valódi teszt és befogadási visszajelzés) hiánya miatt az éles EDI készenlét továbbra sem igazolt.

Forrás: [ALDI Warehouse DESADV LPN and Item Level MIG 2.4](<../ALDI opentext/ALDI SOUTH GROUP Message Implementation Guidelines - Supplier/ALDI SOUTH Group DESADV Warehouse LPN and Item Level EANCOM D.01B.pdf>), [ALDI EDI Guideline 1.4, 11. fejezet](<../ALDI opentext/Aldi Opentext dokumentumok/ALDI SOUTH Group - EDI Guideline for Suppliers_EANCOM.pdf>), helyi ERP kód és read-only adatbázis-audit.
