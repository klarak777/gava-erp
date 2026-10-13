# ALDI / OpenText – Task 4 és az ERP EDI tesztkörnyezete

Dátum: 2026-10-13.

## Állapot és a képesség visszaigazolása

A felhasználó jelzése szerint a Task 3 EDI megállapodás elfogadása megtörtént. A tervezett ORDERS fejlesztést még nem igazolta vissza kész képességként. A Task 4 teljes szövegét és kijelöléseit most megadta: mind a hat felsorolt sor „Yes”-re van előválasztva.

| Előválasztott sor | Irány | Jelenlegi ERP állapot |
| --- | --- | --- |
| Purchase Order (Create) – ORDERS D.01B | ALDI → Gava | Belső tesztfeldolgozó kész; éles Napi rendelés adapter még szükséges |
| Purchase Order Change and Cancellation – ORDERS D.01B | ALDI → Gava | Belső tesztfeldolgozó kész; Full alapértelmezés, éles bekötés még szükséges |
| Dropship Despatch Advice – DESADV D.01B | Gava → ALDI, végső eCommerce vevőnek szállítás | Nincs implementálva; a Gava folyamatára való alkalmazhatóság egyeztetendő |
| Warehouse Despatch Advice – DESADV D.01B | Gava → ALDI, ALDI raktár/hub kiszállítás | Nincs implementálva; a konkrét raktári DESADV változat megerősítendő |
| Outbound Goods Receipt – RECADV D.01B | ALDI → Gava | Nincs implementálva |
| Commercial Invoice – INVOIC D.01B, számla és jóváírás | Gava → ALDI | Nincs implementálva |

A portál piros tájékoztatója szerint az alapértelmezés **Full PO Change**. Delta-only üzeneteket külön ALDI/HOFER egyeztetéssel kell kérni. Az ERP tesztűrlap alapértelmezését és a mintacsomagot ezért Full módra állítottuk; Delta választható marad külön egyeztetett próbához. A környezeti beállítási mintában is `ALDI_EDI_CHANGE_MODE=full` szerepel. A korábban már törölt, nulla mennyiségű sorok elhagyhatók későbbi Full üzenetből; történeti állapotuk megmarad, aktív sor kihagyását továbbra sem értelmezzük automatikus törlésként.

A Task 4 „Yes my company agrees to the pre-selected EDI message types” jelölése a teljes előválasztott lista közvetlen cseréjének képességére vonatkozik. A portál tájékoztatása szerint a megerősített választás később nem módosítható. A most elkészült ORDERS tesztfeldolgozó önmagában nem igazolja a teljes lista vagy az éles kapcsolat készenlétét.

Pontosítás: a Task 4 az üzenettípusok támogatásának visszaigazolása. A partneri végpontok közötti teszt és az éles indulás külön, későbbi lépések (Task 8 és 9); nem kell ezeket a Task 4 lezárása előtt már teljesítettnek tekinteni. A Task 4 ellenőrzéséhez viszont tudni kell a teljes kijelölt listát, és az adott szerkezet/tartalom kezelésének képességét igazolni kell. A pusztán tervezett fejlesztést nem jelöljük már meglévő képességnek.

Ha a teljes előválasztott listát jelenleg nem tudja támogatni a vállalat, az űrlap saját útmutatója a „No my company does not agree to the pre-selected EDI message types” választ és a Business Partner Notes indoklását kéri. A fejlesztés szakaszolását és határidőit ALDI/OpenText felülvizsgálatával kell rendezni.

Javasolt megjegyzés a most megadott teljes lista alapján:

> GAVA-HUNGRIA KFT. cannot currently confirm capability for all six pre-selected message types. Our ERP currently imports purchase-order PDFs. We have implemented and internally tested an ORDERS 2.4 AHEAD test processor and SFTP client; integration with our operational order module and OpenText connectivity are still in progress. We intend to receive purchase orders, changes and cancellations using business-partner-initiated SFTP and the default Full PO Change profile. Please confirm whether ORDERS can be introduced as the initial phase, and confirm the required scope, DESADV warehouse variant and implementation deadlines for Warehouse DESADV, RECADV and INVOIC, including credit notes. Please confirm whether Dropship DESADV applies to our business relationship. We do not have a GS1-registered GLN and do not plan GS1 registration; please confirm a bilaterally agreed ZZ identifier and the required UNB/NAD identifiers and qualifiers for test and live messages. Please also provide the SFTP test connection and file-retrieval details and confirm whether 60-minute polling is permitted.

