# GAVA ERP - Fejlesztési Összefoglaló és Változásjegyzék (V0.8.2)

**Dátum:** 2026. augusztus 27.  
**Verzió:** V0.8.2

---

## 📋 Összefoglaló

A legutóbbi műszak során a rendszer stabilitását, felhasználói élményét (UX/UI) és adatmodelljét érintő komplex fejlesztéseket végeztünk az **ALDI Rakodás**, **Komissió utasítás** és az **Adminisztráció (Göngyöleg típusok)** modulokban.

---

## 🚀 Részletes Módosítások és Fejlesztések

### 1. ALDI – Rakodás (Cross-Docking) optimalizálások
- **Új kamion rögzítése ablak & táblázat:**
  - Optimalizáltuk a beviteli mezők (`Kamionszám`, `Rendszám`, `Szállítási nap`, `Fuvarozó`) méretét és elrendezését.
  - A felesleges oszlopok (`Göngyöleg típus`, `Tára súly`, `Származási ország`, `Lotszám`, `Raklap típus`) eltávolításra kerültek az átláthatóság növelése érdekében.
  - A táblázat oszlopnevei középre lettek igazítva.
- **Tétel küldése kamionra modal & kalkuláció:**
  - Letisztítottuk a modalt: eltávolításra kerültek a redundáns mértékegység feliratok (`EU PLT`, `EU raklap`) és a felesleges mentés gomb.
  - Pontosításra került a rendelkezésre álló raklaphelyek kalkulációja és a kamionra küldés mennyiségi logikája.
  - A kamionra küldés előtt validáció figyelmeztet, ha a `#/PLT` (váltási egység) nincs kitöltve.
- **Automatikus mentés (Auto-save):**
  - A jobb oldali Áru igény táblázat `#/PLT` mezőjének módosítása mostantól automatikusan, azonnal mentődik az adatbázisba (nem szükséges külön mentés gomb).
- **Tétel szétbontása (Split funkció):**
  - Az Áru igény táblázatba bekerült egy kék `+` gomb.
  - Kattintásra megnyílik a *Rendelés szétbontása* modal (jelenlegi kartonszám vs. új kartonszám), amellyel a tételek tetszőleges kartonmennyiségre bonthatók (pl. 100 karton -> 80 és 20).
- **Tétel törlése:**
  - Különálló törlés oszlop jött létre kuka ikonnal (**🗑️**) a fejlécben, és egy fehér háttéren piros **"✕"** törlés gombbal, amely megerősítés után törli a hátralévő rendelési igényt.

---

### 2. ALDI – Komissió Utasítás & PDA szinkronizáció
- **Valós idejű PDA szűrés:**
  - A *Komissió utasítás* fül táblázata kizárólag azokat a kamionokat jeleníti meg, amelyeknél a Rakodások oldalon a PDA ikon aktív (színes).
  - Ha a felhasználó inaktívvá teszi (kiszürkíti) a PDA ikont, a kamion automatikusan és azonnal eltűnik a Komissió fülről.
  - A Komissió fülre váltáskor a rendszer minden alkalommal frissíti az adatokat a szerverről.
- **Komissió megtekintése modal kereső:**
  - Eltávolításra került a redundáns kamionszám mező a fejlécből.
  - A helyére egy valós idejű, terméknév alapú keresőmező került (*Termék keresése*), amellyel az adott kamion tételei között lehet dinamikusan szűrni.

---

### 3. Göngyöleg Típusok modul (ADMIN) & Adatbázis bővítés
- **Adatbázis migráció (`ref_packaging_types`):**
  - Bővítettük a táblát az alábbi mezőkkel: `category` (Fajta), `tare_weight_kg` (Tára súly kg), `width_cm` (Szélesség cm), `length_cm` (Hossz cm), `height_cm` (Magasság cm), `is_deposit_required` (Betét díjas), `is_inventory_tracked` (Göngyöleg leltárban szerepel).
- **CSV Adatimport (`Göngyöleg típusok .csv`):**
  - A projekt gyökerében lévő CSV fájl teljes adattartalma (32 db IFCO, Europool, Magyar rekesz, Raklap, stb.) bekerült a központi adatbázisba.
- **Admin felület továbbfejlesztése:**
  - Az általános adminisztrációs táblázatgenerátor kiegészült a logikai (`boolean`) típusok kezelésével.
  - A táblázatban a logikai állapotok **✅ / ❌** formájában jelennek meg.
  - Új tétel rögzítésekor és szerkesztésekor a *Betét díjas* és *Göngyöleg leltárban szerepel* mezők **jelölőnégyzetként (checkbox)** szerkeszthetők.

---

## 🗄️ Érintett Fájlok
- `Access UI/index.html` (Verziószám: V0.8.2)
- `Access UI/src/modules/aldi_rakodas.js`
- `Access UI/src/modules/aldi_rendelesek.js`
- `Access UI/src/modules/admin.js`
- `server/src/routes/aldi_cross_docking.js`
- `server/src/db/migrations/20260827023500_add_packaging_type_columns.js`
- `server/import_packaging_csv.js`
- `Göngyöleg típusok .csv`
