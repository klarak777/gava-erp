# Gava ERP - V0.8.6 Fejlesztési Összefoglaló
Dátum: 2026-09-10
Téma: **ALDI Heti Lekötés Modul Újratervezése és Bővítése**

## 1. Architektúra és Adatbázis Módosítások
- **Új táblák létrehozása:**
  - `aldi_weekly_commitments`: A heti tervek fejléce (év, hét, létrehozás ideje).
  - `aldi_weekly_commitment_items`: Az Excelből beolvasott tétel sorok (termék neve, azonosító, akciós vagy normál típus, akciós időszak, becsült mennyiségek).
- **Új végpontok (`/api/v1/aldi-weekly-commitments/`):**
  - Fájlfeltöltő (`/upload`): Képes fogadni a "Heti lekötés (HLK)" és "Akciós (HLA)" Excel fájlokat, tartalmukat feldolgozni és elmenteni.
  - Lekérdezők (`/weeks/:year`, `/:year/:week`): Év és hét alapján strukturáltan szolgáltatják a lekötött terveket a frontendnek.
  - Készlet kezelő (`/stock`): Meglévő tábla frissítése az induló készlet és beérkező áruk tekintetében (tranzakció alapú biztosítással).

## 2. Fájlfeldolgozás és Mentési Logika
- **Hálózati Mentés:** A feltöltött Excel fájlokat a rendszer mostantól automatikusan a `\Gava Hungria System\ERP ALDI\Heti lekötés\YYYY\` mappába menti, szigorú elnevezési konvencióval (`KWxx HLK.xlsx` és `KWxx HLA.xlsx`).
- **Dátum nélküli fájlok kezelése:** A dátumot nem tartalmazó "Akciós" és "Terv/Keresleti" fájlokat a rendszer nem utasítja el, hanem a felületen kiválasztott év/hét (KW) pároshoz köti.
- **Deduplikáció:** Ugyanahhoz a héthez külön kezelődnek az Akciós és a Normál adatok. Újbóli feltöltés esetén felülírják a korábbi feltöltést (típusonként), megakadályozva a sorkettőződéseket.
- **ALDI Cikkszám alapú párosítás (article_number):** A készletek mentésénél áttértünk az ALDI cikkszám (article_number) alapú azonosításra a belső termék ID helyett, biztosítva a stabil adatkapcsolatot.

## 3. Matematikai Számítások és Készletgöngyölítés
- **Tényleges rendelés vs. Becslés:** A napi fogyás számításánál a rendszer először megvizsgálja, van-e ténylegesen befutott ALDI rendelés az adott napra. Ha igen (akár a nulla is), azt használja fel. Ha nincs, akkor az excelből kinyert "Becsült" mennyiséget vonja le.
- **Készlet Előreszaladó Göngyölítése:** Minden nap készlete automatikusan számítódik a hét első napjától kezdve:
  *`Zárókészlet = (Előző napi Zárókészlet + Napi Érkező Mennyiség) - Napi Fogyás`*
- **Akciós Százalékok Pontosítása (Időtartam Alapú Logika):**
  Az ALDI akciós időszakok felosztása mostantól nem a napok fizikai elhelyezkedése, hanem az akció hossza alapján történik:
  - 4 napos akció (pl. Szerda-Szombat): 30% / 30% / 22% / 18%
  - 3 napos akció (pl. Vasárnap-Kedd): 40% / 40% / 20%
  - 2 napos akció (pl. Péntek-Szombat): 70% / 30%
  Ha egy napon van normál becslés, de az akciós felosztás ott éppen 0% lenne, akkor automatikusan a fennmaradó normál mennyiségekből tölti fel azokat a napokat a megfelelő napi szorzókkal (Szerda-Péntek: 17%, Szombat: 13%, Vasárnap: 14%, Hétfő-Kedd: 11%).

## 4. UI / UX Továbbfejlesztések (Frontend)
- **Dinamikus heti táblázat:**
  A "Heti lekötés" nézet mostantól egy teljes, 7 napos (Szerda -> Kedd) heti táblázatot generál.
- **Múltbéli napok vizuális elrejtése:**
  Aktuális hét böngészése esetén a mai naphoz képest "múltbéli" napok cellái automatikusan leszürkülnek (`#f1f5f9`), a beviteli mezők inaktívvá válnak (szerkesztés elleni védelem), és a számok helyett kötőjel (`-`) jelenik meg. A rendszer a háttérben továbbra is csendben kiszámolja a múltbéli értékeket, így a mai készlet mindig pontos!
- **Színkódok és olvashatóság:**
  - Termék neve: Halványzöld (`#dcfce7`)
  - Akciós periódus (dátumok): Okkersárga (`#fde047`)
  - Akciós napok cellái (amelyeken tényleg fut az akció): Halványzöld háttér (`#bbf7d0`), félkövér szöveg
  - A szerkeszthető beviteli cellák ("Érkező" mennyiségek, induló készlet) mostantól fekete betűszínnel rendelkeznek az olvashatóság érdekében.

## 5. Hibajavítások
- Kijavítva a `/stock` végponton egy tranzakciós scope-kezelési hiba (`trx` nem volt definiálva a `catch` blokkban), ami megakadályozhatta volna a módosítások visszagörgetését.
- Helyreállítva a frontend aszinkron betöltése: a heti menüből egyből betöltődnek a rendelkezésre álló hetek, és a feltöltő gomb mindig reszponzívan reagál.
