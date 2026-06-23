# Fejlesztési Napló – V0.3.8 – 2026-06-23

## Összefoglalás
Ezen fejlesztési ciklusban a **Rakodás (Áru igény)** modul felületét és backendjét finomítottuk a felhasználói visszajelzések alapján. Bevezetésre került az Áru igények közvetlen módosításának és mentésének lehetősége a felületen egy új szerkesztő modal és PUT API segítségével, javítottuk a raklapszámok léptetését, tisztáztuk a partner-referencia elnevezést, valamint elhárítottunk néhány Linux-kompatibilitási útvonal-hibát a DigitalOcean (DO) éles környezetben.

---

## Változtatások

### 1. Áru Igény Szerkesztése (Edit Cargo Demand)
- **UI:** A Rakodás modulban az **Áru igény** táblázat soraiba bekerült egy **Szerkesztés (ceruza)** ikon.
- **Modal:** A Szerkesztés gombra kattintva megnyílik az "Áru igény szerkesztése" felugró ablak, amely az adott tétel meglévő adataival előre ki van töltve. A mentés gomb ekkor nem új rekordot hoz létre, hanem frissíti a meglévőt.
- **Backend API:** Létrejött a `PUT /api/v1/cargo-demands/:id` végpont, amely fogadja az összes szerkeszthető mezőt, ellenőrzi az adatokat (pl. terméknév megléte, legalább 1 raklap típus), frissíti a rekordot az adatbázisban, majd visszaadja a frissített objektumot.

### 2. UI léptetések és elnevezések finomítása
- **Raklapszám spinner léptetés:** Az "Áru igény hozzáadása / szerkesztése" modalokban az **N° Euro Palets:** és **N° Normal Palets:** mezőknél a fel/le nyilakkal történő léptetést egész számokra állítottuk be (1-esével ugrik), de gépeléssel továbbra is megengedett a tizedes értékek megadása (pl. `1.5` raklap). Ezt a `step="any"` paraméter beállításával értük el.
- **Reference placeholder:** Az Áru igény ablakban a "Reference:" mező placeholder szövege "Albarán N°"-ról **"Partner"**-re változott, mert ez a mező tárolja valójában a partner nevét (`albaran_number` oszlop).

### 3. Fájlelérési utak és kompatibilitási javítások (DO / Linux)
- **`resolveFilePath` definíciós hiba:** Javítottunk egy `ReferenceError: resolveFilePath is not defined` hibát a `transport_orders.js` fájlban, ami a fuvarmegbízások előnézete és letöltése során lépett fel.
- **Linux kompatibilitás:** A hálózati elérési utak (UNC, pl. `\\192.168.1.5\raktar`) Linux-alapú Docker környezetben (DigitalOcean szerver) történő feloldását a fallback útvonalakra is kiterjesztettük a `resolveFilePath` segítségével.

### 4. Adatbázis import szkriptek
- Elkészült a dokumentumok adatainak dump-ja (`server/data/docs_dump.json`) és az ehhez kapcsolódó import szkript (`server/import_docs_from_json.js`), amely dinamikusan kezeli a PostgreSQL adatbázisba való betöltést, megakadályozva az idegen kulcs (foreign key) megsértéseket a DigitalOcean szerveren.

### 5. Rakodás (Áru igény) szűrők és elrendezés igazítása
- **Destination oszlop:** Az Áru igény táblázat kibővült a **Destination (Célállomás)** oszloppal.
- **Kereső szűrők:** A táblázatok felett elhelyezésre került három szűrő vezérlő az Áru igények kereséséhez:
  - **Destination** (célállomásra való szűrés)
  - **Partner** (a partner reference kódra/nevére való szűrés)
  - **Customer** (vevő nevére való szűrés)
  - Valamint egy "Szűrők törlése" gomb.
- **Egyforma széles táblázatok (Layout):** A két fő táblázat ("Rakodások" és "Áru igény") egyforma szélességet kapott (`flex:1`), és a betűméreteket finomítottuk, hogy a Destination oszlop bevezetése ellenére se csússzanak szét a táblázatok.

### 6. Transportistas (Fuvarozók) modul finomítása
- **Padding csökkentése:** Csökkentettük a padding-ot és a távolságot a vezérlők és a táblázat között, növelve az információ-sűrűséget.
- **Felirat javítása:** Eltávolítottuk a zavaró `"frmTransportistas_Sub – "` prefixet a "Szállítmányok listája" elől.

---

## Érintett fájlok

| Fájl | Módosítás típusa | Leírás |
|------|-----------------|--------|
| `Access UI/index.html` | MODIFY | Alkalmazás verziójának léptetése **V0.3.8**-ra. |
| `Access UI/src/modules/rakodas.js` | MODIFY | Áru igény táblázat kibővítése szerkesztés gombbal és Destination oszloppal; kereső szűrők elhelyezése; elrendezés és táblázatszélességek (50-50%) finomítása. |
| `Access UI/src/modules/transportistas.js` | MODIFY | Padding csökkentése a vezérlők és a táblázat között; a "frmTransportistas_Sub" prefix eltávolítása a címsorból. |
| `Access UI/src/modules/kamion_szerkesztes.js` | MODIFY | A raklap-csökkentési mentés és fallback logika pontosítása. |
| `server/src/routes/cargo_demands.js` | MODIFY | Új `PUT /api/v1/cargo-demands/:id` végpont hozzáadása a szerkesztések mentéséhez. |
| `server/src/routes/transport_orders.js` | MODIFY | `resolveFilePath` definiálása és bevezetése a megtekintés és letöltés útvonalakhoz. |
| `server/src/routes/ekaer.js` | MODIFY | `resolveFilePath` alkalmazása a fallback (OK-s) elérési utakra. |
| `server/package.json` | MODIFY | Csomag függőségek frissítése / karbantartása. |
| `server/data/docs_dump.json` | NEW | Dokumentum adatok mentése. |
| `server/import_docs_from_json.js` | NEW | DO-barát importáló szkript dokumentum adatok betöltéséhez. |

---

## Élesítési és Migrációs Útmutató

> [!NOTE]
> **Adatbázis migrációra ezen verzió esetében nincs szükség!** A meglévő adatbázis sémája teljes mértékben támogatja a változtatásokat.

Az éles DO szerveren a frissítéshez elegendő a kódbázis frissítése és a backend konténer újraépítése:

```bash
# 1. Lépj be a szerverre és húzd le a legfrissebb kódokat
git pull origin master

# 2. Építsd újra és indítsd el a backend konténert
docker-compose -f docker-compose.prod.yml up -d --build gava_api
```

---

## Verzió
`V0.3.8` (előző: V0.3.7 – 2026-06-22)
