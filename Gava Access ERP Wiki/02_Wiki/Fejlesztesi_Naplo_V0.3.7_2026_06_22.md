# Fejlesztési Napló – V0.3.7 – 2026-06-22

## Összefoglalás
Az elmúlt időszakban a Fuvarmegbízások és EKAEREK modulok jelentős funkcióbővítésen estek át: bevezetésre került a dokumentumok (DOCX) közvetlen böngészőből történő megtekintése (Mammoth.js alapú előnézettel), a fájlok letöltése, valamint a robusztusabb hálózati meghajtó (UNC) elérés és a dokumentumok valós törlése megerősítő lépcsővel.

---

## Változtatások

### 1. Dokumentumok Megtekintése és Előnézet (Mammoth.js)
- A **Fuvarmegbízások** és **EKAEREK** modulok UI-ján a dokumentum megnyitás gomb mostantól egy modális ablakot nyit meg, ami a `Mammoth.js` segítségével a háttérben beolvassa a szerveren lévő DOCX fájlokat, és HTML formátumban jeleníti meg azokat a felhasználónak.
- Az előnézeti ablak töltést jelző animációt (spinner) és modern UI elemeket kapott.
- Ugyanezen a felugró ablakon elhelyezésre került egy "Letöltés" gomb is, amellyel a DOCX fájl közvetlenül letölthető a böngészőt futtató kliens gépre.

### 2. Okos Dokumentum Útvonal Keresés és Önjavítás (Self-Healing Paths)
- A backend új logikát kapott a megosztott hálózati mappákon (pl. `\\192.168.1.5\raktar`) lévő fájlok megkeresésére.
- **EKAER könyvtárak keresése:** Ha egy EKAER fájl nem található a szabványos elérési úton (pl. `LOG341` mappában), a rendszer automatikusan megpróbálja megkeresni az " OK" végződésű mappában is (`LOG341 OK`), ami az Access-es időkben gyakori elnevezési konvenció volt.
- **Rendszám alapú fájlnevek kezelése:** A kód módosult, hogy az EKAER fájlok generálásakor a rendszámok közötti szóközöket megtartsa (pl. `AI HK 742 - AH OD 227.docx`), így biztosítva a visszafelé kompatibilitást a régi fájlokkal.
- Ha a rendszer sikeresen megtalálja a dokumentumot egy alternatív útvonalon, a **háttérben automatikusan frissíti az adatbázist** a helyes elérési úttal, így a jövőben a megnyitás azonnali lesz.

### 3. Biztonságos Törlés Jóváhagyással (Fuvarmegbízások és EKAEREK)
- A felhasználói felületen a "Törlés" gombokhoz jóváhagyó (megerősítő) felugró ablak (Modal) lett társítva.
- A korábbi "dummy" (csak frontenden futó) törlési logika helyett be lett kötve a tényleges backend `DELETE` API végpont.
- Két új backend végpont jött létre:
  - `DELETE /api/v1/transport-orders/:id`
  - `DELETE /api/v1/ekaer-records/:id`
- Ha a felhasználó jóváhagyja, a rekord fizikailag is törlésre kerül az adatbázisból, és a táblázat frissül.

### 4. Verziószám Frissítés
- Az alkalmazás frontend felületén (bejelentkezési képernyő, oldalsó menü) a verziószám **V0.3.7**-re lett frissítve.

---

## Érintett fájlok

| Fájl | Módosítás típusa | Leírás |
|------|-----------------|--------|
| `Access UI/index.html` | MODIFY | Verziószám frissítése V0.3.7-re. |
| `Access UI/src/modules/fuvarmegbizas.js` | MODIFY | Előnézeti modal hozzáadása, letöltés gomb és valós DELETE API hívás. |
| `Access UI/src/modules/ekaerek.js` | MODIFY | Előnézeti modal hozzáadása, letöltés gomb és valós DELETE API hívás. |
| `server/src/routes/transport_orders.js` | MODIFY | Megtekintés (`/preview`), Letöltés (`/download`) és Törlés (`DELETE`) végpontok. |
| `server/src/routes/ekaer.js` | MODIFY | Megtekintés (`/preview`), Letöltés (`/download`) és Törlés (`DELETE`) végpontok, önjavító logika. |
| `server/src/config/transporterConfig.js` | MODIFY | EKAER útvonal és fájlnév generáló logika finomhangolása (szóközök megtartása). |
