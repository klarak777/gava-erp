# Fejlesztési Napló - V0.8.5 (2026.09.03)

## Új funkciók és módosítások

### 1. PDA Komissió Modul Továbbfejlesztése
- **Adatbázis bővítés:** Az `aldi_truck_lines` tábla kibővült az `is_picked` (boolean) és `picked_cartons` (integer) mezőkkel, amelyek a PDA-n történő valós komissiózást követik nyomon.
- **Backend API:** 
  - Létrejött 3 új GET végpont a szótárakhoz (`packaging-types`, `origin-countries`, `pallet-types`), amik az ADMIN modulból kérdezik le a referencia adatokat a PDA számára.
  - Új PUT végpont (`/commission-lines/:id/pick`) a rögzített komissió adatok (súly, göngyöleg, raklap stb.) mentéséhez és nyugtázásához.
- **PDA Frontend (`commission.js`):** 
  - A régi, táblázatos nézetet felváltotta egy 3-lépcsős teljes képernyős folyamat (Lista -> Adatbekérés -> Cél Lokáció).
  - A Típus oszlop mostantól a Raklap típust mutatja a listában.
  - Dinamikus tára súly számítás (Kartonszám × Göngyöleg Tára súly).
  - Vizuális visszajelzés (zöld pipa) a sikeresen komissiózott tételeknél.
  - A PDA emulátor beépített virtuális gombjai (Vissza, Kezdőlap) most már vezérlik a PDA nézeteit.

### 2. ERP Komissió Megtekintése Szinkronizáció
- Az **ALDI-Rendelések** modulban található "Komissió megtekintése" ablak logikája módosítva lett (`aldi_rendelesek.js`). 
- Ezentúl csak és kizárólag azokat a tételeket listázza ki, amelyeket a PDA-n már sikeresen lekomissióztak (`is_picked = true`).

### 3. Verziószám Frissítés
- Az ERP főmenüjében és bejelentkezési képernyőjén a verziószám **V0.8.5**-re módosult.

---

## Szerver (DigitalOcean) frissítési útmutató

A módosítások élesítéséhez a DO szerveren az alábbi parancsokat kell kiadni a projekt mappájában (pl. `/gava-erp` vagy `/var/www/gava-erp`):

```bash
# 1. Frissítések letöltése a GitHub-ról
git pull

# 2. A backend (API) újraépítése és elindítása (ez lefuttatja a legújabb adatbázis migrációkat is!)
docker compose -f docker-compose.prod.yml up -d --build gava_api

# 3. A frontend újraépítése és elindítása (hogy a legújabb JS/HTML fájlok betöltődjenek)
docker compose -f docker-compose.prod.yml up -d --build gava_frontend
```

> **Megjegyzés:** Mivel a felhasználók böngészője esetleg gyorsítótárazhatja (cache-elheti) a régi JavaScript fájlokat, érdemes megkérni őket, hogy a frissítés után nyomjanak egy **Ctrl + F5** kombinációt az oldalon, vagy a PDA emulátoron a "frissítés" ikont.
