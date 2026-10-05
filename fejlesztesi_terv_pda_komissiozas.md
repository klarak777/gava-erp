# PDA komissiózás – felülvizsgált fejlesztési terv

**Dátum:** 2026-10-02  
**Állapot:** fejlesztés előtti terv; az alábbi megoldások még nincsenek megvalósítva.  
**Hatókör:** LOT-figyelmeztetés, legfeljebb egy raklapnyi maradék párhuzamos komissiózásának védelme, „Mentés” gombfelirat.

**Rögzített pontosítás:** a LOT első két számjegye az ISO-hét, utolsó két számjegye a hét napja (`01` = hétfő, `07` = vasárnap). 2026-10-02 LOT-ja `4005`. A komissiós védelem a Mentéskor ellenőriz; a tételkiválasztás és adatbevitel megkezdése engedélyezett.

## 1. Vélemény a korábbi tervről

Az irány használható, de a korábbi tervet a fejlesztés előtt javítani kell.

| Hiba / hiány | Következmény és javítás |
|---|---|
| A korábbi felülvizsgálat a LOT utolsó két számjegyét hónapnapnak értelmezte. | A pontosítás szerint ez a hét napja (01–07). A `3626` és `3926` hibás, nem dátumként feloldandó LOT. A jelenlegi klienskód hét/nap értelmezése helyes. |
| Késznek jelöli a LOT-ellenőrzést. | A meglévő klienskód a PDA óráját és naptári évét használja, hibás formátumnál pedig kihagyja a korvizsgálatot. Szerveroldali ellenőrzés, évforduló- és hibakezelés még szükséges. |
| A korábbi hibás példa alapján 6 napos kortól figyelmeztetne. | A hibás példa nem határozza meg a küszöböt. Az eredeti „6 napnál régebbi” kérés szerint `ageDays > 6`: 6 naposan nincs lejárati figyelmeztetés, 7 naposan van. |
| Az A változat címkéből állapítaná meg a másik dolgozót. | A jelenlegi címkegenerálás nem ment dolgozói és bejelentkezési munkamenet-azonosítót. Adatbázis-bővítés szükséges, bár új tábla nem feltétlenül. |
| Az ellenőrzést címkegenerálás után végezné. | Ellenőrzés és létrehozás egy tranzakcióban, sorzár alatt szükséges, különben két egyidejű kérés is sikerülhet. |
| Végül A+B kombinációt, tételkiválasztáskori lock/unlock API-t ír elő. | Ez megkezdéskor létrejövő foglalás, külön megoldás a felhasználó által választott Mentéskori A változattól. |
| Dolgozói névvel azonosítana. | A tulajdonos `req.user.id` és `req.user.sessionId` alapján azonosítható; a név megjelenítésre szolgál. |
| Öt perc után feltétel nélkül feloldana. | Megújítás és a lejárt címke későbbi használatának tiltása nélkül aktív munka közben is elveszhet a védelem. |
| Két `commission.js` kézi szerkesztését írja elő. | A valódi szerkesztendő forrás a `PDA UI`; a build ebből készíti a `PDA-App/www` másolatot. |

**Választott megoldás:** A változat, a felhasználó pontosítása szerint a „Mentés” gombtól induló védelemmel. Az ideiglenes címkén alapuló megoldás pontosabban Mentéskor létrejövő szerveroldali foglalás; nem klasszikus, kizárólag verzióütközést vizsgáló optimista zárolás.

## 2. Ellenőrzött jelenlegi architektúra

Az elemzés a munkakönyvtár forrásaira épül; az éles adatbázist és a PDA-ra ténylegesen telepített APK-t nem vizsgáltuk.

