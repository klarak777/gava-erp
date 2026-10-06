# MI asszisztens – PDF-export oldaltördelésének javítása

**Dátum:** 2026. október 6.

## Jelentett hiba és vizsgálat

A `Gava_MI_Elemzes (21).pdf` 15 oldalas A4-es dokumentum. Az első oldalról a másodikra átnyúló táblázat a fejléc megismétlése nélkül folytatódik. A korábbi export egy hosszú, képpé renderelt konténert vágott oldalnyi darabokra, ezért az oldaltörések nem követték a bekezdések és a táblázatsorok határait.

## Módosított működés

- A tartalom a böngészőben, tényleges mérete alapján előre A4-es oldalakra rendeződik. A PDF ezekből az oldalakból készül, külön-külön rendereléssel.
- Az egy oldalra férő bekezdések, listatételek és kisebb táblázatok együtt maradnak. Az oldalnál hosszabb bekezdés szóhatáron, a szöveg és az inline formázás megőrzésével folytatódik.
- A hosszú táblázatok sorhatáron folytatódnak a következő oldalon, megismételt oszlopfejléccel.
- A szakaszcím együtt marad a hozzá tartozó első tartalommal. A rövid táblázatbevezető szöveg a címmel és a táblázat kezdetével együtt kerül elhelyezésre.
- A grafikonok átkerülnek a PDF-be, és minden oldalon megjelenik az oldalszám és a teljes oldalszám.
- Az export csak a legutolsó befejezett MI-választ választja ki. A feltöltési, folyamatjelző és korábbi exportüzenetek nem válnak exportált elemzéssé egy újabb kattintásnál.
- Az export alatt a mentés gomb nem indíthat újabb párhuzamos exportot. Hiba esetén a felület jelzi az okot, és az ideiglenes tördelési elemek törlődnek.

Új adatbázis-migráció és PDA APK nem szükséges. A már megnyitott ERP-oldalt újra kell tölteni. Az `index.html` a főmodult `main.js?v=0.9.7.3`, a főmodul az MI-felületet `ai-chat.js?v=10` címen tölti be.

## Ellenőrzések és mintafájl

- Chromiumban ellenőrizve: a tartalom nem lóg túl az oldalakon, minden táblázatsor egyszer szerepel, a hosszú táblázat fejlécei ismétlődnek, a címek nem maradnak tartalom nélkül, és a grafikon megmarad.
- Egy 1600 szóból álló bekezdés szövege megmarad az oldalak közötti folytatásban.
- A tényleges, korábban is használt `html2pdf.js` 0.10.1 könyvtárral elkészült egy 18 oldalas A4-es próbafájl. Az oldalszám megegyezik az előzetes tördelés eredményével. Popplerrel renderelve az oldalak és a táblázatfolytatás vizuálisan is ellenőrizve.
- A tényleges mentés gomb két egymás utáni kattintása ugyanazt az elemzést, ugyanannyi oldallal exportálja.
- A teljes szervertesztkészlet: **65 sikeres teszt, 0 hiba, 2 kihagyott PostgreSQL-teszt**. A PDF renderelési teszt a helyben letöltött könyvtárat használja; ennek hiányában ez a kiegészítő teszt kimarad, az oldaltördelési teszt továbbra is fut.

[PDF-tördelési mintafájl](../artifacts/ai-pdf-review/Gava_MI_Elemzes_tordeles_minta.pdf) – tesztadatokból készült, nem a beküldött PDF átírt változata.

## Érintett források

- `Access UI/src/modules/ai-pdf-export.js`: tartalomblokkok, oldaltördelés, fejlécismétlés és oldalankénti PDF-renderelés.
- `Access UI/src/modules/ai-chat.js`: befejezett MI-válasz kijelölése és az export gomb kezelése.
- `Access UI/src/main.js`, `Access UI/index.html`: frissített betöltési verziók.
- `server/tests/aiPdfExport.test.js`, `server/tests/aiWorkbookUpload.test.js`: PDF- és korábbi Excel-folyamatok ellenőrzése.

A könyvtár meglévő Worker API-ja használható a külön oldalak renderelésére: [html2pdf.js dokumentáció](https://ekoopmans.github.io/html2pdf.js/). Új éles könyvtárfüggőség nem került be. A módosítás helyben elkészült; GitHub-feltöltés és éles telepítés ebben a munkában nem történt.