Ez előkészített szöveg; a portálon nem mentettük, és külső üzenetet nem küldtünk.

## UNB és NAD

| Adat | Jelentés | Példa / megjegyzés |
| --- | --- | --- |
| UNB küldő és fogadó | A kommunikáló EDI rendszerek azonosítói az üzenetcsomag borítékában | Routinghoz használják; a küldő és fogadó nem felcserélhető |
| UNB azonosító minősítése | Az azonosítórendszer kódja | A `:14` GLN / GS1 azonosítót jelöl; a fogadóhoz a MIG más egyeztetett kódokat is enged |
| UNB kontrollazonosító | Az üzenetcsomag egyedi hivatkozása | Az UNZ-ben visszatér, az ismétlés felismeréséhez is használjuk |
| UNB tesztjelzés | Teszt és éles forgalom megkülönböztetése | `0035=1` teszt; a kész tesztmodul ezt megköveteli |
| NAD BY | Vevő / beszerző szervezet | Üzleti szereplő, nem feltétlenül azonos az UNB küldővel |
| NAD SU | Szállító, azaz a Gava vállalati azonosítója | GLN, DUNS vagy kétoldalúan egyeztetett ZZ azonosító; a minősítő kódot is egyeztetni kell |
| NAD DP | Szállítási címzett / célraktár | A raktár hozzárendeléséhez fontos |
| NAD SF | Feladási hely, ha szerepel az üzenetben | Kiegészítő üzleti szereplő |
| `::9` a NAD-ban | GS1 által kezelt azonosítási rendszer | A NAD azonosító jellemzően GLN |

A `1060776-AT-2` partnerazonosító és a `1060776-AT-2.1` portálfiók nem azonos a GLN-nel. A letöltött GLN-listában a magyar ALDI UNB vállalati azonosítója `4099200007472`, a magyar beszerzőé `4099200005096`. A partnerhez ténylegesen kijelölt országot, tesztazonosítókat és routingot a Task 6 adatai alapján kell rögzíteni; az AT partnerkódhoz nem választunk automatikusan magyar GLN-t. A mellékelt tesztminták borítékazonosítói demonstrációs adatok.

A felhasználó jelzése szerint a Gava nem rendelkezik saját regisztrált GLN-nel és nem tervez GS1 regisztrációt. Az EDI Guideline 1.4 4. és 7.3 pontja kifejezetten engedi a GLN mellett a DUNS és a kétoldalúan egyeztetett ZZ azonosítót. A javasolt irány ezért az OpenText/ALDI által jóváhagyott ZZ azonosító kérése, külön rögzítve az UNB és NAD mezőket és minősítőket. A partnerkód használata lehet egyeztetési javaslat, de nem tekintjük már jóváhagyott EDI azonosítónak. Az általános ZZ megnevezés és az egyes mezőkben használt, például ZZZ minősítő nem cserélhető fel automatikusan. Az ALDI saját GLN-jei ettől változatlanul használhatók.

## A további üzenetek üzleti jelentése

| Típus | Jellemző irány ebben a beszállítói folyamatban | Vállalati és ERP feladat |
| --- | --- | --- |
| ORDERS | ALDI → Gava | Rendelés, mennyiség- és dátummódosítás, új sor, tételtörlés, teljes törlés fogadása |
| DESADV | Gava → ALDI | Szállítás előtti értesítő a tényleges küldeményről, rendeléshivatkozásokról és az előírt csomagolási/raklapadatokról; a kiválasztott változat határozza meg a részleteket |
| INVOIC | Gava → ALDI | Elektronikus számla küldése, vevő/szállító adatokkal, tételekkel, adózási és összegadatokkal, szükséges hivatkozásokkal |
| RECADV | ALDI → Gava | Áruátvételi visszajelzés fogadása és a közölt mennyiségek/eltérések egyeztetése; a letöltött változat az ALDI oldaláról „Outbound Goods Receipt” |

