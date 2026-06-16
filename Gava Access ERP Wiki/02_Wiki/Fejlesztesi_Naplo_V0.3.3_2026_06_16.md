# GAVA Access ERP – Fejlesztési napló (2026-06-16, V0.3.3)

**Verzió:** V0.3.3  
**Dátum:** 2026. június 16.  
**Érintett fájlok:** `Access UI/index.html`, `Access UI/src/modules/kamion_szerkesztes.js`, `Access UI/src/modules/rakodas.js`

---

## 1. Felületi és működési hibajavítások

### 1.1 Kamion szerkesztő ablak függőleges igazítása
**Fájl:** `Access UI/src/modules/kamion_szerkesztes.js`
- A 1100x650px méretű ablak horizontálisan tökéletesen középen volt, de a jobb láthatóság érdekében függőlegesen **40 pixellel feljebb** igazítottuk a képernyő középpontjától.
- A pozicionálás megőrzi a felső menüsáv alatti korlátot (`Math.max(0, ...)`), így kisebb képernyőn sem csúszik ki az ablak teteje.

### 1.2 "Áru igény" lista UI frissítés javítása
**Fájlok:** `Access UI/src/modules/kamion_szerkesztes.js`, `Access UI/src/modules/rakodas.js`
- **Hiba:** Amikor a Kamion szerkesztése felugró ablakban csökkentették egy termék raklapszámát, a rendszer helyesen átvezette az eltérést az Áru igény táblába, de a felületen az Áru igények táblázat nem frissült automatikusan.
- **Megoldás:**
  1. A `kamion_szerkesztes.js` modul sikeres mentés/átvezetés után elküld egy egyedi eseményt: `document.dispatchEvent(new CustomEvent('cargoDemandsUpdated'))`.
  2. A `rakodas.js` modul feliratkozik erre az eseményre, és automatikusan újratölti az Áru igény táblázatot (`loadCargoDemandsData()`), így a változások azonnal megjelennek.

---

## 2. Verziószám frissítése V0.3.3-ra

**Fájl:** `Access UI/index.html`
- A verziószám átírva `V0.3.3`-ra a következő helyeken:
  1. Az oldal `<title>` elemében: `GAVA Access UI – V0.3.3`
  2. A **bejelentkező képernyőn** az `Access UI` felirat mellett (`V0.3.3`)
  3. A **sidebar logó** mellett (`V0.3.3`)

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
4. Mivel adatbázis sémamódosítás most nem történt, nem feltétlenül kell újraépíteni a teljes konténert, de a frontend frissítéséhez elegendő a konténerek újraindítása, vagy a biztonság kedvéért a megszokott parancs futtatása:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
5. Miután elindult a szerver, a felhasználóknak egy frissítés javasolt a böngészőben (**Ctrl + F5**), hogy az új verzió betöltődjön.
