# GAVA ERP Access - Fejlesztési Napló
## Verzió: V0.4.0
**Dátum:** 2026.06.24.

### Elvégzett módosítások és fejlesztések:

#### 1. Adatbázis és Háttérrendszer (Backend)
- **Transport Company Adatok Tisztítása:** A `transporters` táblában található adatok frissítése a legújabb tisztított listára. A hiányzó/felesleges tételek inaktiválásra kerültek (`is_active = false`), elkerülve az adatok végleges törlését, így a korábban rájuk hivatkozó adatok (pl. korábbi fuvarok) nem sérülnek.
- **Admin felület API végpontok módosítása:** Az Admin modul API végpontjai (különösen a `DELETE`) mostantól "soft-delete" (puha törlés) logikával működnek a Partnerek és Szállítmányozók esetében, vagyis `is_active = false` értékre állítják a rekordot a tényleges törlés helyett.
- A lekérdezések módosításra kerültek, így a felületeken már csak az aktív (`is_active = true`) elemek jelennek meg.

#### 2. Rakodás Modul (`rakodas.js`)
- **Táblázat elrendezés optimalizálása:** 
  - A "Rakodások" (bal) táblázat oszlopszélességei csökkentésre kerültek (`flex: 1.0`), hogy több hely jusson az "Áru igény" (jobb) táblázatnak.
  - Az "Áru igény" (jobb) táblázat szélessége megnövelve (`flex: 1.56`).
- **Új oszlop az Áru igény táblázatban:**
  - Bekerült a "Comment" oszlop, amely megjeleníti az áruigényhez fűzött megjegyzéseket, ezzel segítve a szervezést.
- **Dinamikus összesítő fejléc:**
  - Az "Áru igény" fejlécén dinamikusan megjelennek a szűrt adatokra vonatkozó összesítések: **"Össz. Euro plt"** és **"Össz. Norm plt"**.
  - A szűrők (Célállomás, Partner, Vevő) használata esetén is csak a látható/szűrt sorok alapján valós időben frissülnek az összesen értékek, 1 tizedesjegy pontossággal.

#### 3. Fuvarok Összesítő Modul (`fuvar.js`)
- **UI Finomhangolás:**
  - A szűrő/vezérlő paneleken lévő címkék (label) betűmérete csökkentésre került (`11px`).
  - A vezérlő panel és a táblázat közötti térköz (padding, margin) csökkentésre került a jobb helykihasználás érdekében.

#### 4. Kamion Szerkesztés Modul (`kamion_szerkesztes.js`)
- **Raklap növelő/csökkentő nyilak viselkedése:**
  - Az "N° Euro Palets" és "N° Normal Palets" mezők (mind a táblázatban, mind a felugró szerkesztőablakokban) `step` attribútuma `any`-re lett állítva.
  - Ennek köszönhetően a fel/le nyilak használatával a rendszer alapértelmezettként **egész számokkal (1-esével)** lépteti az értékeket, de begépelve továbbra is gond nélkül elfogadja és kezeli a **tizedes számokat**.
- **Táblázat összesítő sor:**
  - A kamionhoz adott tételek táblázatának aljára egy rögzített (sticky) lábléc (`tfoot`) került beépítésre.
  - Az összesítő sor dinamikusan, oszloponként kiszámolja a **"Total Palets"**, **"N° Euro Palets"** és a **"N° Normal Palets"** összegeit az aktuális kamionhoz hozzáadott tételek alapján. Bármilyen cellamódosítás esetén ez azonnal frissül.
