# GAVA Access ERP – Fejlesztési napló (2026-06-12, V 0.2.0)

**Verzió:** V 0.2.0  
**Dátum:** 2026. június 12.  
**Érintett fájlok:** `kamion_szerkesztes.js`, `index.html`, `style.css`

---

## 1. Rakodás modul – Termék hozzáadása átdolgozás

### 1.1 Mező nevek lokalizációja
A „+ Termék hozzáadása" felugró ablak és a táblázat fejlécei a kért angol nevekre lettek cserélve, pontosan az alábbi sorrendben:
- N° Euro Palets
- N° Normal Palets
- Products
- Reference
- Customer
- Destination
- Comment
- Gross weight (kg)
- Price (EUR)
- Price BCN (EUR)
- Unit
- Reloading/plt
- Transport BCN/plt
- Customer order N°

### 1.2 Total Palets – automatikus számítás
A sor szintű Total Palets értéke automatikusan számítódik a fuvarok összesítőjéből ismert `conversionMap` logika alapján (normál raklap → euro raklap átváltás, arányos elosztás). A számítás nem veszi figyelembe a kamionszámot (egy fuvarhoz, egy kamionhoz tartozik).

### 1.3 Truck N°/plt oszlop
Új oszlop hozzáadva (`truck_number_per` mező), egész szám formátum, tizedes nélkül.

---

## 2. Termék szerkesztő – Új UX struktúra

### 2.1 A felső „+ Termék hozzáadása" panel eltávolítva
- Korábban: statikus felső panel minden mezővel.
- Most: egy modális felugró ablak, amelyet az első oszlopban lévő **✏️ szerkesztő ikon** nyit meg.

### 2.2 Szerkesztő ikon az első oszlopban
- Minden sorban: **✏️** (szerkesztés) és **✕** (sor adatainak törlése).
- A ✕ gomb **nem törli a sort**, hanem visszaállítja üres állapotba.
- Üres sorokon a ✕ le van tiltva (szürke, disabled).

### 2.3 Közvetlen cellaszerekszthetőség
- A táblázat összes adata közvetlenül szerkeszthető `<input>` mezők formájában.
- Szám mezők: `number` típus, szöveg mezők: `text` típus.
- A Total Palets automatikusan frissül cellaszerkesztéskor.

### 2.4 25 rögzített sor
- Mind új, mind meglévő kamionnál **mindig 25 sor** jelenik meg.
- Ha az adatok pl. 8 sorban vannak, a maradék 17 sor üres (halvány háttérrel).
- Mentéskor csak a nem-üres sorok kerülnek el a backendnek.

---

## 3. Inline Products keresés a táblázatban

A Products (termék) oszlop inline szerkesztő mezőjébe gépeléskor:
- Megjelenik egy **lebegő dropdown** a `position:fixed` pozícionálásnak köszönhetően (a táblázat keretétől függetlenül).
- A termékadatbázisból (`/api/v1/products`) szűr, max. 10 találatot mutat.
- Kijelölésre beírja a pontos terméknevet és elmenti a `product_id`-t is.
- Ugyanez a kereső funkció a **szerkesztő popup** Products mezőjében is működik.

---

## 4. Vízszintes gördítősáv – mindig látható

**Probléma:** Az `overflow-x: scroll` + `overflow-y: visible` kombináció nem működött megfelelően, mert a szülő div `overflow-y: auto` miatt a gördítősáv csak a táblázat aljára görgetés után vált láthatóvá.

**Megoldás:** A layout átstrukturálása `flex` dobozokkal:
- `#ks-scroll-wrap`: `overflow: hidden`, `flex:1`
- `.access-subform` (táblázat konténer): `flex:1; display:flex; flex-direction:column; min-height:0`
- `#km-table-wrap`: `flex:1; overflow:auto`

Így a vízszintes és vertikális gördítősáv egyszerre mindig látható.

---

## 5. Kisebb UI javítások

| Elem | Változás |
|------|----------|
| Hőmérséklet mező | Szélesség leszűkítve `90px`-re (`Temp. (°C):` label) |
| Taskbar cím | Szerkesztéskor a valódi kamionszám jelenik meg (pl. `Kamion szerkesztése: GHU 195`) |
| Teljes nézet (□ gomb) | CSS frissítve: `calc(100% - 70px)` – csak a topbar magasságát vonja le |

---

## 6. Verziószám megjelenítése

**Fájl:** `index.html`

A `V 0.2.0` verziószám megjelenik:
1. Az oldal `<title>` elemében: `GAVA Access UI – V 0.2.0`
2. A **bejelentkező képernyőn** az `Access UI` felirat mellett (13px, halvány)
3. A **sidebar logó** mellett (10px, halvány)

---

## 7. Deployment állapot

- **DigitalOcean droplet:** `http://138.68.143.223:3001`
- **GitHub repo:** `klarak777/gava-erp` (private)
- **Helyi elérési út:** `c:\Users\klara\Documents\Nepelemes ügyek\Gavá\ERP Access`
- **Git branch:** `main`
- **Frissítési folyamat:** ld. `Deployment_Utmutato.md`

---

*Megjegyzés: A Wiki fájlokat az Obsidian alkalmazásban a `02_Wiki` mappában tároljuk. A fejlesztési naplók markdown formátumban íródnak.*
