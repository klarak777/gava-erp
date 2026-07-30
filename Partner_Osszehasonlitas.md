# Partner Összehasonlító Jelentés (CSV vs. Adatbázis/ADMIN)

**Forrás CSV:** `25-26 Fuvarok összesítö V2 260617.csv`
**Adatbázis (ADMIN):** Lokális PostgreSQL `partners`, `partner_identifiers`, `transporters` táblák

## Összegző Statisztika

| Kategória | CSV-ben szerepel | Adatbázisban megtalálható | Adatbázisból HIÁNYZIK |
|---|---|---|---|
| **Reference (Szállítók)** | 83 | 62 | **21** |
| **Customer (Vevők)** | 40 | 31 | **9** |
| **Transport Company (Fuvarozók)** | 50 | 49 | **1** |

## 1. Reference (Szállítók) részletezés

### ⚠️ Adatbázisból HIÁNYZÓ Reference-ek (21 db)

| # | CSV-ben szereplő név |
|---|---|
| 1 | AGROPONIENTE |
| 2 | AGROPONIENTE NIJAR |
| 3 | AGRPONIENTE |
| 4 | AXAFRUIT |
| 5 | CASI AEROPORTO |
| 6 | CASI AIRPORT |
| 7 | CASI ARIPORT |
| 8 | COMPAGRI |
| 9 | DELGAFRUIT |
| 10 | EUROGROUP |
| 11 | EUROGROUP DE |
| 12 | EUROGROUP ES |
| 13 | EURORGOUP DEUTSCHLAND |
| 14 | GAVA |
| 15 | GHU |
| 16 | LEHMANN |
| 17 | MALENO Y TORRES |
| 18 | OLASO |
| 19 | OLYMPIC |
| 20 | OLYMPIC FRUITS |
| 21 | WRAPPING |

### ✅ Adatbázisban MEGLÉVŐ Reference-ek (62 db)

