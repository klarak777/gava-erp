# Heti lekötés: terméksor törlése és akciós → normál váltás

2026. október 8.

A Lekötés & Rendelés táblázat termékszerkesztőjében az Akciós szerkesztés kapcsoló minden terméknél megjelenik, az eredeti akciós Excel-soroknál is. Kikapcsoláskor a két kartonszám összevonódik, és a normál heti százalékprofil osztja el. A mód menthető, újranyitáskor megmarad; visszakapcsolva megadható új akciós kartonszám és naplista.

A normál mód tartósan az explicit üres `action_days_json` listával és nulla kézi akciós mennyiséggel rögzül. A `null` naplista továbbra is az Excel szerinti napokat jelenti. Az eredeti Excel-időszakot és napi forrásadatokat nem töröljük; az újrafeldolgozás nem kapcsolja vissza a kézzel normálra állított tételt. Nincs szükség adatbázismigrációra.

A Mentés mellett mindkét szerkesztési módban megjelenik a Törlés gomb. Megerősítés után a kiválasztott hét és termék összes `aldi_weekly_commitment_items` sora törlődik, így az összevont terméksor eltűnik a táblázatból és a hozzá tartozó készletnézetből. A törlés nem érinti másik hét tételeit, a terméktörzset, a napi rendeléseket vagy a mentett készletbeviteleket. Elutasított megerősítéskor nincs API-kérés; sikertelen törléskor a szerkesztő nyitva marad.

API: `DELETE /api/v1/aldi-weekly-commitments/weeks/:year/:week_number/article/:article_number`. Hibás azonosítónál 400, hiányzó heti lekötés vagy tétel esetén 404; siker esetén a válasz jelzi a törölt forrássorok számát. A törlés nem olvas Excelt. Későbbi új Excel-feltöltés ugyanazt a terméket ismét felveheti; a kézi újrafeldolgozás csak a meglévő sorokat frissíti.

Ellenőrzés: 33 kapcsolódó teszt sikeres. Chromiumban: eredeti akciós sor normálra váltása, mentés, újranyitás, visszaváltás; normál és akciós terméksor törlése; törlési megerősítés elutasítása. API-teszt: összevont forrássorok törlése, hét szerinti elkülönítés, védett rekordok megőrzése, ismételt törlés 404. Számítási teszt: a mentett normál mód hiányos vagy frissített napi Excel-adatok mellett is megmarad.

A helyi backend újraindítva; a heti GET HTTP 200 (16 ms). Az új DELETE útvonal hibás hétre HTTP 400 választ ad; a CORS OPTIONS HTTP 204. A készletnézet és az önálló ALDI-ablakok további 6 tesztje is sikeres. A futó helyi adatbázisból teszteléshez terméksort nem töröltünk. A nyitott böngészőoldalt egyszer frissíteni kell az új frontend betöltéséhez.
