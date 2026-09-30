# Fejlesztési Napló: Dolgozók Modul Implementációja (V0.9.6)
**Dátum:** 2026. Szeptember 30.
**Modul/Verzió:** ERP V0.9.6 - Dolgozók és Rendszerjogosultságok

## 1. Célkitűzés
A cél egy teljes értékű **Dolgozók modul** létrehozása az ADMIN -> Rendszerek menüpont alatt, amely a HR és munkaügyi adatokat, a tagolt lakcímeket, az eszközök kiosztását és a jogosultságokat kezeli, továbbá átfogó biztonsági naplózást és vonalkód generálást / nyomtatást tesz lehetővé.

## 2. Megvalósított komponensek és Frissítések (V0.9.6)

### 2.1 Adatbázis módosítások
- Létrehozásra került az `employees` és kapcsolódó táblák alapstruktúrája.
- **Lakcím mezők szétválasztása (20260930004643_update_employee_address_fields.js)**: A korábbi egybefüggő `address` mező törlésre került, helyette tagolt mezők jöttek létre (`address_country`, `address_zip`, `address_city`, `address_street`, `address_type`, `address_number`, `address_building`). A migrációs szkript adatvesztés nélküli adatmentést végez az `address_street` mezőbe.

### 2.2 Backend fejlesztések (Node.js/Express)
- **API Végpontok (`employees.js`)**: Teljes CRUD funkcionalitás.
- **Hitelesítés előkészítése**: Az útvonalakat egy `verifyAuth` middleware védi. Jelenleg tesztüzemben (ha a `REQUIRE_AUTH` környezeti változó nincs true-ra állítva) a `mock-token` azonosítókat automatikusan Admin jogosultsággal engedi át, hogy a frontend zavartalanul fejleszthető legyen a bejelentkezési képernyő elkészültéig.
- **Dinamikus eszköz státusz**: Az eszközök kiosztásakor a rendszer már figyelembe veszi a kliens felől küldött státuszt, nem írja felül kötelező "Aktív" értékkel.

### 2.3 Frontend fejlesztések (Vanilla JS)
- **Felület felépítése (`Access UI/src/modules/employees.js`)**: Vizuális grid-rendszer (2 és 3 oszlopos elrendezések) a személyes, tagolt lakcím és munkaügyi adatok számára.
- **Dokumentumok és Képzések felugró ablakai**: Interaktív, egyedi felugró űrlapokon (modals) keresztül rögzíthető az oktatás, nyelvtudás, illetve dokumentum. A dokumentumfeltöltés egyelőre fejlesztés alatt álló üzenetet ad a végleges mentési útvonal egyeztetéséig.
- **PDA Nyomtatás Integráció**: A vonalkód (CODE128) előnézetileg megjelenik. A "Nyomtatás" gombra kattintva a valós rendszerbe regisztrált aktív nyomtatók (az `/api/v1/admin/printers` végpontból lekérve) jelennek meg a legördülőben. A "Mentés PDF-ként" funkció natív böngészős nyomtatási/mentési ablakot indít.
- **Kiosztott eszközök szerkesztése és visszavonása**: A sorokban azonnali Visszavonás (❌) és Szerkesztés (✏️) gombok kaptak helyet. Hálózati hiba vagy backend elutasítás esetén a felület hibaüzenetet ad és nem frissíti be az adatokat hamisan.
- **Jogosultságok Mester-jelölőnégyzete**: A JOGOK lapon a főmenük kategóriái (pl. IRODA, RENDSZEREK) kaptak egy-egy fő pipát, amivel az összes alájuk tartozó almodul jogosultsága egyszerre kapcsolható be/ki. A korábbi írási/olvasási szintek kikerültek a rendszerből a megbízó kérése alapján.
- **Lapozás (Pagination)**: Az Eszköz- és Rendszerelőzmények táblázat egyaránt kapott egy 10-esével lapozható felületet.

## 3. Érintett állományok
- `server/src/db/migrations/20260930004643_update_employee_address_fields.js` (Új migráció)
- `server/src/routes/employees.js` (Biztonsági és státusz frissítések)
- `Access UI/index.html` (Verziószám emelés V0.9.6-ra)
- `Access UI/src/modules/employees.js` (Teljes UI és funkció átalakítás, nyomtató integráció)

## 4. Tesztelési javaslatok
- Tagolt lakcím felvitele és mentése (közterület jellege legördülőből).
- Valós hálózati nyomtató listázásának ellenőrzése a PDA nyomtatás menüpontban.
- Főmenü jogosultság checkbox-ok kapcsolgatása.
- Eszközök kiosztása inaktív vagy lejárt státusszal, majd HTTP hibakezelés tesztelése (pl. hálózati kapcsolat megszakításával történő mentés esetén).
