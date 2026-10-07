# Fejlesztési napló – ALDI Heti lekötés és RAKODVA ellenőrzés

Dátum: 2026. október 7.

Ez a jegyzet a mai munkában elvégzett Heti lekötés-javításokat, a felhasználó által pontosított számítási szabályokat és a RAKODVA módosítás célzott ellenőrzését rögzíti. A más fejlesztésből származó Fuvarok/Rakodás módosításokat ellenőrzésként, nem saját új fejlesztésként sorolja fel.

## 1. Heti lekötés: akciós és normál mennyiség

A táblázat és a KW szerkesztő ugyanabból a termékenkénti számításból kapja az értékeit. Az eredeti napi Excel-adatok alapján külön számoljuk az akciós és az akción kívüli részt. Mindkét részre a Beállításokban megadott százalékprofil vonatkozik; a kézi szerkesztés után is ez az elosztás érvényesül.

- A Rendelési terv **Értékesítési előrejelzés** oszlopa az elsődleges heti alap. A napi oszlopok összege csak hiányzó/üres előrejelzésnél tartalék.
- Megmarad az eredeti egynapos eltolás: Excel csütörtök → felületi szerda, …, Excel következő szerda → felületi kedd.
- Több, azonos termékhez tartozó raktári sor összeadódik. Több akciós időszak nem írja felül egymást.
- A KW a teljes normál és akciós mennyiséget mutatja. Az önálló napi kerekítés miatt a napi értékek összege ettől kis kerekítési különbözettel eltérhet.

## 2. A nagyobb keresleti mennyiség különbözete az akciós alaphoz kerül

A felhasználó végleges előírása alapján, ha a Keresleti adatok Excel **Becsült mennyiségek (KAR)** értéke nagyobb a Rendelési terv heti előrejelzésénél, a pozitív különbözet az akciós alapot növeli. A normál alap változatlan marad.

| Érték | Számítás a felhasználó példájával |
| --- | ---: |
| Rendelési terv heti előrejelzése | 1706 karton |
| Keresleti mennyiség | 2687 karton |
| Keresleti többlet | 2687 − 1706 = **981 karton** |
| Eredeti akciós alap | 1568 karton |
| Új akciós alap | 1568 + 981 = **2549 karton** |
| Normál alap | 1706 − 1568 = **138 karton** |
| Teljes heti KW | 2549 + 138 = **2687 karton** |

A 30%–30%–22%–18% akciós profil a **2549** kartonra vonatkozik. A normál napok a **138** kartonból számolódnak. Kisebb keresleti mennyiség nem csökkenti a tervet. Akció nélküli héten a nagyobb heti mennyiséget a normál profil osztja szét.

## 3. KW szerkesztő és import

- Akciós időszakkal megjelölt sornál **Akciós időszak** és **Akciós időszakon kívüli** mező jelenik meg a kiszámolt részösszegekkel, az eredeti akciós napok pedig be vannak pipálva. A példában ezek 2549 és 138 karton.
- Akciós időszak nélküli sornál csak egy **Normál** mező jelenik meg, akciós mező és napválasztó nélkül. Mentése csak a normál mennyiséget küldi; nem írja át a nem szerkesztett akciós mezőket.
- A korábban Normál kartonszámnak nevezett mező az akciós soroknál az akción kívüli részt jelentette. Az új címke ezt egyértelműsíti; a számítási szabály és az adatbázis-mezők elnevezése megmarad.
- A megnyitás, a Mégsem és a változatlan mentés nem hoz létre kézi felülírást. Csak a ténylegesen módosított mező lesz kézi érték.
- A mentett kézi akciós összeg a teljes akciós alapot helyettesíti; a keresleti többletet nem adjuk hozzá újra.
- A kézi nulla érvényes. Az üres mennyiségmező visszaállítja az Excelből számolt alapot. Hibás/negatív mennyiséget és érvénytelen naplistát a szerver elutasít.
- A normál és akciós mezők a megfelelő API-mezőbe mentődnek.
- Új hét importja nem örökli automatikusan az előző hét kézi mennyiségeit és naplistáját.
- Az Adatok újrafeldolgozása a kiválasztott hét archivált tervéből frissíti a heti és napi alapadatokat. A kézi felülírások és a százalékok megmaradnak.

