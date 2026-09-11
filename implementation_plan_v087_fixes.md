# V0.8.7 – Napi értékek javítása (Lekötés & Rendelés tábla)

## Összefoglalás

A felhasználó 5 konkrét hibát azonosított. A 6. (fájlnév) nem hiba – a jelenlegi `Rendelési terv KW37.xlsx` formátum a helyes.

---

## Javítandó hibák

### 1. Csak akciós napok értékei kerülnek át – a többi nap marad a Keresleti becslésnél

**Probléma:** A `aldi_rendelesek.js` 576. sorában:
```js
for (const key of estimate.actionDays) { distribution[key] = estimate.result[key]; ... }
```
Csak az akciós napok kerülnek be. A nem-akciós napokra a normál (`distribution`) marad.

**Javítás:** Ha van `daily_values`, az `estimatedDistribution` visszaadja az összes 7 nap értékét. A hívó oldalon az **összes** `result` kulcsot felül kell írni, nem csak az `actionDays`-t.

**Érintett fájl:** [`aldi_rendelesek.js`](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/Access%20UI/src/modules/aldi_rendelesek.js) – sor 571–577

---

### 2. L oszlop (szerda) dátuma hibás – a kezdő szerdát kapja a következő szerda helyett

**Probléma:** A `weeklyCommitments.js`-ben:
```js
const excelKeyToDatesIdx = { thu: 1, fri: 2, sat: 3, sun: 4, mon: 5, tue: 6, wed: 0 };
```
A `wed: 0` a **kezdő szerdát** (dates[0]) rendeli az Excel L oszlopához. De az L oszlop valójában a **következő szerdát** jelöli – azaz a Lekötés hét UTOLSÓ napját (Kedd = dates[6]) megelőző napot, ami a dátumsorban `dates[0] + 7 nappal`.

A helyes mapping az eggyel eltolt logikából következően:
- F=thu → dates[0] (Szerda az ALDI UI-ban)
- G=fri → dates[1] (Csütörtök)
- H=sat → dates[2] (Péntek)
- I=sun → dates[3] (Szombat)
- J=mon → dates[4] (Vasárnap)
- K=tue → dates[5] (Hétfő)
- L=wed → dates[6] (Kedd – ez az Excel következő szerdája de UI-ban Kedd)

```js
const excelKeyToDatesIdx = { thu: 0, fri: 1, sat: 2, sun: 3, mon: 4, tue: 5, wed: 6 };
```

**Érintett fájl:** [`weeklyCommitments.js`](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/Access%20UI/src/utils/weeklyCommitments.js) – sor 112

---

### 3. Több sor azonos termékre/időszakra: daily_values felülíródik összeadás helyett

**Probléma:** A `productGroups` gyűjtésnél:
```js
productGroups[pid].actionDailyValues[item.action_period || ''] = dv;
```
Felülírja az előző sor értékeit ahelyett, hogy összeadná.

**Javítás:** Ha már van `actionDailyValues` az adott periódushoz, naponta összeadni:
```js
const existing = productGroups[pid].actionDailyValues[key];
if (existing) {
  ['thu','fri','sat','sun','mon','tue','wed'].forEach(k => { existing[k] = (existing[k]||0) + (dv[k]||0); });
} else {
  productGroups[pid].actionDailyValues[key] = {...dv};
}
```

**Érintett fájl:** [`aldi_rendelesek.js`](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/Access%20UI/src/modules/aldi_rendelesek.js) – sor 554–557

---

### 4. Korábbi feltöltések nem kapják meg automatikusan a napi adatokat

**Állapot:** A `/reprocess` végpont és UI gomb már elkészült az előző commitban. Ez a hiba **megoldott**.

---

### 5. Raktárkészlet törtszámot mutathat

**Probléma:** `futoKeszlet = parseFloat(stockInput.initial_stock) || 0` – nincs `Math.round()`.
A Lekötés & Rendelés táblában és a Készlet listában az `initial_stock` megjelenítésére is szükség van egész formában.