1. A `/api/v1/pda/login` dolgozói belépést kezel. A JWT-ben dolgozói azonosító, név és bejelentkezési `sessionId` szerepel; a middleware ellenőrzi ezeket.
2. A `GET /api/v1/pda/commission-lines` a kamionsorokat adja vissza. A maradék a rendelt és már komissiózott kartonok különbsége. A `cartons_per_pallet` a válaszban `plt`.
3. A sor kiválasztásakor a kliens helyi `openForm()` függvénye nyit adatlapot. **Nincs szerverkérés, ezért a szerver nem tud az adatbevitel megkezdéséről.**
4. Az adatlap „Mentés” gombja `POST /api/v1/pda/generate-pallet-label` kérést küld. Ideiglenes SSCC-címke keletkezik kamionsor-azonosítóval és kartonszámmal. A komissiózott mennyiség még nem nő.
5. Nyomtatás, céllokáció megadása és az SSCC visszaolvasása következik.
6. A `PUT /api/v1/pda/commission-lines/:id/pick-and-assign` véglegesít. A közös `processPick()` tranzakcióban, `FOR UPDATE` sorzárral ellenőrzi a maradékot, rögzíti a komissiót és készletet, növeli a komissiózott kartonszámot és véglegesíti a címkét.
7. Több visszalépési útvonal meghívja a `DELETE /api/v1/pda/provisional-label/:id` végpontot. Címkegeneráláskor a szerver jelenleg törli a két óránál régebbi ideiglenes címkéket is.

A jelenlegi `FOR UPDATE` a rövid mentési tranzakció idejére él. A második véglegesítés a maradéknál nagyobb mennyiségnél 409 hibát kap, így túlrögzítés ellen már van védelem. Ez nem védi az adatbeviteli időszakot, és két kisebb részkomissiózást sem tilt, ha együtt beleférnek a maradékba.

### A #/PLT adat és a védendő mennyiség

Az ALDI Rakodás áruigények `#/PLT` mezője az `aldi_daily_order_lines.cartons_per_pallet` értéket módosítja. Kamionra helyezéskor a kliens továbbadja ezt az értéket, és bekerül az `aldi_truck_lines.cartons_per_pallet` mezőbe; a PDA innen olvassa.

Az utólagos áruigény-módosító végpont csak a napi rendeléssort frissíti, ezért a két érték később eltérhet. Ezt a védelemnél ellenőrizni kell.

**Tervezési alap:** egy konkrét PDA-kamionsort védünk (`aldi_truck_lines.id`), a még nem komissiózott rendelt mennyiség alapján. Ez nem fizikai raktárkészlet. Az áruigények `available_cartons` értéke a kamionokra még ki nem osztott mennyiség, és nem azonos a PDA maradékával.

Ha ugyanazon áruigény több kamionra kiosztott tételeit együtt kell védeni, a közös `order_item_state_id` alapján összesített maradékot és közös foglalást kell kezelni. Terméknév szerint zárolni nem megfelelő: összekeverhet külön rendeléseket.

## 3. Fejlesztés 1 – LOT-figyelmeztetés

### Üzleti szabály

- Formátum: négy számjegy, `WWDD`; `WW` az év ISO-hetének száma (01–53), `DD` a hét napja (01–07).
- `01` = hétfő, `02` = kedd, `03` = szerda, `04` = csütörtök, `05` = péntek, `06` = szombat, `07` = vasárnap.
- `4005` = 2026-10-02, a 40. hét péntekje; `3906` = 2026-09-26, a 39. hét szombatja.
- A `3626` és `3926` hibás, mert a `26` nem hétköznap-sorszám; a rendszer javítást kér.
- **Tervezési küszöb az eredeti „6 napnál régebbi” kérés szerint: `ageDays > 6`.** Pontosan 6 napos LOT-nál nincs lejárati figyelmeztetés; 7 napos kortól van.
- Lejárt LOT-nál figyelmeztetünk, és tudatos jóváhagyással engedünk tovább. Hibás vagy nem feloldható dátumnál javítást kérünk.

### Dátumfeloldás

