# ALDI tételáthelyezés és rendelésverzió-kezelés – fejlesztési terv

## 1. Cél és hatókör

A fejlesztés két, egymással összefüggő területet rendez:

1. Az ALDI Rakodás modulban a tételek biztonságos mozgatása kamionok, az Áruigény és a Napi rendelések között.
2. Az azonos ALDI rendelés egymást követő PDF-verzióinak megőrzése, az aktuális verzió kijelölése, a verziók közötti mennyiségi eltérések megjelenítése és a korábbi verziókon elindított rakodási folyamat továbbvitele.

A meglévő Excel-export tartalma és formátuma nem változik. Verziókülönbségre szolgáló technikai mezők nem kerülnek az exportba.

## 2. Kötelező üzleti szabályok

### 2.1. Mennyiségi invariáns

Egy logikai rendelési tételnél minden művelet után teljesülnie kell:

```text
0 <= loaded_cartons <= sent_cartons <= current_ordered_cartons
```

Kivétel az új rendelésverzió által előidézett csökkentés: ha az új rendelt mennyiség kisebb a már Rakodásra küldött vagy kamionra tett mennyiségnél, a rendszer nem töröl és nem csökkent automatikusan fizikai árumennyiséget. A tételt piros eltérésjelzéssel, rendezendő állapotban kell megjeleníteni.

### 2.2. Fogalmak

- `current_ordered_cartons`: a legfrissebb, érvényes rendelésverzió mennyisége.
- `sent_cartons`: a Rakodásra átadott teljes mennyiség, verziótól függetlenül.
- `loaded_cartons`: az ALDI kamionokra kiosztott mennyiség összege.
- `available_cartons = sent_cartons - loaded_cartons`: az Áruigényben szabadon kiosztható mennyiség.
- Minden kartonmennyiség nemnegatív. A kamionok közötti áthelyezés mértékegysége kizárólag EU raklap.

## 3. Stabil, verziókon átívelő adatmodell

Az aktuális rakodási állapotot nem szabad egy konkrét PDF-verzió tételsorához kötni, mert az új verzió érkezésekor a korábbi verzió érvénytelenné válik, miközben a már átadott vagy kamionon lévő áru megmarad.

### 3.1. Rendeléscsalád

Új `aldi_order_families` tábla:

- `id`
- `base_order_number` – az ALDI eredeti Purchase Order Number értéke, suffix nélkül
- `current_order_id` – az aktuális verzió
- `created_at`, `updated_at`
- egyedi kulcs: `base_order_number`

Az `aldi_daily_orders` új mezői:

- `order_family_id` – FK az `aldi_order_families` táblára
- `version_number` – egész szám, adatbázisban tárolva
- `version_status` – `current` vagy `superseded`
- `superseded_by_order_id` – nullable FK
- `superseded_at` – nullable timestamp

A verziószámot és az aktuális státuszt többé nem fájlnév-suffixből és lekérdezési sorrendből kell dinamikusan előállítani.

### 3.2. Logikai tételállapot

Új `aldi_order_item_states` tábla, amely a verziókon átívelő rakodási állapotot tárolja:

- `id`
- `order_family_id`
- `gtin`
- `sent_cartons`
- `requires_reconciliation` – igaz, ha az új verzió mennyisége kisebb a már mozgatott mennyiségnél
- `reconciliation_reason`
- `created_at`, `updated_at`
- egyedi kulcs: `order_family_id + gtin`

Az `aldi_daily_order_lines` új mezői:

- `order_item_state_id` – FK a stabil logikai tételállapotra
- `previous_ordered_cartons`
- `quantity_delta`
- `change_type` – `unchanged`, `added`, `increased`, `decreased`, `removed`

Az `aldi_truck_lines` kapjon `order_item_state_id` FK-t. A régi `aldi_daily_order_line_id` átmenetileg audit- és kompatibilitási célból megtartható, de az elérhető/rakodott mennyiségek számításának elsődleges kapcsolata az új stabil állapot legyen.

### 3.3. Tételazonosítás verziók között

Elsődleges megfeleltetés: `order_family_id + GTIN`.

Ha ugyanaz a GTIN egy PDF-en belül több sorban szerepel, a verzió-összehasonlítás előtt GTIN szerint összegezni kell. Ha később szükség lesz a PDF eredeti sorszintjének megőrzésére, külön `source_line_number` mező vezetendő be.

Ismeretlen vagy hiányzó GTIN esetén automatikus megfeleltetés nem történhet; a feltöltés hibával álljon meg vagy kerüljön kézi felülvizsgálati listába.

