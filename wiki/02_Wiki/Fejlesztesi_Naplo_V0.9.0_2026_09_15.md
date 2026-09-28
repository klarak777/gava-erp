# GAVA ERP – V0.9.0 Fejlesztési Összefoglaló

**Dátum:** 2026-09-15  
**Verzió:** V0.9.0  
**Érintett modulok:** ALDI Rendelések (Heti lekötés, Heti árak, PDA, Backend API, PostgreSQL Adatbázis)  

---

## 1. Heti lekötés: „⚙ Beállítás” funkció (Eloszlási százalékok szerkesztése)

A Heti lekötés fül fejlécében egy új **⚙ Beállítás** gomb került elhelyezésre (egy feltöltött hét kiválasztása után válik aktívvá), amellyel a heti előrejelzés napi felosztási kulcsai rugalmasan és precízen finomhangolhatók.

### 1.1. Szerkeszthető profilok és időszakok (3 táblázat, 7 időszak)
1. **Akciós profilok:**
   - **2 napos akció:** Péntek – Szombat (alapértelmezett: 70% / 30%)
   - **3 napos akció:** Vasárnap – Kedd (alapértelmezett: 40% / 40% / 20%)
   - **4 napos akció:** Szerda – Szombat (alapértelmezett: 30% / 30% / 22% / 18%)
2. **Akción kívüli (nem-akciós napok) profilok:**
   - 2 napos akció melletti napok (Sze, Cs, V, H, K)
   - 3 napos akció melletti napok (Sze, Cs, P, Szo)
   - 4 napos akció melletti napok (V, H, K)
3. **Normál (7 napos standard) profil:**
   - Teljes hét Szerdától Keddig (alapértelmezett: 17%, 17%, 17%, 13%, 14%, 11%, 11%)

### 1.2. Üzleti és biztonsági szabályok
- **Szigorú 100%-os összeg-validáció:** Mindegyik időszaknak külön-külön pontosan **100.00%**-ot kell kiadnia. Nullás érték és legfeljebb két tizedesjegy megengedett. Üres mező, negatív szám vagy 100%-tól eltérő összeg esetén a felület hibaüzenetet ad és **letiltja a mentést**.
- **Mentési jóváhagyás:** Mentés előtt a rendszer megerősítő kérdést jelenít meg az újraszámításhoz.
- **Heti szintű hatókör:** A módosítás kizárólag a kiválasztott hétre mentődik; a korábbi és jövőbeli hetek változatlanok maradnak.
- **A tényleges rendelés prioritása:** A mentés után a becslések és a zárókészletek azonnal újraszámolódnak, de a tényleges napi rendelések (beleértve a 0 db-os rendelést is) továbbra is elsőbbséget élveznek a becsült értékekkel szemben.
- **Párhuzamos mentések elleni védelem (Optimistic Locking):** Az `aldi_weekly_commitments` táblában tárolt `rates_version` megakadályozza, hogy egymás utáni vagy egyidejű mentések felülírják egymás munkáját.

---

## 2. Heti árak: Feltöltési védelem és felülírás-kezelés

1. **Szállítási időszak alapú hétazonosítás:**
   - Az algoritmus a "Szállítási időszak" oszlop első szerdai napja alapján határozza meg a hét számát és határait. A heti keretből (Szerda – Kedd) kilógó dátumokat a rendszer automatikusan a keretbe csonkolja.
2. **Duplikáció- és felülírás-kezelés (409 Conflict):**
   - **Azonos tartalom:** Ha az adott hétre már pontosan azonos tartalmú Excel létezik, a rendszer figyelmeztetést ad, és elutasítja az ismételt feltöltést.
   - **Eltérő tartalom:** Ha a fájl ugyanarra a hétre vonatkozik, de a tételekben eltérés van, egy megerősítő felugró ablakban felajánlja a hét felülírását (`overwrite`).

---

## 3. Incoterms (DDP, DPT) tisztítás és pénznem-formázás

