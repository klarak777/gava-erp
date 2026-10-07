# ALDI Heti lekötés, Rakodás és fuvarok – ismételt ellenőrzés

Dátum: 2026. október 7.

Az alábbi megállapítások az átvizsgáláskori állapotot rögzítik. A későbbi Heti lekötés számítási és szerkesztési javítást külön jegyzet dokumentálja: [Akciós és normál számítás helyreállítása](Heti_lekotes_akcios_es_normal_szamitas_javitas_20261007.md).

Az ellenőrzés a munkakönyvtár legújabb, még nem commitolt módosításaira vonatkozik. A fuvaros követelmények alapja a `docs/aldi-fuvarok-es-rakodas-jegyzet-20261007.md`, az összehasonlítás alapja az előző ellenőrzési jegyzet. Az alkalmazás forrását nem módosítottam; csak ezt a jegyzetet és helyi diagnosztikai segédfájlokat készítettem.

**Értékelés:** több korábbi hiba javult, de az összesítő lekérdezése továbbra sem működik, és az új kézi mennyiség-, teljesítés- és számlakezelésben javítandó hibák maradtak. A meglévő automatikus tesztek sikeres lefutása ezeket nem fedi le.

## Korábbi hibák javításának állapota

| Terület | Jelenlegi állapot és ellenőrzés |
| --- | --- |
| Sikertelen „Rakodva” mentés | Javult: HTTP 500 esetén jelzi a hibát és visszaállítja a kamiont az aktív listába. Böngészős próbában a kamion megmaradt, a szerveroldali állapot hamis maradt. |
| Fuvaros szerkeszthető mezők mentési hibái | Az összesítő és a Belföldi fuvarok ellenőrzi a HTTP-választ, hibánál újratölti az adatot. Belföldi böngészős próbában a hibásan mentett érték visszaállt. |
| Szezonválasztó | Az összesítő elküldi a szezonparamétert; a backendben szeptember 1-től a következő szeptember 1-ig tartó szűrés szerepel. A Belföldi fuvarok ténylegesen szűri a dátumokat. Böngészős próbában a Season 26-27 csak az új szezon kamionját mutatta. Az összesítő backendjét a lent leírt lekérdezési hiba jelenleg blokkolja. |
| Nem létező kamion számlafeltöltése | Javult: 404, fájlírás nélkül. A mappa szerveroldali kamionszámból készül, nem a kliens által küldött kamionszámból. |
| Számla letöltése | Létrejött a `/api/v1/uploads/aldi-invoice/file` végpont, a felület ezt hívja. Szimulált fájlrendszerrel a megfelelő, nyilvántartott fájlt adta át letöltésre. A hálózati megosztón való működést nem vizsgáltam. |
| Évfordulós heti besorolás | A 2026.01.01–01.07 fejléc/fájlnév most 2026 KW1-re kerül; a korábbi 2025 KW1 hiba javult. Más fejlécév kezelésében még van hiba, lásd lent. |
| Több akciós időszak összeadása | Javult: 400 és 200 kartonos időszakokból 600 karton fogyás keletkezik, a sorok fordított sorrendjében is. |
| Heti lekötés szintaxis | Az ellenőrzés közben a fájl változott: az elején tapasztalt hiányzó blokklezárás és hibásan escape-elt sablonkarakterek a végső forrásból már eltűntek. A teljes ALDI ablakos böngészőteszt is sikeres. Ezek nem fennmaradó hibák. |
| Crossdocking mező | A `crossdock_pallets` mező neve egyezik a migrációban, az API-ban és a felületen. |

## Fennmaradó hibák, javítási sorrendben

A P1 sürgős működési vagy adatpontossági hibát, a P2 meghatározott helyzetben jelentkező hibát jelöl.

### 1. P1 – A Fuvarok összesítő minden lekérdezése 500-as hibára fut

Forrás: `server/src/routes/aldi_fuvarok.js:17`.

A join feltételben az `.andOnRaw('cl.aldi_truck_line_id IS NULL')` hívás szerepel. A projekt telepített Knex verziójának JoinClause objektumán nincs `andOnRaw` metódus. Az összesítő lekérdezése így már SQL-végrehajtás előtt elbukik, üres adatbázisnál és szűrő nélkül is.

Reprodukció: a valódi Knex lekérdezésépítővel meghívott route 500 / `Internal server error` választ adott. Az `andOnRaw` típusa `undefined`, az `andOnNull` típusa `function`.

Javítás: támogatott join-feltételre kell cserélni, például `.andOnNull('cl.aldi_truck_line_id')`. Ezután a tényleges összesítést is ellenőrizni kell a 6. pont szerinti régi adatokkal.

### 2. P1 – A kézi normál és akciós kartonszám felcserélve kerül mentésre

Forrás: `Access UI/src/modules/aldi_rendelesek.js:1230`.

A normál mezőből olvasott `norm` a `manual_action_demand`, az akciós mezőből olvasott `act` a `manual_normal_demand` mezőbe kerül. A backend ezeket a neveket helyesen értelmezi, tehát az adat ténylegesen rossz kategóriába mentődik.

