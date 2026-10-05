# Fejlesztési napló – PDA komissió és ALDI Bio-címkék

**Dátum:** 2026. október 5.  
**Érintett komponensek:** PDA UI, PDA Android alkalmazás, Access UI / ALDI Termék adattábla, szerveroldali API és DOCX-export.  
**PDA-verzió:** elkészült APK: 0.9.20 (verziókód: 20); a belépési foglalást tartalmazó, buildre előkészített forrás: 0.9.21 (verziókód: 21).

## 1. PDA: az utolsó raklap tételkiválasztási védelme

A korábbi 0.9.19-es fejlesztés más dolgozó aktív foglalása esetén csak a Mentésnél tiltotta az utolsó raklap komissiózását. A 0.9.20 ezt a védelmet a tételkiválasztó listában is megjelenítette. Az új 0.9.21 forrás már a tételre kattintáskor, az adatmegadó képernyő megnyitása előtt létrehozza a szerveroldali belépési foglalást.

- A tétel szürke és nem kattintható, ha más dolgozó aktív foglalása van, és az elérhető maradék legfeljebb egy raklapnyi karton.
- A sor megmutatja a komissiózó dolgozó nevét és az elérhető kartonszámot.
- A számítás a kapcsolódó ALDI áruigény aktuális `#/PLT` értékét használja. Az egyenlőséget is védő, korábbi V4-es szabály megmaradt.

```text
Elérhető maradék = max(0, rendelt karton − véglegesített karton − aktív foglalások kartonjai)
Tiltás = más dolgozó aktív foglalása van ÉS elérhető maradék ≤ #/PLT
```

Példa: 19 rendelt kartonból 10 kartont már lefoglalt egy másik dolgozó. Ha a `#/PLT` értéke 10, az elérhető 9 karton miatt a tétel nem választható ki más dolgozónál.

Csak az érvényes, vissza nem vont belépési foglalások és ideiglenes komissiós címkefoglalások számítanak. A saját foglalás önmagában nem tilt. Visszavonás, lejárat vagy véglegesítés után a foglalás kikerül a számításból; az összeemelési címkék nem foglalnak komissiós kartonokat. A belépési foglalás már a kattintáskor elindul, de még nem von le kartont és nem hoz létre címkét. A Mentés ugyanahhoz a munkamenethez hozza létre az ideiglenes címkét; annak kartonszáma csak egyszer kerül levonásra.

- Ha például 10 karton maradt, és a `#/PLT` értéke 10, az első dolgozó megnyithatja az adatmegadást. A második dolgozó már Mentés előtt sem léphet be.
- A belépés tranzakciós tételszintű sorzárral történik: két egyidejű kattintásnál is csak egy dolgozó léphet be az utolsó raklaphoz.
- A tétellistára vagy más nézetre visszalépés, a kijelentkezés és a sikeres befejezés felszabadítja a foglalást.
- A nyitott folyamat percenként, illetve előtérbe kerüléskor megújítja az ötperces foglalást. Lejárt munkamenet nem éleszthető újra; újból a listából kell belépni.
- Egy raklapnál nagyobb maradéknál a párhuzamos adatmegadás megmarad. A szabályosan belépett dolgozók később is befejezhetik a folyamatot; a mentés külön ellenőrzi a kartonmennyiséget.

A lista előtérben 15 másodpercenként és az alkalmazás előtérbe kerülésekor frissül. Ez a másik PDA-n létrejött vagy feloldott foglalás láthatóságát szolgálja; a 15 másodperc választott frissítési idő, nem üzleti szabály. Kattintáskor újra ellenőrzi az elérhetőséget és szerveroldali belépési foglalást kér; sikertelen ellenőrzésnél vagy elutasított foglalásnál nem nyitja meg az űrlapot. A tiltás nem vár a lista következő frissítésére.

### Korábbi GitHub APK-build: 0.9.20

