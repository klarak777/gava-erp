# Fejlesztési Napló - 2026. 08. 26.

Az alábbi összefoglaló a rendszer legutóbbi módosításait, új funkcióit és javításait tartalmazza.

## 1. ALDI Rakodás - Új Kamion Rögzítése
- **Egyszerűsített rendszám megadás:** A "Vontató rendszám" és "Pótkocsi rendszám" mezők helyett egyetlen, közös "Rendszám" mező került bevezetésre.
- **Kamionszám automatizálás:** A rendszer mostantól automatikusan megkeresi az adatbázisban a legutóbbi ALDI kamionszámot (pl. AL01), és automatikusan inkrementálva ajánlja fel a következőt (pl. AL02).
- **Szabad helyek számítása (EU Raklap):** Az új kamion rögzítő ablakba bekerült egy „Szabad helyek” (EU raklap) számláló, ami folyamatosan mutatja a fennmaradó helyet a kamionon (maximum 33 raklap).
- **Felesleges vezérlők eltávolítása:** Eltávolításra kerültek a „Küldendő kartonszám”, „Karton / Raklap” és „Kalkulált raklap” szükségtelen kalkulátor mezők.

## 2. Rakodási Táblázat Bővítése és Autocomplete
- **Új oszlopok a táblázatban:** A kamionra rakott tételek táblázata új mezőkkel bővült, hogy teljeskörű információt nyújtson: 
  *TERMÉK, RENDELT KARTONSZÁM, SZÁLLÍTHATÓ # / RAKLAP, RAKLAP, PARTNER, RENDELÉSI SZÁM, RENDELÉS TÍPUSA, CÉL LOKÁCIÓ, BRUTTÓ KG, NETTÓ KG*.
- **Adatbázis támogatás:** Az adatbázis (migration) felkészítésre került a fenti adatok, valamint a *Göngyöleg típus*, *Tára súly*, *Származási ország*, *Raklap típus* és *Lot szám* tárolására.
- **Gyors keresés (`datalist`):** A lenyíló menük helyett mostantól beépített keresővel ellátott autocomplete mezők segítik a gyorsabb gépelést és kiválasztást a termékek, göngyölegek, országok és raklapok esetében.

## 3. Admin Modul - Új Törzsadat Tárhelyek (Referencia táblák)
Az Adminisztrációs modulba (adatbázissal együtt) 3 új menüpont és adatkör került bevezetésre, amelyekből a rakodási felületek a lenyíló listáikat táplálják:
1. **Göngyöleg típusok** (`ref_packaging_types`)
2. **Származási országok** (`ref_origin_countries`)
3. **Raklap típusok** (`ref_pallet_types`)

*Ezek az admin felületen keresztül mostantól szabadon bővíthetők és szerkeszthetők.*

## 4. ALDI Komissió Megtekintése - "Taskbar" Ablak
- **Külön ablakos (Window) nézet:** A komissió nézet kikerült a fő képernyőbeágyazásból, és mostantól önálló, mozgatható, és a Tálcára (Taskbar) lecsukható ablakként nyílik meg, így közben más felületek is használhatók maradnak.
- **Csak olvasható mód:** A komissió nézetből eltávolításra került a "➕ TERMÉK" gomb és a törlés funkció, a lista mostantól teljesen "Read-only" (csak olvasható).
- **Valós kamion tételek listázása:** A felület mostantól pontosan a kamionra felrakott tételeket (`truck_lines`) listázza ki.
- **Egyszerűsített szűrők:** A fő nézetből (summary) kikerült a feleslegessé vált "Kamionszám választó" lenyíló lista.

## 5. Globális Kereső Logika Módosítása (Substring Match)
- **Működés változása:** Az egész rendszerben (Admin táblázatok, Aldi rendelések, Kamion szerkesztés autocomplete, Rakodás modul szűrői) megváltozott a keresési logika.
- **Karakterlánc egyezés (`includes`):** A korábbi kezdőkarakteres (`startsWith`) keresés helyett a rendszer bárhol előforduló szótöredékre is keres. (Pl. az "alma" kifejezésre most már megtalálja a "Piros alma" és a "Zöld alma" találatokat is, nem csak az "Alma" kezdetűeket.)