Böngészős reprodukció a szerkesztőablakkal: Normál = 10, Akciós = 20. A küldött JSON: `manual_action_demand: "10"`, `manual_normal_demand: "20"`. A helyes értékek fordítottak.

Javítás: a két JSON-értéket a saját mezőjükhöz kell kötni; mentés és újranyitás után is ellenőrizni kell az értékeket.

### 3. P1 – Pozitív kézi mennyiségből negatív napi becslés keletkezhet

Forrás: `Access UI/src/modules/aldi_rendelesek.js:654` és `:665`.

A kód a napi átlagot `Math.round` segítségével kerekíti, majd az összes kerekítési különbözetet az utolsó napra teszi. Ha a felfelé kerekített korábbi napok összege nagyobb az összmennyiségnél, az utolsó nap negatív lesz.

Reprodukció: 2 karton négy kijelölt napra → **1, 1, 1, −1 karton**. A renderelt táblázatban is ezek jelentek meg. A negatív napi fogyás a készletgöngyölítésben készletnövekedést okoz.

Javítás: nemnegatív, összeget megőrző szétosztás szükséges. A kézi mennyiségek és a naplista szerveroldali ellenőrzése is hiányzik: jelenleg a negatív mennyiséget vagy érvénytelen napot nem utasítja el a mentési végpont.

### 4. P1 – Rendelésverzió-váltás után a teljesítés eltűnik az aktuális Heti lekötésből

Forrás: `server/src/routes/aldi_cross_docking.js:110`, `server/src/routes/aldi_weekly_commitments.js:413`, `server/src/routes/aldi_daily_orders.js:257` környéke.

A rakodottá állítás a kamionsor `aldi_daily_order_line_id` mezőjén hivatkozott rendelési sor `fulfilled_cartons` értékét növeli. Új rendelési PDF-verzió feltöltésekor új rendelési sorok jönnek létre ugyanazzal az `order_item_state_id` értékkel, a teljesítés átvitele nélkül. A megmaradt kamionsor a korábbi rendelési sorra hivatkozhat. A Heti lekötés viszont csak `current` rendelésverziókat olvas.

Reprodukció a valódi rakodási route-tal és szimulált adattáblákkal: 10 karton rakodása után a korábbi sor teljesítése 10, az aktuális sor teljesítése 0. Akkor is elvész a heti nézetben a teljesítés, ha a rendelésverziót csak a rakodás után cserélik, mert az új sor alapértéke 0.

Javítás: a teljesítést verziófüggetlen rendelési tételhez kell kötni, vagy a megfelelő aktuális sorra kell átvezetni. A rendeléscsaládok és a tényleges komissiós tételek alapján kell összesíteni, hogy több rendelés ne keveredjen össze.

### 5. P1 – Párhuzamos számlafeltöltés elveszíthet egy fájlhivatkozást

Forrás: `server/src/routes/uploads.js:188`, `:235`, `:243`.

Két kérés ugyanazt a korábbi `invoice_files` listát olvassa, külön-külön hozzáfűzi a saját fájlját, majd visszaírja a teljes listát. A későbbi írás felülírja a másik kérés bejegyzését; a fájl fizikailag megmarad, de a felületen nem lesz elérhető.

Reprodukció: két egyidejű, eltérő nevű PDF feltöltése egy kamionhoz. Mindkét válasz 200, két fizikai fájl, de csak egy adatbázis-hivatkozás maradt.

Javítás: a fájllista módosítását tranzakcióval és sorzárral vagy atomi adatbázis-művelettel kell végezni; külön dokumentumtábla is megfelelő megoldás.

### 6. P2 – A régi, kamiontétel-kapcsolat nélküli komissió súlya továbbra is duplázódhat

Forrás: `server/src/routes/aldi_fuvarok.js:14`.

Az új közvetlen `aldi_truck_line_id` kapcsolat helyes irány. A régi, null kapcsolatú sorokra használt kamion + terméknév feltétel azonban minden azonos nevű kamionsorhoz kapcsolja ugyanazt a komissiót.

Az 1. pont metódushibáját kizárólag a diagnosztika memóriabeli másolatában javítva: két azonos nevű kamionsor és egy 100 kg-os, null tételkapcsolatú komissió → mindkét sor 100 kg, összesen **200 kg a tényleges 100 kg helyett**. Közvetlenül kapcsolt 100 és 300 kg-os komissióknál már helyes 100/10 és 300/30 értékeket adott a lekérdezés.

Javítás: terméknév alapján csak egyértelmű kapcsolatra szabad visszaesni. Több lehetséges tételnél külön egyeztetés vagy a régi kapcsolatok helyreállítása szükséges.

### 7. P2 – Az időbélyeg önmagában nem garantál egyedi számlafájlnevet

Forrás: `server/src/routes/uploads.js:220`.

A fájlnév csak az eredeti alapnévből és `Date.now()` értékéből áll. Azonos nevű fájlok azonos ezredmásodpercben ugyanarra az útvonalra kerülnek, a második felülírja az elsőt. Ez egy többfájlos feltöltésen belül is lehetséges.

