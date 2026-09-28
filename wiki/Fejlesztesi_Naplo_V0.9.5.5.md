# GAVA ERP Fejlesztési Napló
**Verzió:** V0.9.5.5
**Dátum:** 2026. Szeptember 28.

## Áttekintés
Ez a frissítés tartalmazza a komissió modul dinamikus szűrésének továbbfejlesztését, az átlagsúly adat beépítését a PDF/címke paraméterek alapján, a "Termékek adat tábla" önálló modullá szervezését, és az Android PDA szoftverhez tartozó hibakeresést. 

## Megvalósított fejlesztések

### 1. Komissió Utasítás – Szűrt Összesítés (Dinamikus szűrés)
- A **Komissió megtekintése** ablakon belüli kereső/szűrő mező használatakor a felület alján lévő összesítő sorban a számított értékek (Karton szám, Nettó KG, Bruttó KG) frissülnek, és mostantól csak az aktuálisan **megjelenített/szűrt tételek** értékeit összesítik az összes komissiózott tétel helyett.

### 2. Komissió Utasítás – Új "Átlag súly" Oszlop
- A raklapcímkék alapján kinyert átlagsúly adat új oszlopként (Átlag súly (nettó) /#) bekerült a "Komissió megtekintése" táblázatba (a Nettó KG és Bruttó KG oszlopok közé).
- Az alsó összesítő sorban ez az adat is aggregálásra kerül, megmutatva a **teljes szűrt Nettó súly / teljes szűrt Karton szám** hányadosát a releváns tételekre vonatkozóan.

### 3. "Termékek adat tábla" Refaktorálása
- A korábban az *ALDI – Rendelések* menüponton belül egy tabként funkcionáló "Termékek adat tábla" modult egy teljesen különálló almenüpontba emeltük az ALDI főmenüpont alatt.
- A kód architektúráját letisztítottuk: az új `aldi_termekek.js` fájl szolgálja ki az új, önálló felületet, az `aldi_rendelesek.js` modulból pedig véglegesen eltávolítottuk az ehhez tartozó megjelenítési réteget. Ez átláthatóbb navigációt és jövőt állóbb kódstruktúrát biztosít.

### 4. PDA (Android) App - Bug Fix & Támogatás
- A GAVA PDA alkalmazás utolsó buildjének (V0.9.8, Debug változat) telepítési hibáit vizsgáltuk. Azonosítottuk, hogy a problémát a Google Play Protect blokkolása okozta, amelyet a megfelelő elfogadással a felhasználó sikeresen elkerült.
- Sikeresen javítottuk a felületen a "Bejelentkezés" gomb megjelenési problémáját.

## Verziókövetés
A módosítások után a webes felület verziószáma frissítésre került `V0.9.5.5`-re az `index.html` állományban.
