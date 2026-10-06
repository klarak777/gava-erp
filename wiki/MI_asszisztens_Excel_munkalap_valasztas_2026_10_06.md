# MI asszisztens – többfüles Excel feldolgozása

**Dátum:** 2026. október 6.

## Korábbi működés

Az MI asszisztens az Excel-munkafüzet első munkalapját dolgozta fel. A további fülek kimaradtak, és erről a felhasználó nem kapott jelzést.

## Új működés

- Többfüles Excel feltöltésekor a beszélgetésben megjelenik a fülek száma és egy kérdés a feldolgozás módjáról.
- Az **Összes fül feldolgozása** gomb minden munkalapot kiválaszt.
- A **Fülek kiválasztása** gomb megnyitja a munkalapnevek jelölőnégyzetes listáját. Egy vagy több fül kijelölhető.
- A **Kijelölt fülek feldolgozása** gomb csak legalább egy kijelölt fül esetén használható.
- A **Mégse** megszakítja az új fájl feldolgozását. A korábbi aktív dokumentum megmarad.
- Egyfüles fájlnál nincs külön választási lépés. A CSV feldolgozása is megmarad; az XLSX mellett a régi XLS-formátum is támogatott.
- A feldolgozott fülek neve megjelenik az aktív dokumentumnál és a beszélgetésben.
- A munkalap neve minden feldolgozott szövegrészhez hozzákerül, így a nagy munkalapok darabolása után is azonosítható az adatok forrása.

## Szerveroldali feldolgozás

A meglévő `POST /api/v1/ai/upload` végpont többfüles fájl első beküldésekor `selectionRequired: true` választ ad, a munkalapnevekkel. Ekkor még nem hoz létre dokumentumrekordot és nem indít embedding-hívást. A fájlt a böngésző tartja meg a választás idejére.

A választás után ugyanaz a fájl ismét beküldésre kerül: az összes munkalaphoz `allWorksheets=true`, egy kijelölt részhalmazhoz JSON-tömbként a `worksheets` mező tartalmazza a neveket. A szerver ellenőrzi a kiválasztást. Nem létező vagy üres kiválasztás esetén 400 választ ad; ugyanaz a fül többszöri megadással sem kerül többször feldolgozásra. A feldolgozás a munkafüzet sorrendjét követi.

Csak a kiválasztott fülek tartalma kerül az MI dokumentum adatai közé. A teljesen üres kiválasztott tartalom feldolgozható adat hiányára utaló hibaüzenetet ad. A fülnevek a felületen szövegként jelennek meg, HTML-ként nem értelmeződnek.

## Ellenőrzések

- Az új funkció hét automatikus tesztje sikeres: választás előtti adatbázis- és embedding-hívások hiánya, összes/kijelölt munkalap feldolgozása, nagy munkalap darabolása, hibás kiválasztás, egyfüles XLSX/XLS/CSV, üres munkalap, valamint Chromium böngészős folyamat.
- A böngészős teszt ellenőrzi a kattintható gombokat, a kijelölést, a megszakítást, a szerverhibát, az azonos fájl újraválasztását és a különleges fülnevek megjelenítését.
- Teljes szervertesztkészlet: **63 sikeres teszt, 0 hiba, 2 kihagyott PostgreSQL-teszt**, külön adatbázis-tesztkörnyezet hiányában.
- A funkciótesztek helyettesített adatbázist és embedding-szolgáltatást használnak; nem küldenek adatot külső MI-szolgáltatásnak.

## Érintett fájlok és frissítés

- `Access UI/src/modules/ai-chat.js`, `Access UI/src/main.js`.
- `server/src/routes/ai.js`, `server/src/services/aiService.js`, `server/src/utils/aiWorkbook.js`.
- `server/tests/aiWorkbookUpload.test.js`.

Használatához az Access UI és a szerver együtt frissítendő. A módosítás helyben elkészült; GitHub-feltöltés és éles telepítés ebben a munkában nem történt. Új adatbázis-migráció és PDA APK nem szükséges.

## Többfüles feltöltésnél jelentett „Ismeretlen hiba” javítása

A jelentett fájl: `Eurogroup-Aldi óraszámok új 2025.xlsx`. A munkafüzet olvasható, tizenkét nem üres munkalapot tartalmaz. A szerveroldali beolvasás helyesen `selectionRequired: true` választ ad.

A régi feltöltési felület ezt a választ általános sikertelen feltöltésként kezelte, és `error` mező hiányában „Ismeretlen hiba” üzenetet írt ki. A működő választófelülethez az új klienskód betöltése szükséges; a változatlan belépési modul URL-je és egy korábban megnyitott oldal megakadályozhatja ezt.

- Az `index.html` belépési modulja új URL-en töltődik: `src/main.js?v=0.9.7.2`.
- A főmodul az MI felületet `ai-chat.js?v=9` címen tölti be.
- A Node.js kiszolgáló a belépési HTML-oldalra is kiküldi a gyorsítótárat tiltó fejléceket.
- A szerver fülválasztást kérő válaszában a régi kliens is kap érthető, oldalfrissítést kérő üzenetet. Az új kliens továbbra is a kattintható választófelületet jeleníti meg.
- A felület általános sikertelen válasznál a szerver `message` mezőjét is megjeleníti, ha nincs `error` mező.

A böngészős regressziós teszt a tényleges HTML- és főmodul-betöltési hivatkozásokat követi. Helyben a jelentett Excel-fájllal ellenőrzi a tizenkét fül megjelenését, a November és December kiválasztását és az összes fül feldolgozását. Ha a személyes mintafájl nincs jelen, a teszt ugyanezt a tizenkét füles felépítést generálja, így a GitHubon is futtatható. A teszt nem küldi a fájl tartalmát külső MI-szolgáltatásnak.

Újraellenőrizve: hét funkcióteszt sikeres; teljes szervertesztkészletben 63 sikeres, 0 hibás és 2 kihagyott adatbázisteszt. További érintett fájlok: `Access UI/index.html`, `server/server.js`. A frissített felület betöltéséhez a már megnyitott ERP-oldalt újra kell tölteni; szükség esetén `Ctrl+F5` használható.
