# Gavá ERP Access UI - Fejlesztési Napló (V0.7.6)

**Dátum:** 2026.08.17.  
**Verzió:** V0.7.6  

---

### Összefoglaló a fejlesztési műszakról

#### 1. ALDI Modul Felépítése & Menüstruktúra
* **ALDI Főmenü:** Létrehozva a `Rendelések`, `Stock`, `Quality` almenükkel és közvetlen modul-navigációval.
* **ALDI Rendelések modul fülstruktúrája:**
  1. `Napi rendelés`
  2. `Heti lekötés`
  3. `Heti árak` *(ÚJ)*
  4. `Termékek adat tábla`

---

#### 2. ALDI Termékek Adat Tábla & PostgreSQL Adatbázis Integráció
* **Adatbázis tábla:** `chain_products` (PostgreSQL)
  * Cikkszám, Megnevezés, GTIN azonosító, EAN azonosító, Címke, Áruházlánc (`chain = 'ALDI'`), aktív státusz.
* **Backend API (`server/src/routes/chain_products.js`):**
  * `GET /api/v1/chain-products?chain=ALDI`
  * `POST /api/v1/chain-products/sync` (Batch szinkronizáció és tranzakciós mentés)
* **Felhasználói felület:**
  * Inline mezőszerkesztés, keresés cikkszám/név/GTIN/EAN alapján.
  * ➕ **Új termék sor hozzáadása** felugró ablak (név, cikkszám, GTIN, EAN, címke).
  * 🗑️ Sor törlése lehetőség.
  * 💾 **Kézi mentés:** A felhasználó a zöld/kék „💾 Mentés” gombra kattintva menti el véglegesen az adatokat a PostgreSQL adatbázisba (nincs automatikus felülírás).

---

#### 3. ALDI „Heti árak" Modul & XLSX Feldolgozás
* **Adatbázis táblák (Migráció: `20260817100000_create_aldi_weekly_prices.js`):**
  * `aldi_weekly_prices` (Év, KW kód, sorszám, hálózati elérési út)
  * `aldi_weekly_price_lines` (XLSX-ből kinyert sorok, GTIN, költségek, időszakok)
  * `aldi_price_currency_periods` (Soronkénti deviza időszakok: EUR/HUF/USD felosztás)
* **Backend API (`server/src/routes/aldi_weekly_prices.js`):**
  * `POST /api/v1/aldi-weekly-prices/upload`:
    * Multipart XLSX feltöltés és automatikus kinyerés (`xlsx` parserrel).
    * Fájl párhuzamos mentése a hálózati meghajtóra: `\\192.168.1.5\raktar\Aldi\ALDI RENDELÉSEK\ERP ALDI\{ÉV}\{KW_XX}\` (Windows és Linux / DO szerver kompatibilis útvonal-kezeléssel).
    * Termékazonosítás GTIN alapján a `chain_products` táblából:
      * **Egyezés esetén:** Az ERP hivatalos termékmegnevezése jelenik meg.
      * **Nincs találat:** Az XLSX eredeti termékneve pirossal (⚠️) emelődik ki.
    * Szállítási időszak felbontása kezdő és végdátumra.
  * `GET /api/v1/aldi-weekly-prices?year=XXXX` (Adott év heteinek listázása)
  * `GET /api/v1/aldi-weekly-prices/:id/lines` (Kiválasztott hét sorainak betöltése)
  * `GET / POST / DELETE /currency-periods` (Deviza periódusok kezelése)
* **Felhasználói felület:**
  * Év választó (2018-tól aktuális évig) és Hét választó (`KW01`–`KW53`).
  * **📤 Heti árak feltöltése ablak:** Év választó, Hét legördülő (jelölve a már feltöltötteket), drag & drop / tallózó zóna.
  * Sötét fejlécű professzionális adattábla: Rekeszköltség, Egységköltség, Csomagolás, Származás, Szállítási időszak, GTIN.
  * Deviza (€/Ft) jelző badge-ek és 💱 **Deviza időszak felugró szerkesztő**.

---

#### 4. Napi Rendelés Bővítés
* **Új oszlopok a Napi rendelés táblában:**
  * `RENDELÉS TÍPUSA` (Normál, Akciós, Kiegészítő, Egyéb)
  * `RAKLAPSZÁM`
* **Rendelés feltöltése ablak:** Bővítve a Rendelés típusa legördülővel és a Raklapszám beviteli mezővel.

---

#### 5. Rendszerverzió & Verzióváltás
* **Verziószám:** Frissítve **V0.7.6**-ra a bejelentkező felületen, a fejlécben és az oldalsávban.
