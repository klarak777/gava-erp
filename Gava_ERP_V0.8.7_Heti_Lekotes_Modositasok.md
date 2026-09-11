# Gava ERP – V0.8.7 Heti lekötés módosítások és javítások

**Dátum:** 2026-09-11  
**Verzió:** V0.8.7  
**Modul:** Lekötés & Rendelés tábla (`aldi_rendelesek.js`, `weeklyCommitments.js`, `aldi_weekly_commitments.js`)  
**Cél:** A Heti lekötés számítási, adatkinyerési, nap-eltolási, aggregálási és kerekítési logikájának teljes körű javítása a megadott üzleti szabályok szerint.

---

## 1. Fájlelnevezés a Gava szerveren

A szerverre feltöltött heti Excel fájlok elnevezése letisztult, megszűntek a felesleges időbélyeg- és véletlen azonosító-utótagok:

| Fájl típus | Mentett fájlnév formátum | Példa |
| :--- | :--- | :--- |
| **Keresleti adatok** | `Keresleti adatok KW{hét}.xlsx` | `Keresleti adatok KW37.xlsx` |
| **Rendelési terv** | `Rendelési terv KW{hét}.xlsx` | `Rendelési terv KW37.xlsx` |

- A hét száma (`KW..`) dinamikusan illeszkedik a feltöltött héthez vagy a kiválasztott hét javításához.
- A fájlok célmappája változatlanul az ERP archívuma a raktárszerveren.

---

## 2. Rendelési terv oszlopok és Nap-eltolás (-1 nap)

### 2.1. Excel oszlop-pozíciók (2. sortól kezdődően)
A Rendelési terv Excelben a napok elnevezése formátumtól függően változhat (napnevek vagy dátumok), ezért az algoritmus **fix oszlop-pozíciók (F–L)** alapján olvassa ki a napi kartonértékeket:

| Oszlop | Excel napja | Kapcsolódó naptári nap |
| :---: | :---: | :--- |
| **F** | Csütörtök | Kezdő szerda + 1 nap (`dates[1]`) |
| **G** | Péntek | Kezdő szerda + 2 nap (`dates[2]`) |
| **H** | Szombat | Kezdő szerda + 3 nap (`dates[3]`) |
| **I** | Vasárnap | Kezdő szerda + 4 nap (`dates[4]`) |
| **J** | Hétfő | Kezdő szerda + 5 nap (`dates[5]`) |
| **K** | Kedd | Kezdő szerda + 6 nap (`dates[6]`) |
| **L** | Szerda | **Következő szerda** = kezdő szerda + 7 nap (`dates[0] + 7 nap`) |

### 2.2. A Nap-eltolás szabálya (Excel nap ➡️ UI cél nap)
A Rendelési terv Excelben szereplő adatok nem az Excelben jelölt napra érvényesek, hanem **egy nappal korábbi napra**.  
A Lekötés & Rendelés tábla heti oszlopai: **Szerda – Csütörtök – Péntek – Szombat – Vasárnap – Hétfő – Kedd**.

Ennek megfelelően a kinyert értékek az alábbi cél napokra kerülnek:
- **Excel F (Csütörtök)** ➡️ **UI Szerda**
- **Excel G (Péntek)** ➡️ **UI Csütörtök**
- **Excel H (Szombat)** ➡️ **UI Péntek**
- **Excel I (Vasárnap)** ➡️ **UI Szombat**
- **Excel J (Hétfő)** ➡️ **UI Vasárnap**
- **Excel K (Kedd)** ➡️ **UI Hétfő**
- **Excel L (Szerda, +7 nap)** ➡️ **UI Kedd**

---

## 3. Számítási és újraelosztási logika (Összeg-alapú számítás)

> [!IMPORTANT]
> **Alapszabály:** Az Excel F–L értékei **számítási alapok**, nem a véglegesen közvetlenül megjelenítendő számok. Az Excel napi értékeiből összeg képződik, amely a cél napok százalékos arányában kerül felosztásra.

