# Heti lekötés – az akciós és normál számítás helyreállítása

Dátum: 2026. október 7.

## A módosult számítás rövid szabálya

A Heti lekötésben a teljes heti mennyiséget továbbra is akciós és normál részre bontjuk. A Keresleti adatok Excel csak akkor növeli az automatikusan számított heti mennyiséget, ha a **Becsült mennyiségek (KAR)** értéke nagyobb a Rendelési terv Excel **Értékesítési előrejelzés** értékénél. Akciós időszak esetén a többlet teljes egészében az akciós részhez kerül; a normál rész eredeti alapja megmarad.

Jelölések: **T** = rendelési terv heti előrejelzése, **K** = keresleti mennyiség, **A** = eredeti akciós kartonszám.

| Számított érték | Képlet akciós időszak esetén |
| --- | --- |
| Keresleti többlet | `max(0, K − T)` |
| Új akciós alap | `A + max(0, K − T)` |
| Normál alap | `T − A` |
| Automatikus heti KW | `max(T, K)` |

A Beállításokban megadott akciós napi százalékokat az **új akciós alapra**, a normál/akción kívüli százalékokat a **normál alapra** alkalmazzuk. Kisebb vagy azonos keresleti mennyiség nem csökkenti a tervet. Akció nélküli héten a teljes heti mennyiséget a normál profil osztja el.

A KW szerkesztőben a kiszámított Normál és Akciós kartonszám jelenik meg, az eredeti akciós napok kijelölésével. Ezek csak tényleges felhasználói módosításkor válnak kézi felülírássá. Kézi felülírás esetén a KW a két érvényes részösszeg összege; az Excel-alapú maximum nem kerül ismét hozzáadásra.

## A hiba oka

A legutóbbi módosításban a Rendelési terv `daily_values` adatait használó számítási ágat letiltották. Emiatt az akción kívüli napi mennyiségek nem kerültek át a táblázatba. A teljes heti előrejelzést akciós mennyiségként kezelték, a kézi szerkesztés pedig egyenletes szétosztást használt a mentett százalékok helyett. Az eltérő akciós dátum vagy az üres naplista nullás becslést is eredményezhetett.

A KW oszlop csak az akciós összeget mutatta. A szerkesztőablak kezdetben csak a már mentett kézi értékeket olvasta; nem ugyanabból a modellből származott a táblázat, a szerkesztő alapértéke és a bepipált naplista.

Az eredeti szabályok forrásai: `Gava_ERP_V0.8.7_Heti_Lekotes_Modositasok.md`, illetve `wiki/02_Wiki/Heti_lekotes_szazalekok_20260915.md`. A két Excel heti mennyiségének összevetését a felhasználó most pontosította.

## Alkalmazott számítás

1. A Rendelési terv **Értékesítési előrejelzés** oszlopa adja a terv teljes heti mennyiségét. Csak hiányzó oszlop vagy üres érték esetén használjuk a napi F–L oszlopok összegét tartalékként.
2. Termékenként és akciós időszakonként összeadjuk a napi Excel-értékeket. Az Excelben ténylegesen az akcióba eső napok összege az akciós alap.
3. Megmarad az eredeti −1 nap eltolás: Excel csütörtök → felületi szerda, …, Excel következő szerda → felületi kedd. A szerkesztőben is ezek a cél napok vannak előre bepipálva.
4. Az automatikus heti alap: **max(Rendelési terv teljes előrejelzése, Keresleti adatok Becsült mennyiség)**. Több, azonos termékhez tartozó raktári sor összeadódik.
5. Ha van az adott hétre eső akciós időszak, a nagyobb keresleti mennyiség **pozitív különbözete az akciós alaphoz adódik**: **akciós alap = eredeti akciós összeg + max(0, keresleti mennyiség − rendelési terv heti előrejelzése)**. Erre a növelt alapra vonatkoznak a Beállítások akciós százalékai. A normál/akción kívüli alap az eredeti **rendelési terv heti előrejelzése − eredeti akciós összeg** marad, erre az akción kívüli százalékprofil vonatkozik.
6. Akció nélküli terméknél a teljes heti normál százalékprofil érvényesül. Az adott héten kívüli akciós időszak nem nullázza le a termék heti előrejelzését.
7. A napi egészre kerekítés megmarad. A KW mező a teljes mennyiségi alapot mutatja; az önállóan kerekített napi értékek összege ettől kerekítési különbözettel eltérhet.
8. A készletszámítás sorrendje: **Becsült → Rendelt → Teljesített (Tel.)**. A megadott Teljesített mennyiség felülírja a Rendeltet és a Becsültet; ha nincs teljesítési érték, a Rendelt érvényesül, ennek hiányában pedig a Becsült. A megadott nulla mindkét tényleges mezőben érvényes érték.

