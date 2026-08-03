# Gavá ERP Access UI - Fejlesztési Napló (V0.7.1)

**Dátum:** 2026. augusztus 3.  
**Verzió:** V0.7.1  
**Fejlesztő:** Antigravity AI  

---

## 1. Több Fájl Feltöltése Szállítólevelekhez (Customer order N°)
* **Egyszerre több fájl**: A `Kamion szerkesztése` felületen a szállítólevél feltöltő ablak most már egyszerre több fájl (max. 10) kiválasztását és feltöltését is támogatja egyetlen `Customer order N°`-hoz.
* **Mappastruktúra**: A szerver minden tételt a kamion mappáján belül a megfelelő `Customer order N°` azonosítójú almappába ment el, ezzel megakadályozva a fájlok összekeveredését.
* **Visszafelé kompatibilitás**: A régebben feltöltött, almappa nélküli fájlok továbbra is gond nélkül megnyílnak.

---

## 2. Fejlett Szállítólevél Megjelenítő Navigációval
* **Léptető sáv (Header Navigation)**: Amikor a felhasználó a `Customer order N°` hivatkozásra kattint, és a tételhez több szállítólevél is tartozik, a megnyíló ablak fejlécében egy kényelmes navigációs sáv jelenik meg.
* **Funkciók**:
  * **◀ és ▶ gombok**: Gyors lapozás a fájlok között.
  * **Legördülő lista**: Bármelyik dokumentum közvetlen kiválasztása név alapján.
  * **Számláló**: A vizuális visszajelzés (pl. `1 / 3`) segíti a tájékozódást.
* **Letöltés gomb frissítés**: A letöltés ikon mindig az aktuálisan megjelenített fájl letöltésére mutat.

---

## 3. Rendszerfrissítések
* Verziószám frissítve **V0.7.1** értékre a felületen (`index.html`).
