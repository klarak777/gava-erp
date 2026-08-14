# Gavá ERP Access UI - Fejlesztési Napló (V0.7.5)

**Dátum:** 2026.08.14.  
**Verzió:** V0.7.5  

---

### Összefoglaló a legutóbbi 6 óra fejlesztéseiről

#### 1. Főmenü Partnerlánc Logók & PENNY Almenük
* **Logók a főmenüben:** ALDI (`AldiNord-WorldwideLogo.svg`), SPAR (`Sparlogo.png`), TESCO (`TescoLogo.jpg`), PENNY (`Penny logo.jpg`).
* **PENNY almenük:**
  * `Stock` (`penny_stock`)
  * `Belföldi fuvarok` (`penny_belfoldi_fuvarok`)
  * `Komissiós utasítás` (`penny_komissios_utasitas`)

#### 2. PENNY Stock Modul
* **Aktuális Stock fül:**
  * Kötelező Penny Partner választó
  * Szállítási dátum választó
  * ⚙️ Beállítás (Oszlop testreszabás localStorage mentéssel)
  * 👁️ Rendelés megtekintése
  * Összekészítés állapota (%-os mérő)
  * 🖨️ Ellenőrzőlap nyomtatása
  * 📊 Exportálás excelbe (UTF-8 CSV letöltés)
  * 🔒 Stock lezárása
  * 16 oszlopos táblázat (Truck No, Arrival Date, Product, Quality, Box Type, Partida, Lot, Opening STOCK, Alsónémedi, Karcag, Veszprém, TOTAL DELIVER, DEPRECIATE, CLASE II. box, FINAL STOCK, Transport date)
* **Lezárt Stockok fül:**
  * Kötelező Penny Partner választó
  * Season választó (adatbázisból)
  * Lezárt stock választó (lezárás dátuma és felhasználója)
  * ⚙️ Beállítás & 📊 Exportálás excelbe
  * Letisztult világos táblázat

#### 3. Partnertörzs és Jellemzők
* `Partnerlánc jellemzők` és `Egyéb` jellemző dinamikus kezelése.
* Partnerek főtáblájában `Partnerlánc` oszlop.
* 19 Penny partner beazonosítása és migrációja (`server/src/db/assign_penny_partners.js` & `20260814020000_seed_penny_partner_characteristics.js`).

#### 4. Verziószám
* **V0.7.5** beállítva a felületen (`Access UI/index.html`).
