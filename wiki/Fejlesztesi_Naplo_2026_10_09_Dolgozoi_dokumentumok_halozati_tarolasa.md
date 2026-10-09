# Dolgozói dokumentumok hálózati tárolása – vizsgálat és javítás

Dátum: **2026. október 9.**

## Elvárt működés

A feltöltött dokumentum a következő helyre kerül, és ugyaninnen olvasható, illetve törölhető:

```text
\\192.168.1.5\raktar\Gava Hungria System\ERP Dolgozók\<adatbázisbeli dolgozó-ID>\<fájlnév>
```

Windows alatt valódi UNC útvonalat használunk. Linux alatt a `//192.168.1.5/raktar` SMB-megosztás tényleges csatolása szükséges; az alapértelmezett csatolási pont `/mnt/raktar`. A `RAKTAR_PATH` beállítás használható, de helyi mappa nem helyettesítheti észrevétlenül a megosztást.

## A kódban talált hibák

1. Hálózati `mkdirSync` hiba esetén a feltöltés helyi `uploads/employees/<ID>` mappába mentett, és a feltöltést sikeresnek jelezte. Az adatbázisba ez a helyi útvonal került. A megnyitó ugyanazt a `file_path` értéket használta, így a fájl az ERP-ben elérhető lehetett, miközben a Raktárban hiányzott.
2. A feltöltési cél `//192.168.1.5/...` útvonala Linuxban helyi abszolút útvonal, nem SMB-kapcsolat. A Docker-konfigurációban megadott `/mnt/raktar` csatolást és `RAKTAR_PATH` beállítást a dolgozói feltöltő nem használta.
3. Fizikai fájltörlési hiba esetén a backend csak naplózott, majd törölte az adatbázisrekordot és sikeres választ küldött. A fájl ettől még a lemezen maradhatott.
4. Azonos nevű új feltöltés felülírhatta egy korábbi dokumentum tartalmát.
5. A felület nem jelenítette meg a backend konkrét feltöltési/törlési hibaüzenetét. A képes megnyitó a dokumentumnév helyett a kiterjesztés nélküli API-URL-ből próbálta eldönteni a képformátumot.

**Az idézett korábbi magyarázat pontosítása:** nem igazolható általános szabályként, hogy a Windows levágja a UNC dupla perjelet. A Node Windows-útvonalkezelője a helyesen megadott UNC-t megtartja; a forward slash használata önmagában nem garantál hálózati mentést. A biztosan azonosított hibák a csendes helyi tartalékmentés és a platformfüggetlenül használt Linux-helyi célútvonal.

## Tényleges környezeti megállapítások

- A kért hálózati `ERP Dolgozók` mappa a jelenlegi Windows-fiókból elérhető.
- A `C:\192.168.1.5\raktar\Gava Hungria System\ERP\1\test.txt` helyi tesztfájl létezik. Ez nem bizonyítja, hogy az összes korábbi valódi feltöltés oda került.
- A helyi fejlesztői PostgreSQL `employee_documents` táblája a vizsgálatkor üres volt. A felhasználó által a felületen látott konkrét dokumentum fizikai helye ezért ebből az adatbázisból nem azonosítható; ehhez a használt ERP-cím és annak backendje szükséges.
- A helyi `gava_erp_prod_api` Docker-konténer újraindulási ciklusban volt: `getaddrinfo ENOTFOUND gava_db`. A Docker állapota külön infrastruktúrahiba; ebben a feladatban nem módosítottuk a Docker adatbázis-beállításait.
- A konténerben `/mnt/raktar` bind csatolás szerepel. A bind útvonal létezése önmagában nem igazolja, hogy mögötte az igazi SMB-megosztás van.

## Javított működés

- Közös, aszinkron tároló kezeli a feltöltést, olvasást és törlést.
- Feltöltéskor nincs helyi tartalékmentés. Elérhetetlen vagy hibásan csatolt Raktár esetén **503** választ kap a felület, és nem keletkezik sikeres dokumentumrekord.
- Windows alatt UNC cél szükséges. Linux alatt a mountinformáció igazolja a tényleges `cifs`/`smb3` csatolást a `//192.168.1.5/raktar` megosztásról; sima helyi mappába nem mentünk.
- A dolgozó létezését a feltöltés előtt ellenőrizzük. A cél almappa az adatbázisbeli dolgozó-ID.
- A fájlneveket ellenőrizzük; PDF, PNG, JPG/JPEG tölthető fel, legfeljebb 50 MB méretben.
- Azonos név esetén az új fizikai fájlnév egyedi utótagot kap; a korábbi dokumentum nem íródik felül.
- Ha az adatbázis-tranzakció sikertelen, az újonnan feltöltött fájlt eltakarítjuk.
- Törléskor a fizikai fájltörlési hiba nem törli el a dokumentumrekordot. Ha a fájl törlése után az adatbázis-tranzakció meghiúsul, a fájl tartalmát visszaállítjuk. Több rekord által hivatkozott fájl csak az utolsó hivatkozás törlésekor törlődik.
- A korábbi ismert helyi tartalék- és régi ERP-mappába mutató dokumentumok olvashatók maradnak. Automatikus áthelyezés nem történt; ezek fizikai helyét az eredeti adatbázisrekord alapján kell rendezni.
- A felület megjeleníti a tényleges backend-hibát. A képek felismerése a dokumentumnév kiterjesztéséből történik.

## Ellenőrzés

- **11 célzott teszt sikeres.** Windows UNC cél, Linux SMB-mount ellenőrzése, sikertelen hálózati mentés, ütköző fájlnevek, dolgozóhoz tartozó útvonalak, régi fájlok olvasása, feltöltés/megnyitás/törlés, adatbázishibák visszaállítása és közösen hivatkozott fájlok kezelése.
- Teljes szerveres tesztcsomag: **102 teszt, 100 sikeres, 0 hibás, 2 kihagyott integrációs teszt**.
- A javított tárolóval a valódi hálózati `ERP Dolgozók\1` mappában saját, névtelen tesztfájl készült, visszaolvasva azonos tartalommal, majd törölve. A teszt nem módosította az adatbázist és nem érintett valódi dolgozói dokumentumot.

A megismételhető hálózati próba:

```powershell
node server/scripts/checkEmployeeDocumentStorage.js 1
```

Ez rövid életű tesztfájlt ír és töröl. A dolgozó-ID helyén ellenőrzésre választott ID-t kell megadni. A csak a teszt által létrehozott üres ID-mappa a végén eltávolításra kerül; rekurzív törlés nincs.

## Módosított fájlok és állapot

- `server/src/services/employeeDocumentStorage.js`: közös hálózati dokumentumtároló.
- `server/src/routes/employees.js`: feltöltési, olvasási és törlési végpontok javítása.
- `server/tests/employeeDocuments.test.js`: tárolási és route-tesztek.
- `server/scripts/checkEmployeeDocumentStorage.js`: valódi megosztáson végzett külön fájlpróba, adatbázisírás nélkül.
- `Access UI/src/modules/employees.js`: konkrét hibaüzenetek és képmegjelenítés.
- `Access UI/src/main.js`: új dolgozómodul-importverzió.

A helyi `localhost:3000` backend a javított dokumentumkezelővel újraindult. Adatbázismigrációra nem volt szükség. Docker-/DO-telepítés és korábbi dokumentumok áthelyezése nem történt.
