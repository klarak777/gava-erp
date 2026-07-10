# GAVA ERP - Napi javítások és fejlesztések (2026-07-10)
**Verzió:** V0.5.0

## Menedzser Modul Adatkezelés és Logika
- **Üres Customer-ű kamionok elrejtése:** Megváltoztattuk a Menedzser modul listázási logikáját (`menedzser.js`). Mostantól ha egy kamionhoz (mint pl. a H383 / GHU 383) nem tartozik egyetlen olyan tétel sem, amelynek a `Customer` mezője "GHU", akkor a kamion egyáltalán nem jelenik meg a Menedzser modul listájában (korábban üres névvel megjelent).
- **Partner csoportosítás kiterjesztése (AGROPONIENTE):** A partnerek összevonási szabályát általánosítottuk. Ezentúl minden olyan partner, amelynek a neve a DB-ben az **"AGROPONIENTE"** szóval kezdődik (pl. "AGROPONIENTE NATURAL", "AGROPONIENTE" stb.) automatikusan egyetlen partnerként csoportosul a felületen és a backend API lekérdezésekben is. Így az ehhez tartozó összes alfuvar tétel (mint a Galia dinnye) hiánytalanul betöltődik a Pénzügyi Kamion Szerkesztőbe.
