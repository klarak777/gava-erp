# PDA komissiózás – 0.9.19 kiadás

Az Android verziókód 19, a verziónév 0.9.19. A GitHub APK-workflow a `PDA UI` forrásából készíti az Android webes fájljait, és a meglévő aláírókulcsot használja.

## Javítások

- A LOT formátuma WWDD: ISO-hét és a hét napja (01–07). Az ellenőrzés budapesti szerveridőből számol. 2026-10-02-án a 4005 az aktuális LOT, a 3906 hatnapos és figyelmeztetést kér. A 3626 hibás. A V4 szerint a küszöb legalább 6 naptári nap; a hiányzó év miatt a legutóbbi lehetséges ISO-évet használjuk, egynapos jövőbeli toleranciával.
- Az űrlap **Mentés** gombja ellenőrzi a LOT-ot, majd egyetlen tranzakcióban foglalja a kartonokat és készíti az ideiglenes címkét. Az újrapróbálás megtartja az azonosítót és a címkét. Eltérő adatokkal ugyanaz a címke nem használható.
- Más dolgozó aktív foglalásánál és legfeljebb egy raklapnyi effektív maradéknál a tétellista szürke, nem kattintható sort és dolgozónevet mutat. A mentés ugyanezt a szabályt tranzakcióban ellenőrzi, és 423 választ ad. A #/PLT a kapcsolódó ALDI áruigény aktuális értéke; hiánya a mentésnél látható hibát okoz. Korábban elfogadott foglalások véglegesíthetők.
- A foglalás öt percig érvényes; az előtérben nyitott folyamat percenként megújítja. A lejárt foglalás nem éleszthető fel. Visszalépéskor a saját foglalás visszavonódik, hálózati válaszvesztés után is. A címkék megmaradnak ellenőrzési célra, az összeemelés címkéit a komissió nem törli.
- Nyomtatáskor és véglegesítéskor ellenőrizzük a dolgozót és a bejelentkezést. A végleges mentés ellenőrzi a munkamenet, tétel, címke, adatok és SSCC összetartozását. A készlet és a komissió egy tranzakcióban íródik; ismétléskor nem duplázódik.
- A böngésző saját szerverének API-ját használja. A WEB_EMULATOR_TEST automatikus profil `PDA_EMULATOR_ENABLED=true` mellett éles környezetben is használható. A DO Docker-konfiguráció ezt engedélyezi, a `NODE_ENV` továbbra is `production`. Az emulátor ugyanannak a szervernek az adataival dolgozik, mint az ERP és az APK; nem külön tesztadatbázis. A profil belépését és API-hívásait a saját webkiszolgáló böngészős Origin/Referer értékére korlátozzuk. Ez környezeti ellenőrzés; a bejelentkezés nélküli emulátor nem felhasználói hitelesítés. Az APK normál dolgozói belépést használ, és nem indít automatikus emulátoros belépést.

## Élesítés sorrendje

1. Zárjátok le az aktív komissiókat és készítsetek adatbázismentést. Az átállás idején ne induljon új komissió.
2. Telepítsétek a javított szerververziót, és futtassátok a szerver `npm run migrate` parancsát az éles környezet helyes konfigurációjával. Szükséges migrációk: `20261002180000_add_picker_fields_to_sscc_labels.js` és `20261002190000_add_pda_reservation_lifecycle.js`. A második migráció egyedi indexet is létrehoz a munkamenet-azonosítóra; korábbi duplikáció esetén az átállás megáll és adatellenőrzés szükséges.
3. Indítsátok újra a szervert, majd telepítsétek az új APK-t minden érintett PDA-ra. Az előző APK nem küldi az új munkamenet-adatokat; a kliens és a szerver együtt frissítendő.
4. Két külön dolgozóval ellenőrizzétek az utolsó raklap mentését, a LOT figyelmeztetés visszautasítását/elfogadását, a nyomtatást, lokációt és SSCC véglegesítést.

Az APK-build nem telepíti a szervert és nem futtat éles migrációt.

### Emulátor automatikus belépésének utólagos javítása

A javítás a webes emulátort, a szervert és a Docker-beállításokat érinti; a 0.9.19 APK cseréje nem szükséges. A webes emulátor lejárt belépési token esetén is automatikusan újra belép, a natív APK-nál ez nem történik meg. A DO-n az ERP gyökérkönyvtárából:

```sh
git pull origin codex/pda-commission-0.9.19
docker-compose -f docker-compose.prod.yml up -d --build gava_api
curl -sS http://127.0.0.1:3001/api/v1/pda/emulator-config
```

Az utolsó parancs várt válasza: `{"enabled":true}`. Az emulátor lapját ezután újra kell tölteni. A dolgozói PDA-bejelentkezések külön dolgozóhoz tartoznak; az emulátor a saját WEB_EMULATOR_TEST rekordját használja.

## Ellenőrzés

### Tételkiválasztási módosítás – 2026-10-05

- A zárolás feltétele: más dolgozó aktív komissiós foglalása van, és `max(0, rendelt karton − véglegesített karton − aktív foglalások kartonjai) ≤ #/PLT`. Az egyenlőség a korábbi V4 szabályból megmarad. Példa: 19 rendelt karton, 10 foglalt karton és 10 db/PLT esetén 9 karton érhető el, ezért a sor más dolgozónál szürke. Több mint egy raklapnyi elérhető maradék továbbra is kiválasztható.
- Csak az érvényes, vissza nem vont, ideiglenes komissiós címkék foglalásai számítanak. A saját foglalás önmagában nem tiltja a kiválasztást. Lejárat, visszavonás vagy véglegesítés után a foglalás kikerül a számításból. Az összeemelési címkék nem foglalnak komissiós kartonokat.
- Az aktív foglalás továbbra is az űrlap Mentés gombjánál, az ideiglenes címkével jön létre; az űrlap puszta megnyitása nem hoz létre foglalást.
- A lista előtérben 15 másodpercenként és az alkalmazás előtérbe kerülésekor frissül. Kiválasztáskor ismét lekéri az állapotot; sikertelen ellenőrzésnél nem nyitja meg az űrlapot. A listalekérdezés a maradékot és a foglalásokat ugyanabból az adatbázis-pillanatképből számolja.
- A módosításhoz a szerver és a PDA felület együtt frissítendő. A webes emulátornál újratöltés, Androidon a frissített forrásból készített APK telepítése szükséges. Új adatbázis-migráció nincs; a 0.9.19 foglalási migrációi szükségesek.

### Automatikus tesztek

- `server`: `npm test`; a teljes automatikus tesztkészlet.
- `server`: `PDA_TEST_DATABASE_URL` beállításával `node --test tests/pdaPicking.test.js`. A teszt külön, véletlen nevű sémában hoz létre adatokat, futtatja a két új migrációt, párhuzamos mentéseket indít, és végül eltávolítja a saját sémáját.
- `PDA UI`: `npm test`; Chromium alatt 320×480 és 390×810 méret, hálózati újrapróbálás, LOT, visszalépés, nyomtatás, lokáció és SSCC folyamat.
- A GitHub build ugyanezeket a PDA-teszteket külön PostgreSQL szolgáltatással futtatja az APK elkészítése előtt.
