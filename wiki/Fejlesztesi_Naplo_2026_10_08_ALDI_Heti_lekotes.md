# Fejlesztési napló – ALDI Heti lekötés

Dátum: **2026. október 8.**

A mai fejlesztések az **ALDI → Rendelés → Heti lekötés → Lekötés & Rendelés** számítását, termékszerkesztőjét és betöltését érintették. A végleges napi állapotot ez a napló foglalja össze; az október 7-i számítási szabályt és a mai korábbi részjegyzetek telepítési állapotát az alábbiak pontosítják.

## 1. A keresleti többlet az akción kívüli időszakhoz kerül

Ha a Keresleti adatok Excel kartonszáma meghaladja a Rendelési terv heti előrejelzését, továbbra is a nagyobb mennyiség adja az automatikus heti alapot. A pozitív különbözet azonban mostantól **az akción kívüli alapot növeli**, az eredeti akciós kartonszám változatlan marad.

Jelölések: **T** = rendelési terv heti előrejelzése; **K** = keresleti mennyiség; **A** = a terv eredeti akciós napi értékeinek összege.

| Mennyiség | Új automatikus szabály |
| --- | --- |
| Keresleti többlet | `max(0, K − T)` |
| Akciós alap | `A` |
| Akción kívüli alap | `T − A + max(0, K − T)` |
| Teljes heti KW | `max(T, K)` |

Példa a mai kéréshez:

| Érték | Karton |
| --- | ---: |
| Rendelési terv | 1706 |
| Keresleti mennyiség | 2687 |
| Többlet | 981 |
| Akciós alap | 1568 |
| Eredeti akción kívüli alap | 138 |
| Új akción kívüli alap | **1119** |
| Teljes heti KW | **2687** |

A többlet elosztására az akción kívüli százalékprofil vonatkozik. Eredetileg nulla akción kívüli alap esetén is ezt a profilt használjuk. Több forrássor és időszak esetén a többletet termékenként egyszer számoljuk el; a meglévő akción kívüli eloszlások arányát megőrizzük.

Kisebb vagy azonos kereslet nem csökkenti a tervet. Megmaradnak a beállított százalékok, a napi kerekítés és az Excel-napok egynapos eltolásának szabályai. A táblázat és a szerkesztő ugyanabból a közös modellből számol. A meglévő kézi felülírások továbbra is elsőbbséget kapnak.

Részletes jegyzet: [Keresleti többlet az akción kívüli időszakhoz](Heti_lekotes_keresleti_tobblet_20261008.md).

## 2. Normál és akciós termékszerkesztés közötti váltás

A termékszerkesztő **Akciós szerkesztés** kapcsolóval váltható a két mód között. A nap végére a kapcsoló mind a normál, mind az eredetileg akciós Excel-soroknál elérhető.

- Normál módban a **Normál** kartonszám szerkeszthető.
- Akciós módban az **Akciós időszak** és az **Akciós időszakon kívüli** kartonszám adható meg, és kijelölhetők az akciós napok.
- Normál → akciós váltáskor ugyanaz a szerkesztő és százalékos elosztás működik, mint az eredeti akciós tételeknél.
- Akciós → normál váltáskor a két mennyiség összevonódik, és a teljes mennyiséget a normál heti százalékprofil osztja el.
- A mód, a mennyiségek és a naplista menthetők, újranyitáskor megmaradnak. Normálról később ismét akciósra lehet váltani.
- A kapcsolás önmagában nem küld API-kérést. A Mégsem eldobja a szerkesztést; változatlan mentés nem ír adatot.
- Pozitív akciós mennyiséghez legalább egy akciós napot ki kell jelölni. A kézi nulla érvényes érték; üres mennyiségmezővel az adott mennyiség kézi felülírása törölhető.

A normálra állított mód tartósan nulla kézi akciós mennyiséggel és explicit üres `action_days_json` listával rögzül. A `null` naplista az Excel szerinti napokat jelenti. Az eredeti akciós időszak és napi forrásadatok megmaradnak; a kézi újrafeldolgozás nem kapcsolja vissza a normálra állított tételt. Ehhez nem kellett adatbázismigráció.

Részletes jegyzetek: [Normál sor akciós szerkesztése](Heti_lekotes_normal_akcios_szerkesztes_20261008.md), [Terméksor törlése és normálra váltás](Heti_lekotes_termeksor_torles_es_normalra_valtas_20261008.md).

