# GAVA PDA Alkalmazás Architektúra és CI/CD Folyamat

Ez a dokumentum részletezi, hogyan lett a böngészős webes felületből natív Android alkalmazás, hogyan működik a felhő alapú fordítás (buildelés), és hogyan tartja a kapcsolatot a kézi szkenner (PDA) a központi szerverrel és adatbázissal.

---

## 1. Az Alkalmazás Architektúrája (Capacitor)

A PDA-ra szánt alkalmazás egy **Hibrid Alkalmazás**. Ez azt jelenti, hogy nem a hagyományos módon, Java vagy Kotlin nyelven írtuk meg a felületet, hanem a meglévő webes kódot (HTML, CSS, JavaScript) hasznosítottuk újra.

Ennek a technológiának a lelke a **Capacitor** (az Ionic csapat által fejlesztett keretrendszer).
* **Mit csinál?** A Capacitor létrehoz egy teljesen üres, natív Android alkalmazást, aminek a felülete nem más, mint egy teljes képernyős, keret nélküli webböngésző (WebView).
* **Hogyan működik?** Amikor az app elindul, nem az internetről (egy weblapról) tölti be a HTML fájlokat, hanem a **saját magába csomagolt fájljaiból** (offline). Ettől lesz az alkalmazás azonnali és villámgyors.
* **Előnye:** Ha bármit fejleszteni kell a felületen (új raklap gomb, új színek), elég csak a megszokott HTML/JS fájlokat módosítani, nem kell újraírni a programot Android nyelven.

---

## 2. A Fordítási (Build) Folyamat a GitHubon

Mivel az Android `.apk` telepítőfájlok elkészítéséhez egy bonyolult és erőforrás-igényes Android Studio / SDK fejlesztői környezet kellene minden gépre, a fordítást automatizáltuk a **GitHub Actions** segítségével. Ezt hívják CI/CD (Continuous Integration / Continuous Deployment) folyamatnak.

**Hogyan működik lépésről lépésre?**
1. **Kód feltöltése:** Amikor a fejlesztő módosítja a `PDA UI` mappában lévő HTML kódot és azt `git push` paranccsal feltölti a `master` ágra.
2. **Szerver indítása:** A GitHub felismeri a változást, és a `.github/workflows/build-apk.yml` utasításai alapján indít egy virtuális Linux (Ubuntu) szervert a felhőben.
3. **Környezet felállítása:**
   * Telepíti a Node.js-t (v22).
   * Telepíti a Java-t (v21), ami az Android 15 (API 36) fordításhoz szükséges.
4. **Capacitor Szinkronizáció:** A szerver átmásolja a legfrissebb webes kódjainkat az Android projekt megfelelő mappájába (`npx cap sync android`).
5. **APK Generálás:** A `gradlew assembleDebug` paranccsal lefordítja a tényleges Java/Android kódot egy futtatható `.apk` fájllá.
6. **Eredmény:** A kész `.apk` fájlt elmenti az adott futás "Artifacts" szekciójába, ahonnan bárki letöltheti és telepítheti a PDA-kra.

> [!TIP]
> Ezzel a módszerrel a GAVA csapatának sosem kell manuálisan Android környezetet karbantartania. A kód változása automatikusan "kiköpi" a legújabb telepítőt.

---

## 3. Kapcsolattartás a Backend-del és az Adatbázissal

Mivel a PDA alkalmazás felülete (HTML) már nem a GAVA szerveréről töltődik le, hanem helyben (offline) fut az eszközön, valahogyan kommunikálnia kell az interneten keresztül a backenddel (hogy lekérje a fuvarokat, vagy elküldje a raklap adatokat). Ezt **REST API** hívásokkal teszi.

### A Kommunikációs Modell
1. **Dinamikus Bázis URL:**
   Mikor az appot először elindítják, a felhasználónak meg kell adnia a **Szerver címét** (pl. `https://app.gavahungria.hu`). Az app ezt elmenti a PDA saját memóriájába (`localStorage.setItem('apiBaseUrl', ...)`).
2. **Kérések (Requests) felépítése:**
   A JavaScript kód minden műveletnél (bejelentkezés, raklap beolvasás) fogja ezt a címet, és hozzáfűzi a megfelelő végpontot. 
   Például: `https://app.gavahungria.hu/api/login`
3. **Adatáramlás (JSON):**
   * A PDA elküldi a beolvasott adatokat (SSCC kód, raklap típusa) JSON formátumban az adott URL-re.
   * A backend szerver (ami egy Docker konténerben fut) fogadja ezt, érvényesíti, majd elmenti az SQL adatbázis konténerbe (vagy felküldi az SAP-ba).
   * A backend visszaküld egy választ (pl. `{"success": true}`).
4. **Vizuális visszajelzés:**
   A PDA-n futó JavaScript feldolgozza a választ, és megváltoztatja a képernyőt (pl. zöldre vált a raklap).

### Biztonság és Hálózat
* A PDA-nak **aktív Wifi / Mobilnet** kapcsolatra van szüksége a műveletekhez.
* Mivel az adatok `https://` protokollon mennek, a kommunikáció a PDA és a szerver között végig titkosított.
* A Session/Süti kezelés ugyanúgy működik, mint weben (a szerver ellenőrzi, hogy a PDA be van-e jelentkezve).

---

## 4. A Fizikai Gombok (Vonalkódolvasó) Működése

A Newland MT93 (és a legtöbb ipari PDA) beépített lézeres vagy kamerás vonalkódolvasója gyárilag úgynevezett **Keyboard Wedge (Billentyűzet ék)** módban működik.

**Mit jelent ez a mi alkalmazásunkban?**
Amikor a raktáros megnyomja az eszköz oldalán lévő sárga gombot a lézer aktiválásához, a készülék leolvassa a vonalkódot, és a beolvasott szöveget **úgy küldi el a mi alkalmazásunknak, mintha egy nagyon gyors gépíró beírta volna azt egy fizikai billentyűzeten**, majd a végén nyomott volna egy `Enter` gombot.

**Mi kell a működéshez a mi részünkről?**
Semmilyen extra Android programozás nem szükséges!
Csupán arra van szükség, hogy a PDA webes felületén a kurzor (fókusz) abban a beviteli mezőben villogjon, ahova a kódot várjuk. Amint megtörténik a beolvasás, a mező kitöltődik, az Enter gomb hatására pedig a mi JavaScript kódunk észleli a bevitelt, és azonnal elküldi az adatokat a szervernek.
