---
title: "Access ERP: Fuvarok Összesítő Fejlesztések"
aliases: ["Fuvarok összesítő", "Transportistas", "Transport Cost"]
tags: [wiki, access, erp, vba]
created: 2026-05-20
updated: 2026-05-20
sources: []
---

# Fuvarok Összesítő Fejlesztések (V1.2 → V1.3)

Ez az oldal az MS Access alapú ERP rendszer `Fuvarok összesítő` (Transportistas) moduljának fejlesztéseit és technikai megoldásait dokumentálja.

## Főbb Funkciók és Üzleti Logika

### 1. Költség Allokáció (Transport Cost) – V2 Logika
A rendszer a teljes kamionra vonatkozó fuvardíjat (Transport price) arányosan osztja el a rajta lévő áruk palettaszáma alapján.

**Számítási lépések (V2 – 2026-05-20-tól):**
1. **Összesítés:** Az adott fuvar (Order number + Szezon) összes Normál raklapját és összes Euro raklapját külön-külön összeadjuk.
2. **Egyszeri átváltás:** Az összesített Normál értéket **egyszer** átváltjuk a `NormalToEuro` függvénnyel (pl. 16 Normál → 20 Euro ekvivalens).
3. **Teljes palettaszám:** `Összes Euro + Átváltott Normál összeg` (pl. 13 + 20 = 33).
4. **Soronkénti elosztás:**
   - Csak Euro sor → Total Palets = Euro érték (változatlan).
   - Normál raklapos sor → `arány = sor Normál / Össz. Normál`, `Total = Euro + (Átváltott Normál × arány)`.
5. **Transport Cost per sor:** `Transport price × (sor Total Palets / fuvar Total Palets)`.

**VBA függvények (modul: `modFuvarSzamitas`):**
- `KalkulaldOsszPalettat(OrderNum, Period)` – A teljes fuvar palettaszáma.
- `CalcSorTotalPalets(OrderNum, Period, RowEuro, RowNormal)` – Egy sor palettaszáma.
- `CalcTransportCost(TransportPrice, OrderNum, Period, RowEuro, RowNormal)` – Egy sor fuvarköltségszáma.

**Korábbi V1 logika (elavult):** Soronként konvertálta a normál raklapokat, majd összeadta. Ez pontatlan eredményt adott a `NormalToEuro` nemlineáris természete miatt.

### 2. Intelligens Űrlapszűrők
- A legördülő listák (pl. Fuvarozó) dinamikusan szűkülnek a korábban kiválasztott Szezon alapján.
- Karakterenkénti keresés működik a szabadon gépelhető szövegmezőkön.
- Egymásra épülő szűrők (Szezon + Év) esetén a metszetük (AND logika) alapján frissül az adatlap (Record Source).

## Technikai Megoldások és Tanulságok
- **Ambiguous Name (Kétértelmű név) hiba elkerülése:** A VBA modulokban és az SQL-ben a mezőket egyértelműen kell hivatkozni (pl. `[Tábla].[Mező]`), valamint kerülni kell az azonos nevű modulokat és függvényeket.
- **Folyamatos űrlapok `#Név?` hibája:** Ha a számított mező hivatkozásai (pl. SQL-ben a `[Order number]`) üres (Null) rekordokra futnak rá az űrlap alján lévő új sornál, az "Invalid Use of Null" hibát okoz, ami miatt az egész oszlop `#Név?` lesz. Megoldás: `Nz([Mező]; "")` használata.
- **Kifejezésszerkesztő szintaktika magyar Windowson:** A VBA vesszőt (`,`) használ, míg az Access magyar felületén pontosvessző (`;`) szükséges az argumentumok elválasztásához!

---

## Módosítási napló – 2026-06-01

### Elvégzett fejlesztések a FUVAROK menürendszeren

Az alábbi változtatások kerültek bevezetésre az ERP felhasználói felületen, és közzétéve: [erp-ui-beta.netlify.app](https://erp-ui-beta.netlify.app)

#### 1. `+ Új Rekord` gomb eltávolítva a fő felületről
- **Fájl:** `index.html`
- A globális fejléc toolbar-ból (`#top-bar`) eltávolításra került a `+ Új Rekord` feliratú gomb.
- Indoklás: A gomb nem volt funkcionálisan bekötve, modulonként eltérő hozzáadási logika szükséges.

#### 2. Fuvarmegbízások modul újraírva (`fuvarmegbizas.js`)
- Vezérlők átnevezve: `Megrendelésszám` → `Kamion szám`, `Szállító` → `Fuvarozó` (legördülő), `Periódus` → `Szezon` (19-20 – 25-26)
- Szezonálisan dinamikus Fuvarozó lista: automatikusan frissül szezon váltáskor
- Akciógombok: `Dokumentum megnyitása` (kijelölésfüggő), `Megbízás törlése` (megerősítő popup), `Szűrő törlése`
- `+ Új Rekord` gomb eltávolítva
- Adattáblázat: Dokumentum név, Rakodás nap, Fuvarozó, Kiküldve
- Teszt adatok: KONYA TRANS GHU 240.DOCX, STI KFT LOG 146.DOCX, KONYA TRANS H 269.DOCX, KONYA TRANS GHU 239.DOCX

#### 3. EKAEREK modul újraírva (`ekaerek.js`)
- Azonos elvek, mint Fuvarmegbízásoknál (szezonfüggő szűrők, sorkijelölés radio buttonnal)
- Akciógombok: `Dokumentum megnyitása`, `EKAER Törlése` (megerősítő popup), `Szűrő törlése`
- Adattáblázat: Kamion szám, EKAER_FileName, Load_Date, Fuvarozó, Kiküldve
- Teszt adatok: GHU 238–240, LOG 147–149, H269 (KÓNYA, BILEK, KERMOR)

#### 4. Planning – Tervezés oldal leegyszerűsítve (`planning.js`)
- Tartalom: csak `Fejlesztés alatt...` felirat, egyéb vezérlő nem szerepel.

#### 5. Fuvarok összesítő tábla frissítve (`fuvar.js`)
- Az összes eredeti oszlop megmaradt (29 oszlop, görgetős táblázat, rögzített fejléc)
- Teszt adatok bekerültek: PEACH 7KG / VERMION FRESH / GHU ALDI, NECTARIN sorok, SPAR HU ÜLLŐ/BICSKE (FRUBALMED, WEDNESDAY NIGHT), 2 NECTARIN YELLOW LOOSE (KOPFSALAT)

> **Deploy:** `erp-ui-beta` Netlify projekt – Deploy ID: `6a1cdd834233b25b54845cfb`
