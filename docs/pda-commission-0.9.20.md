# PDA komissiózás – 0.9.20

Az Android verziókód 20, a verziónév 0.9.20. A GitHub `Build PDA Android App` workflow a `PDA UI` forrásából építi az APK-t a meglévő aláírókulccsal.

- A más dolgozó által foglalt tétel szürke és nem kattintható, ha az aktív foglalások levonása után legfeljebb egy raklapnyi karton érhető el. A #/PLT a kapcsolódó ALDI áruigény aktuális értéke.
- A lista előtérben 15 másodpercenként, valamint az alkalmazás előtérbe kerülésekor frissül. Kattintáskor is újra ellenőrzi az elérhetőséget. A tranzakciós szerveroldali mentési védelem megmarad.
- A saját foglalás önmagában nem tilt. Visszavonás, lejárat és véglegesítés után a foglalás kikerül a számításból. A foglalás továbbra is az űrlap Mentés gombjánál indul.

A szervert és az APK-t együtt kell frissíteni. Új migráció nincs; a 0.9.19 foglalási migrációi továbbra is szükségesek. A GitHub APK-build nem telepíti az éles szervert.

Ellenőrzés: a teljes helyi szervertesztkészletben 64 sikeres teszt, 0 hiba és 1 kihagyott, külön összeemelési adatbázisteszt. Az elkülönített PostgreSQL-ben a tétellista és a párhuzamos mentések tesztjei lefutottak. A PDA böngészős munkafolyamatok 320×480 és 390×810 méretben sikeresek. A GitHub-build a PDA-szerverteszteket és a böngészős teszteket is futtatja az APK elkészítése előtt.
