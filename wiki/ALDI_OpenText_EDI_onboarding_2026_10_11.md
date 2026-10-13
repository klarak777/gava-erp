# ALDI / HOFER – OpenText EDI onboarding

Dátum: 2026-10-11.

**2026-10-12-i pontosítás:** a később rendelkezésre bocsátott négy `OpenText Trading Grid Intelligence` PDF a portál Task 1 űrlapját mutatja. A következő lépés a beszállítói adatok és technikai kapcsolattartó portálon történő visszaigazolása. Az e-mail-tervezet kiegészítő egyeztetéshez használható. Az EANCOM / Classic EDI a tervezett saját ERP integrációhoz megfelelő besorolás; az átviteli protokoll külön döntés. Részletes kitöltési útmutató és SFTP/API kapcsolati javaslat: [OpenText Task 1](../docs/opentext-task1-kitoltese-20261012.md).

**Task 2 / Task 3 kiegészítés:** a felhasználó kitöltötte a Task 1-et, és letöltötte az új dokumentumcsomagot az `ALDI opentext/Aldi Opentext dokumentumok` mappába. A Task 3 elektronikus szerződés-jóváhagyást kér (elfogadás, jóváhagyó neve, dátum, 4.4-es verzió). A most elérhető lépésenkénti útmutató igazolja, hogy Task 4 az üzenettípusok és Task 5 a kapcsolattípus kiválasztása. Az SFTP beszállító által kezdeményezett kapcsolatként szerepel az AS2/VAN/X400 mellett; REST API nincs a listában. A Task 4 képességnyilatkozatát és a szerződésben szereplő üzenettípusokat a jelenleg csak PDF importot végző ERP fejlesztési ütemezésével össze kell hangolni. [Task 3 elemzés és kitöltés](../docs/opentext-task3-edi-megallapodas-20261012.md).

## Cél és jelenlegi állapot

A Gava Hungria Kft. ERP rendszerében a rendelések, rendelésmódosítások és tételtörlések automatikus fogadása és feldolgozása, kézi dokumentumfeltöltés nélkül. Elsődleges igény: API kapcsolat.

A felhasználó által bemásolt meghívó alapján az ALDI / HOFER elindította a vállalat EDI onboardingját. Partnerazonosító: `1060776-AT-2`; onboarding felhasználó: `1060776-AT-2.1`; projekt PIN: `25347`. A felhasználó jelzése szerint az új jelszót már beállították.

A meghívó az Active Intelligence portált az onboarding feladatainak elvégzésére nevezi meg. Ebből nem következik, hogy a portál bejelentkezése egyben gépi adatkapcsolati jogosultság, vagy hogy már létrejött egy éles rendelésletöltési API. A bemásolt levél nem tartalmazza az eredeti hivatkozások tényleges URL-jét. A portálba ebben az áttekintésben nem történt belépés.

Kapcsolattartó: `AldiHofer.ob@opentext.com`.

## Átvizsgált helyi dokumentáció

Forrásmappa: `ALDI opentext/ALDI SOUTH GROUP Message Implementation Guidelines - Supplier/`.

| Dokumentum | Verzió | Kiadási dátum | Terjedelem |
| --- | --- | --- | --- |
| ALDI SOUTH Group ORDERS EANCOM D.01B.pdf | 2.4 | 2025-08-19 | 46 oldal |
| ALDI SOUTH Group INVOIC Commercial EANCOM D.01B.pdf | 2.5 | 2025-08-06 | 75 oldal |
| ALDI SOUTH Group DESADV Warehouse LPN and Item Level EANCOM D.01B.pdf | 2.4 | 2025-08-15 | 43 oldal |
| ALDI SOUTH Group DESADV Warehouse Variant Level EANCOM D.01B.pdf | 1.1 | 2025-08-08 | 50 oldal |
| ALDI SOUTH Group DESADV Dropship EANCOM D.01B.pdf | 2.1 | 2025-08-15 | 28 oldal |
| ALDI SOUTH Group RECADV Outbound Goods Receipt EANCOM D.01B.pdf | 1.1 | 2025-08-19 | 27 oldal |

A hat PDF üzenetimplementációs útmutató. A kinyert szövegben nem található REST/API végpont, OAuth leírás vagy AS2/SFTP csatlakozási útmutató. Az adatátvitelhez további, partnerhez rendelt kapcsolati dokumentáció szükséges. A portál Project Library tartalmának frissességét a helyi példányokhoz képest ellenőrizni kell.

## Az ORDERS útmutatóból megállapítható működés

Az alábbi adatok a helyi ORDERS 2.4 dokumentumból származnak. A partnerhez ténylegesen rendelt működési változatot és példákat az OpenTextnek kell megerősítenie.

### Rendelés és módosítás azonosítása

