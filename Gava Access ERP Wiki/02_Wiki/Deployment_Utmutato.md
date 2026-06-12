# GAVA ERP – Szerver Deployment Útmutató (DigitalOcean)

Ez a dokumentum lépésről lépésre bemutatja, hogyan lehet az alkalmazást a helyi környezetből (GitHub-on keresztül) a DigitalOcean (DO) éles szerverre telepíteni és frissíteni, illetve hogyan kell betölteni a kezdeti adatbázist.

**Éles szerver IP címe / Elérhetősége:** `http://138.68.143.223:3001`
**Szerver mappa:** `/root/gava-erp`

---

## 1. Frissítések telepítése meglévő rendszerre

Amikor a helyi (fejlesztői) gépen módosításokat végzünk (akár frontend, akár backend oldalon), majd azokat felpusholjuk a GitHub `master` ágára, a szerveren a következő parancsokkal lehet frissíteni az alkalmazást.

Minden lépés előtt be kell lépni a projekt könyvtárba:
```bash
cd /root/gava-erp
```

### Lépés 1: A legfrissebb kód letöltése
Húzzuk le a változásokat a GitHub repóból:
```bash
git pull origin master
```

### Lépés 2: A Docker konténerek újraépítése
Bár a frontend (Access UI) fájlok közvetlenül ki vannak vezetve (volume), a biztonságos és teljes körű frissítéshez (például ha a `package.json` vagy a backend forráskód módosult), mindig építsük újra a konténereket a `--build` flag használatával:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
*(Ha modern Docker fut a szerveren, a kötőjel nélküli `docker compose` parancs is használható).*

### Lépés 3: Adatbázis sémák frissítése (Migrációk)
Ha készültek új adatbázis táblák vagy mezők (új migrációs fájlok a `server/src/db/migrations` mappában), ezeket érvényesíteni kell az adatbázison:
```bash
docker exec -it gava_erp_prod_api npm run migrate
```

### Lépés 4: Böngésző gyorsítótár ürítése (Hard Refresh)
Nagyon fontos: A módosítások – különösen a felületen végrehajtott frontend (UI és JavaScript) változások – csak akkor válnak azonnal láthatóvá, ha a felhasználó törli a böngészője gyorsítótárát.
Meg kell nyomni a **Ctrl + F5** (vagy `Shift + F5` / `Cmd + Shift + R`) gombkombinációt a böngészőben!

---

## 2. Teljesen új telepítés és adatbázis betöltés (Üres rendszer inicializálása)

Ha az adatbázis teljesen üres (például először indítjuk el a szervert, vagy töröltük a `gava_db` konténert), akkor a migrációk után fel kell tölteni az adatokat.

### 1. Migrációk futtatása (Táblák létrehozása)
```bash
docker exec -it gava_erp_prod_api npm run migrate
```

### 2. Referencia adatok (Seed) betöltése
A `knex seed:run` létrehozza a szezonokat, fuvarozókat, a raklap váltó táblát, és az admin felhasználót:
```bash
docker exec -it gava_erp_prod_api npx knex seed:run --knexfile knexfile.js
```

### 3. A korábbi CSV adatfájlok bemásolása
Mivel az importáló Node.js szkriptek a konténer gyökerében keresik a fájlokat, a szerver fájlrendszeréből át kell másolni őket a futó API konténerbe:
```bash
docker cp "Transportistas 260605.csv" gava_erp_prod_api:/
docker cp "25-26 Fuvarok összesítö 260621.csv" gava_erp_prod_api:/
docker cp "25-26 Fuvarok összesítö V2.4 260605.csv" gava_erp_prod_api:/
```

### 4. Az import szkriptek lefuttatása
A konténeren belül lefuttatjuk a szkripteket, amelyek beolvassák a CSV-ket és feltöltik az adatbázist (Több száz fuvar és tétel):
```bash
docker exec -it gava_erp_prod_api node import_csv.js
docker exec -it gava_erp_prod_api node import_new_lines.js
```

Ezek után az alkalmazás a szerveren pontosan azokkal az adatokkal fog működni, mint a lokális fejlesztői környezetben.
