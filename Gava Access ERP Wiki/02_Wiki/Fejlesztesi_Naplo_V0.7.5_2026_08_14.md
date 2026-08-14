# GAVA ERP Access - Fejlesztési Napló
## Verzió: V0.7.5
**Dátum:** 2026.08.14.

### Elvégzett módosítások és fejlesztések az elmúlt 6 órában:

#### 1. Főmenü és Navigáció Újítások
- **Partnerlánc Logók Integrációja a Főmenübe:**
  - A bal oldali főmenüben a kiemelt kereskedelmi láncok közvetlenül a hivatalos logójukkal jelennek meg:
    - **ALDI:** `AldiNord-WorldwideLogo.svg`
    - **SPAR:** `Sparlogo.png`
    - **TESCO:** `TescoLogo.jpg`
    - **PENNY:** `Penny logo.jpg`
- **PENNY Almenü Struktúra Kialakítása:**
  - A PENNY menüpont alá 3 dedikált almenü modul került:
    1. **📊 Stock** (`penny_stock`)
    2. **🚚 Belföldi fuvarok** (`penny_belfoldi_fuvarok`)
    3. **📋 Komissiós utasítás** (`penny_komissios_utasitas`)

#### 2. PENNY – Stock Modul Kialakítása
- **Két fül rendszer:**
  - **📦 Aktuális Stock:** Folyamatban lévő készletek és napi elszámolások kezelése.
  - **🔒 Lezárt Stockok:** Archivált készletállományok visszakeresése szezonszűréssel.
- **Aktuális Stock Funkciói:**
  - **Partner szűrő (Kötelező):** Kizárólag a Penny láncjellemzővel ellátott partnerek listázódnak; partner kiválasztása nélkül a táblázat nem jelenik meg, helyette tájékoztató felhívás látható.
  - **Szállítási dátum választó:** Nem kötelező; ha nincs megadva, mindig a legfrissebb adatokat listázza.
  - **⚙️ Beállítás (Oszlopok konfigurálása):** Felugró ablakban checkboxokkal egyenként ki- és bekapcsolható a táblázat mind a 16 oszlopa, a beállításokat a böngésző helyileg megjegyzi.
  - **👁️ Rendelés megtekintése:** Kapcsolódó partner rendelési nézet gyorselérése.
  - **Összekészítés állapota:** Vizuális és %-os dinamikus haladási állapotjelző sáv.
  - **🖨️ Ellenőrzőlap nyomtatása:** Dokumentum és ellenőrzőlap nyomtatása.
  - **📊 Exportálás excelbe:** A megjelenített táblázat azonnali letöltése CSV/Excel formátumban UTF-8 kódolással.
  - **🔒 Stock lezárása:** Aktuális készletállomány lezárása.
  - **16 oszlopos Stock Táblázat:** A specifikált színekkel és elrendezéssel:
    *(Truck No, Arrival Date, Product, Quality, Box Type, Partida, Lot, Opening STOCK, Alsónémedi, Karcag, Veszprém, TOTAL DELIVER, DEPRECIATE, CLASE II. box, FINAL STOCK, Transport date)*.
- **Lezárt Stockok Funkciói:**
  - **Partner (Kötelező):** Penny partnerek kiválasztása.
  - **Season:** Szezonok listázása az adatbázisból (`Season 25-26`, `Season 24-25`, stb.).
  - **Lezárt stock:** Legördülő választó a lezárás dátumával és a lezárást rögzítő felhasználó nevével (`Dátum – Felhasználó`).
  - **⚙️ Beállítás & 📊 Exportálás excelbe:** Ugyanúgy elérhető a lezárt adatokra is.
  - **Táblázat:** Letisztult világos stílusú nézet.

#### 3. Partnertörzs és Partner Jellemzők Bővítése
- **Partnerlánc Jellemzők Támogatása:**
  - A Partner szerkesztő *Egyéb adatok > Jellemzők* blokkjában megjelent a `Partnerlánc jellemzők` opció, ahol kiválasztható a kívánt lánc (`Penny`, `Spar`, `Tesco`, `Aldi`).
  - Az `Egyéb` jellemző kiválasztásakor szabadon beírható szöveges értékmező nyílik.
  - A Partnerek főtáblázatában új **Partnerlánc** oszlop mutatja a hozzárendelt láncokat közvetlenül a Cím és a Művelet oszlopok között.
- **19 Penny Partner Automatikus Beazonosítása és Hozzárendelése:**
  - Létrehozva a `server/src/db/assign_penny_partners.js` önálló futtatható script és a `20260814020000_seed_penny_partner_characteristics.js` migráció.
  - Intelligens szövegillesztéssel a DO szerveren és lokálisan is beazonosítja és hozzárendeli a `Penny` jellemzőt a partnerekhez (*San Lucar Fruit, A.N Boekel, Anton Dürbeck, Kv Logistic, Kölla, Mandersloot, Vermion Fresh, Olympic Fruit, Nutri Frucht, Lehmann, Hillfresh, Greenyard Espana, Greenyard Italy, Campina Verde, Cretan Root, Dolcefrutta, Eurogroup Deutschland, Eurogroup Espana, Eurogroup Italy*).

#### 4. További Javítások és Finomhangolások
- **Admin > Archív Partnerek Karakteres Kereső:** Live `startsWith` szűrés név, számlázási név és inaktív azonosítók alapján.
- **Kamion Szerkesztés – Számlázási Partner és Transport Price:** Számlázunk partnerkereső és összeg/deviza tárolásának támogatása.
- **MI Asszisztens Hibajavítás:** Javítva az `ErpDataAgent` partnerkereső lekérdezése létező oszlopokra.
- **Verziószám:** Frissítve **V0.7.5**-re a bejelentkező képernyőn és az oldalsávban.
