# GAVA Access UI - V0.7.3 Fejlesztési jegyzetek

## Újdonságok és módosítások
1. **Invoice (Számla) feltöltés a Transportistas táblából:**
   - A `Transportistas` nézeten minden sor "Invoice Number" mezője mellé bekerült egy dokumentum ikon (📄).
   - Erre az ikonra kattintva megnyílik a **Számla feltöltése** ablak. Az ablak kötelezővé teszi a számlaszám (Invoice Number) megadását, és ha már be van írva a táblázatba, automatikusan kitölti azt.
   - A feltöltött fájlokat a háttérrendszer a következő hálózati meghajtó útvonalra menti:
     `Season [szezon] / [Kamionszám (Order Number)] / [Invoice Number] / [fájlnév]`
   - Támogatott a több fájl egyidejű feltöltése (Drag & Drop funkcióval).

2. **UI változások:**
   - Ha egy kamionhoz már töltöttek fel számlát, az `Invoice Number` kék színű és aláhúzott lesz, jelezve, hogy kattintható.
   - A számlaszámra (vagy az ikonra) kattintva előhívható a fájlnéző/letöltő ablak, amivel a már feltöltött fájlok megjeleníthetők és letölthetők.
   - Az értelmetlen "A kamionhoz nincs kitöltve Invoice Number..." figyelemeztető felugró ablak törlésre került, a validáció maga a modal ablakban zajlik.
   - Verziószám frissítése `V0.7.3`-ra a kezdőképernyőn és a menüben.

## Adatbázis módosítások
- A `shipments` tábla bővült egy új `invoice_files` (JSONB) oszloppal.
- Migrációs fájl: `server/src/db/migrations/20260813000000_add_invoice_files_to_shipments.js`.

---

## 🚀 Telepítési útmutató a DigitalOcean (DO) szerverhez (Docker környezetben)

Mivel a fejlesztés adatbázis sémát érintett, a szerver frissítésekor **MINDENKÉPPEN** le kell futtatni az adatbázis migrációt a backend konténeren belül.

**Lépések a DO szerveren:**

1. Navigálj a projekt szerver mappájába, ahol a `docker-compose.yml` található:
   ```bash
   cd /path/to/your/project
   ```

2. Frissítsd a kódot a GitHub-ról:
   ```bash
   git pull origin main
   ```

3. Állítsd újra össze a konténereket (ha a package.json módosult volna), és indítsd el:
   ```bash
   docker-compose up -d --build
   ```
   *(Megjegyzés: Ha csak kódváltozás történt, elég lehet a konténer újraindítása is: `docker-compose restart backend`)*

4. **Futtasd le az adatbázis migrációt a futó backend konténerben:**
   ```bash
   docker-compose exec backend npm run migrate
   ```
   *(A `backend` helyére a saját konténered nevét írd be, pl. `gava-server` vagy `api`)*