### Példa

A dokumentált körte napi adatai: 681, 666, 609, 502, 83, 74, 70 karton. Az akciós alap **2458**, az eredeti napi adatokból számolt akción kívüli alap **227**.

2685 kartonos heti alap mellett:

| Cél nap | Százalékprofil | Napi becslés |
| --- | --- | ---: |
| Szerda | Akció 30% | 737 |
| Csütörtök | Akció 30% | 737 |
| Péntek | Akció 22% | 541 |
| Szombat | Akció 18% | 442 |
| Vasárnap | Akción kívül 20% | 45 |
| Hétfő | Akción kívül 30% | 68 |
| Kedd | Akción kívül 50% | 114 |

A projektben lévő mintafájl Értékesítési előrejelzés oszlopában **2686** szerepel, míg a kerekített napi értékek összege 2685. A felhasználó által megadott oszlop elsőbbsége alapján a heti alap 2686, az akciós alap 2458, a normál alap pedig **228**. Ha a keresleti fájlban 3000 lenne, a különbözet **314**, az akciós alap **2772**, a normál alap továbbra is **228**, a KW pedig **3000**.

### Pontosítás: a keresleti többlet az akciós részt növeli

A korábbi értelmezést javítottuk: a pozitív különbözetet az akciós alaphoz kell adni. A felhasználó konkrét példája:

- Keresleti adatok: **2687 karton**.
- Rendelési terv heti előrejelzése: **1706 karton**.
- Különbözet: **2687 − 1706 = 981 karton**.
- Eredeti akciós összeg: **1568 karton**.
- Százalékos elosztás új akciós alapja: **1568 + 981 = 2549 karton**.
- Normál alap: **1706 − 1568 = 138 karton**.
- Heti KW összesen: **2549 + 138 = 2687 karton**.

A négynapos akció alapértelmezett 30%, 30%, 22%, 18% arányai a 2549 kartonra vonatkoznak: **765, 765, 561, 459** karton. A normál napok továbbra is a 138 kartonból számolódnak. A napi kerekítés miatt a napi összegek egy kartonnal eltérhetnek a KW-alaptól; a kerekítési szabály változatlan.

A táblázat és a szerkesztő ugyanazt a korrigált alapot használja: **Normál = 138, Akciós = 2549**. A mentett kézi akciós érték a teljes akciós alapot helyettesíti; a különbözetet nem adjuk hozzá ismét a kézi értékhez. Több akciós időszaknál a különbözet termékenként egyszer kerül elszámolásra, az eredeti akciós eloszlás arányában.

## Szerkesztés

### A teljes heti mennyiség akciós mezőbe kerülésének javítása

A felhasználó a DO teszten **Akciós időszak = 2994**, **Akciós időszakon kívüli = 0** értéket jelzett. A kódban megtalált, reprodukált hiba: hiányzó vagy teljesen üres napi bontásnál az egész tervmennyiséget akciós alapnak vettük, majd ehhez adtuk a keresleti többletet. Ettől az akción kívüli rész nulla lett, még akkor is, ha az eredeti Excelben szerepeltek akción kívüli mennyiségek. A mezőnevek módosítása ezt az adatproblémát nem oldotta meg.

Az új javítás:

- A heti adatok GET végpontja a régi importok hiányzó napi bontását automatikusan kiolvassa az adott heti archivált Rendelési tervből. Az olvasás nem módosít adatbázissort vagy kézi értéket.
- Az archívum termék-, akciós időszak-, mennyiség- és (ha dátumos a fejléc) heti megfelelőségét ellenőrzi. Másik heti fájlt vagy eltérő előrejelzésű forrást nem használ a hiányzó adatok pótlására.
- Több raktári forrássort összesít, ha a tárolt tétel már összevont; eltérő, nem egyértelmű sorszámnál nem talál ki bontást.
- Megszűnt az „egész mennyiség akciós” tartalékszabály. Ha a pontos napi alap nem állítható helyre, a szerkesztőben az ismeretlen részösszeg üres, a napi becslés `—`, és a felület jelzi, hogy a helyes heti terv feltöltése vagy újrafeldolgozása szükséges. A hiányzó becsléstől függő készlet és hiány is `—`; meglévő Rendelt/Teljesített adatok továbbra is felhasználhatók.
- A megadott kézi 0 megmarad érvényes értéknek. A szerkesztő jelzi, ha kézi felülírás van érvényben; ha a forrás ismert, külön kiírja az Excel szerinti két alapot is. Üres mező mentésével a kézi felülírás törölhető.

