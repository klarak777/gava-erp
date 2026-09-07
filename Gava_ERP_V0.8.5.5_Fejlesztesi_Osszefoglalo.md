# GAVA ERP V0.8.5.5 - Fejlesztési Összefoglaló (Az elmúlt 12 óra módosításai)

**Kiadás Dátuma:** 2026.09.07.
**Verzió:** V0.8.5.5

## Tartalmi és Logikai Módosítások

### 1. ALDI Rakodás és Komissiózás (PDA & Asztali Felület)
- **Komissiózás mentési hibák javítása (Backend):** A `pda.js` végpontban (`processPick`) javítva lett egy hiba, amely miatt a PDA komissiózás megszakadt, mert hiányoztak az `aldi_truck_id` és a `product_name` adatok a részletes `aldi_commission_lines` naplózásból. Ezzel a komissiózások adatbázisba történő lementése ismét stabil.
- **Raklap típus betöltés a PDA-n:** A PDA UI (`commission.js`) kódjában javítva lett a már megkezdett komissiózások betöltése, így a rendszer helyesen beazonosítja és kiválasztja a korábban megadott raklaptípust a legördülő menüben.
- **Vizuális fejlesztések az asztali felületen (Kamion szerkesztő):** 
  - A tételekhez tartozó bruttó és nettó súly megjelenítése dinamikussá vált. Amikor egy tétel már el van kezdve a PDA-n (readonly mód), a rendszer elegánsan, százalékos formátumban írja ki a súlyt (pl. `150 kg (80%)`).
  - Hozzáadásra került egy zöld folyamatjelző háttér (gradient) a táblázat celláiban, amely vizuálisan is mutatja a komissiózás készültségi fokát.
- **Auto-save (Automatikus mentés) védelem:** Az asztali felületen módosításra került a mentési logika, hogy a PDA által számolt és zárolt (readonly) súlyadatokat az asztali auto-save funkció véletlenül se tudja felülírni vagy kinullázni.

### 2. Szintaktikai Hibajavítások
- **Eltűnő menüsor javítása:** Kijavításra került az `aldi_rakodas.js` modulban egy template string escape hiba (felesleges visszaperjel karakterek), amely megbénította a HTML sablon renderelését és a főmenü eltűnését okozta a felületen.

### 3. Tesztelés és Stabilizáció
- Megtörtént a nettó súly mentési folyamatának átvizsgálása a backend `processPick` folyamatában, a rendszer már garantálja, hogy a helyesen megadott bruttó súlyokból a PDA rendben kiszámítja és lementi a nettó súlyt.