- A 12. oldal szerint az üzenettípus `ORDERS`, a példa `ORDERS:D:01B:UN:EAN010`.
- A 13. oldal szerint a BGM dokumentumkódja `220` az új rendeléshez, `230` a rendelésmódosításhoz.
- A BGM.C106.1004 a rendelési szám; a BGM.C106.1056 az üzenetsorozat verziója, ha küldik. A dokumentum példája szerint 1 az első rendelés, 2 a következő módosítás, majd 3 és így tovább.
- A BGM.1225 felsorolt értékei `9` és `31`. Az általános EDIFACT kódtárból nem szabad automatikusan más, itt nem előírt módosítási vagy törlési kódot feltételezni.
- A helyi útmutató a módosítást ORDERS-en belül írja le; külön ORDCHG adatfolyam meglétét ebből nem lehet megállapítani.

### Tételszintű műveletek

A 32. oldal szerint:

| LIN.1229 | Jelentés |
| --- | --- |
| 1 | Új tételsor hozzáadása |
| 2 | Tételsor törlése |
| 3 | Tételsor módosítása |
| 4 | Változatlan tételsor; teljes rendelést tartalmazó módosításban használható |

A dokumentum kifejezetten megengedi a módosításoknál a csak változott sorokat tartalmazó (delta) és a teljes rendelést tartalmazó (full load) közlést. Teljes rendeléstörlésnél a dokumentumkód 230, és az összes tételsor műveletkódja 2.

**A delta üzenetből hiányzó sor nem tekinthető töröltnek.** Például az eredeti A=100 és B=50 rendelés után egy kizárólag A=120 módosítást közlő delta üzenet eredménye A=120 és B=50. Az új ERP adapterben az üzenet értelmezése megelőzi az operatív mennyiségek módosítását.

Az OpenTexttel tisztázni kell a hozzánk érkező változatot, annak felismerését, a verziók sorrendjét és a hiányzó sorok kezelését. A delta itt a változott sorok közlését jelenti; a mennyiségek összeadási szabályát nem szabad ebből önmagában levezetni.

### GTIN, mennyiség és teljesítés

- A 32. oldalon a LIN.C212.7140 az adott rendelt termék GTIN-je, a 7143 jelölése `SRV`.
- A tételazonosító a LIN.1082 mezőben szerepel. A külső tételszámot a GTIN mellett meg kell őrizni; nem célszerű a sorazonosságot kizárólag a GTIN-re építeni.
- A 33. oldalon a `QTY+21` a rendelt mennyiség. A mennyiségi egység mezője ebben az útmutatóban nem használt, ezért az ERP kartonértékére való megfeleltetést és a csomagolási szintet külön tisztázni kell.
- A 34. oldalon a `QTY+27:0.000` azt jelzi, hogy a részszállítás után fennmaradó mennyiséget már nem kérik; a sor műveletkódja ekkor 3. Ez nem azonos egy teljes tételtörléssel.
- A 35. oldalon a `QTY+46` a már leszállított mennyiség.
- A 15. és 36. oldal fej- és tételszintű szállítási dátumokat, illetve eltérő jelenlegi/rövid távú/hosszú távú szabályokat ír le. A nálunk alkalmazandó változatot tisztázni kell.
- A 11. oldalon az UNB küldő/fogadó azonosító és a tesztjelzés szerepel. A portál partnerazonosítóját nem szabad automatikusan GLN-nek, EDI címnek vagy API kliensazonosítónak tekinteni.

A GTIN értékeket szövegként kell kezelni a vezető nullák megőrzéséhez. A fogyasztói termék és a karton GTIN-je közötti megfeleltetés ellenőrzött törzsadat alapján történjen.

## Jelenlegi ERP kód és az integráció előfeltételei

Statikus kódáttekintés történt, adatbázis- és hálózati adatokat nem módosítottunk, tesztimportot nem futtattunk.

- `server/src/routes/aldi_daily_orders.js:22`: a jelenlegi belépési pont kézi PDF feltöltés.
- `server/src/utils/aldiOrderPdf.js`: PDF szövegéből olvassa a GTIN-t, mennyiséget, szállítási dátumot, és felismeri a `2-Deleted` jelölést.
- A mentés verziózza a rendeléseket és megőrzi az előzményeket.
- `server/src/routes/aldi_daily_orders.js:168`: az új és régi sorokat GTIN alapján hasonlítja össze; a beérkező listából hiányzó korábbi sort nulla mennyiséggel, eltávolítottként kezeli. Ez a PDF útvonal teljes rendelési állapotot feltételez, ezért változtatás nélkül nem alkalmas EDI delta közvetlen fogadására.
- A PDF útvonal egy rendelésen belül több különböző szállítási dátumot elutasít; az EDI tételszintű dátumokat is támogat.
- A jelenlegi tartalmi hash dátum/GTIN/mennyiség adatokra épül, rendelési szám nélkül. Az EDI ismétlésvédelmét küldő/fogadó, üzenetazonosító, rendelés és külső verzió alapján is meg kell tervezni, hogy különálló, azonos tartalmú rendelések ne vesszenek el.
- Kapcsolódó statikus észlelés: a sorbeszúrás után a kód `newLine.id`-re hivatkozik, miközben a beszúrás eredményét nem rendeli `newLine` változóhoz (`server/src/routes/aldi_daily_orders.js:258–273`). A kapcsolódó ágat az integráció előtt javítani és tényleges módosítási esettel tesztelni kell. Ebben az áttekintésben nem módosítottuk a futó kódot.

