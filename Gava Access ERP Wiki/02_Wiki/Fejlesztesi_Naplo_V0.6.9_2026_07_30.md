# Gavá ERP Access UI - Fejlesztési Napló

## Verzió: V0.6.9
**Dátum:** 2026.07.30.

### Kiemelt javítások és fejlesztések

1. **Termékek (Products) tábla ABC sorrendezése és kereső szűrője**
   - A `Termékek (Products)` modulban a termékek mostantól **ABC sorrendben** (a termék neve alapján, magyar ékezetes ábécé szerint) jelennek meg a korábbi cikkszám szerinti rendezés helyett.
   - A táblázat fejlécébe beépítésre került egy dinamikus **Keresés** beviteli mező (`🔍 Keresés...`), mellyel valós időben lehet szűrni a cikkszámokra, magyar és angol terméknevekre, vagy az azonosítóra.

2. **Áruigény hozzáadása modul - Product választó korlátozás feloldása**
   - **Limit eltávolítása**: Az Áruigény hozzáadása/szerkesztése ablakban a termékválasztó autocomplete legördülő menüje korábban mesterségesen le volt korlátozva maximum **8 elemre** (`slice(0, 8)`), emiatt sok beírt karakterre nem jelentek meg a kívánt termékek. Ezt a korlátot feloldottuk (akár 300+ elem is megjeleníthető görgethető listában).
   - **Keresés kiterjesztése**: A szűrés korábban kizárólag a terméknév kezdetére illeszkedett (`startsWith`). Ezt átalakítottuk részleges illeszkedésre (`includes`), így a terméknév tetszőleges részletére, cikkszámára vagy magyar nevére is azonnal feldobja a találatokat.
   - **Fókuszra megjelenő lista**: A mezőbe kattintva (vagy fókuszt kapva) a teljes terméklista azonnal megjelenik ABC sorrendben, így gépelés nélkül is böngészhetővé vált az összes termék.
