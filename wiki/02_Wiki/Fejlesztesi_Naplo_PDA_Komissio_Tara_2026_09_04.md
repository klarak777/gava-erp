# Fejlesztési Napló – 2026. 09. 04.

## PDA Komissió: kézi kartonszám, maradék számítás, göngyöleg tára kézi bevitel

### 1. Kartonszám nincs előtöltve a vezérlőbe
- A PDA Komissió tételre koppintásakor a kartonszám beviteli mező **üresen indul** – a komissiózott mennyiséget mindig a felhasználó (targoncás) adja meg, függetlenül a rendelt kartonszámtól.
- A rendelkezésre álló **hátralévő** mennyiség placeholder-ként jelenik meg a mezőben (`Hátralévő: N`).
- A lista "Karton" oszlopa mostantól a **hátralévő** mennyiséget mutatja (rendelt − komissiózott); a rendelt/komissiózott érték tooltipben érhető el.

### 2. Kumulatív (részleges) komissió
- A "Megadás" gomb a megadott mennyiséget **hozzáadja** a korábban komissiózotthoz (`picked_cartons` kumulatív), nem felülírja.
- Példa: 50 karton rendelt → 10 komissiózva → a tétel 40 hátralévővel a listában marad → 40 újabb megadásnál a tétel teljesül (`is_picked = true`).
- A zöld pipa (`is_picked`) csak akkor jelenik meg, ha a komissiózott mennyiség eléri a rendeltet.
- Validáció: kötelező pozitív egész szám; a hátralévőt meghaladó érték esetén megerősítő kérdés.
- Az admin "Komissió megtekintése" összesítő (KOMISSIÓZOTT / MÉG HÁTRA VAN oszlopok) változatlanul helyes, mert `SUM(picked_cartons)`-ból dolgozik.

### 3. Göngyöleg tára súly – kézi bevitel, ha nincs tára definiálva
- Ha az ADMIN → Göngyöleg Típusok táblában a kiválasztott típushoz (pl. Fa rekesz) **nincs megadva Tára súly (kg)**, a rendszer **nem számol** automatikusan tára értéket.
- Ilyenkor a "Göngyöleg tára súly" mező **szerkeszthetővé válik** és üresen indul – a felhasználó adja meg kézzel; a kartonszám változtatása nem írja felül.
- Ha a mező kézi módban üresen marad, a mentés figyelmeztetéssel megáll.
- Ha a típushoz van tára súly, a viselkedés változatlan: auto-számítás (tára kg × kartonszám), readonly mező.

### 4. Tétel küldése kamionra – tizedes raklap és háttér kartonszám átadás
- Az ALDI Rakodás modulban javítva a validáció: a küldendő raklap mező elfogad tizedes tört értéket is (pl. 0.5 raklap), és a háttérben a kartonszámok is helyesen átszámításra és átadásra kerülnek a PDA felé.

### 5. PDA Komissió: túllépés piros hiba & blokkolás, illetve léptetés tiltása
- Ha a felhasználó a rendeltnél nagyobb mennyiséget adna meg, az űrlap piros kerettel és hibaüzenettel azonnal jelzi, a "Megadás" gomb letiltásra kerül.
- Kevesebb mennyiség megadásakor a tétel hátralévő mennyisége csökken; ha elfogy (0 marad), a tétel automatikusan eltűnik a komissiózási listából.
- A PDA szám típusú beviteli mezőiben a fel/le nyilakkal (mind a felületi léptető nyilak, mind a billentyűzet ArrowUp/ArrowDown gombjai, mind az egérgörgő) való léptetés letiltva, kizárólag kézi gépelés lehetséges.

## Érintett fájlok / végpontok
- `Access UI/src/modules/aldi_rakodas.js` – tizedes raklap validáció és karton kalkuláció.
- `Access UI/src/modules/pda_emulator.js` – verziószám frissítés iframe URL-ben.
- `PDA UI/css/pda-style.css` – szám beviteli mezők léptető nyilainak elrejtése.
- `PDA UI/index.html` – gyorsítótár frissítés (v=3).
- `PDA UI/js/app.js` – globális billentyűzet és görgő léptetés tiltása.
- `PDA UI/js/views/commission.js` – üres kartonszám mező, hátralévő megjelenítés, piros hibaüzenet túllépéskor, tétel eltávolítás teljesüléskor, tára logika, szám léptetés letiltása.
- `server/src/routes/pda.js` – kumulatív komissiózás logika (picked_cartons növelése, hátralévő kalkuláció).
- `server/src/routes/aldi_cross_docking.js` – háttér adatszinkronizáció javítása.
