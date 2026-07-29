# Fejlesztési Napló - V0.6.7
**Dátum:** 2026. 07. 29.

## Kiemelt Módosítások

### 1. Kamion Szerkesztése (UI Javítások)
* A "Kamion Szerkesztése" ablakban található belső (inline) legördülő menük (Product, Reference, Customer) megjelenítési hibájának (elcsúszásának) javítása.
* **Oka:** A szülő konténerben használt `transform: scale(0.75)` CSS tulajdonság megzavarta az abszolút koordináták kiszámítását.
* **Megoldás:** A menük kikerültek a skálázott konténerből, közvetlenül a `document.body`-hoz lettek adva `position: fixed` stílussal, a koordináták pedig a `getBoundingClientRect()` alapján pontosan be lettek állítva. Bevezetésre került egy `MutationObserver`, ami az ablak bezárásakor automatikusan eltávolítja a DOM-ból a menüket.

### 2. EKAER Dokumentum Generálás (VBA Logika Implementálása)
* Az EKAER fájlok tartalmának generálási logikája át lett írva, hogy pontosan kövesse az eddig Excelben használt VBA makró algoritmusát (`ProcessReferences`).
* **Új működés:**
  * Referencia és Úti cél (Destination) *egyedi párok* kigyűjtése.
  * Ha a Customer értéke "GHU", akkor a Destination automatikusan "GAVA" lesz.
  * A "SPAR SLO..." és "SPAR CRO..." úti célok szűrése (nem kerülnek be a dokumentumba).
  * A "SPAR HU..." kezdetű úti célok egységesítése "SPAR HU" alakra.
  * Formázott kimenet biztosítása sorszámok nélkül: `[Reference] - [Destination]:`.

### 3. EKAEREK Modul (UI Módosítások)
* A táblázatból eltávolításra került a felesleges `EKAER_FileName` oszlop (fejléc és adatcellák is).

### 4. Adatbázis Migrációk (Cargo Demands)
* Létrejött egy új adatbázis migrációs szkript (`039_add_partner_id_to_cargo_demands.js`).
* Ez a szkript hozzáadja a `partner_id` oszlopot a `cargo_demands` táblához.
* Visszamenőleg (adat migrációval) összeköti a meglévő Áru igény (cargo demand) sorokat a Partnerekkel a `partner_name` és a `partner_identifiers` tábla segítségével, így megbízhatóbb lesz az adatok összekapcsolása.

### 5. Verziófrissítés
* A `index.html`-ben és a főmenüben a verziószám frissítésre került **V0.6.7**-re.
