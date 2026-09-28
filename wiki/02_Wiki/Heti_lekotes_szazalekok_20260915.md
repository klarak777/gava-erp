# Heti lekötés – szerkeszthető napi százalékok

A Heti lekötés fülön, egy feltöltött hét kiválasztása után a **⚙ Beállítás** gomb nyitja meg a beállításokat.

Mentés előtt a rendszer jóváhagyást kér a kiválasztott hét becsléseinek és számított készletének újraszámításához. Elutasításkor a szerkesztő nyitva marad, és nincs mentés. A tényleges rendelés elsőbbsége megmarad. Az Excel ismételt feltöltése nem szükséges.

Ha a szerver válaszából hiányoznak a százalékprofilok, régi backend fut: a migráció és a backend újraindítása szükséges, nem újabb Excel-feltöltés. A helyi adatbázison a migráció 2026-09-15-én lefutott, a helyi backend újraindult. A DO szerver frissítése külön telepítési lépés.

Három külön táblázatban hét időszak szerkeszthető:

- Akció: szerda–szombat, vasárnap–kedd, péntek–szombat.
- Akción kívül: szerda–szombat, vasárnap–kedd, szerda–csütörtök–vasárnap–hétfő–kedd.
- Normál: a teljes hét.

Az induló értékek a korábban használt százalékok. Az időszakok összegének külön-külön pontosan 100%-nak kell lennie. A nulla megengedett, legfeljebb két tizedesjegy használható. Az üres, negatív, 100%-nál nagyobb vagy hibás összegű beállításokat a felület és a szerver is elutasítja.

A **Mentés és újraszámítás** a kiválasztott hétre ment. A többi hét nem változik. Ez az alkalmazott alapértelmezett hatókör; új hetek továbbra is a korábbi alapértékeket használják.

Mentés után a Lekötés & Rendelés napi becslései és a számított készletek újraszámolódnak. A tényleges rendelés – beleértve a nullát – továbbra is elsőbbséget kap a becsléssel szemben. A nyitókészlet, az érkezések és az Excelből beolvasott mennyiségek nem módosulnak.

Az alapértékek visszaállítása a szerkesztőben történik; véglegesítéséhez szintén mentés szükséges. A Mégse elveti a nem mentett változtatást. Ha közben más felhasználó mentett, az újabb állapotot nem írjuk felül: a táblázatot újra meg kell nyitni.

## Telepítés

Új migráció: `server/src/db/migrations/20260915000000_add_weekly_commitment_rates.js`.
Az `aldi_weekly_commitments` táblához a mentett JSON-százalékok és a mentési verzió kerülnek. A meglévő hetek alapértelmezett százalékai változatlanok.

A backend indítási migrációja és a friss frontend szükséges. Az éles migrációt/DO-telepítést ebben a munkában nem futtattuk.

## Ellenőrzés

A célzott tesztek ellenőrzik mind a hét időszakot, a 100%-os összegeket, a tört százalékokat, az alapértékek megőrzését, az új százalékok eljutását a tényleges táblázat/készlet számításába, a rendelési elsőbbséget és a párhuzamos mentés elleni védelmet.
