# 2026.07.15 - Napi módosítások (V0.5.4)

## Partnerek Modul Újraírása (V0.5.4)
1. **Adatbázis kibővítése:** 
   - A `partners` tábla ~40 új mezővel bővült (címek, természetes személy adatok, pénzügyi beállítások).
   - 11 új kapcsolódó tábla jött létre a komplex adatok tárolásához (`partner_sites`, `partner_communications`, `partner_contacts`, `partner_agents`, `partner_identifiers`, `partner_characteristics`, `partner_restrictions`, `partner_categories`, `partner_bank_accounts`, `partner_discounts`, `partner_credit_settings`, `partner_events`, `partner_attachments`).

2. **Backend API (`partners_extended.js`):**
   - Létrehoztunk egy új API végpontot, ami tranzakcionálisan menti el a partnert és az összes hozzá tartozó altábla adatát.
   - Fájlfeltöltés (Multer) és letöltés logika a Csatolmányokhoz.

3. **Frontend Felület (`partnerek.js`):**
   - Új, 8 főfüles (és számos alfüles) komplex partnerkezelő felület készült el az "Iroda" menüpont alá ("Partnerek" néven).
   - Lista nézet, típus szerinti szűréssel és kereséssel.
   - A felugró ablak áttetszőségét javítottuk (fehér, átlátszatlan háttér a jobb láthatóságért).

4. **Verziószám Frissítés:**
   - Az UI-n mindenhol V0.5.4-re módosítottuk a verziószámot.
