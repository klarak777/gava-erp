# Fejlesztési jegyzetek - V0.9.4

## Elvégzett módosítások:

1. **ALDI Rendelések Modul - Egység Címke EAN:**
   - Az **EGYSÉG CÍMKE** blokkban az `EAN 13` szöveget kicseréltük `EAN kód`-ra.
   - Az inline szerkesztés során az `EAN kód` most már egy saját **beviteli mező vezérlőt** kapott, így nem kell külön felületet (modalt) megnyitni a szerkesztéséhez. Az érték közvetlenül itt szerkeszthető, majd a mentés gomb megnyomásakor a rendszer az adatot lementi a szerverre.
   - A `saveLabelFn` funkció kibővült az EAN mező értékének mentésével a PUT API híváson keresztül.

2. **Karton és Egység címkék exportja (DOCX):**
   - Korábbi fejlesztés részeként az exportálás (DOCX) sablonja javításra került úgy, hogy a "pieza" (Egység címke) és a "CAJA" (Karton címke) megfelelő elrendezésben és keretvastagsággal szerepeljen egymás alatt, pontosan egyezve a megadott referencia mintával.

3. **Backend Adatintegritás és Heti árak funkció:**
   - A módosítások biztonságosak: **NEM érintik a DO szerveren lévő alapvető Termék adattáblát**, csak az ALDI termékek specifikus tulajdonságait (`chain_products`).
   - A termék adattáblába felvitt adatok, illetve azok **Heti árak fülön történő mentése maradéktalanul megmaradt**, a változtatások nincsenek hatással a rendszer többi részének logikájára.

4. **Verzióváltás:**
   - A felhasználói felület (UI) fejlécében a verziószám frissítve lett `V0.9.4`-re (`index.html`).
