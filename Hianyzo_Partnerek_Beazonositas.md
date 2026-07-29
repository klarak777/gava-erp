# Hiányzó Partnerek Beazonosítása a Partnerek Modulban

Az alábbi elemzés az `Aktiv_Partnerek_Osszehasonlitas.md` során talált hiányzó azonosítókat keresi meg a PostgreSQL **partners** táblájában.

## 1. Hiányzó Reference Partnerek Beazonosítása (9 db)

### 🔹 Keresett Név: `AGROPONIENTE`

**Találatok a `partners` táblában (3 db):**

| ID | Partner Neve (`name`) | Számlázási Név (`invoice_name`) | Cím / Város |
|---|---|---|---|
| 3977 | AGROPONIENTE S.A. | --- | -, - |
| 27 | Agroponiente Natural Produce S.L. | Agroponiente Natural Produce S.L. | -, 04710 Almeria (Santa Maria del Áhuila), Paises Bajos, 100-Apartado 53 |
| 3978 | Agroponiente VegaCanada S.A. | Agroponiente VegaCanada S.A. | -, - |

**Kapcsolódó létező azonosítók a `partner_identifiers` táblában:**

| ID Type (Szerepkör) | Azonosító Érték (`value`) | Partner ID | Partner Neve |
|---|---|---|---|
| (Reference) Szállítók | AGROPONIENTE NATURAL | 27 | Agroponiente Natural Produce S.L. |

---

### 🔹 Keresett Név: `AGROPONIENTE NIJAR`

**Találatok a `partners` táblában (3 db):**

| ID | Partner Neve (`name`) | Számlázási Név (`invoice_name`) | Cím / Város |
|---|---|---|---|
| 3977 | AGROPONIENTE S.A. | --- | -, - |
| 27 | Agroponiente Natural Produce S.L. | Agroponiente Natural Produce S.L. | -, 04710 Almeria (Santa Maria del Áhuila), Paises Bajos, 100-Apartado 53 |
| 3978 | Agroponiente VegaCanada S.A. | Agroponiente VegaCanada S.A. | -, - |

**Kapcsolódó létező azonosítók a `partner_identifiers` táblában:**

| ID Type (Szerepkör) | Azonosító Érték (`value`) | Partner ID | Partner Neve |
|---|---|---|---|
| (Reference) Szállítók | AGROPONIENTE NATURAL | 27 | Agroponiente Natural Produce S.L. |

---

### 🔹 Keresett Név: `CASI AEROPORTO`

**Találatok a `partners` táblában (3 db):**

| ID | Partner Neve (`name`) | Számlázási Név (`invoice_name`) | Cím / Város |
|---|---|---|---|
| 41 | CASI | - | -, - |
| 45 | CASI PARTIDORES | - | -, - |
| 4357 | CASI Cooperativa Provincial Agraria Y Ganadera San Isidro S. Coop. And. | CASI Cooperativa Provincial Agraria Y Ganadera San Isidro S. Coop. And. | -, - |

**Kapcsolódó létező azonosítók a `partner_identifiers` táblában:**

| ID Type (Szerepkör) | Azonosító Érték (`value`) | Partner ID | Partner Neve |
|---|---|---|---|
| (Reference) Szállítók | CASI | 41 | CASI |
| (Reference) Szállítók | CASI PARTIDORES | 45 | CASI PARTIDORES |

---

### 🔹 Keresett Név: `CASI AIRPORT`

**Találatok a `partners` táblában (3 db):**

| ID | Partner Neve (`name`) | Számlázási Név (`invoice_name`) | Cím / Város |
|---|---|---|---|
| 41 | CASI | - | -, - |
| 45 | CASI PARTIDORES | - | -, - |
| 4357 | CASI Cooperativa Provincial Agraria Y Ganadera San Isidro S. Coop. And. | CASI Cooperativa Provincial Agraria Y Ganadera San Isidro S. Coop. And. | -, - |

**Kapcsolódó létező azonosítók a `partner_identifiers` táblában:**

| ID Type (Szerepkör) | Azonosító Érték (`value`) | Partner ID | Partner Neve |
|---|---|---|---|
| (Reference) Szállítók | CASI | 41 | CASI |
| (Reference) Szállítók | CASI PARTIDORES | 45 | CASI PARTIDORES |

---

### 🔹 Keresett Név: `COMPAGRI`

❌ **Nincs közvetlen találat a `partners` táblában.**

---

### 🔹 Keresett Név: `GAVA`

**Találatok a `partners` táblában (6 db):**

