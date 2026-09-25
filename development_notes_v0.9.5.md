# Fejlesztési jegyzetek - V0.9.5

## Elvégzett módosítások:

1. **ALDI Rendelések Modul - Szabadon szerkeszthető Karton és Egység címkék:**
   - A "KARTON CÍMKE" és "EGYSÉG CÍMKE" blokkok a különálló, szétaprózott mezők (LOT, GLN, méret, stb.) helyett egy-egy egységes, szabadon formázható és szerkeszthető szövegmezővé (mini szövegszerkesztővé) lettek alakítva.
   - Az inline szerkesztés során a teljes címkeszöveg közvetlenül, soronként szerkeszthető a kereten belül.
   - A mentés a `label_custom_texts` JSON mezőbe történik (`unit_content` és `carton_content` kulcsok alatt).

2. **DOCX Címkeexportálás támogatása:**
   - A szerver oldali címkegeneráló végpont (`/api/v1/chain-products/:id/label`) frissítésre került: amennyiben egyéni szerkesztett címkeszöveg van megadva, azt automatikusan soronként bekezdésekre bontva illeszti be a DOCX sablon megfelelő keretébe ("pieza" vagy "CAJA").

3. **Verziófrissítés (V0.9.5):**
   - A felhasználói felület (UI) fejlécében, az oldalsáv logónál, a böngészőfül címsorában (`<title>`) és a bejelentkezési képernyőn a verziószám frissítve lett `V0.9.5`-re (`Access UI/index.html`).
