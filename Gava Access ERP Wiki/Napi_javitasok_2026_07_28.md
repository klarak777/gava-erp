# 2026.07.28 - Napi javítások és fejlesztések

## Kamion szerkesztés és Szállítólevél kezelés (V0.6.5)

### 1. Szállítólevél feltöltés felugró ablak és gomb kezelése
- **Feltöltés gomb pozíciója és feltételes megjelenítése:**
  - A „📄 + Feltöltés" gomb átkerült a táblázat fejlécéből a többi vezérlőhöz (a Szállítólevél címke alá).
  - A gomb mostantól **kizárólag akkor jelenik meg**, ha a Kamion szerkesztése ablakot a **Transportistas (Fuvarozók)** modulból nyitják meg. Fuvarok vagy Rakodás modulokból indítva a gomb és a szülő konténer is elrejtésre kerül.
- **Reference mező és automatikus kiegészítés javítása:**
  - A felugró ablakon és a táblázat sorain a Reference (Szállító) mezők legördülő és blur eseménykezelői módosításra kerültek, így a kiválasztott érték nem tűnik el fókuszvesztéskor.

### 2. Adatmentési és szűrési logika javítása (Reference mentése raklap nélkül)
- **0 raklapos sorok szűrésének lazítása:**
  - Korábban mind a frontend (`kamion_szerkesztes.js`), mind a backend API (`shipments.js` PUT és POST végpontok) eldobott minden olyan tételsort, ahol a raklapszám 0 volt.
  - Módosítottuk az `activeLines` szűrőt: mostantól a sorok akkor is megmaradnak és mentésre kerülnek, ha a raklapszám 0, de meg van adva érdemi adat (pl. `partner_id`, `partner_name` (Reference), `product_id`, `customer` vagy `destination`).

### 3. Kötelező validáció új kamion rögzítésekor
- **Új kamion létrehozási szabályok:**
  - Új kamion mentésekor a rendszer validálja a bevitelt, és nem engedi a létrehozást, ha nincs megadva:
    1. Legalább **egy sorban érvényes raklapszám** (Euro vagy Normal > 0).
    2. Legalább **egy sorban Reference (szállító)** érték.
  - Hiányosság esetén egy figyelmeztető felugró ablak részletesen jelzi a hiányzó adatokat. Meglévő kamionok szerkesztésére a szabály nem blokkoló jellegű (a korábbi rugalmas logika megmaradt).

### 4. Drag-and-drop sor-átrendezés (Kamion szerkesztő)
- **Vizuális sorrend módosítás:**
  - A Kamion szerkesztése táblázat minden sorának elején megjelent egy **☰ (drag handle)** húzóikon.
  - Bal egérgombbal nyomva tartva a sorok tetszőlegesen fel/le húzhatók és átrendezhetők, miközben egy kék jelzővonal mutatja a beillesztés helyét.
- **Automatikus mentés és kalkulációs függetlenség:**
  - Az átrendezés automatikusan újraszámolja a vizuális pozíciót, de **teljesen független a raklap-, súly- és árkalkulációktól**.
  - Meglévő fuvarok esetén az elengedést követően a háttérben azonnal elmentődik az új sorrend az adatbázisba egy új végponton (`PATCH /api/v1/shipments/:id/reorder`) keresztül.
- **Adatbázis migráció:**
  - Létrehoztuk a `20260728000000_038_add_display_order.js` migrációt, amely egy `display_order` (integer, alapértelmezett: 0) oszlopot ad a `shipment_lines` táblához.

### 5. Verziószám
- A teljes frontend felületen és az `index.html` állományban a verziószám **V0.6.5**-re lett frissítve.

---

## 🛠️ Implementációs útmutató és parancssorok a DO (DigitalOcean) Linux szerverhez

A DO szerveren a Linux környezetben, ahol az adatbázis, a backend és a frontend is külön Docker konténerekben fut (pl. `docker-compose` által vezérelve), az alábbi parancssorokkal lehet biztonságosan élesíteni a V0.6.5-ös verzió módosításait.

### 1. Lépés: Kód frissítése (Git Pull)
Lépj be a projektek gyökérkönyvtárába a szerveren (ahol a `docker-compose.yml` vagy a git repo található), és húzd le a legfrissebb módosításokat:
```bash
# Lépj be a projekt könyvtárába (példa útvonal, igazítsd a szerver valós útvonalához!)
cd /var/www/gava-erp-access

# Módosítások lehúzása a távoli tárolóból
git pull origin main
```

### 2. Lépés: Adatbázis migráció futtatása a Backend konténerben
Mivel új migrációs fájl készült (`038_add_display_order.js`), ezt le kell futtatni az adatbázison a futó backend konténeren keresztül.
*(Megjegyzés: Ha a backend konténered neve nem `gava-backend` vagy `server`, helyettesítsd be a `docker ps` paranccsal lekérdezett pontos konténernévvel!)*

```bash
# Aktív konténerek nevének ellenőrzése
docker ps

# Migráció futtatása a backend konténerben (Docker Compose használata esetén)
docker-compose exec backend npm run migrate

# VAGY közvetlenül docker paranccsal (ha pl. 'gava_backend_1' a konténer neve):
docker exec -it gava_backend_1 npm run migrate
```
*Várható kimenet: `Batch XX run: 1 migrations` (megjelenik a 038-as migráció lefutása).*

### 3. Lépés: Konténerek újraindítása / újraépítése
A backend kód (új `shipments.js` végpont és logika), valamint az új frontend statikus fájlok (V0.6.5 HTML/JS) aktiválásához indítsuk újra a szolgáltatásokat:

```bash
# Docker compose környezetben (újraépíti a módosított konténereket és újraindítja őket)
docker-compose up -d --build

# Ha csak egyszerű újraindítás szükséges (pl. mert volume-ként van becsatolva a kód):
docker-compose restart
```

### 4. Lépés: Verifikáció és Tesztelés
```bash
# Konténerek státuszának ellenőrzése
docker-compose ps

# Backend logok ellenőrzése, hogy nincs-e hiba az induláskor
docker-compose logs -f --tail=50 backend
```

> **Fontos felhasználói megjegyzés:** A böngésző gyorsítótára (cache) miatt az éles felület megnyitásakor nyomni kell egy **Ctrl + F5** (vagy Cmd + Shift + R Mac-en) billentyűkombinációt a böngészőben, hogy garantáltan a friss **V0.6.5** verzió töltődjön be!
