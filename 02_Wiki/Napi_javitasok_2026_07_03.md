# Napi Javítások és Fejlesztések (2026. 07. 03.)

## Fuvarmegbízások és EKAEREK Modul Fejlesztése (GHU / LOG logikák)

A Fuvarmegbízások és EKAEREK táblázatok funkcionalitása és felhasználói élménye továbbfejlesztésre került a pontosabb állapotkövetés és az adatok tisztább megjelenítése érdekében.

### 1. Adatbázis módosítások
- A korábbi egyetlen "is_sent" (kiküldve) mező helyett bekerült két új oszlop a `transport_orders` és az `ekaer_records` táblákba: `is_sent_ghu` és `is_sent_log`.
- Az összes korábbi adatot, ahol a dokumentum "kiküldve" állapotban volt, átemeltük az új struktúrába.
- **Tömeges módosítás:** 2026. május 31-ig (bezárólag) visszamenőleg minden Fuvarmegbízás és EKAER dokumentum "kiküldve" (mind a GHU, mind a LOG) állapotúra lett állítva, hogy a régi szezon adatai ne zavarják a napi munkát. (5040 db Fuvarmegbízás és 5557 db EKAER dokumentum frissítve).

### 2. Frontend (UI) funkciók
- **"Kiküldve" oszlopok szétválasztása:** A táblázatban megjelent a "Kiküldve GHU" és a "Kiküldve LOG" oszlop.
- **Okos checkboxok:** 
  - Ha egy fuvaron nincs GHU vagy nincs LOG tétel (a rendszer ezt a tételeknél lévő Customer mezőből számolja ki: 'GHU' felirat alapján), akkor a megfelelő checkbox helyén egy szürke ❌ ikon jelenik meg. Így azonnal látható, hogy az adott dokumentum típusból nincs mit kiküldeni.
  - Ha a felhasználó bejelöl egy checkboxot, egy megerősítő felugró ablak (confirm) figyelmezteti a véletlen kattintások elkerülése végett.
- **Sorok automatikus elrejtése:** Ha egy fuvaron minden _aktív_ (szükséges) dokumentum kiküldésre került (pl. egy vegyes fuvar esetén a GHU és a LOG is be van pipálva), a sor automatikusan eltűnik az alapnézetből.
- **Új szűrők:** A fejlécek felett megjelent két új szűrő: "Mutassa a kiküldött GHU fuvarokat" és "Mutassa a kiküldött LOG fuvarokat". Ezek bepipálásával a már kiküldött (kész) és elrejtett sorok ismét láthatóvá tehetők.

### 3. Üres kamion védelem (Rakodás modul)
- Fuvarmegbízás (dokumentum) készítésekor, illetve a kamion "RAKODVA" állapotba helyezésekor (amikor az EKAER is automatikusan generálódna) a rendszer először ellenőrzi, hogy vannak-e tételek az adott kamionhoz rendelve.
- Ha a fuvar "üres" (nincs célállomás, áru), akkor egy figyelmeztető ablak ugrik fel: *"⚠️ Nincsenek tételek (áru) rögzítve ezen a kamion fuvaron! Biztosan létre akarja hozni..."*
- Ha a felhasználó igennel válaszol, a fuvar üresen is elkészül, és a Fuvarmegbízások/EKAEREK listában **mindkét** (GHU és LOG) jelölőnégyzet aktív lesz, hogy kézzel le tudják zárni.

### 4. Egyéb Finomítások
- **Rakodás:** Kamion rögzítésnél a fuvardíj (Transport price) mellett megjelent egy pénznem választó (EUR/HUF), ami mentésre is kerül az adatbázisban.
- **Transportistas:** A kamionszámra (Order number) kattintva mostantól felugrik az adott kamion szerkesztési ablaka.

### 5. Dokumentumok online szerkesztése (Fuvarmegbízás és EKAER)
- **Szerkeszthető előnézet:** A "📄 Dokumentum megnyitása" gombra kattintva a fejlécben megjelent egy sárga "✏️ Szerkesztés" gomb. Erre kattintva a dokumentum szöveges része közvetlenül a böngészőben szerkeszthetővé válik.
- **Mentési funkció:** A "💾 Mentés" gomb elmenti a változtatásokat közvetlenül a szerveren lévő eredeti .docx fájlba. A "✕ Mégse" gomb elveti a módosításokat.
- **Biztonsági mentés (Backup):** A mentés gomb megnyomásakor a rendszer az eredeti .docx fájlról automatikusan másolatot készít a /mnt/raktar/_DOCX_Backup/Fuvarmegbizasok/ és /mnt/raktar/_DOCX_Backup/EKAER/ mappákba időbélyeggel ellátva, így az eredeti dokumentumok bármikor visszaállíthatók.
- **Formázás megőrzése (XML-alapú szerkesztés):** A szöveges módosítások a Word fájl belső XML szerkezetén mennek végbe (`w:t` elemek frissítése), így a dokumentum formázása (betűméret, bold, dőlt, betűtípus) érintetlenül megmarad.

### 6. Kiküldve (is_sent) logika visszaállítása
- **Adatbázis módosítás visszavonása:** Az is_sent_ghu és is_sent_log mezőket megszüntettük a 	ransport_orders és ekaer_records táblákban, és visszaállítottuk az eredeti is_sent logikai mezőt.
- A GHU és LOG szerinti megkülönböztetésre a jövőben egy **pénzügyi / könyvelési modulban** lesz szükség, nem pedig a fuvarok/EKAER-ek kiküldésének lezárásánál.
- A Frontend és az API hívások (Fuvarmegbízások és EKAEREK) visszaálltak a korábbi, egyszerű "egy checkbox = egy kiküldés" (is_sent) logikára, de megtartották az új, tiszta UI-t, a megerősítő ablakokat (confirm) és az okos szűrőt.
