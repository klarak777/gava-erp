# Napi javítások és fejlesztések - 2026.07.06. (V0.4.8)

## 1. Menedzser Modul Fejlesztései
- **Teljesen új "Menedzser" nézet:** Kialakításra került a logisztikai "Bevételezve" logika új alapokra helyezve, leválasztva a korábbi Transportistas nézetről.
- **Dinamikus "per" (alszám) generálás:** A korábbi hibás csoportosítási és azonosítási logika át lett írva. A Menedzser modul mostantól a kamion szerkesztő felület (`kamion_szerkesztes.js`) logikáját követi. Nem a `customer` mező, hanem a fuvar (kamion) neve (`order_number` pl. `GHU...` vagy `H...`) alapján szűr, és a partnerek (`ref`) alapján dinamikusan számolja ki a per (`/0`, `/1`, `/2`, stb.) értékeket.
- **Bevételezés mentés (is_received):** A per értékek tárolásának hiánya miatt a bevételezés mentése mostantól a `ref_name` (partner neve) alapján történik. Ez robusztusabb adatbázis frissítést biztosít.
- **Szűrők:** 
  - *Hiányzó fuvarszámla*: Szűri azokat a tételeket, ahol az adott fuvarhoz tartozó számlaszám (`invoice_number`) üres.
  - *Bevételezésre vár*: Csak azokat a sorokat jeleníti meg, amelyeknél a bevételezve állapot hamis.
- **Kamion betöltés hibajavítása:** Egy backend oldali hiba miatt a `shipment_id` törlésre került a hálózati kommunikáció előtt. Ennek következtében a Menedzser felületről rákattintva a kamion számára a "Nem található a kamion" hiba jelentkezett. A `delete line.shipment_id;` sor eltávolításával a hiba megszűnt.

## 2. Adatbázis Migrációk
- Két új migráció készült a bevételezések pontosítására:
  - `019_set_old_records_received.js`: Az összes 2026. Május 31. előtti (vagy aznapi) fuvar megkapta az `is_received = true` státuszt.
  - `020_unreceive_new_shipments.js`: A 2026. Május 31. utáni fuvarok esetében töröltük a véletlenül felkerült `is_received` jelölést, hogy ezen az időponton túl ténylegesen bevételezésre várjanak.

## 3. UI Finomítások
- A `/0` végződésű (`truck_number_per = 0`) kamionszámok esetében a `/0` már rejtve van, a felület tisztán a kamionszámot (pl. `H196`) mutatja. Ezenkívül a `truck_number_per` mindenütt integer (egész szám) értékként van formázva, megszüntetve a tizedesek (pl. `0.0000`) felesleges megjelenítését.
- A **Transportistas modulból** véglegesen eltávolításra került a "Bevételezésre vár" gombhoz kötött eseménykezelő, ami korábban az oldal betöltési hibáját (összeomlását) okozta.

## Verziófrissítés (DO Szerver)
A szerveren a módosítások lekérése után az alábbi parancsok szükségesek a változások (különösen a 2 új migráció) életbe léptetéséhez:

```bash
cd /root/gava-erp
git pull origin main
cd server
npm run migrate
```
Mivel a szerver futtató szkriptje (`npm start`) eleve tartalmazza az `npm run migrate && node server.js` parancsot, ezért a szerver egyszerű újraindítása (vagy ha PM2/systemd futtatja, annak újraindítása) automatikusan lefuttatja a fenti migrációkat.