Reprodukciós tesztadat: terv **2686**, eredeti akciós alap **2458**, kereslet **2994**. A javított eredmény **2766 akciós + 228 akción kívüli = 2994**. Ez ellenőrzési példa; a DO-n jelzett konkrét termék helyes két értékének igazolásához a termék/cikkszám, a KW-hét és a tényleges API-/Excel-adatok szükségesek.

A javítás helyben készült el, a DO tesztszerveren nem telepítettem. A szerveroldali archívumolvasáshoz a backend frissítése is szükséges. A fejlécében másik hetet tartalmazó minta nem használható automatikus helyreállításra.

- Akciós időszakkal megjelölt sornál két szerkeszthető mező jelenik meg: **Akciós időszak** és **Akciós időszakon kívüli**. Ezek a táblázattal azonos, kiszámolt részösszegeket tartalmazzák. Az eredeti akciós napok előre be vannak pipálva.
- Akciós időszak nélküli sornál csak a **Normál** mező jelenik meg; nincs akciós mennyiségmező vagy akciós napválasztó.
- Az akciós sor korábbi „Normál kartonszám” mezője az akciós időszakon kívüli részösszeget jelentette. Az új elnevezés ezt egyértelműsíti. Az API-mező neve továbbra is `manual_normal_demand`; az akciós mennyiségé `manual_action_demand`.
- A mezők megjelenését a sorban megjelölt akciós időszak határozza meg, nem a kartonszám nullától eltérése. Másik hétre eső, de megjelölt akciónál is két mező jelenik meg; az adott hét akciós mennyisége ilyenkor lehet 0.
- A szerkesztő megnyitása, a Mégsem és a változatlan értékek mentése nem ír adatot az API-ba.
- Csak a megváltoztatott érték lesz kézi felülírás. A változatlan, Excelből származó másik mennyiség nem válik tartós kézi értékké.
- A kézi mennyiség vagy naplista módosítása után is a Beállítások százalékprofiljai érvényesülnek. Az akción kívüli rész továbbra is számolódik.
- A kézi nulla érvényes érték. Az üres mennyiségmező visszaállítja az adott mennyiség Excelből számolt alapját.
- A negatív vagy nem számként értelmezhető mennyiséget, illetve hibás naplistát a szerver elutasítja. Akciós mennyiséghez a felület legalább egy kiválasztott napot kér.
- Új hét importja nem örökli automatikusan a korábbi hét kézi mennyiségeit és napjait. A korábban mentett kézi értékeket ez a javítás nem törli.

A mezőmegjelenítés módosítása után **20 célzott teszt sikeres, 0 hibás**. Chromiumban ellenőrizve: a két időszak helyes neve és részösszege, az egymezős Normál szerkesztés, mentés és újranyitás, nulla, üres mezővel visszaállítás, valamint másik hétre eső akció. A DO tesztszerver ebben a munkában nem frissült; a feliratmódosítás önmagában nem pótolja a hiányzó napi Excel-adatokat.

## Készlet lista: a Teljesített mennyiség elsőbbsége

A **Lekötés & Rendelés** táblázat **Tel.** oszlopának mennyiségét a **Készlet lista** napi hiánya és továbbvezetett készlete is figyelembe veszi. A készletből levont napi mennyiség mindig a legmagasabb elsőbbségű, rendelkezésre álló érték; a három mennyiséget nem adjuk össze.

| Becsült | Rendelt | Teljesített | A készletből levont mennyiség |
| ---: | ---: | ---: | ---: |
| 170 | nincs | nincs | 170 |
| 170 | 120 | nincs | 120 |
| 170 | 120 | 80 | 80 |
| 170 | 120 | 0 | 0 |
| 170 | 0 | nincs | 0 |

**Napi zárókészlet = napi nyitókészlet + érkező karton − érvényes napi mennyiség.** A következő nap ebből a zárókészletből indul, így a Teljesített változása a további napok hiányát és a hét végi zárókészletet is módosítja. A Becsült oszlop és a KW mennyiségi alap emiatt nem változik.

A hiányzó (`null` vagy nem átadott) Teljesített adat a felületen `-`, és nem írja felül a Rendelt mennyiséget. A Tel. oszlopban szereplő számérték, beleértve a **0**-t is, elsőbbséget kap. Az API a napi és termékenkénti összesítésben megőrzi a hiányzó adat és a nulla közti különbséget, a meglévő teljesítési értékeket pedig összeadja. Csak az aktuális rendelési verziók kerülnek ebbe az összesítésbe.