A most megadott Task 4 listában mindkét DESADV sor, valamint RECADV és INVOIC is elő van választva. A raktári DESADV konkrét változata, a Dropship üzleti alkalmazhatósága, ország, kötelező adatok, teszthatáridő és éles indulás még ALDI/OpenText egyeztetést igényel. DESADV-, INVOIC- és RECADV-feldolgozó ebben a fejlesztésben nem készült; ezek készenlétét a rendszer nem jelzi igazoltnak.

## Elkészült ERP tesztfolyamat

Menü: **ALDI → EDI teszt és napló**, külön ERP ablakban. Az induláshoz az új migráció és a módosított backend betöltése szükséges.

1. Előállítható négy összetartozó `.edi` tesztminta. A megjelenő linkekről egyenként letölthetők.
2. Feltöltési sorrend: új rendelés → módosítás → tételtörlés → teljes törlés. A mintákhoz Full módot kell választani; a változatlan sor is szerepel LIN 4 jelöléssel. A minták előállítása a mezőt Full-ra állítja. Minden új mintacsomag külön rendelési azonosítót kap.
3. A feltöltés archiválja az eredeti bájtokat és SHA-256 lenyomatukat, majd a megadott profil alapján feldolgozza az üzenetet.
4. A fájl részleteiben olvasható az eredeti üzenet, letölthető az eredeti fájl, látható a teljes feldolgozott rendelés és a korábbi/új mennyiség, eltérés, törlés, szállítási dátum.
5. Hibás fájlnál az eredeti és a feldolgozást megakadályozó hiba is megmarad. A hiányzó előzmény későbbi beérkezése után újrapróbálható a feldolgozás.

A tesztverziók külön `aldi_edi_test_*` PostgreSQL táblákba kerülnek. Nem kerülnek át automatikusan az éles Napi rendelés, Rakodás, kamion vagy fuvar tábláiba. A Napi rendelés üzleti folyamataihoz szükséges éles adapter, GTIN/csomagolási egység és raktár-GLN leképezés az OpenText profil és tesztadatok ismeretében még elkészítendő és ellenőrizendő. Ezt a készültségi állapotot az API és a felület is egyértelműen jelzi.

### ORDERS értelmezés

- ALDI ORDERS 2.4 AHEAD: `ORDERS:D:01B:UN:EAN010`, UNH kiadásszám `2.0`, syntax 3, UNOC vagy UNOD; a tesztjelzés kötelező. UNA, UNT/UNZ ellenőrzés, UNS összesítő, szereplőazonosítók és naptári dátumok ellenőrzése.
- BGM `220`: eredeti rendelés; `230`: módosítás. LIN `1`: új sor; `2`: törlés; `3`: módosítás; `4`: változatlan sor teljes módosításban.
- Delta módban a kimaradó sorok megmaradnak. Full módban a korábbi soroknak vagy explicit törlésüknek szerepelniük kell; a hiányzó sorokat nem töröljük feltételezés alapján.
- QTY `21`: rendelt; `46`: már szállított; `27:0`: a fennmaradó mennyiség lezárása. A `27:0` nem a teljes rendelt mennyiség nullázása.
- A korábbi teljesítés nem tűnik el módosításkor. Teljesített mennyiség alá csökkentés, teljesítés csökkentése és lezárt maradék újranyitása egyeztetést igénylő hibát ad a tesztben.
- A szállítási dátum lehet fejléc- vagy tételszintű. A korábbi rendelési állapot nem változik meg; új pillanatkép és eltéréslista készül.
- Külső verziószám esetén a régebbi/ismételt verziót elutasítjuk. Delta módban a köztes verzió kihagyását is megakadályozzuk. Hiányzó eredeti/köztes verzió miatt blokkolt SFTP fájlt későbbi lekéréskor újrapróbálunk.
- Az azonos eredeti bájtsorozat ismételt fogadása naplózódik, új rendelésverziót nem hoz létre. UNB/UNH azonosítók más tartalommal történő újrahasználata hibát ad. Egy csomag minden üzenete egy tranzakcióban készül el; hiba esetén egyik részrendelés sem marad félkészen.
- CNT `38E`: becsült raklapszám, külön adat; nem tételszám.

