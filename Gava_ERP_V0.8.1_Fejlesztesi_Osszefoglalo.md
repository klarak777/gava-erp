# GAVA ERP - ALDI Fejlesztési Összefoglaló (V0.8.1)

Dátum: 2026. augusztus 24-25.

Az elmúlt két nap során jelentős továbbfejlesztések történtek az ALDI Rendelések és Rakodások modulokban, kiterjesztve a rendszer funkcionalitását a komissiózási folyamatok felé, illetve javítva a meglévő megjelenítési problémákat.

## 1. Komissió Utasítás Modul Kialakítása
Létrehozásra került egy teljesen új "Komissió utasítás" fül az ALDI Rendelések felületen, amely lehetővé teszi a raktári összekészítés pontos adminisztrálását.

- **Adatbázis és Backend fejlesztés:** 
  - Létrejött az új `aldi_commission_lines` adattábla.
  - Elkészültek az új API végpontok, amelyek kiszolgálják a komissiózási összesítő, valamint a részletes nézet adatait.
- **Aggregált (Összesítő) Nézet:** 
  - Kamiononként összesíti a megrendelt kartonszámokat, a már komissiózott mennyiségeket és a hátralévő darabszámot.
  - Kiszámolja és színkódolva (zöld/sárga/szürke) mutatja a komissiózás készültségi fokát százalékban.
  - Dátum és kamionszám szerinti szűrési lehetőséggel lett ellátva.
- **Részletes (Szerkesztő) Nézet:**
  - Kamiononként tételesen (termékenként és lot-onként) rögzíthetők az összekészített csomagok adatai (kartonszám, bruttó/nettó/átlag súly, raklapszám, származási ország, stb.).
  - **Dinamikus termékszűrés:** A termék legördülő listában okos szűrés működik, így a dolgozó csak azokat a termékeket választhatja ki, amelyek a "Rakodás" menüben ténylegesen fel lettek rögzítve az adott kamionra.
  - **Auto-save (Automatikus mentés):** Nincs szükség külön mentés gombra; a rendszer a háttérben automatikusan menti az adatokat, amint a felhasználó kilép egy szerkesztett cellából.

## 2. Deviza / Típus (EUR/HUF) Helyes Megjelenítése
- Kijavításra került az Áru igények (Demands) listában jelentkező "Normál" típusú hiba.
- A rendszer mostantól helyesen ellenőrzi a Heti Árak fülön berögzített deviza időszakokat (Currency Periods).
- Minden terméknél a szállítási dátum és a rögzített időszakok alapján dinamikusan és helyesen jelenik meg az EUR vagy HUF típusú rendelés.

## 3. PDA Ikon Megjelenítési Javítás
- A Rakodások felületen nem jelent meg megfelelően a PDA ikon a túl szűk hely, illetve fájlhivatkozási problémák miatt.
- A táblázat oszlopszélességei optimalizálásra kerültek.
- A `PDA logo.png` fájl bekerült a megfelelő könyvtárba, és le lett hivatkozva a kód szintjén.

---
*A következő tervezett lépés a részletes komissió nézetben a súlyadatok (bruttó, nettó) automatikus számítása a terméktörzs paraméterei és a megadott kartonszám alapján.*