**Javítás:**
```js
let futoKeszlet = Math.round(parseFloat(stockInput.initial_stock) || 0);
```

A `lekotesRows`-ban a raktárkészlet cellája szintén kapjon `Math.round()`-ot.

**Érintett fájl:** [`aldi_rendelesek.js`](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/Access%20UI/src/modules/aldi_rendelesek.js) – sor 583, 652

---

### 6. Fájlnév – NEM hiba

A jelenlegi `Rendelési terv KW37.xlsx` formátum helyes. Nem módosítandó.

---

## A módosítás logikája: Bug #1 + #2 együtt

Az `estimatedDistribution` függvényt is egyszerűsítjük ha `dailyValues` van:
- **Nincs szükség** a százalék-alapú akciós elosztásra
- Közvetlenül mappeljük az Excel F–L értékeket UI napokra az eltolással
- Az összes 7 nap értékét visszaadjuk, nem csak az akciósat
- Az `actionDays` lista (zöld háttér jelölés) megmarad az akciós időszak alapján

```js
// Ha dailyValues elérhető: közvetlen mapping, eltolással
const excelToUi = { thu: 'wed', fri: 'thu', sat: 'fri', sun: 'sat', mon: 'sun', tue: 'mon', wed: 'tue' };
for (const [excelKey, uiKey] of Object.entries(excelToUi)) {
  result[uiKey] = Math.round(Number(dailyValues[excelKey]) || 0);
}
// Akciós napok azonosítása dátum alapján (zöld háttérhez)
// excelKeyToDatesIdx javítva: { thu: 0, fri: 1, sat: 2, sun: 3, mon: 4, tue: 5, wed: 6 }
```

A hívó oldalon (`aldi_rendelesek.js`) a teljes `result`-ot kell átvenni:
```js
// Régi (hibás):
for (const key of estimate.actionDays) { distribution[key] = estimate.result[key]; }
// Új (helyes):
Object.assign(distribution, estimate.result);
for (const key of estimate.actionDays) { if (!actionDays.includes(key)) actionDays.push(key); }
```

---

## Módosítandó fájlok

### [`weeklyCommitments.js`](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/Access%20UI/src/utils/weeklyCommitments.js)
- `excelKeyToDatesIdx` javítása: `{ thu: 0, fri: 1, sat: 2, sun: 3, mon: 4, tue: 5, wed: 6 }`
- Ha `dailyValues` van: közvetlen mapping az összes napra, nincs százalék-elosztás

### [`aldi_rendelesek.js`](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/Access%20UI/src/modules/aldi_rendelesek.js)
- `actionDailyValues` összeadás javítása (Bug #3)
- `distribution` felülírás javítása: `Object.assign` az összes napra (Bug #1)
- `futoKeszlet` és raktárkészlet cella `Math.round()` (Bug #5)

---

## Verifikálás (Körte példával)

Akció: 03.09.–06.09. (Csütörtök–Vasárnap a valóságban → UI-ban Sze–Szo)  
Excel adatok: F=Csü=2458, G=Pé=1803, H=Szo=1474, I=Vas=83, J=Hé=74, K=Ke=70  
Normál keresleti: 2686

Elvárt UI értékek (közvetlen mapping):
| UI nap   | Excel kulcs | Érték |
|----------|-------------|-------|
| Szerda   | thu (F)     | 2458 × ? = 737 (akciós nap) |
| Csütörtök| fri (G)     | 1803 × ? = 541 (akciós nap) |
| Péntek   | sat (H)     | 1474 × ? = 442 (akciós nap) |
| Szombat  | sun (I)     | 83 (nem-akciós) |
| Vasárnap | mon (J)     | 74 (nem-akciós) |
| Hétfő    | tue (K)     | 70 (nem-akciós) |
| Kedd     | wed (L)     | ? |

> **Kérdés:** Az F–L értékek az Excel sorában összege az összmennyiség (total_forecast_cartons), vagy ezek közvetlen napi értékek amik összeadódnak a heti összeghez? Ha közvetlen napi értékek, akkor nincs szükség százalék-elosztásra – egyenesen vesszük át őket.
