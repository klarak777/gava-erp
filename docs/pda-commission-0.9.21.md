# PDA komissiózás – 0.9.21: foglalás már a tétel megnyitásakor

Az Android verziónév 0.9.21, a verziókód 21. A 0.9.20-as APK még csak a Mentésnél hozott létre foglalást; az új forrás már a tételre kattintáskor kér szerveroldali belépési foglalást, az adatmegadó képernyő megnyitása előtt.

## Működés

- Ha más dolgozó már megnyitotta a komissiós adatmegadást, és az elérhető maradék az aktuális #/PLT alapján legfeljebb egy raklap, új dolgozó nem léphet be. A lista szürke sort és dolgozónevet mutat; a belépési API az elavult listán történő kattintást is 423 válasszal tiltja.
- A belépés, a mentés és a felszabadítás ugyanazt a tételszintű adatbázis-sorzárat használja. Két egyidejű kattintásnál csak az egyik dolgozó kap belépési jogot az utolsó raklaphoz.
- A belépési foglalás még nem foglal kartonszámot és nem készít címkét. A Mentés hozza létre a kartonfoglalást és az ideiglenes címkét ugyanahhoz a munkamenethez. A címke mennyisége egyszer kerül levonásra az effektív maradékból.
- A tétellistára visszalépés, a főképernyőre vagy más nézetre kilépés, a kijelentkezés és a sikeres véglegesítés felszabadítja a belépési foglalást. A saját munkamenet felszabadítása más dolgozó foglalását nem törölheti.
- Nyomtatásról az adatmegadáshoz visszalépve a régi címke és foglalás visszavonódik, majd új belépési foglalás szükséges. Az űrlap megadott értékei megmaradnak.
- A foglalás öt percig érvényes. Az előtérben nyitott adatmegadás és a folyamat további képernyői percenként, illetve az alkalmazás előtérbe kerülésekor megújítják. Megújításkor a már létrehozott címke lejárata is frissül. Lejárt vagy visszavont munkamenet nem éleszthető újra.
- Hálózati válaszvesztés esetén is megmarad a belépési kísérlet azonosítója a visszavonáshoz. A belépési kérés előtt beérkező visszavonás megakadályozza, hogy a késve feldolgozott belépés új foglalást hozzon létre.
- Egy raklapnál több elérhető mennyiségnél a párhuzamos adatmegadás továbbra is lehetséges. A már szabályosan belépett dolgozók folytathatják a folyamatot akkor is, ha később csökken a maradék; a kartonszámot minden mentés tranzakcióban ellenőrzi.
- A lista 15 másodperces megjelenítési frissítése megmaradt. A belépési tiltás ettől függetlenül a kattintáskor végrehajtott tranzakcióban érvényesül.

## Technikai változások

- Új `pda_pick_entries` tábla: munkamenet, tétel, dolgozó, bejelentkezés, lejárat, visszavonás és befejezés adatai.
- Új migráció: `20261006010000_add_pda_pick_entries.js`.
- Új végpontok: `POST /api/v1/pda/commission-lines/:id/enter`, `POST /api/v1/pda/commission-lines/:id/entry/renew`, `DELETE /api/v1/pda/commission-lines/:id/entry?pickSessionId=...`.
- A tétellista egy adatbázis-pillanatképből számol a nyitott adatmegadásokkal és a kartont foglaló ideiglenes címkékkel.
- Új címke létrehozásához érvényes belépési foglalás szükséges. A korábban már elfogadott, érvényes címkék véglegesítése továbbra is lehetséges.

## Frissítés

1. Az élesítés előtt zárjátok le az aktív komissiókat és készítsetek adatbázismentést.
2. Telepítsétek a szerver módosított forrását, és futtassátok az új migrációt a szerver `npm run migrate` parancsával.
3. Frissítsétek a webes PDA-felületet, és az új forrásból épített APK-t telepítsétek a PDA-kra. A 0.9.20-as APK nem kéri a belépési foglalást, ezért az új szerveren új címke mentéséhez kliensfrissítés szükséges.

A 0.9.21 APK a GitHub `master` ágán található `54389fa326fdf1325b1f734ae04587bd51b61144` commitból elkészült. Az éles szerver frissítése és a PDA-kra telepítés külön művelet; a GitHub-build ezeket nem végezte el.

## Elkészült GitHub APK-build

- [Sikeres GitHub Actions futás](https://github.com/klarak777/gava-erp/actions/runs/37332862161); a PDA szerveroldali és Chromium-tesztjei is sikeresek.
- APK: `Gava-PDA-App-0.9.21.apk`; a letöltött GitHub artifact: `Gava-PDA-App-0.9.21.zip`.
- Ellenőrzött csomagazonosító: `com.gava.pda`; verziónév: `0.9.21`; verziókód: `21`.
- A beépített `commission.js` és `app.js` egyezik a forrással. Az aláíró tanúsítvány egyezik a 0.9.20-as APK-éval.
- APK SHA-256: `1ebe6fa3663b566220c71e2d9a655cf7813591c7baac2086bce2e45bf9262aae`.

## Ellenőrzések

- `server`: `PDA_TEST_DATABASE_URL` megadásával `npm test` – külön PostgreSQL-sémában valódi párhuzamos belépések, lejárat, jogosultságok, megújítás, visszavonás, hálózati újrapróbálás és véglegesítés.
- `PDA UI`: `npm test` – a képernyő csak sikeres szerveroldali belépés után nyílik meg; mentés előtti megújítás és visszalépés, válaszvesztés utáni visszavonás, a belépési azonosító megőrzése a teljes munkafolyamatban, valamint a korábbi PDA-folyamatok.
