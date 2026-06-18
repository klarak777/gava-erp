# Fejlesztési Napló – V0.3.6 – 2026-06-18

## Összefoglalás
Történelmi duplikált adatok eltávolítása, hibás jövőbeli szezonok áthelyezése, valamint a szállítmányok törlésének teljes körű megvalósítása a Transportistas felületen (adatbázis szintű tranzakcionális törléssel és frontend hibajavítással).

---

## Változtatások

### Új funkciók

#### 1. Szállítmányok (fuvarok) törlése a Transportistas felületen
- **Modul:** `Access UI/src/modules/transportistas.js`
- Új törlés gomb (🗑️) hozzáadása minden szállítmánysor végére.
- Kattintáskor a rendszer megerősítést kér a felhasználótól.
- Robusztus eseménykezelő implementálása (`e.currentTarget.dataset.id`), ami megakadályozza, hogy az emoji ikonra kattintáskor elveszzen a kijelölt azonosító.

#### 2. Tranzakcionális törlési API végpont
- **Backend:** `server/src/routes/shipments.js` – `DELETE /api/v1/shipments/:id`
- Adatbázis tranzakció (`trx`) használata a biztonság érdekében:
  1. Első lépésben törli a fuvarhoz kapcsolódó összes tételt a `shipment_lines` táblából.
  2. Második lépésben törli magát a fuvart a `shipments` táblából.
  3. Bármely hiba esetén visszagörgeti (rollback) a változtatásokat, megőrizve az adatintegritást.

### Hibajavítások és Adatbázis Karbantartás

#### 1. Történelmi duplikátumok törlése
- **Adatbázis migráció:** `20260618000001_011_cleanup_duplicates.js`
- A történelmi adatok ismételt betöltésekor keletkezett azonos szezonú és kamionszámú duplikált, üres sorok sikeres tisztítása (121 db teljesen üres vagy felesleges rekord eltávolítva).

#### 2. Szellem (ghost) szezonok javítása
- **Adatbázis migráció:** `20260618000002_012_cleanup_ghost_season.js`
- A hibás `99-00` szezonkód törlése.
- Az ehhez a szezonhoz tévesen hozzárendelt szállítmányok átmozgatása a jelenlegi `25-26` szezonba, az adatok konzisztenciájának megőrzésével.

#### 3. Törlés API routing hiba javítása
- A `DELETE /api/v1/shipments/:id` végpont definíciója a `module.exports = router;` sor után maradt a backend fájlban, ami miatt a szerver nem exportálta azt (404 Cannot DELETE választ adva). A sorkorrekció megtörtént, a végpont megfelelően működik.

---

## Érintett fájlok

| Fájl | Módosítás típusa | Leírás |
|------|-----------------|--------|
| `server/src/routes/shipments.js` | MODIFY | DELETE végpont hozzáadása és exportálási sorrend javítása |
| `Access UI/src/modules/transportistas.js` | MODIFY | Törlés gomb integrálása, megerősítő ablak és hibatűrő eseménykezelő |
| `server/src/db/migrations/20260618000001_011_cleanup_duplicates.js` | NEW | Duplikált adatok eltávolítása |
| `server/src/db/migrations/20260618000002_012_cleanup_ghost_season.js` | NEW | 99-00 szezon tisztítása és adatok áthelyezése |

---

## Git
- **Commit:** (Készülőben)
- **Branch:** `master`

---

## Verzió
`V0.3.6` (előző: V0.3.5 – 2026-06-18)
