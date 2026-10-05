# ALDI termékek – Bio címkeszerkesztő

A KARTON CÍMKE és EGYSÉG CÍMKE Bio terméknél két oszlopból áll: balra a jelenlegi címkeadatok, jobbra felül az eredeti `eu-organic-logo-600x400_0.png`, alatta középre igazított szabad szöveg. A két oszlop között nincs látható elválasztó.

Mindkét címke saját Szerkesztés és Mentés gombjával módosítható. A logó alatti 100 pixel magas szövegdobozban tetszőleges, akár többsoros szöveg vagy megjegyzés írható; karton- és egységcímkén külön menthető. Nincs látható mezőfelirat, előre rögzített „EU mezőgazdaság” sor vagy automatikus kezdőszöveg. A logó mérete és az oszlopszélességek megmaradnak. A TERMÉK RÉSZLETEI blokkban csak a Bio-jelölés marad, tanúsítómező nincs.

A korábban mentett `bio_certifier` szövege megmarad mindkét címkén, amíg a felhasználó felül nem írja. Új terméknél a mező üres. A címkénkénti módosítás a meglévő `label_custom_texts` mezőben, `carton_bio_certifier` és `unit_bio_certifier` kulccsal mentődik. A kifejezetten üresre mentett szöveg nem kapja vissza a régi alapértéket. A Bio-jelölés ki- és bekapcsolása megőrzi a mentett címkeszövegeket.

A Letöltés (DOCX) a mentett adatokat exportálja. Bio-jelölésnél a logó kitöltetlen tanúsító esetén is szerepel mindkét címkén. A Word-táblázat két rögzített, 75:25 arányú oszlopot használ láthatatlan belső elválasztóval. A PNG képernyős és DOCX-változata ugyanabból a szerveroldali fájlból származik.

A szerver és az Access UI frissítése szükséges, új adatbázis-migráció és PDA APK nem kell.

Ellenőrzés:

- `server`: `node --test tests/productLabelLayout.test.js` – DOCX-elrendezés, eredeti PNG, kitöltetlen tanúsító, külön címkeszövegek, böngészős szerkesztés, mentés, újratöltés, export, visszavonás és sikertelen mentés.
- `server`: `npm test` – teljes szervertesztkészlet. A böngészős teszthez a Playwright Chromium telepítése szükséges.