- A tesztelt PDA-módosítások commitja: `c71dbb9fed737b5a25545499e12a83e0729f2efc`.
- Fejlesztési ág: `codex/pda-commission-0.9.19`; ezen az ágon készült a 0.9.20-as APK is.
- [Sikeres GitHub Actions build](https://github.com/klarak777/gava-erp/actions/runs/37245525729).
- Elkészült fájl: `Gava-PDA-App-0.9.20.apk`; a GitHub artifact helyi ZIP-je: `Gava-PDA-App-0.9.20.zip`.
- Ellenőrzött csomagazonosító: `com.gava.pda`; verzió: `0.9.20`; verziókód: `20`.
- Az aláíró tanúsítvány egyezik a 0.9.19-es APK-éval, és a beépült komissiós JavaScript egyezik a módosított forrással.

A GitHub-build lefuttatta a PDA szerver- és böngészős tesztjeit. Az APK-build nem telepítette az éles szervert. Ez a 0.9.20-as build még nem tartalmazza a Mentés előtti belépési foglalást.

### Új belépési foglalás élesítése: 0.9.21

Az új forrás használatához a szerver és a PDA-felület frissítése, valamint új APK buildelése szükséges. A szerveren futtatni kell a `20261006010000_add_pda_pick_entries.js` migrációt, amely létrehozza a `pda_pick_entries` táblát. A régi APK nem kér belépési foglalást, ezért az új szerveren új címke mentéséhez kliensfrissítés szükséges. A 0.9.21 APK-build és az éles szerver frissítése még nem történt meg.

## 2. ALDI Termék adattábla: Bio-címkék szabad szöveggel

A végleges elrendezés mind a KARTON CÍMKE, mind az EGYSÉG CÍMKE felületén:

| Bal oldali oszlop | Jobb oldali oszlop |
| --- | --- |
| A jelenlegi, szerkeszthető címkeadatok. | Felül az EU Bio-logó, alatta középre igazított, szabadon szerkeszthető szöveg. |

A két oszlop között nincs látható elválasztó sem a felületen, sem a DOCX-exportban. A logó mérete és az oszlopszélességek megmaradtak; a DOCX két rögzített, 75:25 arányú oszlopot használ. A képernyős logó 108 pixel széles, a DOCX-logó 108×72 pixel mérettel kerül be.

### Szerkesztés és mentés

- Bio-jelölésnél az eredeti `eu-organic-logo-600x400_0.png` mindkét címkén megjelenik, üres szövegmező esetén is.
- A logó alatti szövegdoboz 100 pixel magas. Középre igazított, többsoros szöveg írható bele: például tanúsítóadat, megjegyzés vagy bármilyen más felhasználói szöveg.
- Nincs „Tanúsító szervezet neve” mezőfelirat vagy helykitöltő szöveg, és nincs előre rögzített „EU mezőgazdaság” sor.
- Új, korábban nem kitöltött mező üresen indul. A korábban elmentett felhasználói szöveg megmarad, és szabadon felülírható vagy törölhető.
- A karton- és az egységcímke jobb oldali szövege külön menthető a saját Szerkesztés és Mentés gombjával.
- A TERMÉK RÉSZLETEI blokkban a Bio-jelölés marad; tanúsítószöveget ott már nem kell megadni.
- A Mégse elveti a szerkesztést. Sikertelen címkementés nem írja felül a korábban mentett helyi szöveget.

### Adattárolás és DOCX-export

A címkénkénti szöveg a meglévő `label_custom_texts` mezőben tárolódik, a kompatibilitás miatt megtartott `carton_bio_certifier` és `unit_bio_certifier` kulccsal. A korábbi `bio_certifier` mezőben tárolt szöveg alapértékként megmarad, amíg a címke saját szövegét nem mentik. A kifejezetten üresre mentett szöveg nem kapja vissza a régi értéket.

A Letöltés (DOCX) gomb a mentett címkeadatokat és a két címke saját szabad szövegét exportálja. Megmaradnak a sortörések, valamint az ékezetes és speciális karakterek. Az eltávolított rögzített feliratok az exportált dokumentumban sem szerepelnek.

A képernyős logót a `GET /api/v1/chain-products/bio-logo` végpont szolgálja ki. A felület és a DOCX ugyanazt a szerveroldali PNG-fájlt használja.

Ehhez a módosításhoz az Access UI és a szerver frissítése szükséges; új adatbázis-migráció és új PDA APK nem kell. Az ALDI-címkemódosítások helyben készültek el, nem részei a fent hivatkozott PDA-build commitjának.

## 3. Ellenőrzések és előnézetek

- PDA 0.9.21: a teljes szervertesztkészlet az elkülönített PostgreSQL komissiós tesztjeivel 71 sikeres tesztet adott, hiba nélkül; egy külön összeemelési adatbázisteszt kimaradt. Ellenőrizve: egyidejű belépés pontosan egy és kevesebb mint egy raklapnál, mentés előtti tiltás, megújítás, lejárat, visszalépés, kijelentkezés, véglegesítés és válaszvesztés. A PDA böngészős tesztek is sikeresek; a korábbi folyamatok 320×480 és 390×810 képernyőméreten megmaradtak.
- ALDI-címkék: a teljes szervertesztkészletben 56 sikeres teszt, 0 hiba és 2 kihagyott adatbázisteszt szerepelt.
- A legutolsó, szabad szöveges pontosítás után a `node --test tests/productLabelLayout.test.js` parancs mind a 6 címke- és böngészős tesztje sikeres. Ellenőrizve: eredeti PNG, változatlan logóméret és DOCX-oszlopszélesség, láthatatlan belső elválasztó, üres induló szöveg, eltávolított feliratok, többsoros szabad szöveg, mentés, újratöltés, export és visszavonás.

Előnézetek tesztadatokkal:

- [Címkeszerkesztő képernyőképe](../artifacts/labels/bio-label-editor-editing.png).
- [Mentett címkék képernyőképe](../artifacts/labels/bio-label-editor-preview.png).
- [DOCX-minta](../artifacts/labels/bio-label-editor-preview.docx).

## 4. Érintett források

- `PDA UI/js/views/commission.js`, `PDA UI/tests/palletFlow.browser.cjs`.
- `PDA-App/android/app/build.gradle`.
- `server/src/routes/pda.js`, `server/src/services/pdaPicking.js`, `server/tests/pdaPicking.test.js`.
- `server/src/services/pdaPickEntries.js`, `server/src/db/migrations/20261006010000_add_pda_pick_entries.js`, `server/tests/pdaWeights.test.js`.
- `Access UI/src/modules/aldi_termekek.js`.
- `server/src/routes/chain_products.js`, `server/src/services/productLabelLayout.js`, `server/tests/productLabelLayout.test.js`.
- Részletes leírások: [PDA 0.9.21 – belépési foglalás](../docs/pda-commission-0.9.21.md), [korábbi PDA 0.9.20](../docs/pda-commission-0.9.20.md), [ALDI Bio-címkeszerkesztő](../docs/aldi-bio-label-editor.md).
