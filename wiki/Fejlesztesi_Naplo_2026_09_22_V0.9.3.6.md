# Fejlesztési Napló és Kiadási Jegyzetek - 2026.09.22 (V0.9.3.6)

**Dátum:** 2026. szeptember 22.  
**Verzió:** V0.9.3.6  
**Érintett komponensek:** Access UI (Admin Raklapcímkék), Backend API (`admin.js`, `pda.js`), ZPL Generálás, Adatbázis karbantartó szkriptek

---

## 📋 Vezetői Összefoglaló

A mai fejlesztési ciklus fókuszában az összeemelt (Master / "Vegyes raklap") SSCC címkék hibátlan megjelenítése, a törzsadatbázisban lévő korábbi gyűjtő raklapok helyreállítása, valamint a böngészős/adminisztrátori előnézet és nyomtatás teljes körű kibővítése állt:

1. **Admin UI Raklapcímkék - Összeemelt címke részletező és nyomtatás:**
   - Az Adminisztrációs felületen a raklapcímke megtekintésekor és nyomtatásakor az összeemelt raklap címkéje mostantól pontosan a kért szerkezetben tartalmazza a csatolt rész-raklapok listáját:
     - `Termék neve: ...`
     - `Kartonszám: ... #`
     - `Azonosító: ... (SSCC)`
   - Megjelenik a szállítási dátum, az összesített kartonszám (`#`), a göngyölegsúlyokkal kalkulált bruttó kg, valamint az alsó SSCC vonalkód az "Azonosító" jelöléssel.
   - Hozzáadásra került egy közvetlen **"🖨️ Zebra nyomtatás"** gomb az előnézeti ablakban, amellyel az Admin felületről is egyetlen kattintással kiküldhető a ZPL kód a raktári Zebra címkenyomtatóra.

2. **Backend API és ZPL Sablon bővítés:**
   - A `GET /api/v1/admin/pallet-labels` végpont automatikusan felderíti és beágyazza a `childrenLabels` listát minden mester raklaphoz (a `pallets_json` és a `consolidated_sscc` relációk alapján egyaránt).
   - Új `POST /api/v1/admin/print-pallet-label` végpont az Admin felületről indított hálózati Zebra nyomtatáshoz.
   - A ZPL generátorban pontosításra került a terméknév, kartonszám és SSCC azonosító formátuma és térközei.

3. **Adatbázis helyreállító szkript (`repair_consolidated_labels.js` és `update_labels_weights.js`):**
   - Új karbantartó szkript készült a DigitalOcean (DO) szerveren már korábban felvitt, régebbi összeemelt és normál címkék adatainak és relációinak teljes körű ellenőrzésére és javítására:
     - Beállítja az `is_consolidated_master = true` jelzőt.
     - Összekapcsolja a gyermek raklapok `consolidated_sscc` mezőit és a mester `pallets_json` listáját.
     - Újraszámolja a mester raklapok összesített kartonszámát, bruttó és nettó súlyát a gyermek tételekből.

---

## 🚀 Részletes Módosítások

### 1. `Access UI/src/modules/admin.js`
- **Előnézet (`showLabelModal`):**
  - Mester raklap esetén dinamikusan listázza a raklaphoz tartozó összes alsó raklapot ("Raklapok" dobozban):
    - Termék neve
    - Kartonszám (#)
    - Azonosító (SSCC)
  - Normál raklap esetén változatlanul a részletes paramétereket mutatja (nettó kg, bruttó kg, átlag súly, lotszám, származási ország).
  - Vonalkód alatti felirat mester raklapnál "Azonosító", normál raklapnál "SSCC".
- **Nyomtatás és PDF mentés (`printLabelDirect`):**
  - A böngészős nyomtatási sablon kibővült a súlyokkal és a csatolt tételek blokkjával.
- **Közvetlen Zebra nyomtatás:**
  - `pl-modal-zebra-btn` gomb beépítése és bekötése a backend Zebra hálózati nyomtatójára.

### 2. `server/src/routes/admin.js`
- `GET /pallet-labels`: Minden `is_consolidated_master` rekordhoz kigyűjti és csatolja a `childrenLabels` tömböt.
- `POST /print-pallet-label`: Adminisztrátori hálózati ZPL kiküldés az aktív Zebra nyomtatóra (IP és port alapján TCP Socketen keresztül).

### 3. `server/src/routes/pda.js`
- Fallback keresés a `print-pallet-label` végpontban: ha a `pallets_json` üres lenne, a `consolidated_sscc` alapján is betölti a gyermek tételeket.
- `generateZpl` segédfüggvény exportálása a közös használathoz.

### 4. `server/scripts/repair_consolidated_labels.js`
- Teljes körű diagnosztikai és javító szkript az összeemelt raklapok és tagjaik helyreállítására.

---

## 🛠️ Futtatás a DigitalOcean Éles Szerveren

1. **Git frissítés lekérése:**
   ```bash
   cd ~/gava-erp
   git pull origin master
   ```

2. **Konténerek újraépítése és elindítása:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Összeemelt raklapok helyreállító szkriptjének futtatása:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec gava_api node scripts/repair_consolidated_labels.js
   ```