Ez tesztfeldolgozó és üzleti ellenőrzés, nem minden MIG mezőre kiterjedő tanúsított validátor. Dropship és syntax 4 nem támogatott. Az ALDI Document Check és a végpontok közötti elfogadás még szükséges. A mennyiségek kartonná alakításához a termék és csomagolási GTIN egyeztetése szükséges.

## SFTP és az órás lekérés

A letöltött onboarding útmutató Task 5 lehetőségei: AS2, VAN, X400 és **SFTP – business partner initiated**. Az automatizált fogadáshoz nem szükséges REST API: az ERP háttérfolyamata kezdeményezi az SFTP kapcsolatot.

A kész tesztlekérő alapértéke **60 perc**, környezeti változóval állítható. Ez a vállalati igény szerinti kiindulás, nem az OpenText által már jóváhagyott lekérési gyakoriság. A kapcsolati szabályokkal és a rendelésmódosítások feldolgozási határidejével egyeztetni kell; egy üzenet akár közel egy órát várhat a következő lekérésig. Induláskor az első időzített lekérés az időköz letelte után történik; beállított tesztkapcsolatnál a menüből azonnali próba indítható.

Beállítási minta: [server/.env.aldi-edi.example](../server/.env.aldi-edi.example). A kapcsolat alapból le van tiltva. Aktiválásához szükséges az OpenText tesztvégpont, port, felhasználó, jelszó vagy SSH magánkulcs, távoli könyvtár, függetlenül visszaigazolt SHA-256 szerverkulcs-lenyomat, UNB küldő/fogadó, NAD SU és delta/full profil. A jelszó és a magánkulcs nem jelenik meg a böngészőben vagy a fogadási naplóban.

A lekérő `.edi`, `.edifact`, `.txt` normál fájlokat vesz át időrendben, fájlonként 5 MB korláttal. Azonos folyamatban két lekérés nem fut egyszerre. Több backendpéldány ütemezését egy kijelölt workerre kell korlátozni a bevezetéskor. A távoli fájlokat nem törli és nem mozgatja; az átvételi visszaigazolás, átnevezés, kiterjesztés és megőrzés szabályát OpenTexttel még egyeztetni kell. A jelenlegi tesztprofil ismételt lekéréskor újra letölti a könyvtárban maradó fájlokat, a tartalom lenyomata alapján kiszűri a duplikált feldolgozást.

## Archiválás a teszt előtt

A letöltött EDI megállapodás **9.1** pontja az eredeti üzenetek és feldolgozást megakadályozó hibák teljes, időrendi, változatlan megőrzését írja elő; **9.2** olvasható visszaadást/nyomtathatóságot; **9.3** a további megőrzési és adatok rendelkezésre bocsátására vonatkozó kötelezettségeket tartalmazza. A külön feldolgozott rendelési pillanatkép tárolása a mi műszaki megoldásunk az ellenőrizhetőségre, nem a 9.1 szó szerinti külön követelménye.

A tesztkörnyezet már ezen az útvonalon működik: eredeti `bytea` + profil + SHA-256; külön változatlan JSON rendelésverziók; külön hozzáfűzhető eseménynapló. Fájlok és események időbélyeget/sorszámot kapnak. Az eredeti, a rendelés és a hibanapló az ERP-ben visszaolvasható; a teljes fájl-napló külön megnyitható, az alaplisták az utolsó 100 bejegyzést mutatják. A böngésző nyomtatási funkciója az olvasható nézethez használható; a részletező blokkok nyomtatás előtt kinyithatók.

PostgreSQL triggerek tiltják az UPDATE, DELETE és TRUNCATE műveleteket az archív táblákon. Már fogadott adatokat tartalmazó migráció automatikus visszavonását is megakadályozzuk. Ez alkalmazás- és adatbázisvédelem; a DB tulajdonosi jogú üzemeltető módosíthatja a sémát, tehát nem önálló WORM tanúsítás. Éles bevezetéshez ellenőrzött mentés/visszaállítás, megfelelő hozzáférési jogok, az alkalmazandó megőrzési idő és üzemeltetési eljárás még szükséges. A kódban nincs automatikus archívumtörlés és nincs feltételezett megőrzési évszám.

