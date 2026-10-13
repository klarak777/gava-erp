# OpenText Task 3 – EDI megállapodás jóváhagyása és következő lépések

Dátum: 2026-10-12.

## Jelenlegi állapot és források

A felhasználó jelzése szerint a Task 1 kitöltése megtörtént, a Task 2 dokumentumai letöltésre kerültek. A Task 3 megnyitott űrlapját az `ALDI opentext/Aproval od EDI Agreement screenshot.png` mutatja. A feladatokat a portálon nem nyitottuk meg bejelentkezéssel, nem mentettük és nem hagytuk jóvá.

Az új csomag négy kiegészítő dokumentumát szövegként áttekintettük:

- [EDI Agreement ALDI-HOFER_4.4_EN.pdf](<../ALDI opentext/Aldi Opentext dokumentumok/EDI Agreement ALDI-HOFER_4.4_EN.pdf>): 14 oldal, 4.4-es verzió.
- [ALDI SOUTH SE - User Step by Step Guide for Suppliers Version 1.1.pdf](<../ALDI opentext/Aldi Opentext dokumentumok/ALDI SOUTH SE - User Step by Step Guide for Suppliers Version 1.1.pdf>): 26 oldal, 2024-03-19.
- [ALDI SOUTH Group - EDI Guideline for Suppliers_EANCOM.pdf](<../ALDI opentext/Aldi Opentext dokumentumok/ALDI SOUTH Group - EDI Guideline for Suppliers_EANCOM.pdf>): 36 oldal, 1.4-es verzió, 2025-07-10.
- [ALDI_Global-Location-Numbers-v5.3 (1).pdf](<../ALDI opentext/Aldi Opentext dokumentumok/ALDI_Global-Location-Numbers-v5.3 (1).pdf>): 14 oldal, 5.3-as verzió.

A csomagban lévő hat üzenetimplementációs útmutató SHA-256 alapján azonos a korábban átvizsgált hat fájllal. Az ORDERS specifikáció továbbra is 2.4 AHEAD, EANCOM D.01B.

## Mit kér a Task 3?

A képernyőkép és a lépésenkénti útmutató 12. oldala alapján **elektronikus megállapodás-jóváhagyást** kérnek a portálon. A bemutatott feladatban nincs aláírt PDF feltöltésére szolgáló mező.

A jóváhagyást a cég nevében erre felhatalmazott személy döntése alapján kell rögzíteni, a megállapodás elolvasása és elfogadása után.

| Képernyőmező | Kitöltés |
| --- | --- |
| I agree to the terms and conditions of the EDI agreement | Jelölés, ha a vállalat elfogadta a megállapodást |
| Name of who approved the EDI agreement | A tényleges jóváhagyó teljes neve |
| Approval date (MM/DD/YY) | A tényleges jóváhagyás napja; ha 2026-10-12, akkor `10/12/26` |
| EDI agreement version | A portálon előtöltött `v4.4 7th February 2025` |
| Save & Close Task | Az útmutatóban előírt lezáró művelet |

Az útmutató szerint lezárás után e-mailes visszaigazolás érkezik a jóváhagyásról és a megadott adatokról. A képen a Save & Open Next Task gomb is elérhető; a dokumentált Task 3 eljárás a Save & Close Task használatát írja le. A puszta Save után a feladat lezárását nem szabad automatikusan feltételezni.

A PDF fejlécében a verzió 4.4, „As of January 2025”; a portál dátumfelirata február 7. A verziószám egyezik, a dátumfelirat eltér. A portál előtöltött értékét nem módosítjuk feltételezés alapján.

## A megállapodásnak az ERP integrációt érintő pontjai

Az alábbiak a letöltött megállapodás tartalmi összefoglalói, nem az alkalmazandó jog önálló értelmezései.

- **Hatókör:** rendelési, számlázási, szállítási értesítő és logisztikai státuszadatokat is lefed (1. oldal; 1.1–1.3 pont). Nem kizárólag rendelésletöltési megállapodás.
- **Kommunikáció:** a felek határozzák meg a protokollt és a szolgáltatókat (4.1.2). A megállapodás nem ad REST API végpontot vagy jogosultságot.
- **Működés:** a saját kommunikációs eszközök fenntartása, az üzenetek indokolatlan késedelem nélküli feldolgozása és a kiesések jelzése szerepel benne (4.1–4.5).
- **Képességvállalás:** a 7.1 pont az Annex 2-ben megadott EANCOM verziók fogadásának és feldolgozásának képességére vonatkozó vállalást tartalmaz. A jelenlegi PDF importot nem szabad kész EANCOM kapcsolatnak tekinteni.
- **Teszt és élesítés:** a 7.2 pont előírja a tesztelést, a tesztüzenetek jelölését és az éles kezdési időpont írásos meghatározását. A tesztadatok nem kezelhetők éles rendelésként.
- **Napló és megőrzés:** az üzenetek és feldolgozást megakadályozó hibák teljes, időrendi és változatlan megőrzését, valamint olvasható visszaadását írja elő (9.1–9.3). Az eredeti üzenet mellett a feldolgozott rendelés külön verziózott tárolását is megvalósítjuk az ellenőrizhetőséghez; ez utóbbi a műszaki megoldásunk, nem a 9.1 szó szerinti külön követelménye. A 2026-10-13-i előkészítés részletei: [Task 4 és EDI tesztkörnyezet](aldi-opentext-edi-test-20261013.md).
- **Költség:** a saját kommunikációs infrastruktúra biztosításának, fenntartásának és használatának költségeit a fél maga viseli (11. pont). A megállapodásból nem következik, hogy az OpenText szolgáltatás díjmentes.
- **Számlaadatok és felelősség:** a 10.4 pont bizonyos hibás vagy későn közölt adózási/törzsadatokhoz kapcsolódó megtérítési kötelezettséget is szabályoz. Ez a számlázási integrációhoz kapcsolódó vállalati döntési szempont.
- **Elektronikus elfogadás:** a 12.1 és 14.1 pont az elektronikus megerősítést nevezi meg a megállapodás hatálybalépéséhez, illetve megkötéséhez. A Task 3 elfogadó jelölése vállalati megállapodás-jóváhagyás.

