# Heti lekötés: keresleti többlet az akción kívüli időszakhoz

2026. október 8. — Az ALDI Rendelés → Heti lekötés → Lekötés & Rendelés számításának új szabálya. Ez felülírja a korábbi dokumentáció azon szabályát, amely a keresleti többletet az akciós alaphoz adta.

- Heti automatikus mennyiség: `max(rendelési terv, keresleti adatok)`.
- Akciós alap: az eredeti rendelési terv akciós napi mennyiségeinek összege.
- Akción kívüli alap: `rendelési terv − akciós alap + max(0, kereslet − rendelési terv)`.
- A többlet az akción kívüli százalékprofil szerint oszlik el. Eredetileg nulla akción kívüli alap esetén is ezt a profilt használjuk.
- Kisebb vagy azonos kereslet nem csökkenti a tervet. A kézi felülírások, napeltolás és napi kerekítés szabályai megmaradnak.
- Több raktári sor és akciós időszak esetén a többletet termékenként egyszer számoljuk el; meglévő akción kívüli mennyiségeknél megtartjuk azok egymáshoz viszonyított eloszlását.

Példa: terv **1706**, kereslet **2687**, eredeti akciós alap **1568**. A többlet **981**; az eredmény **1568 akciós + 1119 akción kívüli = 2687**. Négy akciós napnál az akción kívüli 20/30/50%-os profil napi értékei **224, 336, 560**, a kerekítés miatt a napi összeg eltérhet a heti alaptól.

A KW41 / 751005 korábban ellenőrzött forrásadataival: terv és eredeti akciós alap **2321**, kereslet **2994**. Az új szabály szerint **2321 akciós + 673 akción kívüli**, akkor is, ha a terv akción kívüli napi cellái üresek (importált értékük nulla).

A közös számítás a táblázatot és a szerkesztőt is frissíti. A már mentett kézi mennyiségeket nem alakítja át; azok továbbra is elsőbbséget kapnak. A frontend importverziója frissült. A modul meglévő hibás karakterkódolása is helyreállt a böngészős ellenőrzés során.

Ellenőrzés: 35 kapcsolódó számítási, API-, készlet- és Chromium-böngészőteszt sikeres. Lefedve a nagyobb/kisebb kereslet, nulla eredeti akción kívüli alap, mentett százalékok, kézi felülírások, több időszak, archivált Excel-bontás, táblázat és szerkesztő.

A változtatás helyben készült; telepítés nem történt.