## 4. Rendelésverzió feltöltési folyamat

Az új PDF feldolgozása, a fájl mentése és az adatbázis-változások összehangolt folyamatban történjen.

1. Purchase Order Number kinyerése és a rendeléscsalád zárolása.
2. A következő `version_number` meghatározása tranzakcióban.
3. A PDF tételsorainak GTIN szerinti normalizálása és összegzése.
4. Az előző aktuális verzió és az új verzió összehasonlítása.
5. Az új verzió és tételsorok létrehozása.
6. A korábbi aktuális verzió `superseded` státuszra állítása.
7. A rendeléscsalád `current_order_id` mezőjének frissítése.
8. A logikai tételállapotok változatlanul tovább élnek, ezért a korábbi verzión Rakodásra küldött és kamionon lévő mennyiség az új verzióban is látható.

Ugyanazon fájl vagy verzió véletlen ismételt feltöltésének elkerülésére fájl-hash vagy más idempotenciakulcs tárolása javasolt.

## 5. Verziókülönbségek számítása

GTIN-enként:

```text
delta = new_ordered_cartons - previous_ordered_cartons
```

Állapotok:

- új GTIN, pozitív mennyiség: `added`
- pozitív delta: `increased`
- negatív delta, de az új mennyiség nagyobb nullánál: `decreased`
- a korábbi GTIN hiányzik az új verzióból: `removed`, megjelenített új értéke 0
- nulla delta: `unchanged`

Ha `new_ordered_cartons < sent_cartons` vagy `new_ordered_cartons < loaded_cartons`:

- tilos automatikusan törölni vagy csökkenteni kamionos/Áruigény-mennyiséget;
- `requires_reconciliation = true`;
- a tétel piros figyelmeztetést kap;
- újabb mennyiség nem küldhető Rakodásra;
- a felhasználónak előbb vissza kell vennie a többletet a kamionról, illetve az Áruigényből.

## 6. Jogosultságok verzióállapot szerint

### Aktuális verzió

- tételszintű és teljes rendelés küldhető Rakodásra;
- exportálható;
- a rakodási állapot és a verziókülönbségek láthatók.

### Elévült verzió

- megmarad a Napi rendelések táblában;
- sorai szürkített megjelenést kapnak;
- sem tétel, sem teljes rendelés nem küldhető belőle;
- nem exportálható;
- csak megtekinthető, illetve a hozzá tartozó eredeti PDF megnyitható;
- minden tiltást a backend is ellenőriz, nem csak a frontend.

## 7. Napi rendelések – UI változtatások

### 7.1. Rendeléslista

- Jól látható `VERSION N` és `Aktuális`/`Elévült` jelölés.
- Az elévült rendelés sora szürke.
- Elévült verzión az exportgomb és a Rakodásra küldési műveletek tiltottak.

### 7.2. „Rendelés megtekintése” modal

- A `Módosítás` gomb felirata `Küldés` legyen.
- A böngésző `prompt()` helyett saját, kisméretű modal kérje be az áthelyezendő kartonmennyiséget.
- Szöveg: „Add meg az áthelyezni kívánt kartonmennyiséget.”
- A megadott érték növekmény, de a frontend a szervernek idempotens célértéket küld: `target_sent_cartons = jelenlegi sent_cartons + megadott mennyiség`.
- A modal mutassa a rendelt, már Rakodásra küldött, kamionon lévő és még küldhető mennyiséget.
- Elévült verzión a Küldés gomb és a teljes rendelés küldése nem jelenik meg vagy inaktív, magyarázó tooltip mellett.

Új „Változás” oszlop:

- `added`/`increased`: `+X`, zöld kiemelés;
- `decreased`: `-X`, sárga kiemelés;
- `removed`: új érték 0, piros kiemelés;
- `unchanged`: üres vagy semleges jelzés;
- rendezendő, már mozgatott többlet: külön piros figyelmeztető ikon és tooltip a Rakodáson/kamionon lévő mennyiségekkel.

## 8. ALDI Rakodás – Áruigény

Az Áruigény API minden sornál adja vissza:

- `ordered_cartons`
- `sent_cartons`
- `loaded_cartons`
- `available_cartons`
- `requires_reconciliation`
- az aktuális rendelés verziószámát

A KARTON oszlop az `available_cartons` értéket mutatja.

### Tétel visszaküldése a Napi rendelésekhez

