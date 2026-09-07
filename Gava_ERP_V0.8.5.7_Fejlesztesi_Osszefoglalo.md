# GAVA ERP V0.8.5.7 - Fejlesztési Összefoglaló

**Verzió:** V0.8.5.7
**Dátum:** 2026.09.08.

Ez a dokumentum a V0.8.5.5 és a V0.8.5.7 közötti legfontosabb fejlesztéseket és hibajavításokat tartalmazza.

## 1. ALDI Heti Árak szinkronizáció automatizálása
* **Automatikus párosítás (GTIN alapján):** Ha egy új termék felvitelre kerül a "Lánc specifikus termékek" (chain_products) adattáblába, vagy frissítik annak GTIN azonosítóját, a háttérrendszer (backend) mostantól automatikusan megkeresi azokat a feltöltött ALDI Heti árak sorokat, amikhez eddig nem tartozott termék (árván maradtak), de megegyezik a GTIN kódjuk az új termékével. 
* **Automatikus összekapcsolás:** Az egyező GTIN kódú ár sorokat a rendszer automatikusan hozzárendeli a termékhez, így az árak azonnal aktívvá válnak.
* **UI azonnali frissítése:** Amikor a felhasználó a "Mentés" gombra kattint a Termék adattáblában, az "ALDI heti árak" felület is automatikusan frissül a háttérben, így az imént mentett változások és az automatikusan párosított árak azonnal megjelennek a felhasználói felületen anélkül, hogy az oldalt frissíteni kellene.

## 2. ALDI Rakodás: Raklapok kerekítésének eltávolítása (Pontos törtszámítás)
* **Probléma:** Korábban a rendszer felfelé kerekítette (Math.ceil) a raklapok számát az ALDI rakodási képernyőkön, illetve időnként a mentett (kerekített) adatra támaszkodott, ami pontatlan adatokhoz és hibás teherautó kihasználtsághoz vezetett (például 30 karton / 72 #/PLT = 1.00 raklapként jelent meg 0.42 helyett).
* **Áru Igény táblázat:** Az "Áru igény" táblázat "RAKLAP" oszlopában eltávolításra került a kerekítés. Mostantól a rendszer élőben, dinamikusan kiszámítja a pontos tört értéket (Karton osztva a #/PLT értékkel, két tizedesjegy pontossággal). A rendszer most már csak akkor használja a korábban mentett raklap adatot, ha a #/PLT (karton per raklap) mező üres.
* **Kamion szerkesztése (Modal):** A kamionra rakott tételek listájában szintén eltávolítottuk a kerekítést a "RAKLAP" oszlopból. Itt is a pontos, tört érték jelenik meg.
* **Szabad helyek számítása:** A kamion modaljának alján található "Szabad helyek száma (EU raklap)" összesítő is pontos tört számításra váltott, kerekítés nélkül. (A többi felületen - például a bal oldali kamion összesítő listában - az eredeti kerekítési elvek változatlanok maradtak a kérésnek megfelelően.)

## 3. Technikai Karbantartás és Adatbázis korrekciók
* Készült egy szkript a teszt/hibás adatok (`aldi_stock_locations`, `aldi_commission_lines`) biztonságos törlésére a szerveren, valamint a kamionok (`aldi_truck_lines`) visszaállítására az eredeti állapotukba (komissiózások nullázása, súlyadatok törlése), hogy a fejlesztések valós és tiszta adatokkal legyenek tesztelhetőek.