## 3. Terméksor törlése a szerkesztőből

A **Mentés mellett Törlés gomb** jelenik meg mindkét szerkesztési módban. Megerősítés után a kiválasztott termék sorát törli az adott heti lekötésből.

A táblázatban egy terméksor mögött több Excel-/raktári forrássor lehet. A törlés az adott heti lekötés és cikkszám összes kapcsolódó `aldi_weekly_commitment_items` sorát eltávolítja, így a termék eltűnik a Lekötés & Rendelés táblázatból és a hozzá tartozó készletnézetből.

Másik hét tételei, a terméktörzs, a napi rendelések és a mentett készletbevitel adatai megmaradnak. Elutasított megerősítéskor nincs törlési kérés. Sikertelen törléskor a szerkesztő nyitva marad és hibaüzenetet jelenít meg.

Új API-végpont:

```text
DELETE /api/v1/aldi-weekly-commitments/weeks/:year/:week_number/article/:article_number
```

Hibás hét vagy termékazonosító: **400**. Hiányzó heti lekötés vagy terméktétel: **404**. Sikeres törléskor a válasz tartalmazza a törölt forrássorok számát. A művelet nem olvas Excelt.

Későbbi új Excel-feltöltés a terméket ismét felveheti. A kézi újrafeldolgozás a meglévő sorokat frissíti, nem hozza vissza a törölt sorokat.

## 4. A lassú helyi betöltés okának feltárása és javítása

A helyi szerveren reprodukált késés oka az október 7-én hozzáadott, megnyitáskori automatikus Excel-archívumolvasás volt. Hiányzó napi bontásnál a backend szinkron `fs.readFileSync` hívással próbált olvasni a `\\192.168.1.5\raktar` hálózati megosztásról. A várakozás alatt más kérések kiszolgálása is megakadt.

**A felhasználó pontosítása:** az ellenőrzött Excelben ott sem szerepeltek akción kívüli mennyiségek, ahol a táblázat nullát jelölt. A konkrét esetben a korábbi olvasás helyes volt; a feltételezett bontási hibát az Excel vizsgálata nem igazolta. A megnyitáshoz kötött automatikus pótlás ezért nem volt indokolt ennél az esetnél, és felesleges lassulást okozott.

Az új működés:

- Megnyitáskor és automatikus frissítéskor a heti adatok végpontja **kizárólag a PostgreSQL-ből olvas**.
- Az Excel feldolgozása a feltöltéshez vagy a felhasználó által indított **Adatok újrafeldolgozása** művelethez tartozik. A feldolgozott napi bontás és heti előrejelzés elmentődik az adatbázisba.
- Betöltés közben az év-, hét- és műveletválasztók láthatók maradnak. Ha már van betöltött táblázat, az is látható marad az új kérés alatt.
- Az automatikus frissítés nem indít újabb lekérést a kezdeti betöltés közben.
- A modul első megjelenítése nem vár más, háttérben induló adatlekérések befejezésére.

| Helyi mérés | Javítás előtt | Javítás után |
| --- | ---: | ---: |
| KW36 heti adatlekérés | kb. 21,1 másodperc | 34 ms, ismételve 10 ms |
| Párhuzamos JavaScript-fájl lekérése | kb. 20,9 másodperc | 20 ms |

A legutolsó backend-újraindítás után a heti GET ismét **200** választ adott, **16 ms** alatt. Ezek helyi, egyedi mérések; az előző hálózati Excel-várakozás megszűnését igazolják.

A javítás nem pótol kitalált mennyiségekkel adatot. Az importált nulla és a ténylegesen hiányzó napi bontás továbbra is különbözik a számításban.

Részletes jegyzet: [Adatbázisból történő betöltés](Heti_lekotes_adatbazis_betoltes_20261008.md).

## 5. Figyelmeztetések és szövegkódolás

Eltávolítottuk a táblázat „Egyes termékek napi tervadatai hiányoznak…” figyelmeztetését, majd a szerkesztőből a következő szöveget is:

> Hiányoznak a napi tervadatok. A pontos részösszegekhez töltsd fel a heti Rendelési tervet vagy indíts újrafeldolgozást.

