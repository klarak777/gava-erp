# Gavá ERP Access UI - Fejlesztési Napló

## Verzió: V0.6.8
**Dátum:** 2026.07.30.

### Kiemelt javítások és fejlesztések
1. **Transportistas Modul UI Finomítások**
   - A szűrők beviteli mezőinek (pl. Order number, Plate, Year stb.) méreteit és elrendezéseit keskenyebbre és optimalizáltabbra vettük, hogy jobban illeszkedjenek a felülethez. A Rakodási helynél a "Telephely" szűrőt "Ország"-ra cseréltük.
   - Bizonyos táblázat oszlopok ("K-B", "B", "T", "AMOUNT HUF", "AMOUNT EUR") keskenyebbek lettek, míg a "COMMENT" és "INVOICE NUMBER" oszlopok szélesebbek, hogy minden tartalom és tizedesjegy megfelelően látszódjon.
   
2. **Kamion Pénzügyi Szerkesztő Modul (Menedzser)**
   - **Customer order N° (Albaran) javítás**: A kamion szerkesztő felületen a "Customer order N°" nem jelent meg a megadott logika alapján. Ezt a táblázat generáló mechanizmusának javításával korrigáltuk, így most már minden szükséges adatcellába bekerül a helyes információ.
   - **Transport & Other fül - Delete line működés**: Aktiváltuk a "Delete line" (Sor törlése) gombot. Mostantól a törlendő sor(ok) kijelölése és a törlés megerősítése után az adatok azonnal kikerülnek a táblából és a végösszeg (Total Invoice) is újraszámolódik.
   - **Transport & Other fül - ExchRt szinkronizáció**: A fejlécben megadott valutaárfolyam (ExchRt) érték valós időben szinkronizálódik a Transport fül összes sorának `ExchRt` mezőjével, beleértve az újonnan hozzáadott sorokat is.
   - **Transport & Other fül - Dinamikus Supplier / Transporter választás**: Ha a `TypeSupp` (Típus) legördülőt "Supplier"-re állítják, a Supplier mező a fejlécből veszi át az alapértelmezett Reference Supplier értéket. Ha "Trasport"-ra kapcsolják, akkor a rendszer az adott kamionhoz rendelt hivatalos fuvarozó cég (Transporter company) nevét hívja be.
   - **Backend API kiegészítés**: A backend `GET /api/v1/shipments/:id` végpontja javításra került, mostantól hozzákapcsolja a `transporters` táblát is, hogy a frontend számára biztosítsa a `transporter_name` (Fuvarozó cég) mezőt, így a "Trasport" opció választásakor a fenti logika helyesen fel tudja tölteni az adatot.

### Egyéb technikai változások
- Kisebb UI felületi elcsúszások korrigálása a kamion szerkesztőben a fájlfeltöltő szekciónál (Szállítólevél feltöltése modul pozíciójának igazítása a Transportistas kamion nézetben).
- Github repó frissítve a legújabb módosításokkal (készen áll a DigitalOcean szerverre történő élesítésre).