1. A LOT szöveg: a mező `type="text"`, `inputmode="numeric"`, pontosan négy számjegy. A kezdő nulla megmarad. Rövid értéket nem egészítünk ki találgatással; a szerver is ellenőrzi a formátumot.
2. Az aktuális dátum a szerver időpontjából, **Europe/Budapest** szerint képzett naptári nap. A PDA órája nem befolyásolhatja a szabályt.
3. A vizsgált ISO-hétév első hetének hétfőjét a január 4-ét tartalmazó hétből képezzük. A LOT dátuma ehhez képest `(WW - 1) * 7 + (DD - 1)` nap. Visszaellenőrizzük az ISO-évet és hetet: nem létező 53. hét, valamint 01–07-en kívüli nap hibás.
4. A LOT nem tartalmaz évet, ezért az év minden esetben nem állapítható meg biztosan. Évfordulón a naptári év és az ISO-hétév különbözhet.
5. **Egyeztetendő évválasztás:** a jelenlegi és a két szomszédos ISO-hétév érvényes jelöltjei közül az aktuális dátumhoz legközelebbit választjuk. Jövőbeli eredménynél javítást kérünk; nem váltunk csendben egy régi évre. Azonos közelség vagy bizonytalan eredet esetén tényleges gyártási dátum szükséges.
6. Ez friss árukra használható következtetés. Régi, akár többéves LOT pontos kora négy számjegyből nem garantálható; ilyen követelménynél a LOT mellé gyártási év vagy teljes dátum kell.
7. Naptári napok különbségét számoljuk: a két budapesti dátum év/hó/nap értékét UTC-napsorszámmá alakítjuk. Nem helyi éjfelek milliszekundum-különbségét osztjuk 24 órával, így az óraátállítás nem tolja el a küszöböt.

### Szerver és kliens

Javasolt közös szerveroldali LOT-szolgáltatás és `POST /api/v1/pda/validate-lot` végpont. Válasza: normalizált LOT, feloldott dátum, aktuális dátum, kor, küszöb és figyelmeztetési állapot.

- A mező elhagyásakor opcionálisan előzetes figyelmeztetés adható.
- A „Mentés” kötelezően ellenőriztet **a címkegenerálás és a következő képernyő előtt**.
- Üzenet például: „A LOT (3905) dátuma 2026.09.25., kora 7 nap. A LOT lejárt. Folytatod?”
- „Javítom”: adatlap marad, LOT kap fókuszt, címke nem keletkezik. „Folytatom”: a kliens továbbítja a jóváhagyás igazolását.
- A `generate-pallet-label` maga is ellenőriz. Jóváhagyás nélkül `409 LOT_EXPIRED_CONFIRMATION_REQUIRED`; hibás dátumnál `400 INVALID_LOT`. A közvetlen API-kérés sem kerülheti meg a figyelmeztetést.
- A jóváhagyást dolgozóhoz, bejelentkezési és komissiós munkamenethez, sorhoz, LOT-hoz és ellenőrzési dátumhoz kötjük; szerveroldali tárolás vagy aláírt igazolás használható. Egy korlátlan `accepted: true` nem elegendő.
- Más LOT vagy új budapesti naptári nap új ellenőrzést és szükség esetén új jóváhagyást igényel. A véglegesítő útvonal is ezt ellenőrzi; az igazolást a komissióhoz kapcsolhatóan megőrizzük.
- Hálózati hiba esetén megmaradnak a bevitt adatok; ellenőrizetlenül nem lép tovább a folyamat.

**APK-hatás:** új APK szükséges a folytatható figyelmeztetés és az igazolás kezeléséhez. Kizárólag szerverfrissítés a régi kliensben egyszerű hibaüzenetet eredményezhet, de a teljes kért folyamatot nem adja meg.

## 4. Fejlesztés 2 – A változat, védelem a Mentéstől

### A védelem kezdete

Az első sikeres címkegenerálás létrehozza a foglalást. A következő felhasználó ugyanazon kis maradékra nem kap új címkét, és az adatlapnál marad.

**Mentés előtt mindkét dolgozó megnyithatja és kitöltheti az adatlapot. Ez az elfogadott működés.** A második dolgozó Mentésekor a friss szerveradat alapján jelezni és tiltani kell a továbbhaladást, ha a maradék legfeljebb egy raklap, és másik dolgozó érvényes komissiója aktív.

