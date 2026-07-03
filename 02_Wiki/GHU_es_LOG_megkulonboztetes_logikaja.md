# GHU és LOG megkülönböztetés logikája

Eredetileg a "Kiküldve" státuszt szerettük volna két külön ágra (GHU és LOG) bontani a Fuvarmegbízások és EKAER modulokban. Ez a logika jelenleg inaktív a kiküldés folyamatában, de a jövőben egy **könyvelési, pénzügyi funkcióhoz** lesz felhasználva.

A logika a következőképpen épült fel:

## 1. Adatbázis (Tábla szintű változások)
A `transport_orders` és `ekaer_records` táblákban az egyetlen `is_sent` logikai mező helyett két külön mező jött létre:
- `is_sent_ghu` (boolean)
- `is_sent_log` (boolean)

A korábbi adatoknál mindkét új mező felvette a régi `is_sent` értékét.

## 2. API végpontok
A GET lekérdezések a két új mezőt olvassák ki (`is_sent_ghu`, `is_sent_log`), majd kiegészítik dinamikusan számított értékekkel, amik megmondják, hogy egy adott fuvarhoz tartozik-e egyáltalán GHU vagy LOG tétel:
- `has_ghu`: Van-e a fuvarhoz (tour alapján) olyan `loads` tétel, aminek a `Customer` mezeje tartalmazza a "GHU" szót.
- `has_log`: Van-e a fuvarhoz (tour alapján) olyan `loads` tétel, aminek a `Customer` mezeje tartalmazza a "LOG" szót.

A PUT végpontok képessé váltak az `is_sent_ghu` és `is_sent_log` mezők külön-külön történő frissítésére.

## 3. UI (Frontend) megjelenítés és szűrés
A táblázatokban két külön oszlop jelent meg (pl. "Kiküldve GHU", "Kiküldve LOG").
- **Okos checkboxok:** 
  - Ha `has_ghu` igaz (vagy üres a fuvar, azaz `has_ghu` és `has_log` is hamis), akkor aktív a jelölőnégyzet.
  - Ha `has_ghu` hamis (de van a fuvaron LOG), akkor egy szürke ❌ ikon jelenik meg, jelezve, hogy nincs mit kiküldeni.
  - Ugyanez a szabály érvényes a `has_log` esetén is.
- **Szűrés és Elrejtés:**
  - A sor alapértelmezetten rejtetté válik, ha minden *aktív* része ki van küldve (tehát ha csak GHU-s, akkor a GHU kipipálása után eltűnik).
  - A szűrősávban két külön checkbox ("Mutassa a kiküldött GHU fuvarokat" és "Mutassa a kiküldött LOG fuvarokat") segített a már feldolgozott elemek újramegjelenítésében.
