# ALDI Napi rendelés – DO feltöltési hiba vizsgálata

Dátum: 2026-10-12.

## Eredmény

A hivatkozott `newLine` hiba igazolt, de a DO szerveren tapasztalt feltöltési hiba pontos üzenete és HTTP-státusza nem áll rendelkezésre. Ezért a kettő azonosságát nem igazoltuk.

Az ellenőrzés kezdetekor már két módosított fájl volt a munkapéldányban:

- `server/src/routes/aldi_daily_orders.js`: a sorbeszúrás eredményét `const [newLine]` változóba menti.
- `Access UI/src/modules/aldi_rendelesek.js`: nem JSON válasznál HTTP-státuszt tartalmazó hibaüzenetet készít.

Ezeket a meglévő módosításokat nem írtuk felül, nem commitoltuk és nem telepítettük.

## A newLine hiba

A `git show 22c20d4 -- server/src/routes/aldi_daily_orders.js` igazolja, hogy ez a commit vezette be a `newLine.id` hivatkozást anélkül, hogy a beszúrt sor eredményét változóba mentette volna.

A hibás ág akkor fut le, amikor az előző rendelésverzióban az aktuális GTIN-hez található korábbi tételsor. Tehát nem pusztán az előző rendelés megléte a pontos feltétel: közös korábbi tételnek is kell lennie. A szerver a ReferenceError-t elkapja és JSON tartalmú HTTP 500 választ ad. A tranzakció valós adatbázis használatánál sikertelenül zárul.

Az első új rendelés nem fut bele ebbe a hivatkozásba. A `const [newLine] = await ...insert(...).returning('*')` módosítás ezt a konkrét hibát kijavítja.

## Elkülönített futtatás

A `scratch/check-daily-order-upload-20261012.cjs` a teljes útvonalfájlt futtatja VM-ben, helyettesített adatbázissal, PDF szövegkinyeréssel és fájlrendszerrel. A PDF tételparser a valódi modulból származik. A fájlmentés minden esetben szándékosan hibát dob.

| Változat és eset | Eredmény |
| --- | --- |
| HEAD, új rendelés, sikertelen fájlmentés | HTTP 200 |
| HEAD, meglévő rendelés közös tételének módosítása, sikertelen fájlmentés | HTTP 500; napló: `newLine is not defined` |
| Helyi javítás, meglévő rendelés közös tételének módosítása, sikertelen fájlmentés | HTTP 200; teljesített mennyiség megőrzése és kamionsor új tételre kapcsolása ellenőrizve |

Ez a JavaScript ág működését ellenőrzi; nem PostgreSQL integrációs teszt és nem DO próbafeltöltés. Éles adatokat és külső fájlokat nem módosít.

További ellenőrzések: a backend és frontend szintaxisellenőrzése sikeres; `server/tests/aldiOrderPdfActions.test.js`: 3 teszt sikeres.

## A hálózati fájlmentésről szóló állítás pontosítása

A feltöltési végpont a könyvtárlétrehozás és a fájlírás hibáit naplózza, majd folytatja az adatbázis-feldolgozást. Ezért egy ilyen fájlmentési hiba önmagában ebben a kódban nem okoz HTTP 500 választ.

A PostgreSQL-be a feldolgozott rendelésadatok, hash értékek, fájlnév és könyvtárútvonal kerülnek. **Az eredeti PDF tartalma nem kerül az adatbázisba.** Ha a lemezre mentés sikertelen, a rendelés táblázata megjelenhet, miközben a PDF megnyitása `404 / A fájl nem található a hálózaton` választ ad.

A repository `docker-compose.prod.yml` fájlja `/mnt/raktar:/mnt/raktar` kötetcsatolást ír elő. A Linux útvonal megléte és a valódi hálózati megosztás elérhetősége két külön kérdés. A DO futó konfigurációját nem ellenőriztük, így az az állítás, hogy ott az útvonal nem létezik, nem tekinthető bizonyítottnak. Egy üres helyi könyvtárba történő mentés sem igazolja a Windows hálózati megosztásra mentést.