### Mennyiség és küszöb

```text
R = ordered_cartons - COALESCE(picked_cartons, 0)
P = érvényes cartons_per_pallet
Q = aktív, még nem véglegesített címkék foglalt kartonjainak összege
F = R - Q  (új foglalásra szabad mennyiség)
```

- `R <= 0`: kész tétel, új címke nem generálható.
- `0 < R <= P`: az első elfogadott munkamenet kizárólagosan foglal. Másik munkamenet kisebb kért mennyiséggel sem indíthat új komissiózást.
- `R > P`: párhuzamos komissiózás engedhető, de a címkékkel már foglalt mennyiséget figyelembe kell venni. Új kérés mennyisége legfeljebb `F` lehet.
- A másik dolgozóra vonatkozó külön tiltás küszöbe `R <= P`, a még nem komissiózott kartonok szerint. Az `F` külön mennyiségi ellenőrzés: új címkékkel nem foglalhatunk több kartont, mint amennyi még szabad. Az `F <= P` önmagában nem vezet be további kizárólagos tiltást, ha `R > P`.
- A nagyobb maradéknál korábban szabályosan elfogadott foglalások lezárhatók. A küszöb átlépése nem okozhat olyan állapotot, hogy két jogos folyamat egymást blokkolja; az új belépőket tiltjuk.
- Negatív vagy túlfoglalt mennyiséget adateltérésként jelezünk, nem rejtjük el nullára kerekítéssel.

**#/PLT:** a kamionsorban tárolt értéket használjuk, de ellenőrizzük a kapcsolódó áruigény aktuális értékével. Hiányzó, nulla, hibás vagy eltérő értéknél új címkét nem fogadunk el: „A #/PLT adat hiányzik vagy eltér az áruigénytől; egyeztetés szükséges.” A védelem nem kapcsolhat ki észrevétlenül. Automatikus szinkronizálás később külön szabállyal vezethető be, aktív foglalások figyelembevételével.

### Adatbázis-bővítés, új locktábla nélkül

Javasolt mezők az `sscc_labels` táblán (tervezett nevek):

| Mező | Cél |
|---|---|
| `picker_employee_id` | Hitelesített dolgozó; neve megjelenítéskor kérdezhető le. |
| `picker_session_id` | Bejelentkezési munkamenet; új belépés nem örököl csendben foglalást. |
| `pick_session_id` | Konkrét komissiózás ismétlésvédelme már címkegeneráláskor. |
| `reservation_expires_at` | Szerveroldali érvényességi határidő. |
| `reservation_closed_at`, `reservation_close_reason` | Véglegesítés, visszavonás és lejárat megkülönböztetése. |

A LOT-jóváhagyásnak is szükséges tárolt igazolás vagy kapcsolódó naplóadat, a választott módszertől függően.

Index kell a sor aktív foglalásainak lekérdezéséhez. A nem üres `pick_session_id` ismétlődését egyedi korlát tiltja: ismételt kérés ugyanazt a címkét adja vissza. A meglévő `aldi_commission_lines.pick_session_id` alapú ellenőrzést megőrizzük és tulajdonos-ellenőrzéssel egészítjük ki.

### Atomi címkegenerálás

Egyetlen tranzakcióban:

1. A tulajdonosi adatok a hitelesített JWT-ből érkeznek, nem a kérés törzséből.
2. A kamionsor `FOR UPDATE` zárolása. Minden foglalást módosító művelet ugyanazt a sorzárat használja; nincs percekig nyitva tartott adatbázis-tranzakció.
3. Azonos munkamenet ismételt, azonos adatokkal küldött kérésénél meglévő címke visszaadása. Eltérő adatokkal ugyanaz az azonosító konfliktus.
4. Lejárt foglalások rendezése, friss maradék és #/PLT ellenőrzése. Más PDA-belépés miatt érvénytelenné vált tulajdonosi munkamenet kezelése.
5. Küszöb és foglalt mennyiség ellenőrzése. Ütközés: `423 PICKING_CONFLICT`, például „A tételt Kovács Anna komissiózza. A hátralévő 40 karton legfeljebb egy raklap (60 karton/raklap), ezért most nem menthető.”
6. LOT, jóváhagyás, súlyok és raklapadatok ellenőrzése.
7. Ideiglenes címke létrehozása tulajdonossal, munkamenetekkel, foglalt mennyiséggel és lejárattal; commit után válasz.