### 3.1. Dátum szerinti besorolás
Az Excel-dátumok (pl. csütörtök = szept. 3.) alapján dől el, hogy az adott nap az Excelben jelölt akciós időszakba (pl. `03.09. – 06.09.`) esik-e.

### 3.2. Akciós napok számítása
1. Összeadjuk az akcióba eső Excel-napok értékeit:
   $$\text{Akciós összeg} = \sum \text{akciós napi értékek}$$
2. Az összeget megszorozzuk az adott cél nap akciós százalékával:
   - **4 napos akció:**  
     - 1. cél nap (Szerda): **30%**  
     - 2. cél nap (Csütörtök): **30%**  
     - 3. cél nap (Péntek): **22%**  
     - 4. cél nap (Szombat): **18%**
   - **3 napos akció:**  
     - 1. cél nap: **40%**, 2. cél nap: **40%**, 3. cél nap: **20%**
   - **2 napos akció:**  
     - 1. cél nap: **70%**, 2. cél nap: **30%**

### 3.3. Akción kívüli napok számítása
1. Összeadjuk a nem-akciós napok Excel értékeit:
   $$\text{Akción kívüli összeg} = \sum \text{nem-akciós napi értékek}$$
2. Az akción kívüli időszakos százalékok alkalmazása a CÉL napokra:
   - **Vasárnap – Hétfő – Kedd (amikor ez a maradék időszak):**
     - Vasárnap: **20%**
     - Hétfő: **30%**
     - Kedd: **50%**
   - **Szerda – Csütörtök – Péntek – Szombat:**
     - Szerda: **25%**, Csütörtök: **25%**, Péntek: **25%**, Szombat: **25%**
   - **Szerda – Csütörtök – Vasárnap – Hétfő – Kedd (pl. Péntek–Szombat akció esetén):**
     - Szerda: **25%**, Csütörtök: **25%**, Vasárnap: **15%**, Hétfő: **15%**, Kedd: **20%**

---

## 4. Konkrét ellenőrző példa (Körte akció: 03.09. – 06.09.)

### Kiinduló Excel adatok (F–L oszlopok):
- **F (Csü):** 681
- **G (Pé):** 666
- **H (Szo):** 609
- **I (Vas):** 502
- **J (Hé):** 83
- **K (Ke):** 74
- **L (Sze):** 70

### Összegek:
- **Akciós összeg (Csü + Pé + Szo + Vas):** $681 + 666 + 609 + 502 = \mathbf{2458\text{ karton}}$
- **Akción kívüli összeg (Hé + Ke + Sze):** $83 + 74 + 70 = \mathbf{227\text{ karton}}$

### Számított értékek a Lekötés & Rendelés táblában:
| Cél nap a felületen | Eredeti Excel nap | Időszak besorolás | Számítási képlet | Megjelenő egész érték |
| :--- | :--- | :--- | :---: | :---: |
| **Szerda** | Csütörtök (F) | Akciós (1. nap) | $2458 \times 30\%$ | **737** |
| **Csütörtök** | Péntek (G) | Akciós (2. nap) | $2458 \times 30\%$ | **737** |
| **Péntek** | Szombat (H) | Akciós (3. nap) | $2458 \times 22\%$ | **541** |
| **Szombat** | Vasárnap (I) | Akciós (4. nap) | $2458 \times 18\%$ | **442** |
| **Vasárnap** | Hétfő (J) | Akción kívüli | $227 \times 20\%$ | **45** |
| **Hétfő** | Kedd (K) | Akción kívüli | $227 \times 30\%$ | **68** |
| **Kedd** | Szerda (L) | Akción kívüli | $227 \times 50\%$ | **114** |

---

## 5. További javítások a felületen és a háttérben

