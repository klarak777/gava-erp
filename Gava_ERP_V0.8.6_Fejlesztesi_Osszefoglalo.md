# Gava ERP – V0.8.6 Heti lekötés javítások

Dátum: 2026-09-10. Állapot: helyi javítás; az éles telepítés és migráció még nem történt meg.

## Akció és rendelés

Az akció tényleges kezdőnapjától haladva: 4 nap esetén 30/30/22/18%, 3 nap esetén 40/40/20%, 2 nap esetén 70/30%. A szeptember 3–6. közötti, 2686 kartonos Körte-akció csütörtök–vasárnapra 806, 806, 591, 483 kartont ad. Másik hét akciója nem írja felül a normál becslést; az évváltás is támogatott.

Elsőbbség: tényleges rendelés (a nulla is) → akciós becslés → normál becslés. Normál és akció ugyanarra a napra nem adódik össze. Csak a current rendelésverzió számít, a szállítási dátum alapján. A terméktörzs kapcsolása nem sokszorozza meg a rendelést; ellentmondó GTIN–cikkszám kapcsolat hibát jelez.

## Készlet

A hét szerda–kedd. Minden újraszámítás a heti nyitókészletből indul.

- Rendelkezésre álló = előző napi záró + aznapi érkező.
- Megjelenített hiány = max(0, −rendelkezésre álló).
- Záró = rendelkezésre álló − aznap érvényes fogyás.

Pénteken a szerdai és csütörtöki fogyás csökkenti a nyitóállapotot. A pénteki fogyás a szombati nyitóban jelentkezik. Külön keddi zárókészlet-oszlop nincs.

Korábbi hetek minden napja látható; az aktuális héten csak a mai nap értékei jelennek meg. A többi nap a háttérben továbbra is beleszámít. A naptári nap Budapest időzónáját használja.

A látható Heti lekötés öt másodpercenként ellenőrzi az adatokat és a napváltást. Gépelés és folyamatban levő készletmentés közben nem frissít a bevitelre. Fülváltáskor is újra lekérdez. Ez rövid késleltetésű lekérdezés, nem szerveres push.

## Feltöltés

Egy gomb, tallózás és behúzás használható; XLSX szükséges. A Keresleti/Normál/HLK és Terv/Akciós/HLA nevek felismerhetők.

Dátumos fájlnál a kezdődátumhoz tartozó, előző vagy aznapi szerdával kezdődő hét számít. A 03.09.2026–09.09.2026 minta KW36-ra kerül.

Dátum nélkül az első feltöltés KW36. A hiányzó másik típus ugyanahhoz a héthez kapcsolódik; új azonos típus a következő hetet indítja. Változatlan fájl ismétlése nem léptet. A „Kiválasztott hét javítása” jelölővel a módosított, dátum nélküli fájl kifejezetten a kijelölt hetet javítja. Évfordulón KW01 következik.

Az Excel ellenőrzése megelőzi a fájl írását és az adatbázissorok cseréjét. Egyedi, verziózott fájlnevek készülnek, „… KW36 HLK.xlsx” vagy „… KW36 HLA.xlsx” végződéssel. Hibás Excel nem írja felül a korábbi fájlt.

A célmappa továbbra is RAKTAR_PATH/Gava Hungria System/ERP ALDI/Heti lekötés/<év>. Windows alapgyökér: \\192.168.1.5\raktar; Linux: /mnt/raktar. Más heti rendelési mappát igazolt elérési út nélkül nem állítottunk be.

## Adatkapcsolat és telepítés

Az azonosítás ALDI-cikkszámon alapul. A kód nem ment chain_products azonosítót a products táblára mutató mezőbe. A megjelenített név az ALDI törzsből, hiányában az Excelből származik.

Új migráció: 20260910010000_fix_weekly_commitment_identity.js. Hozzáadja az Excel terméknevének mezőjét, megszünteti a hibás tétel-ID használatát, és ahol nincs ütközés, kitölti a korábbi készletsorok cikkszámát a kapcsolt termékkódból. A feloldhatatlan régi készletsorok kézi egyeztetést igényelnek; nem töröljük őket.

A készletmentés csak az elküldött mezőt módosítja. Sikertelenségkor látható hibaüzenet és a szerver adatainak visszatöltése történik; a tranzakció visszagörget.

## Ellenőrzés

Hat célzott teszt sikeres: Körte és egyéb akciós elosztások, évváltás, tényleges nulla elsőbbsége, pénteki nyitókészlet és érkező, budapesti éjfél, fájltípus/hét-felismerés, hibás Excel visszagörgetése. Több eset közös tesztben szerepel.

56 frontendmodul és a módosított backend szintaktikai ellenőrzése sikeres. A teljes tesztcsomag két korábbi PDA-súlytesztje eltér a jelenlegi PDA-kódtól; e javítás ezeket nem módosítja. Böngészős és éles DO-ellenőrzés nem történt.

---

## DigitalOcean – Élesítési Útmutató (Docker konténer környezet)

A DigitalOcean szerveren az alkalmazások Docker konténerekben futnak a `docker-compose.prod.yml` definíció alapján.

### 1. SSH csatlakozás és projekt mappa
```bash
ssh root@<DO_SZERVER_IP>
cd /root/gava-erp
```

### 2. Legfrissebb forráskód lehúzása
```bash
git pull origin master
```

### 3. Backend konténer újraépítése és újraindítása
Mivel a backend Node.js forráskódja a Docker build során beépül a `gava_erp_prod_api` konténerbe (nem bind-mount), a backend módosítások és az új migrációs fájlok érvényesítéséhez újra kell építeni a konténert:
```bash
docker compose -f docker-compose.prod.yml up -d --build gava_api
```
*(Régebbi Docker esetén: `docker-compose -f docker-compose.prod.yml up -d --build gava_api`)*

> **Megjegyzés:** A konténer indulásakor a `package.json` szerinti `npm start` automatikusan lefuttatja a migrációkat (`npm run migrate && node server.js`).

### 4. Migráció ellenőrzése / kézi futtatása (szükség esetén)
```bash
docker compose -f docker-compose.prod.yml exec gava_api npm run migrate
```
vagy közvetlenül a konténernévvel:
```bash
docker exec -it gava_erp_prod_api npm run migrate
```

### 5. Frontend frissítése (Access UI)
Mivel az `Access UI` mappa közvetlen volume csatolással (`./Access UI:/usr/share/nginx/html:ro`) fut az Nginx alatt, a fájlok a `git pull` után azonnal elérhetők. Opcionálisan az Nginx újratölthető:
```bash
docker compose -f docker-compose.prod.yml exec gava_frontend nginx -s reload
```

### 6. Ellenőrzés és logok
```bash
# Konténerek státusza
docker compose -f docker-compose.prod.yml ps

# Backend logok figyelése
docker compose -f docker-compose.prod.yml logs -f --tail=50 gava_api
```

### 7. Böngésző gyorsítótár ürítése (kliens oldalon)
A módosult frontend JS fájlok miatt kötelező a böngészőben: **Ctrl + F5** (vagy `Ctrl + Shift + R`).

