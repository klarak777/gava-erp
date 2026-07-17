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
