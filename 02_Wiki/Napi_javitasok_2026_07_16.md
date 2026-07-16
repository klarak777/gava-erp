# Napi javítások és fejlesztések - 2026. 07. 16.

## 1. Verzió frissítése
- A felület verziószáma frissítve lett **V0.5.5**-re.

## 2. Partnerek deduplikációja és tisztítása
- Az `AGROPONIENTE` és egyéb duplikált partnerek adatbázis-szintű teljes tisztítása megtörtént. 
- Egy új, intelligens (fuzzy) szövegkereső algoritmussal további 69 név-duplikáció és 7 elírásos duplikáció (pl. `OLYMPIC FRUIT` vs `OLYMPIC FRUITS`, `DELGAFRUIT` vs `DELGAFRUITS`) került összevonásra.
- Az összes kapcsolódó tábla (`shipment_lines`, `product_demands`, `finance_transport_lines`) idegen kulcsai (foreign keys) automatikusan frissítve lettek a fő partnerek azonosítójára, a felesleges rekordok pedig törlésre kerültek.

## 3. CSV Importálás és Szinkronizáció
- A `Partner.csv` adatbázis tisztítása során eltávolításra kerültek a "NE HASZNÁLD" rekordok, a duplikátumok, és az üres címmel/adószámmal rendelkező sorok. (Megmaradt: 3576 tisztított sor).
- Egy új import script intelligens szóhatár-alapú párosítással illesztette a CSV adatait a már meglévő (rövidített nevű) partnerekhez. (pl. `Delgafruits S.L.` párosítva a `DELGAFRUITS` partnerhez).
- **Eredmény:** 85 partner adószáma, címe és hivatalos bizonylati neve frissítve lett a meglévő adatbázisban, miközben a UI-on a megszokott rövidített nevük megmaradt. További 3491 új partner került beillesztésre.

## 4. Fuvarozó kategória bevezetése
- Kiderült, hogy a fuvarozó cégek külön táblában (`transporters`) szerepeltek.
- Írtam egy algoritmust, ami a 158 fuvarozót automatikusan átszinkronizálta a `partners` táblába. Ebből 71 cég már benne volt (ezek megkapták a "fuvarozó" típust is), és 87 új cég került beillesztésre.
- **UI frissítések:**
  - A partnerek szűrőjébe (dropdown) bekerült a "Fuvarozók" opció.
  - A fuvarozó partnerek sárga badge-t kaptak a listában.
  - A partner szerkesztő modal "Típus" legördülő menüjének az értékei (`vevő`, `szállító`, `fuvarozó`, `ügynök`, `egyéb`) szinkronba kerültek a backend adatbázis aktuális, magyar nyelvű enum értékeivel.

Minden változtatás sikeresen kommitolva és pusholva lett a távoli (GitHub) repository-ba.
