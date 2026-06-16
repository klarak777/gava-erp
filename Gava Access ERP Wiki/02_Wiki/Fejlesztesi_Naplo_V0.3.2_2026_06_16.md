# GAVA Access ERP – Fejlesztési napló (2026-06-16, V0.3.2)

**Verzió:** V0.3.2  
**Dátum:** 2026. június 16.  
**Érintett fájlok:** `Access UI/index.html`, `Access UI/src/modules/rakodas.js`, `server/src/routes/cargo_demands.js`, `server/migrations/20260616140800_010_add_fields_to_cargo_demands.js`

---

## 1. Áru igény modal és adatbázis frissítése

### 1.1 Adatbázis sémabővítés (Backend)
- Új migráció letvehozva: `20260616140800_010_add_fields_to_cargo_demands.js`
- Bekerült mezők a `cargo_demands` táblába:
  - `albaran_number`
  - `destination`
  - `gross_weight_kg`
  - `price_eur`
  - `price_bcn_eur`
  - `unit`
  - `reloading_per_plt`
  - `transport_bcn_per_plt`
  - `customer_order_no`
  - `comment`
- A `truck_number_per` mező szándékosan **nem** került be ide, mert ez logikailag a konkrét fuvarhoz/kamionhoz tartozik.

### 1.2 API végpontok frissítése
**Fájl:** `server/src/routes/cargo_demands.js`
- **POST `/`**: Bővítve lett a kérés törzsének (req.body) feldolgozása, hogy lementse az összes új mezőt a `cargo_demands` adatbázistáblába.
- **PATCH `/:id/fulfill`**: Amikor az Áru igényből kamionra kerül a tétel, a rendszer immár átmásolja az újonnan felvett mezőket (súly, árak, stb.) a létrejövő `shipment_lines` (fuvar tétel) sorba az eddigi `0` alapértékek helyett.

### 1.3 Felhasználói felület (UI)
**Fájl:** `Access UI/src/modules/rakodas.js`
- A korábbi egyszerű "+ Hozzáadás" modal HTML kódját lecseréltük a `kamion_szerkesztes.js`-ben lévő "Termék szerkesztése" stílusú kódra.
- A Mentés gomb működése módosítva lett, így minden input mezőt begyűjt és elküld a `/api/v1/cargo-demands` API végpont felé.
- A `partner_name` input mezőt kivettük (a Termék szerkesztése ablakban sem volt), helyette a `Customer` mezőt használjuk (`customer_name` az adatbázisban).

---

## 2. Verziószám frissítése V0.3.2-re

**Fájl:** `Access UI/index.html`
- A verziószám átírva `V0.3.2`-re a következő helyeken:
  1. Az oldal `<title>` elemében: `GAVA Access UI – V0.3.2`
  2. A **bejelentkező képernyőn** az `Access UI` felirat mellett (`V0.3.2`)
  3. A **sidebar logó** mellett (`V0.3.2`)

---

## 3. Hogyan frissítsd a DigitalOcean (DO) szervert?

Mivel ez a fejlesztés adatbázis migrációt is tartalmaz, a szerveren újra kell húzni a Docker konténereket. 

1. Lépj be a DigitalOcean szerverre SSH-n keresztül.
2. Navigálj be a projekt mappájába:
   ```bash
   cd /path/to/gava-erp
   ```
3. Húzd le a legújabb kódokat a GitHub-ról:
   ```bash
   git pull
   ```
4. Indítsd újra a konténereket buildeléssel (ez le fogja futtatni az adatbázis migrációt is):
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
5. Miután elindult a szerver, a felhasználóknak egy frissítés javasolt a böngészőben (**Ctrl + F5**), hogy az új Javascript és HTML letöltődjön.