Az ALDI rendelésmodulban meglévő hibás karakterkódolást helyreállítottuk, hogy a magyar feliratok és ikonok helyesen jelenjenek meg. A frontend modulimportok verziója frissült, hogy a böngésző az új kódot kérje le.

## 6. A munkakönyvtárban látható további felületi változások

A napi táblázati oszlopok sorrendje a jelenlegi kódban **Becsült → Rendelt → Szállított**; a harmadik fejléc felirata **Száll.** A becslések böngészőtesztjét ehhez a sorrendhez igazítottuk. A szerkesztő két mennyiségmezője egymás mellett, a napválasztók egymás alatt jelennek meg.

A munkakönyvtárban külön Rakodás-módosítás is látható: a RAKODVA jelölés megerősítést csak 100% alatti előkészítettségnél kér. Ezt a mai Heti lekötés-feladatban nem én készítettem, és külön működési tesztjét nem futtattam; a naplóban a meglévő változtatásként rögzítjük.

## 7. Ellenőrzések

A fejlesztés során több célzott tesztfutás történt. A végső termékszerkesztési és törlési változtatásnál **33 teszt sikeres, 0 hibás**; ezt a készletnézet és az önálló ALDI-ablakok **6 további sikeres tesztje** egészítette ki. A böngészőteszt az utolsó importverzió-frissítés után is sikeres volt.

Az ellenőrzések lefedik:

- A keresleti többlet új elosztását, a nulla eredeti akción kívüli alapot, a százalékokat, a kerekítést és több forrássor/időszak kezelését.
- A normál és akciós mód közötti kétirányú váltást, mentést, újranyitást, változatlan mentést és Mégsem működését.
- Mindkét terméktípus törlését, a törlés elutasítását és a többi termék megőrzését Chromiumban.
- A törlési API hét szerinti elkülönítését, az összevont sorok törlését, a védett rekordok megőrzését és a hibás/hiányzó azonosítókat.
- Az ismételt GET nulla Excel-olvasását, az újrafeldolgozás adatbázisba mentését, valamint a vezérlők megjelenését visszatartott adatválasz mellett.
- A készletszámítás és az önálló ALDI-ablakok kapcsolódó működését.

A backend route-tesztek szimulált adatbázist és fájlrendszert használnak; a felületi tesztek tényleges Chromium-böngészőben futnak. A futó helyi adatbázisból tesztelés céljából nem töröltünk terméktételt. A teljes szerveres tesztcsomag mai végső futtatása nem történt meg.

## 8. Érintett fájlok és futó állapot

| Fájl | Változás |
| --- | --- |
| `Access UI/src/utils/weeklyCommitments.js` | Keresleti többlet az akción kívüli alaphoz; tartós normál mód kezelése |
| `Access UI/src/modules/aldi_rendelesek.js` | Kétirányú szerkesztési kapcsoló, törlés, figyelmeztetések eltávolítása, betöltési javítások |
| `Access UI/src/main.js` | Friss modulimport-verzió |
| `server/src/routes/aldi_weekly_commitments.js` | GET archívumolvasásának megszüntetése; terméksor DELETE végpont |
| `server/src/utils/weeklyCommitmentExcel.js` | Explicit üres naplista megőrzése a normál módhoz |
| `server/tests/weeklyPromotionSplit.test.js` | Számítási és normál módra váltási tesztek |
| `server/tests/weeklyPromotionEditor.browser.test.js` | Szerkesztés, módváltás, törlés, lassú válasz melletti betöltés |
| `server/tests/weeklyCommitmentEditingApi.test.js` | Adatbázisból olvasás, módmentés, törlés, újrafeldolgozás |
| `server/tests/weeklyCommitments.test.js`, `server/tests/commitmentRates.test.js` | Route-mockok illesztése az új DELETE végponthoz |

A **helyi `localhost:3000` backend a végleges javított kóddal újraindult**. A heti lekérés HTTP 200, az új DELETE útvonal érvénytelen hétre HTTP 400 választ ad. A meglévő böngészőoldalt egyszer frissíteni kell az új frontend betöltéséhez.

A mai munkában Git-commit, GitHub-feltöltés vagy távoli/DO-telepítés nem történt. A korábbi mai részjegyzetek „telepítés nem történt” megjegyzése a megírásuk idejére vonatkozik; a helyi backend később frissült.