Az ellenőrzés lefedi a mennyiségek elsőbbségét, mindkét tényleges mező nulláját, a hiányzó adatokat, az érkezéseket, a későbbi napokra továbbvezetett készletet, a hiányt, az ismételt megjelenítést és az API-összesítést.

## Régebben feltöltött adatok

### A mintafájl ellenőrzése

A későbbi hibajelzés vizsgálatakor a felhasználó megerősítette, hogy a minta Excel hibás. A projektben található `Rendelési terv Gava Hungria Kft.xlsx` előrejelzésoszlopának fejléce **13.08. – 19.08.**, miközben több terméksor akciós időszaka **03.09. – 06.09.**, **05.09. – 06.09.** vagy **07.09. – 09.09.**. A heti fejléc és a vizsgált sorok időszaka így nem egyezik meg.

Az adott héten kívüli akciót a számítás nem tekinti az adott hét akciós részének: ilyenkor a teljes heti alap a Normál mezőben jelenhet meg. Ez önmagában nem hibás szétbontás. Az összehasonlításhoz a Rendelési terv és a Keresleti adatok megfelelő, azonos hétre vonatkozó fájljait kell használni.

A helyi adatbázisban ezenfelül a korábbi importból származó Rendelési terv sorainál a `daily_values` mező hiányzott. Napi alapadatok nélkül az eredeti akciós és normál kartonszám nem állítható helyre pontosan; ez külön adatprobléma, amelyet a helyes forrásból történő importtal vagy az elérhető, helyes archívum újrafeldolgozásával kell rendezni. Az ellenőrzés során az adatbázist nem módosítottam. A hibás minta miatt a megállapodott számítási szabály nem változott.

A **🔄 Adatok újrafeldolgozása** gomb a kiválasztott hét archivált Rendelési terv fájljából frissíti az eredeti heti előrejelzést és a napi alapadatokat, akkor is, ha azok korábban már ki voltak töltve. Megtartja a kézi mennyiségeket, naplistát és százalékbeállításokat. A megőrzött kézi felülírások továbbra is elsőbbséget kapnak; az újrafeldolgozás ezeket nem állítja vissza Excel-alapra.

A frissítés termék és akciós időszak szerint történik. Több raktári forrássor összeadódik, ha az adatbázisban már egyetlen összesített tétel van. Eltérő, nem egyértelmű sorszám esetén a csoportot kihagyja és jelzi. Az újrafeldolgozást ezen fejlesztés alatt éles adatbázison nem futtattam.

## Módosított fájlok és ellenőrzés

- `Access UI/src/utils/weeklyCommitments.js`: közös termékenkénti számítási modell, az eredeti akciós és normál alapok, százalékok és napeltolás.
- `Access UI/src/modules/aldi_rendelesek.js`: teljes KW mennyiség, a közös modellből feltöltött szerkesztő, csak tényleges módosítás mentése, kiválasztott heti újrafeldolgozás.
- `Access UI/src/main.js`: friss modullekérési verzió.
- `server/src/utils/weeklyCommitmentExcel.js`: előrejelzésoszlop kiolvasása és kézi mezők ellenőrzése.
- `server/src/routes/aldi_weekly_commitments.js`: import, kézi mentés és újrafeldolgozás illesztése az eredeti számításhoz.

Új tesztek: `weeklyPromotionSplit.test.js`, `weeklyPromotionEditor.browser.test.js`, `weeklyCommitmentEditingApi.test.js`. Vizsgált esetek: eredeti százalékok, nagyobb/kisebb keresleti mennyiség, eltérő napi összeg és előrejelzésoszlop, mindkét időszak számítása, előre kitöltött szerkesztő és pipák, változatlan mentés, kézi nulla, napmódosítás, tényleges rendelés elsőbbsége, több raktári sor/időszak, újrafeldolgozás és mentett kézi adatok megőrzése.

Teljes `server/npm.cmd test`: **87 teszt, 85 sikeres, 0 hibás, 2 kihagyott PostgreSQL-integrációs teszt**. A végső heti archívumellenőrzés és felületi szövegpontosítás után a kapcsolódó **9 API- és Chromium-teszt szintén sikeres**. A kézi szerkesztő és az ALDI önálló ablakai tényleges Chromium-böngészőteszten is sikeresek. A route-tesztek szimulált adatbázist és fájlrendszert használnak. A Készlet lista Teljesített → Rendelt → Becsült elsőbbségét külön számítási, táblázatmegjelenítési és API-tesztek ellenőrzik.

A javítás a munkakönyvtárban készült el. A frontend és a backend frissítése szükséges a futó rendszerben való használathoz; GitHub-feltöltés vagy éles telepítés ebben a munkában nem történt.
