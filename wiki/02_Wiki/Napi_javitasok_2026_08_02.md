# Napi javítások – 2026.08.02.

## Admin modul: duplikált aktív szerepkör-nevek felszámolása

### A bejelentett hiba

Az Admin modul **Szállítók / Partnerek**, **Customer / Vevők** és **Fuvarozó cég / Fuvarozók**
tábláiban ugyanaz a név többször is szerepelt aktívan, különböző partnerekhez rendelve
(pl. `ESMAR` egyszerre a *JOKER* és az *Esmar Frutas Imp-Exp. SL* partnernél).

### Az érvényes üzleti szabály

Egy szerepkör-kategórián belül egy név **csak egyetlen aktív azonosítóként** létezhet
a rendszerben. Ugyanazon a partneren belül viszont **több alias megengedett**
(pl. `CASI` / `CASI AIRPORT` / `CASI AEROPORTO` mind a 41-es partnernél).

### Miért fordulhatott elő – 4 kódhiba

1. **`saveSubTables` (partners_extended.js)** — partner mentésekor törölte és újra
   beszúrta az összes azonosítót *mindenféle validáció nélkül*. Ez volt a fő szivárgás.
2. **`PUT /identifiers/:id/reassign`** — áthelyezésnél nem vizsgálta a névütközést.
3. **`partner_identifiers` tábla** — az elsődleges kulcson kívül semmilyen egyediségi
   megszorítás nem védte a szabályt.
4. **`DELETE /identifiers/:id`** — a nem létező `cargo_demands.supplier` oszlopra
   hivatkozott, ezért az azonosító-törlés minden esetben 500-as hibával elszállt.

Ezen felül a `partners_by_role.js` csak a `partners.is_active` oszlopra szűrt, az
`is_inactive`-ra nem — így az archivált partnerek szerepkörei is kilistázódtak volna.

### A talált szennyeződés (11 aktív duplikátum)

**(A) Ugyanaz a cég kétszer felvéve** — a 2026.07.30-i import hozta létre a párokat:
`AXARFRUIT`, `CRETAN ROOT` (2 szerepkörben), `TOMATO-AL`, `PAP JÓZSEFNÉ`,
`GAVA POLSKA`, `MALENO`.

**(B) Idegen partnerhez csúszott referencia:**

| Referencia | Hibás gazda | Helyes gazda |
|---|---|---|
| ESMAR | 288 JOKER | 184 Esmar Frutas Imp-Exp. SL |
| EUROGROUP DEUTSCHLAND | 4685 FŐSPED 2000 KFT. | 232 Eurogroup Deutschland Gmbh |
| NATURINDA | 2592 NANDOPAL, S.L. (CCW: NANDO) | 2603 NATURINDA, SLNE |
| TRANS-SPED | 3456 TRIO FRUTTA KFT. (CCW: TRIOF) | 365 Trans-Sped Kft. |

A teljes táblára lefuttatott elcsúszás-audit (a referencia egyetlen szava sem szerepel a
partner nevében) **nem talált további rejtett esetet** — a hibás párosítás pontosan erre
a 4 rekordra korlátozódott.

### Az elvégzett javítás

**042 migráció** (`20260802000000_042_deduplicate_active_role_identifiers.js`):

- A 11 duplikátum **inaktiválása, nem törlése** — mindegyik megjelenik az Archív
  partnerek modulban és bármikor visszaállítható. A `down()` visszaállítja őket.
- A megtartott oldal minden esetben a névhez ténylegesen illő, adatokban gazdagabb
  partner (adószám / közösségi adószám / telephely alapján). Két esetben ezért az
  *újabb* rekord maradt: `GAVA POLSKA` → 4796 (PL adószám + telephely + fuvarozó
  szerepkör), `MALENO` → 67 (közösségi adószám + teljes cégnév).
- Determinista biztonsági háló: ha maradna ütközés, a legnagyobb id-jú példány
  inaktiválódik és naplóba kerül.
- **Részleges egyedi index**: `ux_partner_identifiers_active_role_value` a
  `(id_type, UPPER(TRIM(value)))` páron, `WHERE is_inactive = false` és csak a három
  szerepkör-típusra. A többi azonosítóra (Adószám, CCW + Kód, FELIR) szándékosan nem
  vonatkozik — ott létezik legitim ismétlődés.

**Kódszinten:**

- Új `assertRoleIdentifiersUnique()` helper, amit a `saveSubTables` a törlés-újraírás
  *előtt* hív meg; ütközésnél a teljes mentés visszagördül és 400-as hibát ad a
  konkrét ütköző partner nevével.
- A `reassign` végpont áthelyezéskor is ellenőrzi a névütközést.
- Az `activate` végpontból kikerült az „1 partner = 1 aktív szerepkör kategóriánként”
  szabály, mert az a több alias engedélyezésével ellentétes volt.
- A törlési végpont a valós oszlopokra vizsgál (`partner_name`, `customer_name`,
  `albaran_number`, `destination`); a hibaüzenet felajánlja az inaktiválást.
- A `transporters.js`-ből kikerültek a beragadt IMANOV debug logok.

### Deploy közben talált külön hiba

Az API konténer **újraindulási hurokban volt**: a 2 hetes image nem tartalmazta a
016–041 migrációs fájlokat, miközben a DB-ben már be voltak jegyezve, így a knex
`migration directory is corrupt` hibával elhasalt. Az `up -d --build gava_api`
megoldotta. **Tanulság:** ha a migrációk csak lokálisan futnak le, a konténert
utána mindig újra kell építeni, különben a következő indításnál nem áll fel.

### Ellenőrzés

- Mindhárom Admin tábla duplikátummentes az élő API-n: 71 Szállító / 33 Vevő / 43 Fuvarozó.
- Rollback-elt tranzakciós teszt: alias megengedett ✅, idegen név blokkolva ✅,
  önmagán belüli duplikátum blokkolva ✅, inaktív másolat megengedett ✅.
- API-szintű teszt: 400-as válasz beszédes magyar üzenettel, az adatbázis változatlan.
- Biztonsági mentés a művelet előtt: `backup_partners_pre_dedup_20260802.sql`.

### Kód review feljegyzés
A bevezetett ellenőrzések (assertRoleIdentifiersUnique) maximálisan megfelelnek az új üzleti szabálynak, és sikeresen megakadályozzák, hogy egy szerepkörkategórián belül két vagy több partner másodlagos azonosítója (alias) névütközést okozzon. Ezt a szabályt a jövőben is meg kell tartani bármilyen új tömegadat-import vagy felület implementálásakor.
