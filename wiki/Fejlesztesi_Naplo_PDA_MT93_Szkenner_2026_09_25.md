# PDA Newland MT93 Szkenner Fejlesztési és Működési Jegyzet (2026-09-25 / 2026-09-26)

## 1. Hardver és Környezet

- **Eszközmodell:** Newland MT93 ipari PDA
- **Operációs rendszer:** Android 13 (API Level 33 / Tiramisu)
- **Tervezési kijelzőméret:** 390 × 810 px (13:27 képarány)
- **Hivatalos referencia:** *Newland MT93, Android PDA API Handbook – Output via API*
- **Kiadott működő APK azonosító (V11):**
  - **Fájl:** `app-debugV11.apk`
  - **SHA-256 Ellenőrzőösszeg (Checksum):** `7FEDE5804D5595CBB0917F358FA1088562B7459A72B6E7C326492C5D232C00F5`

---

## 2. A Működési Mechanizmus (Natív Broadcast API)

Az alkalmazásban az Android natív `BroadcastReceiver` architektúrája kezeli a vonalkód-beolvasást:

1. **Előtérbe kerüléskor (`onResume`):**
   - Az alkalmazás elküldi az `ACTION_BAR_SCANCFG` Intentet:
     - `EXTRA_SCAN_MODE = 3` (Newland specifikáció: *Output via API*)
     - `EXTRA_SCAN_AUTOENT = 0` (Nincs szükség utólagos Enter emulálására)
2. **Háttérbe kerüléskor (`onPause`):**
   - Az alkalmazás visszaállítja a szkennert billentyűzet ék módba:
     - `EXTRA_SCAN_MODE = 2` (*Simulate keystroke*), hogy más alkalmazásokban (pl. böngésző, jegyzet) a szkenner megszokott módon működjön.
3. **Vonalkód fogadása (`scannerReceiver`):**
   - Android 13 alatt exportált vevőként regisztrálva (`Context.RECEIVER_EXPORTED`).
   - Akció: `nlscan.action.SCANNER_RESULT`
   - Státusz ellenőrzés: `SCAN_STATE == "ok"`
   - Kinyert adat: `SCAN_BARCODE1`
4. **Átadás a webes felületnek:**
   - A natív `MainActivity` közvetlenül a Capacitor WebView rétegébe injektálja az adatot a `window.dispatchEvent(new CustomEvent('pda-barcode-scanned', { detail: barcode }))` JavaScript hívással.
   - **Eredmény:** Nem szükséges aktív fókusz vagy beviteli mező, a kód azonnal és hibamentesen bekerül a megfelelő folyamatba (komissiózás, raklapkeresés, konszolidáció).

---

## 3. Tartalék Mód (Fallback – V8.2 Keystroke Buffer)

- Az előző (8.2-es) verzió billentyűzetes figyelése tartalék megoldásként (`fallback`) továbbra is aktív a `PDA UI/js/app.js`-ben.
- Ha az eszközt külső Bluetooth szkennerrel vagy kézi billentyűzet emulációval használják, a globális `keydown` figyelő puffereli a karaktereket (150 ms időzítővel vagy `Enter` leütésre), majd ugyanazt a `pda-barcode-scanned` eseményt váltja ki.
- Az `inputmode="none"` és a `Keyboard.hide()` trükkök **teljesen eltávolításra kerültek** az APK-ból.

---

## 4. Architekturális Különbség: Natív Broadcast API vs. inputmode="none" + Keyboard.hide()

| Szempont | Natív Broadcast API (Jelenlegi V11) | `inputmode="none"` + `Keyboard.hide()` (Korábbi hiba) |
| :--- | :--- | :--- |
| **Működési elv** | **Eseményalapú adatfolyam:** A szkenner hardver közvetlen Android OS Intentet küld, amit a Java réteg fogad és továbbít a JS-nek. | **Beviteli mező emuláció:** A szkenner billentyűzetként (`KeyEvent`) gépeli be a karaktereket egy fókuszban lévő `<input>` mezőbe. |
| **Beviteli fókusz igény** | **NEM szükséges.** A mezők lehetnek `readOnly`-k, `disabled`-ek vagy sima `<div>` elemek. Bárhol jár a felhasználó, a beolvasás működik. | **Kötelező.** A kurzornak pontosan a cél input mezőben kell állnia, különben a beolvasott karakterek elvesznek. |
| **Virtuális billentyűzet** | **Garantáltan NEM jelenik meg.** Mivel nincs fókuszált szerkeszthető beviteli mező, az Android Input Method Manager (IMM) soha nem aktiválódik. | **Villogás / Beragadás (Race condition):** Az Android azonnal megnyitja a billentyűzetet fókuszkor. A `Keyboard.hide()` aszinkron hívás, emiatt a billentyűzet felvillan, vagy lezárja a bevitelt és elvágja a vonalkódot. |
| **Karaktervesztés esélye** | **0% (Bitpontos átvitel).** A teljes string egyben érkezik a memóriában (nincs karakterenkénti leütés-késleltetés). | **Magas.** Gyors beolvasáskor a WebView eseményhurok kihagyhat karaktereket, vagy az `inputmode="none"` letilthatja a szkenner billentyűit is. |
| **Rendszerterhelés és UX** | Tiszta, folyamatos, a felület nem ugrik/ugrál össze-vissza a képernyő-átméretezések (`adjustResize`) miatt. | Zavaró képernyő-ugrálás, átméretezési anomáliák. |

---

## 5. Miért volt szükség az SHA-256 Hashelésre?

Az `SHA-256: 7FEDE5804D5595CBB0917F358FA1088562B7459A72B6E7C326492C5D232C00F5` ellenőrzőösszeg rögzítése a következő okok miatt elengedhetetlen ipari környezetben:

1. **Verzióazonosság és Tévedhetetlenség (Disambiguation):**
   - A fejlesztés során több verzió (V8.1, V8.2, V9, V10, V11) és több hasonló nevű fájl (`app-debug.apk`, `Gava-PDA-App.apk (10)`, stb.) keletkezett a letöltési mappákban és a PDA-kon.
   - Az SHA-256 ujjlenyomat alapján a rendszergazda/felhasználó 100%-os biztonsággal meg tudja állapítani a telepítés előtt, hogy pontosan a tesztelt, működő V11-es binárist telepíti-e, nem pedig egy korábbi, billentyűzet-hibás változatot.
2. **Átviteli Integritás Ellenőrzése:**
   - A raktári környezetben a PDA-ra történő letöltéskor (gyenge wifi, megszakadt kapcsolat, böngészős letöltési hiba) előfordulhat, hogy az APK fájl csonkán érkezik meg. Az SHA-256 hash egyezése garantálja, hogy a fájl bitről bitre sértetlen.
3. **Reprodukálhatóság és Vállalati Release Menedzsment:**
   - A WMS rendszerben kritikus, hogy dokumentálva legyen a production környezetben elfogadott verzió kriptográfiai ujjlenyomata, így auditálható és bármikor igazolható, hogy a készülékeken futó szoftver azonos a jóváhagyott builddel.

