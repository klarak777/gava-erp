# CSV vs. Admin Modul – Hiányzó Partnerek Elemzése

**Forrás:** `25-26 Fuvarok összesítö V2 260617.csv`
**Admin aktív lista forrás:** `Reference partnerek.csv`, `Customer partnerek.csv`, `Transport Company partnerek.csv`

> Az alábbi partnerek a CSV-ben szerepelnek, de **NEM** találhatók az Admin modulban (aktív listaként).
> Minden egyes névnél megvizsgáljuk, hogy a **Partnerek adatbázisban** megtalálható-e.

## 1. Reference (Szállítók) – CSV-ben van, Admin modulban NINCS

**Összesen hiányzik az Admin modulból:** 12 db
- ✅ Megtalálható a Partnerek adatbázisban: **12 db**
- ❌ Sehol sem található (teljesen új partner): **0 db**

### ✅ Megtalálható a Partnerek adatbázisban (12 db)

| # | CSV Név | Azonosítás módja | DB Partner Neve | Partner ID | Aktív? |
|---|---|---|---|---|---|
| 1 | `AGRPONIENTE` | `partner_identifiers` | Agroponiente Natural Produce S.L. | 27 | 🟢 Igen |
| 2 | `AXAFRUIT` | `partner_identifiers` | Axarfruit | 34 | 🟢 Igen |
| 3 | `CASI ARIPORT` | `partner_identifiers` | CASI | 41 | 🟢 Igen |
| 4 | `DELGAFRUIT` | `partner_identifiers` | Delgafruits S.L. | 20 | 🟢 Igen |
| 5 | `EUROGROUP` | `partner_identifiers` | EUROGROUP ESPANA | 31 | 🟢 Igen |
| 6 | `EUROGROUP DE` | `partner_identifiers` | Eurogroup Deutschland Gmbh | 4685 | 🟢 Igen |
| 7 | `EUROGROUP ES` | `partner_identifiers` | EUROGROUP ESPANA | 31 | 🟢 Igen |
| 8 | `EURORGOUP DEUTSCHLAND` | `partner_identifiers` | Eurogroup Deutschland Gmbh | 4685 | 🟢 Igen |
| 9 | `GHU` | `partner_identifiers` | GHU | 8 | 🟢 Igen |
| 10 | `LEHMANN` | `partner_identifiers` | LEHMANN & TROOST B.V. | 76 | 🟢 Igen |
| 11 | `OLYMPIC` | `partner_identifiers` | Olympic Fruit B.V. | 14 | 🟢 Igen |
| 12 | `OLYMPIC FRUITS` | `partner_identifiers` | Olympic Fruit B.V. | 14 | 🟢 Igen |

---

## 2. Customer (Vevők) – CSV-ben van, Admin modulban NINCS

**Összesen hiányzik az Admin modulból:** 12 db
- ✅ Megtalálható a Partnerek adatbázisban: **12 db**
- ❌ Sehol sem található (teljesen új partner): **0 db**

### ✅ Megtalálható a Partnerek adatbázisban (12 db)

| # | CSV Név | Azonosítás módja | DB Partner Neve | Partner ID | Aktív? |
|---|---|---|---|---|---|
| 1 | `ANTON DÜRBECK` | `partner_identifiers` | Anton Dürbeck GmbH | 47 | 🟢 Igen |
| 2 | `EUROGROUP` | `partner_identifiers` | EUROGROUP ESPANA | 31 | 🟢 Igen |
| 3 | `EUROGROUP DE` | `partner_identifiers` | Eurogroup Deutschland Gmbh | 4685 | 🟢 Igen |
| 4 | `EUROGROUP ES` | `partner_identifiers` | EUROGROUP ESPANA | 31 | 🟢 Igen |
| 5 | `GEMÜSERING` | `partner_identifiers` | GEMÜSERING | 82 | 🟢 Igen |
| 6 | `GYÜMÖLCSÉRT` | `partner_identifiers` | Gyümölcsért Kft. | 18 | 🟢 Igen |
| 7 | `KÓNYA` | `partner_identifiers` | Kónya István | 5452 | 🟢 Igen |
| 8 | `LEHMANN` | `partner_identifiers` | LEHMANN & TROOST B.V. | 76 | 🟢 Igen |
| 9 | `MANDRESLOOT` | `partner_identifiers` | Mandersloot Expeditiebedrijf B.V. | 68 | 🟢 Igen |
| 10 | `OLYMPIC` | `partner_identifiers` | Olympic Fruit B.V. | 14 | 🟢 Igen |
| 11 | `OLYMPIC FRUITS` | `partner_identifiers` | Olympic Fruit B.V. | 14 | 🟢 Igen |
| 12 | `ROMÁNIA` | `partner_identifiers` | ROMÁNIA | 69 | 🟢 Igen |

---

## 3. Transport Company (Fuvarozók) – CSV-ben van, Admin modulban NINCS

**Összesen hiányzik az Admin modulból:** 7 db
- ✅ Megtalálható a Partnerek adatbázisban: **7 db**
- ❌ Sehol sem található (teljesen új partner): **0 db**

### ✅ Megtalálható a Partnerek adatbázisban (7 db)

| # | CSV Név | Azonosítás módja | DB Partner Neve | Partner ID | Aktív? |
|---|---|---|---|---|---|
| 1 | `FRIGOSPED SK` | `partner_identifiers` | FRIGOSPED SK | 3855 | 🟢 Igen |
| 2 | `HILTOP` | `partner_identifiers` | Hilltop Logisztikai Kft | 1692 | 🟢 Igen |
| 3 | `HZ LOG` | `partner_identifiers` | HZ LOG | 3863 | 🟢 Igen |
| 4 | `PAP` | `partner_identifiers` | PAP | 3884 | 🟢 Igen |
| 5 | `S TRANSPORT` | `partner_identifiers` | S TRANSPORT | 3920 | 🟢 Igen |
| 6 | `SWISS TEMP` | `partner_identifiers` | Swiss Temp Logistics GmbH | 3182 | 🟢 Igen |
| 7 | `THERMO` | `partner_identifiers` | Thermo Épitöipari Tervezö Szervezö És Kivitelezö Kft | 3371 | 🟢 Igen |

---

