# ALDI Napi rendelés – módosított rendelés feltöltése és a Rakodva szabályok

Dátum: 2026-10-13

## Mi történt

A DO szerveren a Napi rendelések modulban egy már feltöltött rendelés módosított PDF-jének feltöltése
„❌ Hiba: Szerverhiba a PDF feldolgozása közben." üzenettel leállt. Az első (új) rendelés feltöltése
működött, a második, azonos rendelési számú, eltérő tételű PDF nem.

## Ok

A `22c20d4` commitban (V0.9.8, 2026-10-07) a `server/src/routes/aldi_daily_orders.js` kapott egy
`if (oldLine)` ágat. Ez az új verzió soraira átmásolja a korábbi verzió `fulfilled_cartons`
(teljesített / Rakodva) mennyiségét, és átköti az `aldi_truck_lines` hivatkozásait az új sorra.
Az ág a `newLine.id`-t használta, de a sor beszúrásának eredménye sehol nem lett változóba mentve:

```js
await trx('aldi_daily_order_lines').insert({...}).returning('*');   // newLine nincs
```

Új rendelésnél (nincs korábbi verzió) az ág nem fut le, ezért ott nem látszott. Módosított rendelésnél
`ReferenceError: newLine is not defined` jött, a tranzakció visszagördült, a felület a fenti
általános szerverhibát mutatta.

## Javítás

- `9c5c83f`: `const [newLine] = await trx('aldi_daily_order_lines').insert({...}).returning('*');`
- A feltöltő felület ([aldi_rendelesek.js](../Access%20UI/src/modules/aldi_rendelesek.js)) a nem JSON
  szerverválaszt (pl. proxy 502/413) már nem „hálózati hibaként" jelzi, hanem a HTTP státuszt írja ki.

## Új szabályok a Rakodva státuszra

A felhasználó döntése alapján:

1. **A Rakodva nem vonható vissza.** A `PUT /api/v1/aldi-cross-docking/trucks/:id` 409-et ad
   (`LOADED_LOCKED`), ha egy már rakodva kamionra `is_loaded=false` érkezik. A Rakodás felület
   a rakodva kamiont eddig is elrejtette; a „nem 100% – biztosan rakodva?" megerősítés is megmaradt.
2. **Módosított rendelés, ha a tétel már rakodva van:**
   - **Csökkentés vagy „2-Deleted" a rakodva mennyiség alá:** a feltöltés elutasítva
     (409, `LOADED_REDUCTION`), semmi nem kerül rögzítésre (nincs új verzió, a kamionsor megmarad).
     A hibaüzenet tételenként kiírja a rakodva és a kért mennyiséget.
   - **Növekedés:** a feltöltés sikeres, a válasz `loadedWarnings` mezője és a felület figyelmeztet,
     hogy a többlet csak másik kamionra vehető fel.
   - A rakodva mennyiség = max(a korábbi sor `fulfilled_cartons`, a rakodva kamionok soraiban
     lévő `ordered_cartons` összege az adott tételre).

## Teszt

`server/tests/aldiOrderVersionUpload.test.js` – eldobható PostgreSQL sémán fut (az éles táblák
szerkezetének klónjával), csak akkor, ha be van állítva az `ALDI_TEST_DATABASE_URL`:

```powershell
$env:ALDI_TEST_DATABASE_URL='postgresql://…/gava_erp'
node --test tests/aldiOrderVersionUpload.test.js
```

Lefedi: új verzió + módosítás típusok (increased / decreased / removed / added), a teljesített
mennyiség és a kamionsor-hivatkozás átvitele, a Rakodva zárolása, a csökkentés és törlés
elutasítását, a növekedési figyelmeztetést és az azonos tartalom (409) elutasítását.
A javítás nélküli kóddal a teszt `500 !== 200` hibával bukott, tehát a hibát valóban megfogja.

## Nyitott pontok

- A DO szerveren a javítás csak deploy (git pull + újraindítás) után él.
- A felületen az elutasítás üzenete a meglévő „❌ Hiba:" ablakban, többsoros szövegként jelenik meg;
  ezt kézzel még nem próbáltuk ki.
- Az éles teszt a lokális adatbázison futott; a DO adatbázison nem.