| ID | Partner Neve (`name`) | Számlázási Név (`invoice_name`) | Cím / Város |
|---|---|---|---|
| 48 | FRUTAS GAVA | - | -, - |
| 62 | GAVA TXEQUIA S.R.O. | GAVA TXEQUIA S.R.O. | -, 140 00 PRAHA 4, NA DOLINÁCH 44 |
| 22 | Gava Polska Sp. z o.o. | Gava Polska Sp. z o.o. | -, 05-850 POZNAŃSKA 98, OŻARÓW MAZOWIECKI |
| 4910 | GAVA GMBH. | GAVA GMBH. | -, 01230 WIEN, C17 198-200 GROSSGRÜNMARKT INZ |
| 4912 | GAVA SLOVAKIA S.R.O. | GAVA SLOVAKIA S.R.O. | -, 82105 BRATISLAVA, DOMOVÉ ROLE 78 |
| 5455 | KOPFSALAT/GAVA SA | KOPFSALAT/GAVA SA | -, - |

**Kapcsolódó létező azonosítók a `partner_identifiers` táblában:**

| ID Type (Szerepkör) | Azonosító Érték (`value`) | Partner ID | Partner Neve |
|---|---|---|---|
| Fuvarozók | GAVA POLSKA | 22 | Gava Polska Sp. z o.o. |
| (Reference) Szállítók | FRUTAS GAVA | 48 | FRUTAS GAVA |
| CCW + Kód | GAVA | 4910 | GAVA GMBH. |
| CCW + Kód | GAVASL | 4912 | GAVA SLOVAKIA S.R.O. |
| (Reference) Szállítók | GAVA POLSKA | 22 | Gava Polska Sp. z o.o. |
| (Customer) Vevők | GAVA | 62 | GAVA TXEQUIA S.R.O. |
| Fuvarozók | GAVA | 62 | GAVA TXEQUIA S.R.O. |

---

### 🔹 Keresett Név: `MALENO Y TORRES`

**Találatok a `partners` táblában (1 db):**

| ID | Partner Neve (`name`) | Számlázási Név (`invoice_name`) | Cím / Város |
|---|---|---|---|
| 52 | Maleno Y Torres Exportación S.L. | Maleno Y Torres Exportación S.L. | -, 04716 Las Norias De Daza, |

**Kapcsolódó létező azonosítók a `partner_identifiers` táblában:**

| ID Type (Szerepkör) | Azonosító Érték (`value`) | Partner ID | Partner Neve |
|---|---|---|---|
| (Reference) Szállítók | MALENO | 52 | Maleno Y Torres Exportación S.L. |

---

### 🔹 Keresett Név: `OLASO`

❌ **Nincs közvetlen találat a `partners` táblában.**

---

### 🔹 Keresett Név: `WRAPPING`

❌ **Nincs közvetlen találat a `partners` táblában.**

---

## 2. Hiányzó Customer Partnerek Beazonosítása (2 db)

### 🔹 Keresett Név: `BILEK`

**Találatok a `partners` táblában (1 db):**

| ID | Partner Neve (`name`) | Számlázási Név (`invoice_name`) | Cím / Város |
|---|---|---|---|
| 11 | BILEK | - | -, - |

**Kapcsolódó létező azonosítók a `partner_identifiers` táblában:**

| ID Type (Szerepkör) | Azonosító Érték (`value`) | Partner ID | Partner Neve |
|---|---|---|---|
| Fuvarozók | BILEK LEVI | 11 | BILEK |
| (Reference) Szállítók | BILEK | 11 | BILEK |

---

### 🔹 Keresett Név: `KÓNYA`

**Találatok a `partners` táblában (5 db):**

| ID | Partner Neve (`name`) | Számlázási Név (`invoice_name`) | Cím / Város |
|---|---|---|---|
| 2051 | Kónya Trans Korlátolt Felelősségű Társaság | KÓNYA TRANS KORLÁTOLT FELELŐSSÉGŰ TÁRSASÁG | Csólyospálos, Tavasz utca 24 |
| 3866 | IMANOV / KÓNYA | - | -, - |
| 25 | KÓNYA ZOLTÁNNÉ | Kónya Zoltánné | Sándorfalva, Korsó utca 11 |
| 5450 | Kónya György Lajosné | Kónya György Lajosné | -, - |
| 5452 | Kónya István | Kónya István | -, - |

**Kapcsolódó létező azonosítók a `partner_identifiers` táblában:**

| ID Type (Szerepkör) | Azonosító Érték (`value`) | Partner ID | Partner Neve |
|---|---|---|---|
| Fuvarozók | IMANOV / KÓNYA | 3866 | IMANOV / KÓNYA |
| CCW + Kód | kónya | 5452 | Kónya István |
| CCW + Kód | KÓNYA | 5451 | KONYA ISTVÁN |
| (Reference) Szállítók | KÓNYA | 25 | KÓNYA ZOLTÁNNÉ |
| Fuvarozók | KÓNYA | 25 | KÓNYA ZOLTÁNNÉ |

---

