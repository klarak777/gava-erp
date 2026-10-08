# Heti lekötés: adatbázisból történő betöltés

2026. október 8.

A felhasználó pontosítása: az ellenőrzött Excelben az akción kívüli napokhoz nem szerepelt mennyiség ott, ahol a táblázat nullát jelölt. A konkrét esetben a korábbi olvasás helyes volt; a feltételezett hibát az Excel vizsgálata nem igazolta. Az október 7-én hozzáadott, megnyitáskori automatikus archívumolvasás felesleges lassulást okozott.

Helyi mérés a javítás előtt (`localhost:3000`): a KW36 GET 21,1 másodperc, közben egy egyszerű JavaScript-fájl 20,9 másodperc; utána ugyanaz a fájl 5 ms. A hiányzó napi bontás miatt a GET szinkron hálózati Excel-olvasást indított, feltartva a Node szervert.

A javított működés:

- A heti adatok GET végpontja kizárólag adatbázisból olvas. Megnyitás és automatikus frissítés nem érinti az archivált Excelt.
- Excel-feldolgozás a feltöltéshez és a felhasználó által indított újrafeldolgozáshoz tartozik; ezek a mennyiségeket és a napi bontást elmentik az adatbázisba.
- A betöltés alatt is megjelenik az év-, hét- és műveletválasztó. A korábban betöltött táblázat látható marad az új kérés alatt.
- Az automatikus frissítés nem indít újabb kérést a kezdeti betöltés közben.
- A modul első megjelenítése nem vár a háttérben induló egyéb lekérések befejezésére.
- A „Hiányoznak a napi tervadatok. A pontos részösszegekhez töltsd fel a heti Rendelési tervet vagy indíts újrafeldolgozást.” szerkesztőüzenet eltávolítva.

A módosítás nem állít elő hiányzó mennyiségeket és nem írja át a mentett adatokat. A ténylegesen hiányzó napi bontás és az importált nulla továbbra is különbözik a számításban.

Ellenőrzés: 24 kapcsolódó API-, számítási, készlet- és Chromium-teszt sikeres. Az API-teszt többszöri GET esetén is nulla Excel-olvasást igazol; újrafeldolgozás után a GET a mentett napi bontást használja. A böngészőteszt visszatartott adatválasz mellett ellenőrzi a vezérlők megjelenését és az ismételt automatikus kérés kizárását.

A helyi `localhost:3000` backend újraindítva a javított kóddal. A KW36 lekérés 34 ms, ismételve 10 ms; a párhuzamos JavaScript-fájl 20 ms. Mindhárom válasz HTTP 200, 24 heti tétel; Excel-olvasás és archívumpótlási figyelmeztetés nélkül. Az adatbázis sorait nem módosítottuk. A nyitott böngészőoldal egyszeri frissítése szükséges az új frontend betöltéséhez.