1. **Incoterms feliratok eltávolítása:**
   - A `REKESZKÖLTSÉG` és `EGYSÉGKÖLTSÉG` árakból a `DDP`, `DPT`, `EXW`, `FCA`, `CPT` stb. kereskedelmi jelölések törlésre kerültek mind a feltöltési beolvasáskor, mind a frontend táblázatokban és modallapokon.
   - Adatbázis-migráció (`20260915030000_strip_incoterms_existing_prices.js`) tisztította meg a már rögzített adatokat.
2. **Forint (HUF / Ft) és Euró (EUR / €) formázása:**
   - **Forint (HUF):** A forintnak nincs váltópénze, ezért a főtáblázatban, modalban és adatbázisban a tizedesjegyek (pl. `,00`) teljesen le lettek vágva (pl. `Ft 5250`, `Ft 1050`).
   - **Euró (EUR):** Megtartja a tizedesjegyeit; a deviza modalban 2 tizedesjegyre kerekítve jelenik meg (pl. `€ 1,45`).

---

## 4. Adatbázis és Szerver Migrációk

| Migrációs fájl | Funkció |
| :--- | :--- |
| `20260915000000_add_weekly_commitment_rates.js` | `distribution_rates` (JSONB) és `rates_version` (INT) mezők hozzáadása az `aldi_weekly_commitments` táblához. |
| `20260915030000_strip_incoterms_existing_prices.js` | Meglévő heti árak Incoterms és HUF tizedesjegy mentesítése a PostgreSQL-ben. |

---

## 5. Verziófrissítés: V0.9.0

- `Access UI/index.html`: Cím, bejelentkező ablak és fejléc átállítva `V0.9.0`-ra.
- `Access UI/src/main.js`: Modulhivatkozások és cache-buster verzió `v=0.9.0`-ra léptetve.
- `server/package.json`: Verziószám `0.9.0`-ra állítva.
- Automatikus böngésző cache-megkerülés: a módosított fájlok frissítése azonnal érvénybe lép.

---

## 6. Komissiózás és PDA továbbfejlesztések

1. **PDA Komissió Adatok – Szigorú kötelező mező kitöltés:**
   - A PDA komissiózási űrlapján (`Komissió Adatok`) mind a 7 mező kötelezővé vált, piros csillaggal (`*`) megjelölve a felhasználó számára:
     - **Kartonszám:** Pozitív egész szám, amely nem haladhatja meg a még hátralévő rendelt mennyiséget.
     - **Bruttó kg:** Pozitív szám, amely nem lehet kevesebb, mint a göngyöleg és a raklap tára összege.
     - **Göngyöleg típus:** Kötelezően kiválasztandó legördülő menüből.
     - **Göngyöleg tára (/un):** Nem negatív szám (törzsadatból automatikusan betöltve vagy kézzel megadva).
     - **Származási ország:** Kötelezően kiválasztandó legördülő menüből.
     - **Lot szám:** Kötelezően kitöltendő szöveges mező.
     - **Raklap típus:** Kötelezően kiválasztandó legördülő menüből.
   - Bármely mező kitöltetlensége vagy érvénytelen értéke esetén a felület egyértelmű magyar figyelmeztető ablakot jelenít meg, és a kurzort közvetlenül a hibás mezőre helyezi (`focus`).

2. **Komissió utasítás – Állapotsáv az ÖSSZEKÉSZÍTÉS ÁLLAPOTA oszlopban:**
   - A Komissió utasítás fül összefoglaló táblázatában az `ÖSSZEKÉSZÍTÉS ÁLLAPOTA` oszlopban a százalékos numerikus érték mellé beépítésre került a folyamatjelző állapotsáv.
   - A sáv megjelenése és stílusa pontosan megegyezik az **ALDI-Rakodás** felület "Állapot" oszlopának dizájnjával (lekerekített szürke keret, zöld folyamatjelző kitöltés, százalékos érték dinamikus színkódolással mellette elhelyezve).

