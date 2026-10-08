# Heti lekötés – a DO-n jelzett 2994 / 0 bontás ellenőrzése

Dátum: 2026-10-07.

## Számítási előírás

A Rendelési terv eredeti napi adatai határozzák meg az akciós és az akción kívüli mennyiséget. Ha a Keresleti adatok heti kartonszáma nagyobb a terv heti előrejelzésénél, csak a különbözet kerül az akciós részhez. Az akción kívüli eredeti alap megmarad. Az akciós napok az eredeti időszakot követik; a naplista és a kézi mennyiségek a szerkesztőben változtathatók. A napi elosztás a Beállítások százalékait használja.

Példa: 1706 terv, 1568 akciós alap, 138 akción kívüli alap, 2687 kereslet → 981 többlet → **2549 akciós + 138 akción kívüli = 2687**.

## Tényleges DO-adatok

A projekt Deployment Útmutatójában megadott szerver olvasási célú ellenőrzése történt: `http://138.68.143.223:3001`. A `GET /api/v1/aldi-weekly-commitments/2026/41` válaszában a jelzett értékpár egy konkrét terméknél reprodukálható:

- KW41, cikkszám **751005**, **Petrezselyem 10*200g**.
- Akciós időszak: **10.10.–11.10.**
- Rendelési terv heti előrejelzés: **2321**.
- Tárolt napi terv: csütörtök 0, péntek 0, szombat **1382**, vasárnap **939**, hétfő 0, kedd 0, szerda 0.
- Keresleti adatok: **2994**.
- Mindkét kézi mennyiség és a kézi naplista: `null`.
- Az API `daily_data_restored` értéke 0, a `warnings` lista üres.

Ebből a jelenlegi modell **2321 + (2994 − 2321) = 2994** akciós és **2321 − (1382 + 939) = 0** akción kívüli mennyiséget számol. A nulla ebben az esetben már az API által visszaadott napi tervben szerepel; nem hiányzó `daily_values`, nem kézi felülírás és nem a mező felirata okozza.

A DO-ról visszaadott további tényleges adatokkal ugyanaz a modell:

| Hét | Cikkszám | Akciós | Akción kívüli | Heti összes |
| --- | --- | ---: | ---: | ---: |
| KW36 | 530766 | 2459 | 227 | 2686 |
| KW39 | 329966 | 1228 | 273 | 1501 |
| KW39 | 329758 | 2551 | 136 | 2687 |
| KW40 | 782815 | 1435 | 0 | 1435 |
| KW40 | 530766 | 2716 | 0 | 2716 |
| KW41 | 751005 | 2994 | 0 | 2994 |

A korábbi, hiányzó napi adatokkal készült **2686 / 2458 / 2994** reprodukciós példa nem ennek a KW41 terméknek az eredeti Excel-adata. Nem használható a konkrét DO-s sor helyes részösszegeinek megállapítására.

## A feltöltött eredeti Excel ellenőrzése

A felhasználó később feltöltötte a projektmappába a **Rendelési terv KW41.xlsx** és **Keresleti adatok KW41.xlsx** fájlokat, és jelezte, hogy hiányoznak az adatok az Excelből. Mindkét fájl ellenőrzése megtörtént.

A Rendelési terv `751005` sorának előrejelzése **2321**. A napi oszlopok dátumai **2026-10-08–2026-10-14**. Október 10-én **1382**, október 11-én **939** karton szerepel; a másik öt napi cella **üres**, nem tartalmaz akción kívüli mennyiséget. A Keresleti adatok ugyanennél a cikkszámnál **2994** kartont tartalmaz. Ezek az értékek egyeznek a DO API adataival: az import az üres napi cellákat nullaként tárolta.

**A konkrét 2994 / 0 eset oka igazolt: az akción kívüli alapadatok a forrás Excelből hiányoznak.** A keresleti többlet **2994 − 2321 = 673**, ezért a megállapodott szabály szerint az akciós rész **2321 + 673 = 2994**, az akción kívüli rész **0**. Az újrafeldolgozás ugyanebből a hiányos forrásból nem tud akción kívüli mennyiséget előállítani. Ennek a sornak a helyreállításához a forrás napi adatait kell kiegészíteni, majd a javított tervet feldolgozni, vagy a két mennyiséget a meglévő szerkesztőben kézzel megadni. A számítási szabály megváltoztatása nem szükséges.

A korábbi hiányzó napi adatos reprodukció és a más időszakot tartalmazó helyi mintafájl nem ennek a konkrét esetnek az oka. Az eredeti KW41 Excel ellenőrzése ezzel lezárult.

Az ellenőrzés során a DO adatbázisa nem változott, nem történt újrafeldolgozás, feltöltés vagy telepítés. A számítási kódot nem módosítottuk ismeretlen akción kívüli mennyiség alapján.

A kapcsolódó számítási és API-ellenőrzések ismételt futtatása: `node --test tests/weeklyPromotionSplit.test.js tests/weeklyCommitmentEditingApi.test.js` → **16 sikeres, 0 hibás teszt**. Ezek az elvárt üzleti szabályt, az importot, az újrafeldolgozást és a kézi adatok megőrzését ellenőrzik szimulált forrásokkal; a konkrét KW41 Excel tartalmát nem igazolják.