## Bevezetés és ellenőrzés

A normál backend-indítás `npm start` a migrációkat is futtatja. Külön migráció: a `server` könyvtárban `npm run migrate`; utána a módosított backend újraindítása és a böngésző frissítése szükséges. A főoldal és a menü importjának verziójelölése frissült. DO-ra ebben a munkában nem történt telepítés, és a valós OpenText kapcsolat nem került aktiválásra.

Új migráció: `20261013000001_create_aldi_edi_test_archive.js`. Új API: `/api/v1/aldi-edi-test` státusz, feltöltés, fájllista, eredeti letöltés, részletek, újrafeldolgozás, eseménynapló és kézi SFTP tesztlekérés.

Ellenőrzések:

- Teljes meglévő szerverteszt-csomag: 122 ellenőrzésből 120 sikeres, 0 hibás, 2 más modul PostgreSQL tesztje környezeti beállítás híján kihagyva. Az új EDI PostgreSQL és böngészős tesztek ezen futásban ténylegesen futottak.
- A további delta-sorrend, SFTP újrapróbálás és MIG pontosítások után az érintett EDI teszteket külön újrafuttattuk, sikeresen.
- Végső EDI tesztfutás: 22 sikeres ellenőrzés, 0 hiba, 0 kihagyás.
- Külön helyi `edi_test` PostgreSQL adatbázis és futásonként külön séma; az ERP üzleti tábláit nem használtuk a próbákhoz.
- Valós HTTP multipart feltöltés és eredeti bájtok letöltése; böngészőben új rendelés, +20/+8 módosítás, tételtörlés, hibás fájl archívuma és HTML-ként megjelenő támadó tartalom kizárása.
- SFTP kliens ellenőrzése szimulált végponttal: hostkulcs ellenőrzése, bájtpontos átvétel, méretkorlát, megváltozott méret, kapcsolatlezárás, titkok kihagyása a naplóból. Ezt valódi helyi SSH/SFTP szerverrel végzett kapcsolati próba is kiegészítette: sikeres ORDERS letöltés és hibás szerverkulcs elutasítása. Valós OpenText szerverhez nincs még hitelesítő adat.

Az EDI adatbázis-teszt külön csak a helyi `edi_test` adatbázist engedi. Példa PowerShell-ben, előkészített tesztadatbázissal:

```powershell
$env:ALDI_EDI_TEST_DATABASE_URL = 'postgres://edi_test:edi_test@127.0.0.1:55440/edi_test'
node --test tests/aldiEdiOrders.test.js tests/aldiEdiSftp.test.js tests/aldiEdiArchive.test.js
```

### Helyi rendszer előkészítése megtörtént

A beállítás ellenőrzése a `127.0.0.1:5432/gava_erp` helyi adatbázist igazolta. Csak az új EDI migráció volt függőben; ezt külön lefuttattuk (134. migrációs csomag). A helyi, 3000-es porton futó Gava ERP háttérszerver újraindítása megtörtént, az SFTP tesztkapcsolat letiltva maradt. A státusz, fájllista és eseménynapló API-ja egyaránt HTTP 200 választ adott. A helyi archívumban a munka végén nincs mintafájl vagy tesztrendelés; a próbák a külön tesztadatbázisban futottak. A normál helyi ERP oldal frissítése után az új menü használható.

### Kiegészítő ellenőrzések és magyarázatok

A helyi Termék adattábla read-only API ellenőrzésekor 16 aktív ALDI termék szerepelt, mindegyikhez 13 jegyű GTIN volt megadva. Ezek meglévő törzsadatok, új termékazonosítókat nem kell feltételezés alapján létrehozni. Az EDI-ben érkező kódokkal és a rendelési csomagolási egységgel való megfelelést ellenőrizzük. A GTIN a terméket, a GLN vagy egyeztetett ZZ a vállalatot/helyet azonosítja.

