# GAVA Access ERP – Fejlesztési napló (2026-06-16, V0.3.4)

**Verzió:** V0.3.4  
**Dátum:** 2026. június 16.  
**Érintett fájlok:** `server/import_25_26_v2.js`, `server/verify_import_25_26.js`, `Access UI/index.html`

---

## 1. Adatbázis frissítés a 2025-26-os szezonra (2026. május 1. utáni adatok)

### 1.1 Új CSV importálás implementálása
**Fájl:** `server/import_25_26_v2.js`
- Létrehoztunk egy új importáló scriptet, amely a `25-26 Fuvarok összesítö V2 260617.csv` alapján frissíti a PostgreSQL adatbázist.
- **Dátum szűrés:** A script csak a 2026. május 1-jén vagy azutáni dátumú (`order_date >= 2026.05.01`) sorokat importálja.
- **Tiszta import:** A script az importálás során felülírja a megadott időszakban lévő rendeléseket, elkerülve a duplikációkat, de meghagyja a korábbi időszakhoz (pl. május 1. előtti) tartozó adatokat.
- **Árva rekordok törlése:** Az üres kamion (fejléc) rekordok, amelyeknek már nincs hozzárendelt áruja az adott időszakon belül, automatikusan törlésre kerültek, biztosítva az adatbázis konzisztenciáját.

### 1.2 Ellenőrző script
**Fájl:** `server/verify_import_25_26.js`
- Elkészítettünk egy validációs scriptet, amely összeveti a CSV tartalmát (május 1. utáni adatok) az adatbázissal.
- Az ellenőrzés 100%-os egyezést mutatott, megerősítve a sikeres importálást.

---

## 2. Verziószám frissítése V0.3.4-ra

**Fájl:** `Access UI/index.html`
- A verziószám átírva `V0.3.4`-ra a következő helyeken:
  1. Az oldal `<title>` elemében: `GAVA Access UI – V0.3.4`
  2. A **bejelentkező képernyőn** az `Access UI` felirat mellett (`V0.3.4`)
  3. A **sidebar logó** mellett (`V0.3.4`)

---

## 3. Hogyan frissítsd a DigitalOcean (DO) szervert?

1. Lépj be a DigitalOcean szerverre SSH-n keresztül.
2. Navigálj be a projekt mappájába:
   ```bash
   cd /root/gava-erp
   ```
3. Húzd le a legújabb kódokat a GitHub-ról:
   ```bash
   git pull
   ```
4. A frissítés érvényesítéséhez elegendő a konténerek újraépítése:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
5. Miután elindult a szerver, a felhasználóknak egy frissítés javasolt a böngészőben (**Ctrl + F5**), hogy az új verzió betöltődjön.