### 5.1. Mind a 7 nap átvétele a Rendelési tervből
- Korábban csak az akciós napok íródtak be a Rendelési tervből, a többi napon a Keresleti becslés maradt.
- **Javítás után:** Ha egy termékhez van Rendelési terv adat (`daily_values`), a Rendelési tervből kiszámolt **mind a 7 nap** értéke átkerül a táblázatba (az akciós és az akción kívüli napok is az újraelosztási szabályok szerint).
- A normál keresleti adatok kizárólag olyan termékeknél érvényesülnek, amelyek nem szerepelnek a Rendelési tervben.

### 5.2. Napi értékek összeadása több sor esetén (`daily_values` aggregálás)
- Ha egy termék több sorban (pl. külön raktárak szerint) szerepel azonos akciós periódussal, az algoritmus nem felülírja, hanem **összeadja** az egyes napok értékeit (`Number()` típuskonverzióval).

### 5.3. Egész számok egységes kezelése (`Math.round`)
- A **Raktárkészlet / Nyitókészlet** (`initial_stock`), a futó készletszámítás (`futoKeszlet`) és a napi **Érkező** (`inc_*`) mezők mind a felületen, mind a mentéskor, mind a készletmérleg-számításban egész számra kerekítve futnak le.
- Ezzel megszűnt a látható és a háttérben számolt hiánymennyiségek közötti bármilyen kerekítési eltérés.

### 5.4. Visszamenőleges újrafeldolgozás (Reprocess funkció)
- **Végpont:** `POST /api/v1/aldi-weekly-commitments/:id/reprocess`
- **UI gomb:** A Heti lekötés fül tetején elérhető a **"🔄 Napi értékek újraszámolása (Excelből)"** gomb.
- **Működés:** A már korábban feltöltött, szerveren lévő eredeti Excel fájlból újra kiolvassa és elmenti a napi értékeket a tételekhez, anélkül, hogy a felhasználónak újra fel kellene töltenie a fájlokat.
- **Pontosítás:** A szűrés `action_period` szerint történik, megelőzve az eltérő időszakú sorok felülírását.

---

## 6. Módosított fájlok áttekintése

1. `Access UI/src/utils/weeklyCommitments.js`:
   - Excel L oszlop indexének javítása (következő szerda dátuma).
   - Összeg-alapú akciós és akción kívüli újraelosztás (`getNormalRatesForContext`, `estimatedDistribution`).
2. `Access UI/src/modules/aldi_rendelesek.js`:
   - Mind a 7 nap átvétele Rendelési terv esetén (`dailyValues`).
   - `daily_values` aggregálása (összeadás) azonos terméknél.
   - Érkező és nyitókészlet mezők egységes egész számra kerekítése (`Math.round`).
   - "🔄 Napi értékek újraszámolása (Excelből)" gomb és eseménykezelő.
3. `server/src/routes/aldi_weekly_commitments.js`:
   - `/reprocess` végpont implementálása és `action_period` szerinti WHERE szűrése.
   - Készlet és érkező mentése egész számra kerekítve (`Math.round`).
4. `server/src/database/migrations/20260911000001_add_daily_values_to_commitment_items.js`:
   - `daily_values` JSON oszlop a heti lekötés tételek táblájában.

---

## 7. Élesítési útmutató (DigitalOcean)

A módosítások aktiválásához a DigitalOcean szerveren a következő lépések szükségesek:

```bash
# 1. Belépés a projekt mappába
cd /root/gava-erp

# 2. Legfrissebb kód letöltése GitHub-ról
git pull origin master

# 3. Adatbázis migráció futtatása (daily_values mező)
docker compose -f docker-compose.prod.yml exec -T gava_api npx knex migrate:latest

# 4. Backend konténer újraépítése és indítása
docker compose -f docker-compose.prod.yml up -d --build gava_api

# 5. Frontend frissítése (Access UI)
docker compose -f docker-compose.prod.yml exec -T gava_web nginx -s reload
```
