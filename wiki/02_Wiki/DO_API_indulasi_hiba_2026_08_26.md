# DO szerver – API indulási hiba (2026. 08. 26.)

## Jelenség

A DO szerveren az ERP felülete nem jelenítette meg az adatokat, ezért elsőre úgy tűnt, mintha az éles PostgreSQL-adatbázis eltűnt vagy kiürült volna.

Az API konténer naplójában az alábbi hiba ismétlődött:

```text
/app/src/routes/aldi_cross_docking.js:270
  } catch (err) {
    ^^^^^

SyntaxError: Unexpected token 'catch'
```

Az `gava_erp_prod_api` konténer az automatikus újraindítás miatt folyamatos újraindulási ciklusba került. Emiatt a frontend nem kapott választ az API-tól, ami kívülről adatbázis-hibának látszott.

## Vizsgálat eredménye

Az adatbázis nem tűnt el:

- a `gava_erp_prod_db` konténer futott;
- a PostgreSQL napló szerint a meglévő adatkönyvtár miatt az inicializálás kihagyásra került;
- a `gava-erp_gava_pgdata` volume csatlakozott a `/var/lib/postgresql/data` könyvtárhoz;
- az API migrációja sikeresen kapcsolódott az adatbázishoz, és `Already up to date` eredményt adott;
- a Docker-hálózaton a `gava_db` és a `gava_erp_prod_db` név is érvényes DNS-alias volt.

Ez kizárta az adatbázis elvesztését és a `DATABASE_URL` hostnevének hibáját.

## A hiba oka

Az `aa535c1` commitban, az ALDI rakodási modul `cartons_per_pallet` módosításakor véletlenül törlésre került egy záró kapcsos zárójel az alábbi fájlból:

```text
server/src/routes/aldi_cross_docking.js
```

A hiányzó `}` miatt a JavaScript értelmező a következő `catch` ágat szintaktikailag érvénytelennek találta. Mivel ezt az útvonalmodult a `server.js` induláskor betölti, a teljes backend leállt, nem csak az ALDI modul.

## Javítás

A hiányzó záró kapcsos zárójel visszakerült a `product` feltétel végére, még a `cartons_per_pallet` számítása elé.

A javítás commitja:

```text
05020ac fix: restore missing brace in ALDI cross-docking route
```

A javított fájlon a Node.js szintaktikai ellenőrzése sikeresen lefutott:

```bash
node --check server/src/routes/aldi_cross_docking.js
```

## Élesítés a DO szerveren

```bash
cd /root/gava-erp
git pull
docker compose -f docker-compose.prod.yml up -d --build gava_api
docker compose -f docker-compose.prod.yml logs gava_api --tail 30
```

Sikeres induláskor a naplóban már nem jelenik meg az `Unexpected token 'catch'` hiba, a migráció után pedig elindul a Node.js API.

## Fontos tanulságok

1. Ha a frontendből egyszerre sok vagy minden adat eltűnik, először az API állapotát és naplóját kell ellenőrizni.
2. Az `ENOTFOUND`, a migrációs hiba és a JavaScript `SyntaxError` három különböző hibakategória; a napló alapján kell megkülönböztetni őket.
3. A Compose-fájl `environment` szakasza felülírja az `env_file` azonos nevű változóját.
4. A konténer környezeti változóit egy egyszerű `docker compose restart` nem tölti újra; ehhez a konténert újra kell létrehozni.
5. A `gava_db` Compose service-név szabályos belső DNS-név. Ebben az incidensben a konténernév használata nem oldotta meg a problémát.
6. Ismeretlen adatbázisállapotnál nem szabad `down -v`, `volume prune`, seed vagy kézi migrációs parancsot futtatni, amíg a csatlakoztatott volume nincs azonosítva.
7. Backend deploy előtt legalább az érintett JavaScript-fájlokon kötelező a `node --check` vagy egy automatizált lint/CI ellenőrzés.

## Hasznos diagnosztikai parancsok

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs gava_api --tail 100
docker compose -f docker-compose.prod.yml logs gava_db --tail 100
docker inspect gava_erp_prod_db --format '{{range .Mounts}}{{println .Name "->" .Destination}}{{end}}'
docker volume ls
docker exec gava_erp_prod_db psql -U gava_admin -d gava_erp -c "SELECT COUNT(*) FROM shipments;"
```