A sorzár az ellenőrzés és insert közötti versenyhelyzetet szünteti meg. Önmagában egy külön `SELECT` és egy későbbi `INSERT` nem elegendő.

### Véglegesítés és életciklus

- A `pick-and-assign` a sorzár alatt ellenőrzi a címke sorát, tulajdonosát, bejelentkezési és komissiós munkamenetét, állapotát, lejáratát és foglalt mennyiségét. A végleges adat nem térhet el észrevétlenül a jóváhagyott címkétől.
- Komissió, készlet, mennyiségi frissítés, címkevéglegesítés és foglaláslezárás ugyanabban a tranzakcióban történik.
- Sikeres véglegesítés ismétlése az eredeti eredményt adja, új mennyiséget nem rögzít. Ez a tulajdonossal ellenőrzött ismétlésvédelmi ág megelőzi a foglalás időközbeni lejáratának vizsgálatát.
- Más dolgozó nem törölheti, nyomtathatja vagy véglegesítheti az ideiglenes címkét. Generálás, nyomtatás, törlés és véglegesítés minden útvonalát együtt védjük, az alternatív címkelétrehozást is.
- Visszalépés a saját foglalást vonja vissza. Nyomtatott vagy auditálandó címkénél fizikai törlés helyett visszavont állapotot őrzünk; a régi SSCC nem véglegesíthető.
- A nyomtatás nem oldja fel a foglalást: lokáció és SSCC visszaolvasásáig tart.
- Hálózati/nyomtatási hiba és ismétlés nem hoz létre új foglalást, a bevitt adatok megmaradnak.
- **Kezdeti javasolt lejárat: 30 perc**, a valós folyamat mérésével pontosítandó. Tulajdonosi szerverkérések lejárat előtt megújíthatják; lejárt foglalás nem éled fel automatikusan.
- Lejárt címke nyomtatása és lezárása elutasított; friss adatokkal újra kell indítani. Auditcélból megőrizhető, de nem foglal kartont.
- Rendszeresen hosszabb műveleteknél a kliens időszakos megújítást küld; ez külön kliensmódosítás. A `beforeunload` nem megbízható feloldási mechanizmus.
- A jelenlegi kétórás címketörlést az új életciklushoz igazítjuk. A foglalás lejárata és az auditadat megőrzése külön szabály.
- A kamionsor mennyiségének csökkentése, áthelyezése vagy törlése sem kerülheti meg a foglalást. Az érintett adminisztratív műveletek ugyanazon zárolási rendben ellenőrzik az aktív munkát; ütközésnél előbb rendezni kell a komissiózást. A #/PLT ellenőrzés és módosítás közötti párhuzamosságot a kapcsolódó rendeléssor összehangolt zárolásával kezeljük.

### Példa és a dolgozó felismerése

`R = 40 karton`, `P = 60 karton/raklap`. Anna és Béla is megnyithatja az adatlapot. Anna előbb nyom Mentést és foglalást kap. Béla Mentése 423 hibát kap Anna nevével, akkor is, ha csak 10 kartont kér. Anna véglegesítése vagy visszavonása után a maradék újra komissiózható.

**A szerver az érvényes ideiglenes címkéből tudja, hogy Anna komissióz.** Ehhez a címke tulajdonosát és érvényességét hozzá kell adni a jelenlegi rendszerhez.

## 5. Rögzített fejlesztési hatókör