- Az Áruigény kuka/visszavétel ikonja külön megerősítő vagy mennyiségbekérő ablak nélkül az adott sor teljes szabad mennyiségét visszaveszi.
- Tranzakcióban: `sent_cartons = loaded_cartons`.
- A kamionon lévő mennyiség változatlan marad.
- Siker után az Áruigény lista és a Napi rendelések állapota frissül.
- Hiba esetén a backend magyar hibaüzenete jelenjen meg, és a UI állapota töltődjön újra.

## 9. ALDI kamion szerkesztése

### 9.1. Bal oldali műveleti oszlop

A FUVAROK → Rakodás → Kamion szerkesztése mintáját követve minden kamionsor bal oldalán legyen:

- fel/le mozgatás vagy drag handle a sorrend változtatásához;
- áthelyezés ikon;
- szükség esetén eltávolítás ikon.

Az `aldi_truck_lines` kapjon `row_order` mezőt és külön tranzakciós sorrendmentő végpontot.

### 9.2. Áthelyezési modal

Az áthelyezés ikon saját modalt nyit „Tétel áthelyezése” címmel. Célok:

1. másik, még nem lezárt ALDI kamion;
2. Áruigény;
3. Napi rendelések.

A mozgatandó mennyiség mértékegysége kizárólag EU raklap. A modal mutassa:

- forráskamion és termék;
- rendelkezésre álló EU raklap;
- cél típusa és – kamion esetén – a célkamion;
- áthelyezendő EU raklap.

Kartonra váltás:

```text
move_cartons = move_eu_pallets * cartons_per_pallet
```

Áthelyezés csak érvényes, pozitív mennyiséggel történhet, és nem haladhatja meg a forrássor mennyiségét. Hiányzó vagy nulla `cartons_per_pallet` esetén az áthelyezés tiltott, érthető hibaüzenettel.

### 9.3. Célonkénti tranzakciós működés

#### Másik kamion

- Forrás- és célkamion zárolása növekvő ID-sorrendben.
- A stabil logikai tételállapot zárolása.
- A forrássor csökkentése/törlése.
- A célsor növelése vagy létrehozása.
- `sent_cartons` nem változik.
- A teljes `loaded_cartons` nem változik.

#### Áruigény

- A forrás kamionsor csökkentése/törlése.
- `sent_cartons` nem változik.
- `loaded_cartons` csökken, ezért `available_cartons` ugyanennyivel nő.

#### Napi rendelések

- A forrás kamionsor csökkentése/törlése.
- Ugyanabban a tranzakcióban `sent_cartons` is csökken az áthelyezett kartonmennyiséggel.
- A művelet után is teljesülnie kell: `loaded_cartons <= sent_cartons`.
- Az áru nem jelenik meg az Áruigényben, hanem visszakerül a még Rakodásra küldhető mennyiségbe.

Lezárt/rakodott vagy PDA-nak véglegesen átadott kamionból történő mozgatás üzleti döntésig tiltott.

## 10. API-terv

### Rendelésverziók

- `POST /api/v1/aldi-daily-orders/upload` – verzió létrehozása és diff számítása tranzakcióban.
- `GET /api/v1/aldi-daily-orders` – verzióstátusz és aktuális verzió visszaadása.
- `GET /api/v1/aldi-daily-orders/:id/lines` – diff- és stabil rakodási állapotok visszaadása.
- `GET /api/v1/aldi-daily-orders/:id/export` – csak aktuális verzión engedélyezett; exportformátum változatlan.

### Mozgatás

- `PATCH /api/v1/aldi-daily-orders/lines/:lineId/send-cartons` – csak aktuális verzióhoz tartozó logikai tételnél.
- `PATCH /api/v1/aldi-order-items/:itemStateId/return-available` – teljes szabad Áruigény visszavétele a Napi rendelésekhez.
- `POST /api/v1/aldi-cross-docking/truck-lines/:lineId/transfer` – másik kamion, Áruigény vagy Napi rendelések célra.
- `PUT /api/v1/aldi-cross-docking/trucks/:truckId/lines/reorder` – sorrend mentése.

Minden mennyiségi végpont tranzakciót, `FOR UPDATE` zárolást, pozitív/egész karton- és raklapvalidációt, valamint egységes lock ordert használjon. A backend ne fogadjon el tetszőleges mezőket a request bodyból.

## 11. Rendelés és PDF törlése