## Frontend és proxy

A backend JSON 500 válaszát a frontend normál esetben `Hiba: Szerverhiba a PDF feldolgozása közben` üzenetként jeleníti meg. A fetch nem pusztán a HTTP 500 miatt kerül a catch ágba.

A korábbi `res.json()` viszont elbukott, ha például a proxy HTML hibaválaszt adott. Ekkor a catch általános feltöltési hibát jelzett. A munkapéldányban lévő frontend-módosítás a nem JSON válasz HTTP-státuszát megmutatja. Ez diagnosztikai javítás: egy proxy- vagy kapcsolati hibát nem old meg.

Ha JSON 500 a válasz, a szerver feldolgozási naplóját kell ellenőrizni. Ha például 502/504, a proxy és API elérhetőségét; 413 esetén a ténylegesen futó proxy feltöltési méretkorlátját. A helyi `nginx.conf` 50M korlátot tartalmaz, de a DO további proxyjának beállításait nem ismerjük. Ha egyáltalán nincs HTTP válasz, a böngésző hálózati hibáját kell vizsgálni.

## A DO hiba eldöntéséhez szükséges bizonyíték

- A feltöltésnél megjelenő pontos hibaüzenet és a POST `/api/v1/aldi-daily-orders/upload` válaszának HTTP-státusza.
- Új rendelésnél is előfordul-e, vagy csak korábbi rendelés módosításánál.
- A feltöltés időpontjához tartozó API/proxy napló és a DO-n futó kódverzió.

A helyi javítás csak telepítés után változtatja meg az éles rendszer működését. A DO hibájának lezárásához sikeres próbafeltöltés és a PDF visszanyitásának ellenőrzése szükséges.

## Kiegészítés: a felhasználó által megadott PDF-ek

A munkamappában három kapcsolódó nevű PDF található. A ténylegesen azonos rendelési számú pár:

- `rendelés feltöltési hiba 1.pdf`: PURCHASE ORDER; rendelési szám 4532724690; szállítási dátum 2026-10-12; 12 terméksor, összesen 934 karton.
- `feltöltési hiba 2.pdf`: PURCHASE ORDER CHANGE; ugyanaz a rendelési szám és dátum; ugyanaz a 12 GTIN, összesen 962 karton.

A `feltöltési hiba 1.pdf` külön, korábbi rendelést tartalmaz (4532035157, 2026-09-09), ezért nem ez az azonos számú pár első dokumentuma.

| Tétel | GTIN | Első PDF | Módosított PDF | Eltérés |
| --- | --- | --- | --- | --- |
| 00040 | 4061462846892 | 20 karton | 40 karton | +20 |
| 00090 | 4069365093832 | 44 karton | 52 karton | +8 |

A módosított PDF mindkét sorhoz `3 - Changed` jelölést tartalmaz. A többi tíz tétel mennyisége változatlan; ebben a párban tételtörlés nincs. A két tartalmi hash eltér, ezért a második nem azonos tartalmú duplikátumként utasítandó el.

A reprodukciós programot kiegészítettük: az első PDF-et a valódi `pdf-parse` és tételparser segítségével feldolgozza, az abból kapott sorokat előző rendelési állapotként adja az elkülönített adatbázisnak, majd a második PDF eredeti bájtjait a tényleges feltöltési handlernek adja. Ekkor a PDF szövegkinyerése is a valódi modulon keresztül fut.

- Javítás előtti HEAD: HTTP 500; napló: `newLine is not defined`.
- Helyi javított kód: HTTP 200; második verzió, 12 tétel, 962 karton; két mennyiségváltozás (+20 és +8), a korábbi teljesítési adat megőrzésével.

A felhasználó által megadott dokumentumokkal tehát a konkrét JavaScript hiba reprodukálható, a helyi javítás pedig ezen az eseten ellenőrzött. Az adatbázis és fájlrendszer továbbra is helyettesített a próbában; DO napló vagy éles próbafeltöltés nélkül nem állítjuk, hogy az éles hibának nem lehet további oka.
