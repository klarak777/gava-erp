# Fejlesztési Napló - Partner Szerkesztő Modális Görgetési Hiba Gyökérok Elemzése és Javítása (2026.07.29)

## 📌 Probléma leírása
A Partner szerkesztő modális ablakban az „Egyéb adatok” fül alja nem volt látható, és a felületen hiányzott a görgetősáv. A korábbi próbálkozások (CSS flexbox módosítások, `box-sizing`, `overflow-y: scroll`, manual JS wheel handler, `recalcPanelsHeight`) hatástalannak bizonyultak.

---

## 🔍 Gyökérok (Root Cause) Elemzés

A probléma **nem CSS-hiba volt, hanem HTML-struktúra hiba**.

A `prtBuildTermeszetesPanel` függvényben (a „Természetes személy” panel Őstermelő szekciójában) egy hibás/hiányzó nyitó `<div class="prt-check-row">` és `<label>` tag miatt a böngésző HTML parsere idő előtt bezárta a `.prt-panels` görgető-konténert.

### Ennek következménye:
- A `.prt-panels` konténer üressé vált (`clientHeight = 42px`, ami pontosan a 2px + 40px padding volt).
- Az „Egyéb adatok” fültől kezdve az összes rákövetkező panel a `.prt-modal` közvetlen gyermekeként landolt a DOM-ban — egy `overflow: hidden` / `overflow: clip` doboz alatt, ahol nem létezett görgető-konténer.
- Minden korábbi CSS/JS próbálkozás a `.prt-panels`-t próbálta beállítani, ami valójában üres volt.

---

## 🛠️ Alkalmazott Javítások

1. **HTML struktúra helyreállítása (`Access UI/src/modules/partnerek.js`)**:
   - `prtBuildTermeszetesPanel`: Pótolva a hiányzó `<div class="prt-check-row">` és `<label>` a kompenzációs felár checkbox körül ([partnerek.js:716-720](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/Access%20UI/src/modules/partnerek.js#L716-L720)).
   
2. **XSS / HTML injekció és korrupció elleni védelem**:
   - Pótolva a hiányzó `prtEsc()` hívások a Jellemzőknél, Korlátozásoknál és Kategóriáknál. Enélkül egyetlen idézőjel az adatértékben ugyanezt a DOM-szétesést okozhatja partnerfüggően.

3. **Kód tisztítás (Clean-up)**:
   - Eltávolítva az átmeneti CSS és JS ragtapaszok (`recalcPanelsHeight`, manual wheel event listener, inline style felülírások), visszaállítva a tiszta natív flexbox + `overflow-y: auto` működést.

---

## ✅ Ellenőrzés

- A DOM fanak helyreállása után a `.prt-modal` alatt pontosan 4 közvetlen gyermek elem található (`titlebar`, `toprow`, `tabs-main`, `panels`).
- Az „Egyéb adatok” fül és az összes többi panel megfelelően a `.prt-panels` görgető-konténerben helyezkedik el.
- A görgetősáv natívan megjelenik és a görgetés hibátlanul működik minden fülön.