## 4. Készlet lista: Becsült → Rendelt → Teljesített

A Készlet lista a Lekötés & Rendelés táblázat **Tel.** értékét is figyelembe veszi. A napi levonás sorrendje:

1. Becsült mennyiség, ha nincs tényleges rendelési vagy teljesítési érték.
2. Rendelt mennyiség, ha rendelkezésre áll: felülírja a Becsültet.
3. Teljesített mennyiség, ha rendelkezésre áll: felülírja a Rendeltet és a Becsültet.

A mennyiségeket nem adjuk össze. Például Becsült = 170, Rendelt = 120, Teljesített = 80 esetén **80 kartont** vonunk le. A megadott 0 is érvényes; a hiányzó adat (`null` vagy nem átadott mező) a felületen `-`.

**Napi zárókészlet = nyitókészlet + érkező karton − érvényes napi mennyiség.** A Teljesített változása a napi hiányt, a következő napok nyitókészletét és a heti zárókészletet is módosítja. A Becsült oszlop és a KW-alap emiatt nem változik.

Az API termékenként és naponként összeadja az aktuális rendelésverziók teljesítését, és megőrzi a hiányzó adat és a nulla különbségét. A meglévő adatbázis alapértelmezett, számszerű 0 értékeit is megadott értékként kezeli.

## 5. Hibás minta Excel

A projektben lévő Rendelési terv fejlécében **13.08. – 19.08.** szerepel, miközben több terméksor szeptemberi akciós időszakot tartalmaz. A felhasználó megerősítette, hogy a minta hibás. Az eltérő heti időszak miatt a teljes mennyiség a Normál mezőben jelenhet meg, ha az akció nem esik a vizsgált hétre.

A helyi adatbázis régi tervsoraiból a napi bontás (`daily_values`) is hiányzott. A pontos eredeti akciós–normál szétbontáshoz a helyes napi forrás szükséges. A vizsgálat során ezeket az adatbázissorokat nem módosítottam.

Részletes számítási jegyzet: [Heti lekötés – akciós és normál számítás](Heti_lekotes_akcios_es_normal_szamitas_javitas_20261007.md).

## 6. RAKODVA: lokációs készlet és fuvarnézetek ellenőrzése

Vizsgált források: `server/src/routes/aldi_cross_docking.js`, `server/src/routes/locations.js`, `server/src/routes/aldi_fuvarok.js`, valamint az ALDI Rakodás és Belföldi fuvarok felülete.

**A szokásos, megfelelő komissiókapcsolattal rendelkező tételeknél az új RAKODVA mentés működik.** A kamion állapota, a teljesítés növelése és a lokációs készletsorok törlése egy tranzakcióban történik.

| Ellenőrzött eset | Eredmény |
| --- | --- |
| RAKODVA bejelölése | A kamion komissiós soraihoz kapcsolt `aldi_stock_locations` készlet törlődik. |
| Lokáció készletének újbóli lekérése | A kiszállított termék eltűnik; ugyanott más kamion terméke megmarad. |
| Komissiós és fuvaradatok | Megmaradnak, így a fuvar súlyai és előzményei továbbra is elérhetők. |
| Teljesítés | A kapcsolt rendelési sor teljesítése a komissiózott kartonszámmal nő. |
| Fuvarok összesítő | Az API a rakodott kamiont visszaadja, a megfelelő komissiós súllyal. |
| Belföldi fuvarok | A felület az `is_loaded === true` kamionokat listázza. A megjelenés a nézet következő adatbetöltésekor érvényesül. |
| Ismételt RAKODVA mentés | Nem növeli újra a teljesítést, és nem töröl másik kamionhoz tartozó készletet. |
| Készlettörlés közbeni adatbázishiba | A rakodott állapot és a teljesítés is visszagördül; a készlet megmarad. |

### Fennmaradó részletek