A külön feldolgozott rendelési pillanatkép az adott verzió teljes rendelési állapotának mentése, a delta fájlban nem szereplő, megmaradó tételekkel együtt. Köztes verzió például az eredeti 1-es és a beérkező 3-as verzió közül hiányzó 2-es: ha a 2-es az A terméket, a 3-as csak a B terméket változtatja, a 2-es kihagyása hibás összállapotot eredményezne. A verziósorrend-ellenőrzés a külső verziószámot tartalmazó üzenetekre érvényes; nem az ERP szoftver kiadásainak számáról van szó.

A NAD DP megfeleltetés az ALDI célraktár üzenetben szereplő azonosítójának hozzárendelése a Gava ERP megfelelő raktár/címzett rekordjához. Ez biztosítja, hogy a rendelés a helyes szállítási célhoz kerüljön. Nem a Gava GS1 regisztrációját jelenti.

A valódi helyi SFTP kapcsolati teszt `server/tests/aldiEdiSftpConnection.test.js` fájlban szerepel. Ideiglenes memóriabeli SFTP kiszolgálót indít, nem GLN formájú demonstrációs azonosítókkal tesztel, a végén leáll; üzleti adatot nem ír. Ez a kiegészítő teszt sikeres volt. Futtatás a `server` könyvtárból: `node --test tests/aldiEdiSftpConnection.test.js`. A demonstrációs azonosítók/minősítők nem OpenText által jóváhagyott routingadatok.

## Következő partneri lépések

1. A Task 4 teljes előválasztott listájának ellenőrzése megtörtént; a jelenlegi állapot alapján az alsó megerősítéshez „No” és a fenti indoklás javasolt. A szakaszolás és a Dropship alkalmazhatósága ALDI/OpenText jóváhagyást igényel.
2. Task 5 SFTP választás; Task 6 teszt- és éles UNB/NAD/routing, kapcsolat, fájlátvételi szabályok és lekérési időköz.
3. Valós ALDI tesztminták, GTIN–termék–csomagolás és NAD DP–raktár megfeleltetés; a Napi rendelés adapterének elkészítése és próba a rakodási/teljesítési folyamatokkal.
4. Task 4-ben a teljes kiválasztott üzenetkör tényleges támogatásának visszaigazolása; a pusztán tervezett fejlesztés és az esetleges szakaszolás külön egyeztetése. A további feladatok a portál által kiosztott sorrendben végezhetők.
5. Task 7 Document Check, Task 8 végpontok közötti teszt, majd Task 9 egyeztetett élesítés. Az üzenettípus-képesség, partneri tesztkészenlét és éles indulási készenlét külön állapotok.

## Források

- [EDI Agreement ALDI-HOFER_4.4_EN.pdf](<../ALDI opentext/Aldi Opentext dokumentumok/EDI Agreement ALDI-HOFER_4.4_EN.pdf>), 7.2 és 9.1–9.3.
- [ALDI SOUTH SE – User Step by Step Guide for Suppliers Version 1.1.pdf](<../ALDI opentext/Aldi Opentext dokumentumok/ALDI SOUTH SE - User Step by Step Guide for Suppliers Version 1.1.pdf>), Task 4–9.
- [ALDI Global Location Numbers v5.3](<../ALDI opentext/Aldi Opentext dokumentumok/ALDI_Global-Location-Numbers-v5.3 (1).pdf>).
- [ORDERS EANCOM D.01B MIG](<../ALDI opentext/ALDI SOUTH GROUP Message Implementation Guidelines - Supplier/ALDI SOUTH Group ORDERS EANCOM D.01B.pdf>), 2.4 AHEAD, 2025-08-19.
- A felhasználó által megadott Task 4 portálfigyelmeztetések. Bejelentkezett portálműveletet nem végeztünk.
- [GS1 EANCOM szintaxis](https://www.gs1.org/sites/default/files/docs/eancom/ean02s3/part1/part1_05.htm) és az [ssh2-sftp-client hivatalos dokumentációja](https://github.com/theophilusx/ssh2-sftp-client).