A tételkiválasztás és az adatbevitel megkezdése engedélyezett. A védelem kizárólag Mentéskor, címkegenerálás előtt dönt a továbbhaladásról; a véglegesítő útvonal megőrzi az ellenőrzéseket. Kiválasztáskori `begin` vagy lock/unlock végpont nem része a fejlesztésnek. A címke érvényességének kezelése a Mentés után létrejött folyamathoz tartozik.

## 6. „Mentés” felirat és APK

| Ellenőrzött helyi példány | Állapot |
|---|---|
| `PDA UI/js/views/commission.js` | „Mentés”; szerkesztendő forrás. |
| `PDA-App/www/js/views/commission.js` | „Mentés”; generált másolat, a web-előkészítés felülírja. |
| `PDA-App/android/app/src/main/assets/public/js/views/commission.js` | „Megadás”; az Androidba másolt példány még régi. |

A `PDA-App/scripts/prepare-web.cjs` a `PDA UI` felületét másolja a `www` könyvtárba. A `copy:android` parancs ezt futtatja, majd `cap copy android` művelettel az Android projektbe másol. A Capacitor `webDir` értéke `www`; nincs távoli felületet betöltő `server.url`. Az API-szerver használata nem jelenti, hogy a képernyők is a szerverről frissülnek.

| Változtatás | Szerver | Adatbázis | Új APK |
|---|---|---|---|
| LOT-ellenőrzés és jóváhagyott folytatás | Igen | Igazolás megőrzése miatt várható | **Igen** |
| A változat minimális Mentéskori konfliktusjelzése | Igen | Igen | Régi kliens a meglévő hibaüzenettel részlegesen kiszolgálható |
| Teljes, ismétlésvédett A változat LOT-tal együtt | Igen | Igen | **Igen**, munkamenet már generáláskor és jóváhagyás továbbítása |
| „Mentés” felirat az eszközön | Nem | Nem | **Igen**, friss Android-másolatból |

A forrásban a kért felirat már helyes. A telepített APK felirata ebből nem állapítható meg. **A teljes fejlesztési csomaghoz új APK készítése és telepítése szükséges.** A terv felülvizsgálatakor APK nem készült.

## 7. Érintett fájlok és sorrend

| Fájl / terület | Tervezett feladat |
|---|---|
| `server/src/routes/pda.js` | LOT API, atomi címkegenerálás, tulajdonos és életciklus, JWT-adatok átadása a közös feldolgozásnak. |
| `server/src/services/lotValidation.js` (új) | Dátumfeloldás, budapesti nap, kor és jóváhagyás. |
| `server/src/services/pickingReservations.js` (új) | Közös foglalási, mennyiségi és tulajdonosi szabályok. |
| `server/src/db/migrations/` (új migráció) | Tulajdonos, munkamenet, lejárat, igazolás és indexek. |
| `server/src/routes/aldi_cross_docking.js` | #/PLT eltérések és az érintett adatok módosításának összhangja a foglalással. |
| `PDA UI/js/views/commission.js` | LOT-mező, szerverellenőrzés, párbeszéd, tartós `pickSessionId`, hibakezelés. |
| `PDA-App` build | Webmásolat, Android-eszközök frissítése, verzióemelés, APK. |
| Szerver- és klienspróbák | Dátumhatárok, valódi adatbázis-párhuzamosság, visszalépés és újrapróbálás. |

1. A rögzített hét/nap LOT-formátum és Mentéskori A változat szerint haladunk; az évválasztást, sor/áruigény hatókört és foglalási időt véglegesítjük.
2. Migráció, közös szolgáltatások és a meglévő ideiglenes címkék átállási szabálya.
3. Szervervégpontok védelme rövid tranzakciókkal.
4. Webes felület módosítása és ellenőrzése.
5. Párhuzamossági és folyamatpróbák tesztadatbázison; Android-másolás, verzióemelés, APK-készítés.
6. Valós PDA-próba, a jobb alsó lila gomb „Mentés” feliratának ellenőrzésével.
7. Éles bevezetés egyeztetett ablakban: aktív komissiózások lezárása, migráció, szerver, APK-k. A régi, tulajdonos nélküli ideiglenes címkék nem válhatnak automatikusan foglalássá; rendezett lezárás vagy visszavonás kell.

