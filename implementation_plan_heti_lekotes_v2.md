# Heti Lekötés - Továbbfejlesztés és Finomítás

A kért módosításokat megvizsgáltam, és az alábbi tervet állítottam össze a megvalósításra. Mivel a feladat több logikai pontot is érint (különösen a fájlok automatikus hetekhez rendelését és a napi rendelések becsatolását), kérlek, olvasd át a nyitott kérdéseket!

## > [!WARNING] Nyitott Kérdések (Kérlek, ezekre válaszolj jóváhagyás előtt!)

1. **KW érték (Hét) automatikus növelése:**
   Azt írtad: *"A dokumentum feltöltésnél ne kelljen megadni a hetet, mert minden feltöltésnél ugrik egyet és kezdjük a KW36-től."*
   Mivel egy héthez kétféle fájlt is fel lehet tölteni (Keresleti és Terv), hogyan tudja a rendszer, hogy mikor kell ugrania a következő hétre? 
   *Javaslatom:* A felületen kiválasztott hétre (pl. KW36) tölti fel a rendszer a fájlt (a fájlnévből felismerve, hogy Keresleti vagy Terv). A "Hét" legördülőben pedig lesz egy gomb/opció: `+ Új hét (KW37) indítása`. Így a felhasználó pontosan irányítja, mikor lépünk a következő hétre, de nem kell manuálisan beírnia a számot. Megfelel ez így?

2. **Jövőbeli napok elrejtése:**
   Azt írtad: *"Figyeljen milyen naptári nap van, és csak az addig tartó becsült értékeket jelenítse meg és vonja le a raktár készletből"*.
   Ez azt jelenti, hogy ha például csütörtök van, akkor a táblázatban a péntek, szombat stb. oszlopokban egyáltalán ne is látszódjon a becsült szám (csak egy üres cella vagy kötőjel legyen), és a hiány is csak a csütörtöki állapotot mutassa? Vagy a jövőbeli számok halványan látszódjanak, de a Hiány mező ne göngyölítse őket?
   *Javaslatom:* A jövőbeli napoknál a Becsült/Rendelt cellában egy kötőjel `-` jelenik meg, és a készlet/hiány göngyölítés megáll az aktuális napnál (a jövőbeli napokra a legutolsó kiszámolt készletet és hiányt mutatja).

## Proposed Changes (Tervezett Módosítások)

### 1. Napi rendelések (Rendelt) összekötése
- **Backend:** A `GET /api/v1/aldi-weekly-commitments/:year/:week_number` végpontot kibővítem. Kiszámolom az adott ALDI hét (Szerda-Kedd) pontos naptári dátumait.
- Lekérdezem a `aldi_daily_orders` és `aldi_daily_order_lines` táblákat ezekre a dátumokra.
- A `chain_products` tábla segítségével összekötöm a `gtin` kódokat a `cikkszám` (article_number) értékekkel, így a backend pontosan tudni fogja, melyik napra, melyik termékből hány karton a valós `Rendelt` mennyiség.
- **Frontend:** A Javascript a `Becsült` érték helyett a valós `Rendelt` értéket fogja felhasználni a levonáshoz, ha az már létezik az adott napra.

### 2. Termék név és UI Stílusok
- **Backend:** A `chain_products` táblából kinyerem a valós `product_name`-t a `cikkszám` (display_name) alapján.
- **Frontend:** A `display` (cikkszám) helyett a termék valós neve jelenik meg.
- A termék neve és az akciós napok Becsült értékei **zöld** színnel lesznek kiemelve.
- Az Akció időszak oszlop **okkersárga** (#d97706) háttérszínt kap.

### 3. Egységes Feltöltés és Fájlmentés
- **Frontend:** A két feltöltés gomb helyett egyetlen "📥 Fájl feltöltése" gomb lesz. Ha rákattintasz, tallózhatod a fájlt.
- A rendszer a fájlnévből (`Keresleti` vagy `Terv`) automatikusan eldönti a típust. Ha egyik szót sem tartalmazza a fájlnév, hibaüzenetet ad.
- **Backend:** A fájlokat a megadott GAVA szerver útvonalra mentem (ahol a Heti rendelés fájlok vannak), a következő néven: `KW<szám> HLK.xlsx` (keresleti) és `KW<szám> HLA.xlsx` (akciós).

### 4. Dátum-vezérelt Göngyölítés
- **Frontend:** Beépítek egy logikát, ami megnézi az aktuális dátumot. Csak az aktuális napig (visszamenőleg a hét szerdájáig) vonja le a raktárkészletből a rendeléseket. A jövőbeli napok levonásai nem rontják a mai Hiány adatot.

## Verification Plan
1. A backend végpontok frissítése után lokálisan kipróbálom a Hét váltást és a fájl feltöltést egy teszt Excel fájllal.
2. Megnézem, hogy a valós rendelések (a korábban az ALDI Napi Rendelésnél feltöltött adatok) megjelennek-e a táblázatban, és felülírják-e a becsült adatokat a göngyölítésnél.
3. Kérem a felhasználót, hogy a lokális felületen validálja az új logikát és a színeket.