A szerződés elfogadása és a műszaki kapcsolat élesítése külön lépés. A szükséges üzenettípusokat és a megvalósítás ütemezését a következő feladatokban egyeztetni kell; a teszt- és éles készenlétet csak az elvégzett fejlesztés és ellenőrzés alapján lehet igazolni.

## A most már dokumentált további feladatok

A lépésenkénti útmutató szerint:

| Feladat | Teendő |
| --- | --- |
| Task 4 | Az ALDI által előválasztott EANCOM üzenettípusok ellenőrzése és visszaigazolása |
| Task 4A | Ha változtatás szükséges, az üzenettípusok módosítása és megjegyzés; ALDI jóváhagyás |
| Task 5 | Kapcsolattípus kiválasztása, teszt és éles hibaértesítési e-mail-címek |
| Task 6A | Éles EDI azonosítók, UNB/NAD adatok, tesztkörnyezet és tesztüzenet-felismerés |
| Task 6B | A kiválasztott kapcsolat konkrét technikai adatai |
| Task 6C | Teszt EDI azonosítók |
| Task 7 | Üzenetellenőrzés / Document Check |
| Task 8 / 8A | Végpontok közötti teszt készenlétének vagy várható időpontjának visszaigazolása |
| Task 9 / 9A | Élesítés készenlétének vagy várható időpontjának visszaigazolása |

Ez az útmutató általános folyamata; a vállalathoz ténylegesen kiosztott feladatok és aktuális portálmezők az irányadók.

### Task 4 – valódi képesség és tervezett fejlesztés

A 13–14. oldalon az útmutató kifejezetten jelzi, hogy az üzenettípus-választás elfogadása az adott szerkezetű üzenetek cseréjének képességét igazolja. A tervezett ORDERS fejlesztést nem szabad már működőként visszaigazolni, és a letöltött INVOIC/DESADV dokumentumokból nem következik, hogy ezek az ERP-ben már implementálva vannak.

A kezdeti cél ORDERS fogadás, rendelésmódosítás és törlés. A DESADV, INVOIC és esetleges RECADV vállalati kötelezettségeit és bevezetési ütemezését a partnerhez előválasztott lista alapján kell egyeztetni. A lista még nem látható a Task 3 képen.

Szükség esetén a megfelelő portál-megjegyzésbe írható egyeztető szöveg:

> Our ERP currently imports purchase-order PDFs manually. We intend to implement automated reception and processing of ORDERS 2.4 AHEAD, including order amendments and cancellations. The EANCOM connectivity and message processing are not yet implemented or tested. Please confirm whether a phased implementation with ORDERS as the initial scope is permitted, and the required scope and deadlines for DESADV, INVOIC and RECADV. We will confirm technical readiness after implementation and end-to-end testing.

### Task 5 – kapcsolatválasztás

A 15. oldal felsorolt lehetőségei: **AS2, VAN, X400 és SFTP**. Az SFTP kapcsolatot a beszállító kezdeményezi („business partner initiated”). REST API nincs a felsorolt kapcsolattípusok között.

Ez alapján a korábbi SFTP javaslatnak már van projektspecifikus dokumentált alapja: saját ERP háttérszolgáltatása indítja a kapcsolatot és veszi át az ORDERS üzeneteket. A végpont, hitelesítés, könyvtárak, lekérési és átvételi szabályok továbbra is a Task 6 / OpenText kapcsolati adatai alapján határozhatók meg. Az API nem szükséges az automatikus fogadáshoz; külön API igény esetén annak támogatását külön kell tisztázni.

A Task 5 ezenkívül külön teszt- és éles hibaértesítési e-mail-címet kér. Éleshez az útmutató közös/csoportos címet javasol. Ez az e-mail cím hibajelzésre szolgál, nem rendelésimporthoz.

### GLN törzsadat

A letöltött 5.3-as GLN listában a magyar UNB vállalati azonosító `4099200007472` (3. oldal); a magyar beszerző szervezet azonosítója `4099200005096` (4. oldal). Ezek eltérő szerepek, ezért nem felcserélhetők. A vállalati partnerkód `1060776-AT-2` nem helyettesíti automatikusan a GLN-t. A Gava tényleges küldő/fogadó GLN-jét és a teszt routingot a Task 6-ban egyeztetett adatok alapján kell rögzíteni.
