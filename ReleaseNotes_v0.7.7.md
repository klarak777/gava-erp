# GAVA Access UI - v0.7.7 Release Notes

**Dátum:** 2026. augusztus 18.
**Verzió:** V0.7.7

## Újdonságok és Javítások (ALDI Napi rendelés és Heti árak modul)

1. **PDF Megtekintési / Letöltési funkció átdolgozása**
   - Hozzáadásra került a `GET /api/v1/aldi-weekly-prices/:id/file` és `GET /api/v1/aldi-daily-orders/:id/file` backend végpont, amely lehetővé teszi, hogy a felületről a felhasználók rákattintva közvetlenül a hálózati meghajtóról nyissák meg vagy töltsék le a fájlokat, kiküszöbölve a böngészők `file://` biztonsági korlátozásait.

2. **Hálózati elérési út javítása (Heti árak)**
   - A feltöltött XLSX fájlok hálózati elérési útja kiegészítésre került. Az új fájlok ezentúl pontosan a `\\192.168.1.5\raktar\Gava Hungria System\ERP ALDI\Heti árak\` főkönyvtárba és a megfelelő év/hét (pl. `2026\KW33`) almappákba kerülnek lementésre.

3. **Fájlnév megtartása feltöltéskor**
   - Az XLSX heti árak feltöltése során a rendszer ezentúl nem generál egyedi fájlnevet (pl. időkóddal), hanem **megtartja a fájl eredeti nevét**.

4. **GTIN azonosítási hiba javítása (Heti árak feltöltése)**
   - Kijavításra került az a hiba, ami miatt a heti árak beolvasásakor a rendszer az összes tételt "pirossal" (azonosítatlanként) jelölte meg.
   - **Ok:** A backend a `chain_products` tábla üres `ean` oszlopában kereste az egyezést, a tényleges GTIN adatokat tartalmazó `gtin` oszlop helyett.
   - **Megoldás:** A keresési logika most már a `gtin` oszlopra hivatkozik, így az Excelből érkező rendelési GTIN azonosítók azonnal párosításra kerülnek az adatbázisban tárolt termékekkel.

5. **Felhasználói felület (UI) finomítása a Heti árak modulban**
   - Az XLSX feltöltése után a felületen az "X sor betöltve", "ERP azonosítva" és "fájlnév" információs címkék helyett egy letisztult zöld **"📥 Heti árak letöltése"** gomb jelenik meg a könnyebb fájlelérés érdekében.

## Adatbázis Migráció
A frissítés nem igényelt új sémamódosító adatbázis migrációt, csupán a backend logikában és a frontend felületen történtek változások.

---
*Készítette: Antigravity AI*
