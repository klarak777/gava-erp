# ALDI Heti árak feltöltési hiba (Dátum és Hét azonosítás) - 2026.10.06. Javítás

## A jelentett hiba
A felhasználó (kolléganő) egy 41. heti ALDI árakat tartalmazó Excel fájlt (pl. `ALDI 41 HETI ÁRAK.xlsx`) próbált feltölteni, de az alábbi két anomáliát tapasztalta:
1. **Rossz héthez rendelés:** A fájl tartalmát a rendszer a 41. hét helyett a 40. héthez töltötte fel.
2. **Eltűnő dátumok:** Az importált tételekhez a felületen az jelent meg, hogy "nincs dátum benne".

## A hiba műszaki oka
A backend oldali Excel feldolgozó (`server/src/routes/aldi_weekly_prices.js`) a hét meghatározásakor a **legelső olyan adatsort vette figyelembe**, amelyben érvényes szállítási időszak szerepelt. 
- A 41. heti fájl első adatsora egy áthozott tétel (Petrezselyemzöld) volt, amelynek kezdődátuma `2026.09.30` volt. 
- Az ALDI naptára szerint a `2026.09.30` szerda a **40. héthez** tartozik, ezért a rendszer az egész fájlt 40. hetesként regisztrálta.

Amint a rendszer 40. hetesként kezelte a fájlt, a többi (helyesen 41. heti, azaz `2026.10.07 - 2026.10.13` közötti) tételt leellenőrizte a heti határokkal szemben a `validateAldiPeriod` függvénnyel. Mivel ezek a dátumok *teljesen kívül estek* a 40. hét határain, a rendszer a dátumokat érvénytelennek minősítette (`invalid_outside`), és `null` értékkel írta felül őket. Emiatt a frontend felület úgy érzékelte, hogy a tételeknek nincsen szállítási időszaka.

## A bevezetett javítás
A javítás a `server/src/routes/aldi_weekly_prices.js` fájlban, az `upload` API végponton történt, több extrém esetet (edge-case) is kezelve:
1. **Szigorú dátum-ellenőrzés:** A statisztikába csak a valós, létező naptári dátumok (pl. nem `2026.02.30`) számíthatnak bele.
2. **Fejléc-olvasás és Év megállapítás:** A kód elsődlegesen az `A1` (vagy hasonló) cellában található explicit megjelölést keresi (pl. `2027 KW01`, `41.hét`). 
    - Ha a fejléc tartalmazza az évet is, azt használja. 
    - Ha csak hétszámot tartalmaz (pl. `KW01`), a fájlban szereplő dátumok alapján kikövetkezteti a helyes évet (pl. megállapítja, hogy a decemberi dátumok a 2027-es év első hetéhez, és nem a 2026-oshoz tartoznak). 
    - A kiolvasott hetet csak akkor fogadja el, ha az értelmezhető az Excelben lévő dátumokkal (legalább egy dátum átfedésben van a hét határaival). Ha hibás a fejléc (pl. `KW99` vagy teljesen más hetet ír, mint a dátumok), automatikusan a statisztikai módszerre vált.
3. **Leggyakoribb hét (Módusz):** Egyértelmű fejléc hiányában a rendszer statisztikát készít: a *leggyakoribb* heti azonosítót kapja a fájl. 
4. **Döntetlen (Tie) megszakítása és Kézi adatmegadás:** Ha két hét pontosan ugyanannyiszor szerepel a fájlban (és nincs fejléc, ami döntene), vagy egyáltalán nem lehet kikövetkeztetni a hetet, a feltöltés biztonsági okokból leáll. Ekkor a rendszer egy felugró ablakban (prompt) kéri be a felhasználótól a hetet, amit a backend automatikusan fel tud dolgozni a sikeres feltöltés érdekében.
5. **Csonkolások kiemelésének mellőzése:** Azok az áthozott tételek, amik kilógnak a hétből, okosan csonkolódnak (clamped) a hét határaira. Ezt eddig sárgával emelte ki a felület. A módosítással a csonkolt tételek státusza `valid` marad, így nem lesznek sárgával kiemelve a UI-n, csupán a feldolgozás során kapunk róluk tájékoztató üzenetet.

Ezzel a módszerrel garantált, hogy egy outlier (áthozott tétel) vagy egy hiányos/hibás fejléc ne rontsa el az egész heti árazást, és a felhasználó mindenről tiszta üzenetet kapjon.