1. **A RAKODVA visszavonása nem állítja vissza a lokációs készletet.** A kamion újra aktív lesz és a teljesítés csökken, de a korábban törölt készletsor és lokáció nem áll vissza. Ez hiányos visszavonási működés; a visszarakás fizikai lokációját és módját rendezni kell.
2. **Régi készletsor komissiókapcsolat nélkül bent maradhat.** A törlés `commission_line_id` alapján történik. Ha a régi sor csak `truck_line_id` kapcsolattal rendelkezik, a RAKODVA mentés nem törli. A jelenlegi PDA mentése mindkét kapcsolatot kitölti.
3. **A korábban rakodott kamionok készlete nem tisztul automatikusan.** A törlés csak a nem rakodott → rakodott állapotváltáskor fut. A helyi adatbázis olvasásakor az **AL02** már rakodott kamionhoz három készletsor tartozott: a 103-as lokáción 20 karton, a 113-as lokáción 30 + 20 karton, összesen **70 karton**. A komissiókapcsolatuk megfelelő, de a készlet bent maradt. A módosítás önmagában ezeket a korábbi sorokat nem rendezi; ismételt `is_loaded: true` mentés sem törli őket.

A RAKODVA vizsgálat során az alkalmazáskódot és a tényleges készletadatokat nem módosítottam. A fenti hiányosságok ezért ellenőrzési megállapítások, nem elkészült javítások.

## 7. Ellenőrzések és állapot

- A Heti lekötés és a készletelsőbbség módosítása után teljes `server/npm.cmd test`: **84 teszt, 82 sikeres, 0 hibás, 2 kihagyott PostgreSQL-integrációs teszt**.
- A szerkesztő mezőinek későbbi módosítása után **20 célzott teszt sikeres, 0 hibás**. A valódi Chromium-próba ellenőrzi a két időszak külön mezőit, a Normál egymezős szerkesztést, a mentést, újranyitást, nullát és Excel-alapra visszaállítást. A DO tesztszerver frissítése ebben a munkában nem történt meg.
- A RAKODVA ellenőrzés külön, valódi PostgreSQL-en, kizárólag az adott kapcsolathoz tartozó ideiglenes táblákkal történt. A lokációs és fuvarösszesítő végpontokat is a tényleges route-kóddal hívtam. Normál törlés, más kamion készletének megőrzése, ismételt mentés és kikényszerített tranzakciós hiba egyaránt ellenőrizve.
- Az AL02 készletállapotának ellenőrzése csak olvasási lekérdezés volt. Tényleges kamion RAKODVA állapotát, üzemi készletet vagy éles adatbázisszekvenciát nem változtattam.
- A Belföldi fuvarok rakodottállapot-szűrését forráskódból ellenőriztem; ebben a célzott próbában külön böngészős megjelenítését nem teszteltem.
- Helyi reprodukció: `scratch/aldi-loaded-stock-review-20261007.cjs`; eredmények: `scratch/aldi-loaded-stock-review-20261007-results.json`.
- A saját javítások a munkakönyvtárban vannak. Ebben a munkában GitHub-feltöltés, éles telepítés és APK-build nem történt.

## 8. A mai saját javítások fő fájljai

- `Access UI/src/utils/weeklyCommitments.js`: közös akciós–normál modell és Teljesített → Rendelt → Becsült készletelsőbbség.
- `Access UI/src/modules/aldi_rendelesek.js`: táblázat, előre kitöltött szerkesztő, megfelelő kézi mezőmentés, kiválasztott heti újrafeldolgozás és Tel. figyelembevétele.
- `Access UI/src/main.js`, `Access UI/index.html`: friss modullekérési verziók.
- `server/src/utils/weeklyCommitmentExcel.js`: előrejelzésoszlop és kézi értékek ellenőrzése.
- `server/src/routes/aldi_weekly_commitments.js`: import, újrafeldolgozás, kézi mentés és teljesítésösszesítés.
- `server/tests/weeklyPromotionSplit.test.js`, `server/tests/weeklyPromotionEditor.browser.test.js`, `server/tests/weeklyCommitmentEditingApi.test.js`, `server/tests/weeklyStockDisplay.test.js`: célzott számítási, felületi és API-ellenőrzések.