| # | CSV Név | DB Azonosító (Rövid név) | DB Partner Teljes Név |
|---|---|---|---|
| 1 | AGRONERVION | AGRONERVION | Agronervion, S.L.U. |
| 2 | AGROPONIENTE NATURAL | AGROPONIENTE NATURAL | Agroponiente Natural Produce S.L. |
| 3 | ANTON DÜRBECK | ANTON DÜRBECK | Anton Dürbeck GmbH |
| 4 | AXARFRUIT | AXARFRUIT | Axarfruit |
| 5 | BERTIPACK | BERTIPACK | Bertipack, S.L. |
| 6 | BILEK | BILEK | BILEK |
| 7 | CASAS ROYES | CASAS ROYES | CASAS ROYES EXPORT S.L. |
| 8 | CASI | CASI | CASI |
| 9 | CASI PARTIDORES | CASI PARTIDORES | CASI PARTIDORES |
| 10 | CLARA | CLARA | CLARA EXPORT, S.L. |
| 11 | CORD | CORD | CORD |
| 12 | CRETAN ROOT | CRETAN ROOT | Cretan Root |
| 13 | DELGAFRUITS | DELGAFRUITS | Delgafruits S.L. |
| 14 | DG69 | DG69 | DG 69, d.o.o., Vrhnika |
| 15 | ECOINVER BIO | ECOINVER BIO | Ecoinver Bio S.L |
| 16 | ESCOBAR | ESCOBAR | Escobar Reyes, S.L. |
| 17 | ESCOFRESH | ESCOFRESH | ESCOFRESH |
| 18 | ESMAR | ESMAR | Esmar Frutas Imp-Exp. SL |
| 19 | EUROGROUP DEUTSCHLAND | EUROGROUP DEUTSCHLAND | Eurogroup Deutschland Gmbh |
| 20 | EUROGROUP ESPANA | EUROGROUP ESPANA | EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U. |
| 21 | EXOTIC FRESH | EXOTIC FRESH | EXOTIC FRESH |
| 22 | EXPOALMA | EXPOALMA | Expoalma S.L. |
| 23 | FA. DE JONG | FA. DE JONG | Fa. De Jong - Fruit |
| 24 | FARAON | FARAON | FARAON EGIPCIO SL |
| 25 | FRANIAL | FRANIAL | FRANIAL |
| 26 | FRESSAN | FRESSAN | FRESSAN |
| 27 | FRUBALMED | FRUBALMED | FRUBALMED SLU |
| 28 | FRUTAS GAVA | FRUTAS GAVA | FRUTAS GAVA |
| 29 | GALLARDO | GALLARDO | GALLARDO |
| 30 | GAVA POLSKA | GAVA POLSKA | Gava Polska Sp. z o.o. |
| 31 | GEMÜSERING | GEMÜSERING | GEMÜSERING |
| 32 | GLOBAL BERRY | GLOBAL BERRY | Global Berry S.L. |
| 33 | GREEN QUALITY | GREEN QUALITY | GREEN QUALITY |
| 34 | GREENCOOP | GREENCOOP | GREENCOOP |
| 35 | GREENYARD | GREENYARD | Greenyard Fresh Spain SA |
| 36 | GYÜMÖLCSÉRT | GYÜMÖLCSÉRT | Gyümölcsért Kft. |
| 37 | IDEAL FRUITS | IDEAL FRUITS | Ideal Fruits, S.l. |
| 38 | KOMPAGRI | KOMPAGRI | KOMPAGRI ESPANA SL |
| 39 | KÓNYA | KÓNYA | KÓNYA ZOLTÁNNÉ |
| 40 | KOPALMERIA | KOPALMERIA | KOPALMERIA S.L. |
| 41 | KOPFSALAT | KOPFSALAT | KOPFSALAT TRADE SL. |
| 42 | KUSEK | KUSEK | KUSEK |
| 43 | LA CALIFORNIA | LA CALIFORNIA | LA CALIFORNIA TRADING ESPANA SL. |
| 44 | LEHMANN & TROOST | LEHMANN & TROOST | LEHMANN & TROOST B.V. |
| 45 | LEVENTE | LEVENTE | LEVENTE |
| 46 | MALENO | MALENO | Maleno Y Torres Exportación S.L. |
| 47 | MANDERSLOOT | MANDERSLOOT | Mandersloot Expeditiebedrijf B.V. |
| 48 | NATURINDA | NATURINDA | NATURINDA, SLNE |
| 49 | NATURNAR | NATURNAR | NATURNAR KRYLUAN SL. |
| 50 | OLYMPIC FRUIT | OLYMPIC FRUIT | Olympic Fruit B.V. |
| 51 | R&M | R&M | R&M |
| 52 | ROMÁNIA | ROMÁNIA | ROMÁNIA |
| 53 | SAN NICOLA | SAN NICOLA | SAN NICOLA GROUP S.R.L. |
| 54 | SENOR TOMATE | SENOR TOMATE | Senor Tomate Kereskedelmi Korlátolt Felelősségű Társaság |
| 55 | SHEBA | SHEBA | SHEBA |
| 56 | SMART | SMART | Smart Fruits S.L. |
| 57 | SOLHERBS | SOLHERBS | SOLHERBS, S.L.U. |
| 58 | SPAR HU | SPAR HU | SPAR HU |
| 59 | SYLVAN | SYLVAN | Sylvan Hungária Zrt. |
| 60 | TOMATO-AL | TOMATO-AL | Tomato-Al |
| 61 | VEGACANADA | VEGACANADA | VEGACANADA |
| 62 | VERMION | VERMION | VERMION |

---

## 2. Customer (Vevők) részletezés

### ⚠️ Adatbázisból HIÁNYZÓ Customer-ek (9 db)

| # | CSV-ben szereplő név |
|---|---|
| 1 | BILEK |
| 2 | EUROGROUP |
| 3 | EUROGROUP DE |
| 4 | EUROGROUP ES |
| 5 | KÓNYA |
| 6 | LEHMANN |
| 7 | MANDRESLOOT |
| 8 | OLYMPIC |
| 9 | OLYMPIC FRUITS |

### ✅ Adatbázisban MEGLÉVŐ Customer-ek (31 db)