Reprodukció rögzített órával: két `a.pdf` → két adatbázis-bejegyzés, egy fizikai fájl, a második tartalmával. Ez az időütközési helyzet szimulációja, nem hálózati megosztón mért időzítés.

Javítás: egyedi azonosító és felülírást kizáró fájllétrehozás szükséges.

### 8. P2 – Rakodott állapot visszavonása és újra megadása duplázza a teljesítést

Forrás: `server/src/routes/aldi_cross_docking.js:96`.

A `false → true` átmenet növeli a teljesítést, a `true → false` átmenet nem vonja vissza. Újra `true` állításkor ugyanazokat a komissiós kartonokat még egyszer hozzáadja.

Route-reprodukció: 10 karton → rakodva → nem rakodva → rakodva → **20 teljesített karton**. A normál Rakodás felület a már rakodott kamiont elrejti, de az API elfogadja ezt az állapotsort; visszanyitás vagy elavult teljes kamionobjektum mentése esetén a számláló hibás marad.

Javítás: a teljesítést tényleges, egyszer elszámolt komissiókból kell meghatározni, vagy megfelelő visszavonást kell biztosítani. Egy ismételt állapotváltás ne számolhassa el kétszer ugyanazt a teljesítést.

### 9. P2 – Az Excel fejlécében szereplő év továbbra is figyelmen kívül marad

Forrás: `server/src/routes/aldi_weekly_commitments.js:122`.

A fejléc reguláris kifejezése elfogadja az évszámot, de nem olvassa ki. A kód a fájlnévből származó vagy aktuális évet használja. Dátum nélküli fájlnévvel ezért egy másik évre szóló Excel rossz évbe és akár rossz hétre kerül.

Reprodukció: `Rendelési terv.xlsx`, fejléc `Értékesítési előrejelzés 04.03.2027 - 10.03.2027` → **2026 KW9**, a helyes **2027 KW9** helyett. A 2026. januári évfordulós eset javítása tehát nem oldotta meg az explicit fejlécév felismerését.

Javítás: az explicit fejlécév kiolvasása és érvényesítése szükséges; ennek hiányában használható a fájlnév vagy a tartalék év.

## További tisztázandó részletek

- A kézi mennyiség napi szétosztása jelenleg egyenlő arányt használ, megkerülve a meglévő százalékbeállításokat. El kell dönteni, hogy ez a kívánt üzleti működés-e; a korábbi Heti lekötés dokumentáció százalékos elosztást ír le.
- A korábbi hét kézi mennyiségeit és akciós napjait az új import átmásolja a következő feldolgozott hétre. A heti mennyiség tartós alapbeállításként történő átvitelének szándékát a rendelkezésre álló terv nem tisztázza.
- Az új `is_locked_for_distribution` mező a migráción kívül nincs használatban. Önmagában az oszlop hozzáadása nem valósít meg rendelés- vagy szétosztási zárolást.
- Az `implementation_plan_heti_lekotes.md` továbbra is 0 bájt. A régi V2/V3 terv jövőbeli napokra vonatkozó leírása eltér a későbbi, kódban és tesztben rögzített teljes heti készletszámítástól; ezt nem minősítettem alkalmazáshibának.

## Ellenőrzések és korlátok

- Végső `server` / `npm.cmd test`: **68 teszt, 66 sikeres, 0 hibás, 2 kihagyott**. A kihagyottak PostgreSQL-integrációs tesztek. Az ALDI menü és a négy önálló ablak böngészőtesztje sikeres.
- Célzott route-próbák, tényleges Knex lekérdezésépítő, memóriabeli SQL-adatok, böngészős szerkesztőablak és renderelt heti táblázat igazolták a fent felsorolt hibákat. Ezek az esetek a meglévő tesztcsomagban nem szerepelnek.
- A számlatesztek szimulált fájlrendszert és adatbázist használnak; nem írtak a hálózati megosztóra. A teljesítési próbák szimulált tranzakciós adatokat használnak, éles adatbázist nem módosítanak.
- A szezon- és hibakezelési felületi próbák valódi Chromiumban, helyi szimulált API-val történtek. Az összesítő tényleges API-jának sikeres adatbetöltését az 1. pont blokkolja.
- A végső szintaxisvizsgálatban a modul import sorai elhagyásával a teljes modul parse-olása sikeres volt; az importok valódi betöltését a sikeres ALDI ablakos böngészőteszt ellenőrzi.
- Az ellenőrzés közben változó forrás miatt a korábbi hibás tesztfutásokat a végső futás felülírja. A felülvizsgálat önmagában nem végezte el a megállapított alkalmazásjavításokat.

Helyi reprodukciós segédfájlok és JSON-eredményeik: `scratch/aldi-review-followup-20261007.cjs`, `scratch/aldi-review-browser-followup-20261007.cjs`, `scratch/aldi-review-invoice-followup-20261007.cjs`. A scratch mappa Git által figyelmen kívül hagyott diagnosztikai terület.
