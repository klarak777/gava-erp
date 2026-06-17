# Fejlesztési Napló – V0.3.5 – 2026-06-18

## Összefoglalás
A RAKODVA pipa funkció teljes implementálása a Rakodás modulban, EKAER dokumentum automatikus generálással és modulok közötti láthatóság-vezérlés.

---

## Változtatások

### Új funkciók

#### 1. RAKODVA pipa – Megerősítő felugró ablak
- **Modul:** `Access UI/src/modules/rakodas.js`
- A RAKODVA checkbox bejelölésekor megerősítő ablak ugrik fel
- Ha a felhasználó visszavon: a pipa nem kerül bepipálásra, semmi sem változik
- Ha megerősít: az API frissíti a státuszt, majd EKAER dokumentum is generálódik

#### 2. RAKODVA pipa – Fuvar eltűnik a Rakodás modulból
- **Modul:** `Access UI/src/modules/rakodas.js`
- Az alapnézet mostantól csak `is_loaded = false` fuvarokat tölt be: `/api/v1/shipments?is_loaded=false`
- Sikeres pipálás után a sor azonnal eltűnik a táblából (helyi szűrés)

#### 3. Automatikus EKAER dokumentum generálás
- **Backend:** `server/src/routes/shipments.js` – `PATCH /:id/loaded` bővítve
- Pipáláskor a backend automatikusan hívja a `generateEkaerForShipment()` helper funkciót
- Sablon: `\\192.168.1.5\raktar\MI Teszt\Minta dokuk\EKAER minta.docx`
- Kimenet: `\\192.168.1.5\raktar\MI Teszt\Fuvarok\{kamionszám}\{rendszám}.docx`
- 3 placeholder kitöltése (VBA kód alapján):
  - `{{ Plate number }}` → rendszám
  - `{{ Tour number }}` → kamionszám
  - `{{ Reference }}` → albaran számok listája (sortöréssel elválasztva)
- Duplikátum-kezelés: ha a fájl már létezik, számot fűz hozzá (`rendszám(1).docx`)
- Rögzítés az `ekaer_records` adatbázis táblában

#### 4. Új API végpont: `POST /api/v1/shipments/:id/generate-ekaer`
- Manuálisan is generálható EKAER dokumentum egy fuvarhoz

#### 5. Transportistas modul – csak rakodott fuvarok
- **Modul:** `Access UI/src/modules/transportistas.js`
- Az API hívás mostantól: `/api/v1/shipments?is_loaded=true`
- Csak RAKODVA jelölt fuvarok látszanak

#### 6. Fuvarok összesítő – csak rakodott fuvarok tételei
- **Backend:** `server/src/routes/shipment_lines.js`
- A lekérdezés `WHERE shipments.is_loaded = true` szűrővel bővült
- Csak azok a tételsorok látszanak, ahol a szülő fuvar RAKODVA státuszban van

#### 7. `GET /api/v1/shipments` – Általános `is_loaded` szűrő
- Új opcionális query paraméter: `?is_loaded=true` vagy `?is_loaded=false`
- Visszafelé kompatibilis (paraméter nélkül minden fuvar visszajön)

---

## Érintett fájlok
| Fájl | Módosítás típusa |
|------|-----------------|
| `server/src/routes/shipments.js` | MODIFY – is_loaded szűrő + EKAER endpoint |
| `server/src/routes/shipment_lines.js` | MODIFY – is_loaded=true JOIN szűrő |
| `Access UI/src/modules/rakodas.js` | MODIFY – confirm dialog + sor eltüntetés + is_loaded=false filter |
| `Access UI/src/modules/transportistas.js` | MODIFY – is_loaded=true API szűrő |

---

## Git
- **Commit:** `5bdb647`
- **Üzenet:** `feat: RAKODVA pipa confirm dialog + EKAER generálás + modulok is_loaded szűrése (V0.3.5)`
- **Branch:** `master`

---

## Verzió
`V0.3.5` (előző: V0.3.4 – 2026-06-16)