Javasolt feldolgozás:

1. Háttérszolgáltatás átveszi az eredeti üzenetet a jóváhagyott kapcsolaton.
2. Tartós fogadási naplóba és archívumba menti, saját egyedi azonosítóval és feldolgozási állapottal.
3. Ellenőrzi a küldőt, fogadót, teszt/éles környezetet, szintaxist, rendelést, verziót, tételszámokat és GTIN megfeleltetést.
4. Elkülöníti az új rendelést, teljes állapotot, delta módosítást és törlést; helyes aktuális rendelési állapotot állít elő.
5. Adatbázis-tranzakcióban menti az előzményt és az aktuális állapotot, majd egyezteti az áruigényt és a kapcsolódó rakodási adatokat. A már teljesített szállítások történetét megőrzi.
6. A szolgáltató szerinti átvételi/technikai visszajelzést a megfelelő feldolgozási ponton küldi. A transport átvételi visszajelzés és az üzleti feldolgozás sikere külön állapot.
7. A hibás vagy ismeretlen terméket tartalmazó üzenetet látható feldolgozási hibaként kezeli; újrapróbálás és újrafeldolgozás nem hoz létre dupla rendelést.

A képernyőnyitás PostgreSQL adatokat olvasson; a külső kapcsolat fogadása a háttérben történjen. Így az OpenText elérhetősége nem blokkolja a rendeléstáblák betöltését.

## Következő onboarding lépések

1. Belépés a meghívó eredeti linkjén az aktivált felhasználóval; cégadatok, technikai kapcsolattartó és ténylegesen kiosztott feladatok ellenőrzése.
2. A Project Library legfrissebb üzenet-, kapcsolat- és tesztelési útmutatóinak beszerzése. A portálon látható kapcsolattípus-választást rögzíteni kell.
3. Elsőként a portál Task 1 feladatát kell elvégezni, és a további kapcsolati feladatokat ellenőrizni. A támogatott automatikus ERP kapcsolatot a portál megfelelő feladatában vagy technikai egyeztetésében kell tisztázni. Műszaki javaslat: Classic EDI / EANCOM, SFTP klienses automatikus lekéréssel, ha ez a partnerhez engedélyezett; dokumentált üzenetfogadási API esetén API adapter is választható. E-mailes egyeztetés kiegészítő csatorna.
4. Teszt és éles végpontok, gépi hitelesítés, GLN/EDI címek, postafiók/routing, eredeti üzenetletöltés, visszajelzések, újraküldés, megőrzési idő, díjak és támogatási feltételek tisztázása.
5. Az `1060776-AT-2` partnerhez tartozó országok és ALDI / HOFER szervezetek visszaigazolása. Az azonosítóból nem szabad valamennyi magyar vagy más országbeli rendelés lefedettségét feltételezni.
6. Új rendelés, sorhozzáadás, sorváltoztatás, sortörlés, teljes törlés és részszállítás lezárásának valós EDI mintáit kérni; full/delta működést és verziósorrendet egyeztetni.
7. A szükséges DESADV változatot, INVOIC és RECADV kötelezettségeket, esetleges további visszaigazoló üzeneteket és az élesítési határidőt megerősíttetni. A mappában három DESADV változat található; ebből nem következik, hogy mindhármat implementálni kell.
8. A visszaigazolt feltételekre ERP adaptert készíteni, tesztkörnyezetben végigpróbálni, majd az OpenText / ALDI elfogadás szerinti élesítés.

Fejlesztési sorrendre javaslat: elsőként rendelésfogadás és módosítás/törlés, majd szállítási értesítő és számla. Az elkülönített élesítés lehetőségét az onboarding előírásai és határidői határozzák meg; nem tekinthető már jóváhagyottnak.

Teszteléskor szükséges: új rendelés; egy és több sor módosítása; teljes/delta üzenetek; tételtörlés; teljes törlés; részszállítás és fennmaradó mennyiség lezárása; ismételt üzenet; sorrenden kívüli verzió; hiányzó eredeti rendelés; ismeretlen GTIN; azonos GTIN több tételsoron; eltérő tételdátum; két külön rendelés azonos tartalommal; kapcsolatkimaradás és újrafeldolgozás.

## Nyilvános elsődleges források és értelmezésük

- [OpenText B2B Integration Foundation](https://www.opentext.com/products/b2b-integration-foundation): általánosan felsorolja az API, AS2, SFTP és más csatlakozási lehetőségeket. Ez nem igazolja, hogy a konkrét ALDI / HOFER projekthez mindegyik igénybe vehető.
- [OpenText Trading Grid – Active Documents](https://developer.opentext.com/ce/products/activedocuments): dokumentumkövetési szolgáltatás és Visibility REST API. A nyilvánosan látható API megnevezése önmagában nem bizonyítja az eredeti ORDERS üzenetek letöltésének támogatását.

Az OpenTextnek küldhető angol egyeztető levél: `docs/opentext-edi-api-egyeztetes-20261011.md`. A levél tervezet; nem került elküldésre.
