# GAVA ERP - Napi javítások és fejlesztések (2026-07-09)
**Verzió:** V0.5.0

## Menedzser Modul & Pénzügyi Kamion Szerkesztő
- **Adatbázis & Backend:** Létrehozásra került a `finance_tax_rates` tábla és az ahhoz tartozó Admin API végpont, hogy a TpTAX kulcsok (0, 5, 12, 18, 25, 27) dinamikusan, legördülőből legyenek választhatóak. A kamionhoz tartozó `invoice_number_finance` mező is létrehozásra került a `shipment_lines` szintjén, így a fuvarszámla (Menedzser) független maradt a Rakodás számlaszámtól.
- **Pénzügyi Szerkesztő Kalkulációk:**
  - `Nettó Amnt` = Kgs * Unit Pr
  - `Un Pr A` = Unit Pr
  - `AmountA BT` = Nettó Amnt
  - A módosítások hatására a táblázat összesítője (Totals) és minden kapcsolódó számítás azonnal frissül a felületen.
- **Elrendezés Módosítások:**
  - A "Totals" sor egy a táblázat fejlécében (thead) rögzített új, kiemelt sorba került a látható oszlopoknak megfelelő, precíz összeigazítással (`colspan="4"` és külön `Tot Invoice A` cimke), így már egy oszlop sem csúszik el.
  - A bal felső sarok fejlécén (GHU, Season, Truck No) vastagon szedett, egysoros formázást alkalmaztunk.
  - A Truck No mezőbe most már megjelenik a tört (/) végződés is, ha a Menedzser modulból egy "sub-order" (pl. H196/2) kerül megnyitásra. Ezt a táblázatból származó `display_order_number` paraméter átadásával oldottuk meg.
  - A "Goods Currency" legördülő és a hozzá tartozó "ExchRt" beviteli mező bekerült a bal felső információs blokkba.
  - Ugyanakkor egy független, második "Currency" és "ExchRt" vezérlőpáros is megjelent a tételtábla eszközsávján (a Delete/Update/Add line gombok mellett).

## UI / Megjelenés
- A verziószám a felületen (belépő képernyő, oldalsáv és fejléc) **V0.5.0**-ra frissült.

## Menedzser Modul Adatkezelés és Optimalizáció
- **Gyorstárazás (Caching) és Frissítés gomb:** A Menedzser modul mostantól elmenti a szerverről lekérdezett adatokat, így a fülek/menüpontok közötti váltáskor nem terheli feleslegesen az adatbázist. A felületen elhelyezésre került egy új "Frissítés" gomb a gyors és manuális adatszinkronizációhoz.
- **Kamion Pénzügyi Szerkesztő GHU Szűrés javítása:** Kijavításra került a betöltési logika, mely szigorúan csak azokat a termékeket/tételeket jeleníti meg az adott alfuvarban (pl. H196/2), melyek `Customer` (Vevő) mezője tartalmazza a "GHU" azonosítót. Ennek köszönhetően a "SPAR SLO", "SPAR CRO" és a hasonló, más vevőhöz (pl. FRUBALMED) tartozó tételek automatikusan rejtve maradnak, igazodva a Transportistas modul szabályrendszeréhez.
