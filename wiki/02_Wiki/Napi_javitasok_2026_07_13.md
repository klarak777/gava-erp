# GAVA ERP - Napi javítások és fejlesztések (2026-07-13)
**Verzió:** V0.5.2

## Adatbázis
- **Currencies (Devizák) tábla létrehozása** (`20260713010000_023_create_currencies_table.js`): Új `currencies` tábla, alap devizákkal előtöltve (EUR, HUF, USD). Admin felületen bővíthető.
- **Finance Transport Lines tábla létrehozása** (`20260713020000_024_create_finance_transport_lines.js`): Új `finance_transport_lines` tábla a Transport & Other számlasort tárolja a Goods tételektől elkülönítve.
- **Finance Unit Cost Lines tábla létrehozása** (`20260713030000_025_create_finance_unit_cost_lines.js`): Új `finance_unit_cost_lines` tábla az egységköltségek (Unit Costs fül) részletes sorainak tárolására.

## Backend
- **Admin API**: `currencies` tábla bekerült az engedélyezett táblák közé, lekérdezhető a `/api/v1/admin/currencies` végponton.
- **Új API végpontok**: `/api/v1/finance-transport-lines` és `/api/v1/finance-unit-cost-lines` – GET (lekérés shipment_id + ref_name alapján) és POST (batch mentés).

## Frontend – Admin
- **nav-structure.js**: Új "Currencies (Devizák)" menüelem az Admin modulban.
- **admin.js**: Új `admin-currencies` akció a Currencies Admin tábla megnyitásához.

## Frontend – Kamion Pénzügyi Szerkesztő
- **Háromfüles rendszer bevezetése**: Goods tábla, Transport & Other tábla, és Unit Costs tábla.
- **Transport & Other tábla oszlopai**: Lin, DATEc, TypeSupp, Supplier, Invoice N, TypeA, Description, Amount, TpTax, Tax, Tot Invoice, Cur, ExchRt, Total Inv Local, IdEmpr, Season, TruckNr.
- **Unit Costs tábla oszlopai**: 
  - Manuális: Lin, Product (datalist), Description, Netto(kgs), Kgs/Box, Pr/kg, Trans/kg
  - Számított (Readonly): V.Cost/kg (Pr+Trans), OH/kg (V.Cost × Overhead%), TotCost/kg (V.Cost+OH), +VAT/kg (TotCost × 1.27), TotCost/Box (TotCost × kgs/Box), +VAT/Box (+VAT/kg × kgs/Box), V.Cost/kg [EUR] (V.Cost / ExchRt).
  - Összesítők a tábla tetején: Pr/kg, Trans/kg, V.Cost/kg, OH/kg oszlopokra, a `Sum(oszlop × Netto(kgs))` képlettel.
- **Mentés**: A Save gomb egyszerre menti mindhárom fül adatait.
