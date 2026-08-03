# Gavá ERP Access UI - Fejlesztési Napló (V0.7.0)

**Dátum:** 2026. augusztus 3.  
**Verzió:** V0.7.0  
**Fejlesztő:** Antigravity AI  

---

## 1. Admin modulok és Archív partnerek UI/UX egységesítése
* **Dizájn és Funkció Egységesítés**:
  * Az Admin menü **Szállítók / Partnerek**, **Customer / Vevők** és **Fuvarozó cég / Fuvarozók** moduljainak táblázatai egységes vizuális megjelenést és keresősávot kaptak, megegyezően az Archív partnerek lappal.
  * A **🔄 Áthelyezés** gomb bekerült minden adminisztrációs táblázat soraiba, amivel egy azonosító szerepkör átirányítható egy másik aktív/inaktív partnerre.
* **Szerepkör és Partner Áthelyezési Szabályok**:
  * **Globális egyediség**: Egy adott szerepkörben nem lehet két azonos nevű aktív azonosító a teljes rendszerben.
  * **Inaktív azonosítók kezelése**: Az inaktív azonosítók áthelyezésénél ellenőrzésre kerül, hogy a célpartnernél vagy a rendszerben ne ütközzön azonos nevű és szerepkörű azonosítóval.
  * **Partnerek státusza**: Aktív szerepkör azonosító kizárólag aktív partnerhez rendelhető.

---

## 2. Szállítólevél (Delivery Note) Megjelenítés és Feltöltés (Transportistas / Kamion szerkesztés)
* **Kattintható Szállítólevél Szám (`Customer order N°`)**:
  * A `Kamion szerkesztése` ablak tételeinél a kitöltött `Customer order N°` mezők kék, aláhúzott stílust kaptak.
  * A számra kattintva a rendszer automatikusan megnyitja a szállítólevél dokumentumot.
* **Szállítólevél Ellenőrzés és Megjelenítés**:
  * Új backend API végpontok (`GET /api/v1/uploads/delivery-note/:season/:orderNumber/check` és `html`) a hálózati mappában (`ERP Fuvarok/Season...`) található fájlok lekérdezéséhez.
  * **DOCX támogatás**: A beépített `mammoth` konverter segítségével a DOCX kiterjesztésű szállítólevelek is valós időben HTML-lé konvertálva jelennek meg az olvasási nézetű felugró ablakban (a PDF, JPG, PNG fájlok mellett).
* **Hiányzó Fájlok Kezelése**:
  * Amennyiben a kamionhoz még nem töltöttek fel szállítólevelet, a rendszer figyelmeztető üzenetet jelenít meg, és automatikusan felkínálja a **📄 + Feltöltés** (Drag & Drop) felugró ablakot.

---

## 3. Rendszerfrissítések
* Verziószám frissítve **V0.7.0** értékre a felületen (`index.html`).
* Hibajavítás a dinamikus ES modultöltésnél és template string eszképelésnél.
