# 2026-07-17 Napi javítások - Partner modul és Azonosítók

## V0.5.7 Frissítés Tartalma
- **Verziószám:** V0.5.5 -> V0.5.7
- **Főképernyő Szűrőbővítés:** A `Partner` modul listanézetében a típus szűrő legördülő menüje kibővült az összes azonosító típussal (`Adószám`, `CCW + Kód`, `Csoportos adószám`, `Közösségi adószám`, `FELIR azonosító`, `NEBIH`).
- **Azonosítók Listázása (Backend):** A backend keresési logikája (`partners_extended.js`) módosítva lett. Ha egy azonosítóra szűrünk a fő listában (pl. `NEBIH`), a rendszer nemcsak azokat a partnereket adja vissza, akiknek a fő típusa ez, hanem azokat is, akik rendelkeznek ilyen azonosítóval a `partner_identifiers` táblában.
- **Azonosítók Táblázat (Egyéb adatok fül):**
  - A `+` gombra már nem egy felugró ablak jelenik meg, hanem egyszerűen csak beszúr egy új, szerkeszthető sort az Azonosítók táblázatba.
  - Ebből a legördülőből kikerültek a státusz típusok (`Vevők`, `Szállítók`, `Fuvarozók`), itt csak konkrét, értékkel rendelkező azonosítók adhatók meg.
  - A felvitt adószámok (VIES) ellenőrzése itt helyben futtatható.
- **Típus Megadása Felugró Ablak:**
  - Létrehoztunk egy új `⚙️ Típus megadása` gombot az Azonosítók táblázat fejlécsorában.
  - Ez a gomb nyitja meg a felugró ablakot, amely kizárólag a partner fő típusának/kategóriájának (pl. `(Customer) Vevők`, `(Reference) Szállítók / Partnerek`, `NEBIH`, stb.) kiválasztására szolgál.
  - A felugró ablakból eltávolítottuk az értékmezőt (`Érték`), így a felhasználót nem kötelezzük felesleges adatbevitelre a státuszok kiválasztásakor.
- **Adószám Auto-betöltés Logika:** Meglévő partnerek megnyitásakor a korábban a fő táblában (`partners.tax_id`) tárolt adószám beolvasásra kerül, és automatikusan bekerül egy szerkeszthető és ellenőrizhető sorként az Azonosítók táblázatába, ha ott még nem szerepelt.
- **Mentés Gomb:** A felugró ablak mentés gombja stabilan a fejlécen lett rögzítve CSS segítségével, és az ablak magassága `90vh`-ban lett maximalizálva a különböző képernyőméretek kezelése érdekében.
- **Telephelyek Cím- és Adatbeviteli Mezők:**
  - Teljesen restauráltuk és kibővítettük a `Telephelyek` fület. Mostantól ha kiválasztasz egy telephelyet a listából, a lenti részen megjelenik a **Székhelynél alkalmazottal megegyező strukturált cím adatbeviteli blokk** (🏠 Cím és ✉️ Levelezési cím).
  - A cím adatmezők mellett megjelentek az egyéb speciális mezők is (pl. Számlázási cím, Számla postázási cím, Azonos a székhellyel opció, Kommunikációs nyelv, Jövedéki engedélyszám, GLN, Szállítási raktár, Alapértelmezett tranzakció).
  - **Többszintű mentési logika:** A telephelyekhez kapcsolódó egyedi elérhetőségek (communications) és kapcsolattartók (contacts) a telephely kiválasztásakor szintén szerkeszthetők a saját alfüleiken.
  - **Új telephelyek ID feloldása (Backend & Frontend):** Az adatbázis integritás megőrzése érdekében a mentés során a kliens egyedi ideiglenes azonosítókkal (`_tempId`) küldi be az új telephelyeket és a hozzájuk rendelt al-adatokat. A backend a mentés során először beszúrja a telephelyeket, lekéri a generált adatbázis ID-kat, majd ezekkel automatikusan feloldja és társítja a kapcsolódó elérhetőségek és kapcsolattartók `site_id` hivatkozásait.
- **Partner Törlése a Táblázatból:**
  - A fő partner listában a sorok végén elhelyeztünk egy `🗑️` (Törlés) gombot.
  - A gombra kattintva megerősítést kér a rendszer, majd a háttérben meghívja a `DELETE /api/v1/partners/:id` végpontot. Sikeres törlés után frissíti a listát és újrarendeli az eseménykezelőket.
  - A gombra való kattintás megakadályozza a sor megnyitását (`event.stopPropagation()`), így nem ugrik fel a partner adatlapja törléskor.