- Rendelés csak akkor törölhető, ha a rendeléscsalád adott verziójának törlése nem szakítja meg a verzióláncot, és egyetlen érintett logikai tételből sincs kamionon mennyiség.
- Aktuális verzió törlésének hatása külön kezelendő: vagy az előző verzió válik újra aktuálissá, vagy a teljes rendeléscsalád törlendő. Ezt implementáció előtt üzletileg rögzíteni kell.
- Sikeres adatbázis-törlés után törlődik az adott verzió PDF-je.
- PDF-törlési hiba esetén a backend warningot ad vissza, amelyet a frontend megjelenít.
- A rendelési sorok törlésével az érintett, már nem szükséges Áruigény automatikusan eltűnik; kamionon lévő tételnél a törlés 409 Conflict választ ad.

## 12. Migráció és meglévő adatok

Az éles migráció előtt kötelező dry-run audit:

- alap rendelési számok és jelenlegi dinamikus verziók listája;
- azonos rendelésen belüli GTIN-duplikációk;
- hiányzó GTIN-ek;
- `loaded_cartons > ordered_cartons` eltérések;
- `sent_to_rakodas = false`, de kamionon lévő tételek;
- árva kamionsorok;
- verziók közötti tételkülönbségek.

Backfill:

1. rendeléscsaládok létrehozása;
2. verziószámok rögzítése a jelenlegi feltöltési sorrend alapján;
3. aktuális verzió kijelölése;
4. stabil tételállapotok létrehozása GTIN szerint;
5. meglévő `sent_cartons` és kamionsorok összekapcsolása;
6. verziókülönbségek kiszámítása;
7. inkonzisztens rekordok listázása és a migráció megszakítása csendes adatjavítás helyett.

Futtatási sorrend éles környezetben:

1. teljes PostgreSQL-backup;
2. dry-run audit és riport mentése;
3. migráció staging/másolati adatbázison;
4. automatikus és kézi ellenőrzés;
5. rövid karbantartási ablak;
6. éles migráció;
7. API újraépítése és UI frissítése;
8. migráció utáni invariáns-audit.

## 13. Tesztelési terv

### Automatizált integrációs tesztek

- részleges és teljes küldés az aktuális verzióból;
- elévült verzió küldésének és exportjának backendoldali tiltása;
- VERSION 1 → VERSION 2 → VERSION 3 státuszváltás;
- added/increased/decreased/removed/unchanged diff;
- korábbi verzión kiküldött mennyiség megjelenése az aktuális verzióban;
- mennyiségcsökkentés Rakodáson és kamionon lévő tételnél;
- Áruigény teljes szabad mennyiségének visszavétele modal nélkül;
- részleges és teljes kamionsor áthelyezése másik kamionra;
- kamionról Áruigénybe, illetve közvetlenül Napi rendelésekhez mozgatás;
- EU raklap–karton konverzió;
- hiányzó `cartons_per_pallet`, nulla, negatív és túl nagy mennyiség elutasítása;
- párhuzamos mozgatási kérések és deadlockmentes lock order;
- sorrendmentés;
- rendelés/PDF törlésének tiltása kamionon lévő mennyiségnél;
- export regressziós teszt: tartalom és oszlopok változatlanok.

### Manuális UI-ellenőrzés

- műveleti ikonok és sorrendezés a FUVAROK modul mintájához igazodik;
- saját mennyiségbekérő modal, böngésző-prompt nélkül;
- aktuális/elévült verziók megfelelő színezése;
- változásoszlop zöld/sárga/piros jelzése;
- piros konfliktusjelzés csökkentett vagy törölt, de már mozgatott tételnél;
- Áruigény és kamionlisták azonnali frissülése;
- magyar és konkrét backend-hibaüzenetek megjelenése.

## 14. Döntési pontok implementáció előtt

1. Az azonos rendeléscsaládot kizárólag a Purchase Order Number azonosítja-e, vagy a szállítási dátum is része az azonosságnak?
2. Ha ugyanaz a GTIN többször szerepel egy PDF-ben, megfelelő-e az összevont GTIN-szintű kezelés?
3. Aktuális rendelésverzió törlésekor az előző verzió váljon újra aktuálissá, vagy a teljes rendeléscsalád törlődjön?
4. Lezárt, rakodott vagy PDA-nak átadott kamionból minden áthelyezés tiltott legyen-e?
5. A `+` változásjelzésnél a kérésben szereplő „zölddel kihúzva” zöld kiemelést vagy tényleges áthúzott szöveget jelent?

Ezeket a döntéseket a séma és az API véglegesítése előtt rögzíteni kell, mert későbbi módosításuk adatmodell-változást okozhat.
