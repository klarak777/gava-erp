# Gavá ERP Access UI - Fejlesztési Napló (V0.6.9)

**Dátum:** 2026.07.30.  
**Verzió:** V0.6.9  

---

## 🚀 Az elmúlt fejlesztési ciklus kiemelt javításai és funkciói

### 1. ⚡ Menedzser Modul Backend Optimalizáció (7x-es Gyorsulás)
- **Probléma:** A Menedzser modul nyitásakor és frissítésekor a szerver 15 000 adatbázis rekord feldolgozása közben soronként külön al-lekérdezést hajtott végre a partnerek referencia azonosítóira. Ez alkalmanként több mint **5,0 másodperces várakozási időt** okozott.
- **Megoldás:** Átalakítottuk a backend `/api/v1/shipment-lines` végpontját. A szerver most egyetlen villámgyors lekérdezéssel a memóriában (Map) képezi le a referencia azonosítókat. 
- **Eredmény:** A betöltési idő **5,0 másodpercről ~0,7 másodpercre** csökkent!

---

### 2. 🚛 Menedzser Kamion Pénzügyi Szerkesztő Modul Javításai

#### **IdEmpr mező dinamikus kinyerése**
- A `Transport & Other` fül **IdEmpr** mezője korábban tévesen a tételsorok ügyfélnevét vette át. Mostantól automatikusan a kamionszámból (Order number) nyeri ki a kezdő betűket (pl. `GHU123` $\rightarrow$ `GHU`, `H123` $\rightarrow$ `H`, `LOG039` $\rightarrow$ `LOG`).

#### **Fejléc összefoglaló táblázat (Summary Table) szinkronizációja**
- **Transport & Other sor Total Invoice:** Mostantól a *Transport & Other* fül saját devizás számlaösszegét jeleníti meg **megszorozva az ExchRt (árfolyam) értékével** (HUF-ra átszámolva).
- **Total Inv A és Balance A:** A *Transport & Other* sorban a `Total Inv A` és `Balance A` mezők automatikusan átveszik a fül devizás (EUR) számlaértékét.
- **Totals: sor:** A `Totals:` sor automatikusan és helyesen összeadja a *Goods* és a *Transport & Other* tételek `Total Invoice`, `Total Inv A` és `Balance A` értékeit.
- **Transfers Totals (EUR):** Az összefoglaló alatti *Transfers Totals* mező automatikusan összesíti euróban a *Goods* és a *Transport & Other* tételek összevont számlaértékét (`Goods EUR + Transport EUR`).

#### **Unit Costs fül finomításai**
- **Felirat törlése:** A táblázat fejlécéből eltávolítottuk a felesleges `(Currency: EUR)` feliratot.
- **Gombsor tisztítása:** Eltávolítottuk a *Unit Costs* fül tetejéről a felesleges `"Delete line"`, `"Update"` és `"Add line"` gombokat.
- **+VAT bruttó szorzó igazítása:** A `+VAT/kg` és `+VAT/Box` számítását módosítottuk. Az eddigi kizárólagos ÁFA-tartalom helyett most a teljes bruttó szorzóval szorozza fel a nettó bekerülést:
  - 27% ÁFA esetén: `TotCost × 1.27`
  - 12% ÁFA esetén: `TotCost × 1.12`
  - 0% ÁFA esetén: `TotCost × 1.00`

---

### 3. 📦 Termékek (Products) & Áruigény Modul Fejlesztések

#### **Termékek tábla ABC sorrendje és Keresője**
- A `Termékek (Products)` modul táblázatában a termékek mostantól **magyar ABC sorrendbe** rendezve jelennek meg.
- A táblázat fejlécébe beépítettünk egy valós idejű `🔍 Keresés...` szűrőmezőt.

#### **Áruigény hozzáadása modul - Product választó feloldása**
- **Szigorú Kezdőkarakteres (`startsWith`) keresés:** Beíráskor (pl. `C` vagy `CA`) szigorúan a megadott kezdőkarakterrel rendelkező termékek listázódnak.
- **8 elemes korlát eltávolítása:** Feloldottuk a korábbi 8 elemes mesterséges korlátot; mostantól görgethető listában az összes kezdőkarakternek megfelelő termék böngészhető.
- **Fókuszra nyíló lista:** A mezőbe kattintva a teljes ABC sorrendbe rendezett terméklista azonnal felugrik.
