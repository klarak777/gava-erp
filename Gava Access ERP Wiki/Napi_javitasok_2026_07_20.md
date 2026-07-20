# 2026.07.20 - Napi javítások és fejlesztések

## Partnerek modul (V0.5.8)

### Felület (UI) változások
- **Fő lista átalakítása:**
  - Oszlopok átrendezése a felhasználói kérés alapján: `#`, `Név`, `Név a bizonylaton`, `Adószám`, `Szervezeti egység` (Székhely), `Cím`, `Művelet`.
  - Típus alapú szűrő dropdown végleges eltávolítása a letisztultabb felület érdekében.
- **Kereső mezők:** 3 különálló keresőmező bevezetése (Név, Adószám, Város).
- **Finomhangolás:** A Partner adatlap "Egyéb adatok" és "Megjegyzés/Kategóriák" füleinél a belső térköz (padding/margin) csökkentése, szűkebbre véve a távolságot a fül lista és a konténer tartalma között.

### Keresés logikai (API) optimalizálása
- **Folyamatos keresés:** Élő keresés beállítása gépelés közben mindhárom mezőre (250ms késleltetéssel).
- **"Starts-With" logika:** Az adószám, város és név szűrők mostantól szigorúan csak a beírt karakterekkel **kezdődő** találatokat adják vissza (nem a köztes egyezéseket).
- **Idézőjelek kezelése:** A név kereső felkészítése az idézőjellel kezdődő cégnevek (pl. `"Kovács Kft"`) intelligens kezelésére (az első idézőjelet a keresőmotor automatikusan figyelmen kívül hagyja).

### Hiba javítások (Bugfixes)
- **VIES / NAV (ABC Ellenőrzés):** 
  - Az "Ellenőrizve" dátum nem mentődött le megfelelően (a mező típusa miatt `textContent` helyett `value` beállítása).
  - A "Név a bizonylaton" (Székhely fülön) nem frissült élőben az ellenőrzés során. Ezt egy automatikus `input` esemény generálással orvosoltuk a kód szintjén.
