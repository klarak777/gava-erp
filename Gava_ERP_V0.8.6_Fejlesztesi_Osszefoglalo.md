# Gava ERP – V0.8.6 Heti lekötés javítások

Dátum: 2026-09-10. Állapot: helyi javítás; az éles telepítés és migráció még nem történt meg.

## Akció és rendelés

Az akció tényleges kezdőnapjától haladva: 4 nap esetén 30/30/22/18%, 3 nap esetén 40/40/20%, 2 nap esetén 70/30%. A szeptember 3–6. közötti, 2686 kartonos Körte-akció csütörtök–vasárnapra 806, 806, 591, 483 kartont ad. Másik hét akciója nem írja felül a normál becslést; az évváltás is támogatott.

Elsőbbség: tényleges rendelés (a nulla is) → akciós becslés → normál becslés. Normál és akció ugyanarra a napra nem adódik össze. Csak a current rendelésverzió számít, a szállítási dátum alapján. A terméktörzs kapcsolása nem sokszorozza meg a rendelést; ellentmondó GTIN–cikkszám kapcsolat hibát jelez.

## Készlet

A hét szerda–kedd. Minden újraszámítás a heti nyitókészletből indul.

- Rendelkezésre álló = előző napi záró + aznapi érkező.
- Megjelenített hiány = max(0, −rendelkezésre álló).
- Záró = rendelkezésre álló − aznap érvényes fogyás.

Pénteken a szerdai és csütörtöki fogyás csökkenti a nyitóállapotot. A pénteki fogyás a szombati nyitóban jelentkezik. Külön keddi zárókészlet-oszlop nincs.

Korábbi hetek minden napja látható; az aktuális héten csak a mai nap értékei jelennek meg. A többi nap a háttérben továbbra is beleszámít. A naptári nap Budapest időzónáját használja.

A látható Heti lekötés öt másodpercenként ellenőrzi az adatokat és a napváltást. Gépelés és folyamatban levő készletmentés közben nem frissít a bevitelre. Fülváltáskor is újra lekérdez. Ez rövid késleltetésű lekérdezés, nem szerveres push.

## Feltöltés

Egy gomb, tallózás és behúzás használható; XLSX szükséges. A Keresleti/Normál/HLK és Terv/Akciós/HLA nevek felismerhetők.

Dátumos fájlnál a kezdődátumhoz tartozó, előző vagy aznapi szerdával kezdődő hét számít. A 03.09.2026–09.09.2026 minta KW36-ra kerül.

Dátum nélkül az első feltöltés KW36. A hiányzó másik típus ugyanahhoz a héthez kapcsolódik; új azonos típus a következő hetet indítja. Változatlan fájl ismétlése nem léptet. A „Kiválasztott hét javítása” jelölővel a módosított, dátum nélküli fájl kifejezetten a kijelölt hetet javítja. Évfordulón KW01 következik.

Az Excel ellenőrzése megelőzi a fájl írását és az adatbázissorok cseréjét. Egyedi, verziózott fájlnevek készülnek, „… KW36 HLK.xlsx” vagy „… KW36 HLA.xlsx” végződéssel. Hibás Excel nem írja felül a korábbi fájlt.

A célmappa továbbra is RAKTAR_PATH/Gava Hungria System/ERP ALDI/Heti lekötés/<év>. Windows alapgyökér: \\192.168.1.5\raktar; Linux: /mnt/raktar. Más heti rendelési mappát igazolt elérési út nélkül nem állítottunk be.

## Adatkapcsolat és telepítés

Az azonosítás ALDI-cikkszámon alapul. A kód nem ment chain_products azonosítót a products táblára mutató mezőbe. A megjelenített név az ALDI törzsből, hiányában az Excelből származik.

Új migráció: 20260910010000_fix_weekly_commitment_identity.js. Hozzáadja az Excel terméknevének mezőjét, megszünteti a hibás tétel-ID használatát, és ahol nincs ütközés, kitölti a korábbi készletsorok cikkszámát a kapcsolt termékkódból. A feloldhatatlan régi készletsorok kézi egyeztetést igényelnek; nem töröljük őket.

A készletmentés csak az elküldött mezőt módosítja. Sikertelenségkor látható hibaüzenet és a szerver adatainak visszatöltése történik; a tranzakció visszagörget.

## Ellenőrzés

Hat célzott teszt sikeres: Körte és egyéb akciós elosztások, évváltás, tényleges nulla elsőbbsége, pénteki nyitókészlet és érkező, budapesti éjfél, fájltípus/hét-felismerés, hibás Excel visszagörgetése. Több eset közös tesztben szerepel.

56 frontendmodul és a módosított backend szintaktikai ellenőrzése sikeres. A teljes tesztcsomag két korábbi PDA-súlytesztje eltér a jelenlegi PDA-kódtól; e javítás ezeket nem módosítja. Böngészős és éles DO-ellenőrzés nem történt.
