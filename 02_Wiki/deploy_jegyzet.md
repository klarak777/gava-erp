# Szerver Deploy Jegyzet

## Módosítások a szerveren (2026-06-12 - 2026-06-15)

1.  **Adatbázis sémák és API útvonalak frissítése:**
    *   Az API végpontok (backend) a legújabb módosításokat tartalmazzák.
    *   A `shipments` és `shipment_lines` (Fuvarok és Tételek) táblák lekérdezéseinél a szűrési logikát pontosítottuk (például a `limit` paraméter növelése 150-re a Rakodás modulban, hogy régebbi fuvarszámok, pl. LOG355, LOG356 is maradéktalanul megjelenjenek).
2.  **UI Frissítések a szerveren:**
    *   A Fuvarok (Rakodás) szerkesztése során megjelenő felugró ablakok (Termék szerkesztése, Tétel áthelyezése) mozgathatóvá (draggable) lettek téve.
    *   **Tétel áthelyezése:** Új gomb és funkció került bevezetésre a tételek áthelyezésére egyik kamionról a másikra. A cél kamionok listájában csak a még NEM RAKODVA státuszú kamionok jelennek meg.
    *   Olyan kamionról, ahol a "Rakodva" pipa már be van jelölve, a tétel áthelyezése le lett tiltva (a gomb nem jelenik meg).
    *   A "foghíj" (üres sorok) probléma javítva: Törlés vagy mennyiség 0-ra állítása esetén a tételek feljebb csúsznak, így nem marad üres sor a kitöltöttek között.
    *   Nullára (0) csökkentett mennyiség esetén a tétel automatikusan törlődik ahelyett, hogy 0 értékkel a kamionon maradna.

## Lokális vs Szerver
A fejlesztési környezetben tesztelt és elfogadott módosítások a szerver `deploy` folyamat során a szerver kódbázisába integrálva lettek. Az összes helyi változtatás, beleértve a `kamion_szerkesztes.js` és `rakodas.js` fájlokat, aktív a szerveren.

Kérjük, egyeztessen velünk, ha a szerveroldali működés a további tesztek során eltérést mutat a dokumentáltakkal szemben.
