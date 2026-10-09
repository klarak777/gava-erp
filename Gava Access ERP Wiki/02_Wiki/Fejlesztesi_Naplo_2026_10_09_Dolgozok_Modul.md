# Fejlesztési Napló - 2026. 10. 09. - Dolgozók modul frissítése (V0.9.8.6)

## Elvégzett módosítások
- **Dolgozók modul UX/UI átalakítás:**
  - A korábbi teljes képernyős asztali nézet helyett a Dolgozók modul (`employees.js`) most már MDI (Multi-Document Interface) felugró ablakként nyílik meg (640x480 méretben, középre igazítva).
  - Ennek érdekében a `main.js`-ben engedélyezve lett az `opensWindow: true` attribútum, majd később közvetlenül a `windowManager.createModal` API-t hívjuk meg a villogásmentes középre igazítás érdekében.
- **Dolgozó profil űrlap UX finomhangolás:**
  - A "Munkaügyi adatok", "Bejelentkezési adatok", "Munkavállaló profil" szövegmezők oszlop-szélességeit a felhasználói kérésnek megfelelően lecsökkentettük, kompaktabb lett a grid layout (`.emp-grid-2`, új `.emp-grid-3` bevezetése).
  - Az "Oktatás képzés", "Nyelvtudás", és "Dokumentumok" listák kártyás stílusban lettek átdolgozva, egymás mellé (3 oszlopba) rendezve.
  - Az új dolgozó hozzáadásakor megjelenő szerkesztő ablak szintén automatikusan a képernyő közepére ugrik.
- **Dokumentum feltöltési logika (Backend + Frontend):**
  - Dolgozókhoz rendelhető dokumentumok valós feltöltésének és csatolásának lefejlesztése.
  - Feltölthető formátumok bővítése (PDF és PNG mellett JPG/JPEG fájlok is engedélyezettek).
  - Backend API: `POST /api/v1/employees/:id/documents` végpont elkészítése, mely UNC hálózati útvonalra (`\\192.168.1.5\raktar\Gava Hungria System\ERP\[ID]\`) menti le a fájlokat, vagy ha a hálózat nem elérhető, tartalék (fallback) könyvtárba.
  - Feltöltéskor a dokumentum neve módosítható.
  - Frontend listázásból a dokumentum nevei kattinthatóvá váltak, rákattintáskor a dokumentum megnyílik.
- **Mock adatok és verziókövetés:**
  - Teszt dolgozó ("Web Emulátor Tesztelő") eltávolítása, majd visszaállítása.
  - Projekt verziószám emelése: `V0.9.8.6` (megjelenik a belépési oldalon és a `package.json`-ben is).