| # | CSV Név | DB Azonosító (Rövid név) | DB Partner Teljes Név |
|---|---|---|---|
| 1 | ALDI AT | ALDI AT | ALDI AT |
| 2 | ANTON DÜRBECK | ANTON DÜRBECK | Anton Dürbeck GmbH |
| 3 | CASAS ROYES | CASAS ROYES | CASAS ROYES EXPORT S.L. |
| 4 | CORD | CORD | CORD |
| 5 | CRETAN ROOT | CRETAN ROOT | Cretan Root |
| 6 | DG69 | DG69 | DG 69, d.o.o., Vrhnika |
| 7 | EUROGROUP DEUTSCHLAND | EUROGROUP DEUTSCHLAND | Eurogroup Deutschland Gmbh |
| 8 | EUROGROUP ESPANA | EUROGROUP ESPANA | EUROGROUP ESPANA |
| 9 | EXOTIC FRESH | EXOTIC FRESH | EXOTIC FRESH |
| 10 | FRUBALMED | FRUBALMED | FRUBALMED SLU |
| 11 | GAVA | GAVA | GAVA TXEQUIA S.R.O. |
| 12 | GEMÜSERING | GEMÜSERING | GEMÜSERING |
| 13 | GHU | GHU | GHU |
| 14 | GLOBAL BERRY | GLOBAL BERRY | Global Berry S.L. |
| 15 | GREENCOOP | GREENCOOP | GREENCOOP |
| 16 | GREENYARD | GREENYARD | Greenyard Fresh Spain SA |
| 17 | GYÜMÖLCSÉRT | GYÜMÖLCSÉRT | Gyümölcsért Kft. |
| 18 | HOFER | HOFER | HOFER Trgovina d.o.o. |
| 19 | IDEAL FRUITS | IDEAL FRUITS | Ideal Fruits, S.l. |
| 20 | KOPFSALAT | KOPFSALAT | KOPFSALAT TRADE SL. |
| 21 | KV LOGISTIKA | KV LOGISTIKA | KV LOGISTIKA |
| 22 | LEHMANN & TROOST | LEHMANN & TROOST | LEHMANN & TROOST B.V. |
| 23 | LEVENTE | LEVENTE | LEVENTE |
| 24 | MANDERSLOOT | MANDERSLOOT | Mandersloot Expeditiebedrijf B.V. |
| 25 | OLYMPIC FRUIT | OLYMPIC FRUIT | Olympic Fruit B.V. |
| 26 | R&M | R&M | R&M |
| 27 | ROMÁNIA | ROMÁNIA | ROMÁNIA |
| 28 | SAN NICOLA | SAN NICOLA | SAN NICOLA GROUP S.R.L. |
| 29 | SPAR HU | SPAR HU | SPAR HU |
| 30 | SYLVAN | SYLVAN | Sylvan Hungária Zrt. |
| 31 | VILLAFRUT | VILLAFRUT | VILLAFRUT SRL |

---

## 3. Transport Company (Fuvarozók) részletezés

### ⚠️ Adatbázisból HIÁNYZÓ Fuvarozók (1 db)

| # | CSV-ben szereplő név |
|---|---|
| 1 | HILTOP |

### ✅ Adatbázisban MEGLÉVŐ Fuvarozók (49 db)

| # | CSV Név | DB Azonosító / Cégnév |
|---|---|---|
| 1 | ALL FRESH | ALL FRESH |
| 2 | BILEK | BILEK |
| 3 | BOGNÁR | BOGNÁR |
| 4 | BUGYI FERENC | BUGYI FERENC |
| 5 | BVT | BVT |
| 6 | CRETAN ROOT | CRETAN ROOT |
| 7 | DERBY | DERBY |
| 8 | ESKADA | ESKADA |
| 9 | FARAON | FARAON |
| 10 | FER TRANS | FER TRANS |
| 11 | FRIGOSPED | FRIGOSPED |
| 12 | FRIGOSPED SK | FRIGOSPED SK |
| 13 | FRUBALMED | FRUBALMED |
| 14 | FRUCTUS | FRUCTUS |
| 15 | FUSTER | FUSTER |
| 16 | GAVA | GAVA |
| 17 | GAVA POLSKA | GAVA POLSKA |
| 18 | HANKA | HANKA |
| 19 | HILLTOP | HILLTOP |
| 20 | HZ | HZ |
| 21 | HZ LOG | HZ LOG |
| 22 | KERMOR | KERMOR |
| 23 | KÓNYA | KÓNYA |
| 24 | KUSEK | KUSEK |
| 25 | KV LOG | KV LOG |
| 26 | LIVIU | LIVIU |
| 27 | LOGISTICHOME | LOGISTICHOME |
| 28 | MANDERSLOOT | MANDERSLOOT |
| 29 | MESAVERDE | MESAVERDE |
| 30 | MÜLLER | MÜLLER |
| 31 | NH CARGO | NH CARGO |
| 32 | PAP | PAP |
| 33 | PAP JÓZSEFNÉ | PAP JÓZSEFNÉ |
| 34 | PET-IMPEX | PET-IMPEX |
| 35 | RAINBOW | RAINBOW |
| 36 | RENACRIS | RENACRIS |
| 37 | RONI | RONI |
| 38 | S TRANSPORT | S TRANSPORT |
| 39 | S-TRANSPORT | S-TRANSPORT |
| 40 | SHEBA | SHEBA |
| 41 | STI | STI |
| 42 | SWISS | SWISS |
| 43 | SWISS TEMP | SWISS TEMP |
| 44 | SZÉKESI | SZÉKESI |
| 45 | THERMO | THERMO |
| 46 | THERMO FRUCHT | THERMO FRUCHT |
| 47 | TÓTH FRIGO | TÓTH FRIGO |
| 48 | TRANS-SPED | TRANS-SPED |
| 49 | VERMION | VERMION |
