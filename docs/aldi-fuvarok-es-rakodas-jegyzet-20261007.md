# ALDI Fuvarok és Rakodás Fejlesztési Jegyzet

**Dátum:** 2026. október 07.
**Modulok:** ALDI – Rakodás, ALDI – Fuvarok összesítő, ALDI – Belföldi fuvarok

Ez a dokumentum a fuvarszervezéssel, rakodással és a kapcsolódó adminisztratív modulokkal végzett legújabb fejlesztéseket és funkciókat foglalja össze.

---

## 1. ALDI – Rakodás modul (Rakodva jelölés)

- **Megerősítő ablak:** Amikor a felhasználó rákattint a "Rakodva" jelölőnégyzetre egy adott kamionnál, a rendszer egy felugró ablakot jelenít meg a véletlen kattintások elkerülése érdekében: *"Biztosan rakodottra állítod a(z) [Kamionszám] kamiont? Ez áthelyezi a kamiont a Fuvarok összesítőbe."*
- **Adatok áthelyezése:** A megerősítést követően a kamion azonnal eltűnik az aktív rakodási táblából.
- **Szinkronizáció:** A rakodott kamion adatai automatikusan átkerülnek mind a **Fuvarok összesítő** táblájába, mind pedig az **ALDI – Belföldi fuvarok** modulba.

---

## 2. ALDI – Fuvarok összesítő modul

- **Fejléc arculat:** A modul fejléce megújult, most már tartalmazza az ALDI logót és a hivatalos "ALDI – Fuvarok összesítő" feliratot.
- **Átlag súly átemelése:** Az "Átlag súly (nettó) /#" oszlop értékei mostantól a *KOMISSIÓ MEGTEKINTÉSE* modulból érkeznek, pontosan a kamionszám és a konkrét tétel alapján párosítva.
- **Komment mező:** A "KOMMENT" mező szélesebb lett, hogy átláthatóbb legyen, és továbbra is szabadon szerkeszthető.
- **Dinamikus Szezon legördülő:** A szűrők között helyet kapott a "Szezon" választó. A rendszer logikája automatikusan lekezeli a szezonváltásokat (egy szezon szeptember 1-től a következő év augusztus 31-ig tart), és magától generálja az új szezonokat (pl. "Season 25-26", "Season 26-27").
- **Központi Fuvarozó cég lista:** A "Fuvarozó cég" legördülő lista adatai immár közvetlenül az ADMIN főmenü Fuvarozó cég (Transporters) moduljának adatbázisából (`Name` mező) érkeznek, így nincs szükség duplikált karbantartásra.
- **Oszlopok testreszabása (Beállítás gomb):** 
  - A jobb felső sarokban elhelyezésre került egy *Beállítás* gomb (a *Szűrők törlése* gomb mellett).
  - Erre kattintva egy modális ablak (`createModal`) nyílik meg, ahol jelölőnégyzetekkel (checkbox) személyre szabható, hogy mely oszlopok jelenjenek meg a táblázatban.
  - A rendszer a felhasználó beállításait eltárolja a böngésző memóriájában (`localStorage`), így azok az oldal frissítése után is megmaradnak.

---

## 3. ALDI – Belföldi fuvarok modul

- **Adatok megjelenése:** Amint egy kamion "Rakodva" státuszt kap, a rekord megjelenik a Belföldi fuvarok listájában.
- **Szerkeszthető mezők:** A "CROSSDOKING RAKLAPSZÁM" és a "KOMMENT" oszlopok adatai a listában közvetlenül és szabadon szerkeszthetők.
- **Dinamikus listák:** Akárcsak az Összesítőben, a Szezon és a Fuvarozó cég legördülő menük itt is a központi logikát és adatbázist használják.
- **Fuvarszámla feltöltés (Invoice):**
  - A modul kiegészült egy PDF/kép feltöltési lehetőséggel a fuvarszámlák számára.
  - Feltöltéskor a backend a megadott hálózati elérési úton (`\\192.168.1.5\raktar\MI Teszt\ERP ALDI\Fuvarszámlák`) **automatikusan létrehoz egy almappát a kamion számával** (pl. `AL02`).
  - A fájl ebbe a dedikált almappába kerül elmentésre, a rendszer pedig adatbázis szinten (`aldi_trucks` tábla) is nyilvántartja a feltöltött dokumentum referenciáját.
