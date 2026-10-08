# Normál sor akciós szerkesztése

2026. október 8.

Az ALDI Rendelés → Heti lekötés → Lekötés & Rendelés normál terméksorának szerkesztőjében megjelent az **Akciós szerkesztés** kapcsoló.

- Kikapcsolva a Normál kartonszám szerkeszthető.
- Bekapcsolva a meglévő Akciós időszak és Akciós időszakon kívüli mennyiségmezők és az akciós napválasztó jelennek meg.
- A mennyiségek és a naplista menthetők a normál Excel-soron is. Újranyitáskor a mentett akciós szerkesztés és napok megmaradnak.
- Normál módra visszaváltáskor a két mennyiség összevonódik. Mentéskor az akciós kézi mennyiség és naplista törlődik; a napi becslést ismét a normál százalékprofil adja.
- A kapcsolás önmagában nem küld mentést. A Mégsem eldobja a szerkesztést; változatlan mentés nem küld API-kérést.
- Akciós pozitív kartonszámhoz legalább egy akciós nap szükséges. Az elosztás a már beállított százalékprofilokkal történik.

A táblázatból eltávolítottuk az „Egyes termékek napi tervadatai hiányoznak…” figyelmeztetést. A számításban az ismeretlen bontás kezelése és a szerkesztő saját jelzése megmaradt.

Ellenőrzés: 18 kapcsolódó számítási, API- és Chromium-böngészőteszt sikeres. A böngészőteszt külön ellenőrzi a normál sor akciós mentését, újranyitását, naplistáját, változatlan mentését, Mégsem működését, a normál módra visszaváltást és a táblázati figyelmeztetés hiányát.

A módosítás helyben készült; telepítés nem történt.