## 8. Elfogadási feltételek

### LOT

Rögzített tesztnap: **2026-10-02**, ISO hét: **40**, hét napja: **05**, mai LOT: **4005**. A `> 6` tervezési küszöbbel:

| LOT | Dátum | Kor | Eredmény |
|---|---|---|---|
| `3905` | 2026-09-25 | 7 nap | Figyelmeztetés |
| `3906` | 2026-09-26 | 6 nap | Folytatás figyelmeztetés nélkül |
| `3907` | 2026-09-27 | 5 nap | Folytatás figyelmeztetés nélkül |
| `4005` | 2026-10-02 | 0 nap | Folytatás figyelmeztetés nélkül |
| `4006` | 2026-10-03 | Jövőbeli | Javítás; nem vált csendben előző évi LOT-ra |
| `3626`, `3926` | Nem érvényes | — | Hibás hét-nap érték; javítást kér |

További próbák: üres/rövid/hosszú LOT, kezdő nulla, 00./54. hét, nem létező 53. hét, 00./08./26. nap, évváltás és ISO-hétév, szökőév, óraátállítás, hibás PDA-óra, ellenőrzés utáni napváltás, LOT-módosítás jóváhagyás után, hálózati hiba, visszalépés és tudatos folytatás.

### Komissiós védelem

- Két külön dolgozó pontosan egy raklapnyi sorra egyszerre kér címkét: egy foglalás sikerül; a másik 423 hibát és dolgozói nevet kap.
- Mindkét dolgozó kiválaszthatja a tételt és kitöltheti az adatlapot; az ütközésjelzés kizárólag Mentéskor jelenik meg, a hátralévő kartonok és az egy raklaphoz tartozó kartonszám megadásával.
- Egy raklap alatti maradéknál a második kisebb kért mennyiséggel sem indulhat tovább, amíg az első foglalás aktív.
- Egy raklap felett működik a szabályos párhuzamosság; az elfogadott összmennyiség nem több a maradéknál.
- Küszöbátlépéskor a korábbi jogos folyamatok lezárhatók; új folyamat nem indul a védett maradékra.
- Elavult lista mellett friss szerveradat dönt; hiányzó vagy eltérő #/PLT egyértelmű hibát ad.
- Elveszett generálási válasz ismétlése azonos címkét ad; dupla véglegesítés nem növeli kétszer a kartonszámot.
- Visszalépés, lejárat, új PDA-belépés és szerver-újraindítás után következetes a foglalás.
- Más dolgozó címkéjének törlése/nyomtatása/véglegesítése elutasított; lejárt vagy visszavont, már kinyomtatott SSCC sem használható.
- Mentéskori ütközésnél nincs új címke, komissió vagy készletrekord. Sikertelen véglegesítés teljes rollbacket eredményez.
- A versenyhelyzeteket valódi tesztadatbázison vizsgáljuk; függvénymock nem igazolja a sorzár működését.
- Új APK és emulátor azonos LOT-, konfliktus- és „Mentés” viselkedést mutat.

## 9. Még tisztázandó üzleti döntések

1. Egy PDA-kamionsort, vagy azonos áruigény összes kamiontételét együtt védjük? A korábbi terv alapján az első a tervezési alap.
2. Elfogadható a LOT legközelebbi dátum szerinti évkövetkeztetése? Bizonytalan gyártási évhez teljes dátum szükséges.
3. Megfelel a 30 perces foglalás a valós nyomtatás–lokáció–SSCC folyamatnak? Hosszabb folyamatnál időszakos megújítás kell.

A LOT hét/nap formátuma és a Mentéstől kezdődő védelem a felhasználói pontosítás alapján rögzített. A lejárati küszöb az eredeti „6 napnál régebbi” szabály szerint `> 6` nap.

**Felülvizsgálat eredménye:** a terv javítva és részletezve. Az üzleti funkciók fejlesztése, migráció, APK-készítés és éles telepítés még nem történt meg.
