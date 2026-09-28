# PDA App (v8.1) – Hibaelemzés és Javítási Terv

## 🔍 Áttekintett fájlok

| Fájl | Állapot |
|------|---------|
| [app.js](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/public/js/app.js) | Billentyűzet + hwBack diszpécser |
| [MainActivity.java](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/java/com/gava/pda/MainActivity.java) | Üres – nincs back override |
| [scanPallet.js](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/public/js/views/scanPallet.js) | hwBack memory leak |
| [commission.js](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/public/js/views/commission.js) | hwBack OK |
| [consolidation.js](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/public/js/views/consolidation.js) | hwBack OK |
| [dashboard.js](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/public/js/views/dashboard.js) | Nincs hwBack handler |
| [AndroidManifest.xml](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/AndroidManifest.xml) | `windowSoftInputMode` hiányzik |
| [capacitor.config.json](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/capacitor.config.json) | Keyboard plugin konfig hiányzik |

---

## 🐛 1. HIBA: Virtuális billentyűzet megjelenik / szkennelés nem működik

### Gyökérok

A jelenlegi megoldás az [app.js:22-28](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/public/js/app.js#L22-L28):

```javascript
window.addEventListener('focusin', (e) => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard) {
      window.Capacitor.Plugins.Keyboard.hide().catch(() => {});
    }
  }
});
```

> [!WARNING]
> **Ez a kód VERSENYHELYZETBEN van az Android rendszerrel:** Amikor az input fókuszt kap, az Android automatikusan megjeleníti a billentyűzetet. A `Keyboard.hide()` utána hívódik, de mivel aszinkron, a billentyűzet villanhat, vagy egyes eszközökön egyáltalán nem tűnik el. Ráadásul egyes PDA-k szkennerje `KeyEvent`-eket küld az inputba – ha a billentyűzet `hide()` az input fókuszát is megzavarja, a szkennelési folyamat megszakadhat.

### Problémák részletezve

1. **Race condition**: `focusin` → Android megjeleníti a billentyűzetet → `Keyboard.hide()` aszinkron → villanás vagy nem tűnik el
2. **Szkenner blokkolás**: Ha az inputot `readOnly`-vá tesszük, a szkenner `KeyEvent`-jei nem jutnak be. Ha a `hide()` miatt a fókusz elveszik, a szkenner adatai elvesznek.
3. **Nincs `windowSoftInputMode`**: Az AndroidManifest.xml-ben nincs beállítva a `android:windowSoftInputMode="stateAlwaysHidden"`, ami az OS szintű megoldás lenne.
4. **Nincs Capacitor plugin konfiguráció**: A `capacitor.config.json`-ban nincs `plugins.Keyboard` szekció.

### Javítás (3 rétegű)

**A) AndroidManifest.xml** – OS szintű tiltás:
```diff
 <activity
     android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
     android:name=".MainActivity"
     android:label="@string/title_activity_main"
     android:theme="@style/AppTheme.NoActionBarLaunch"
     android:launchMode="singleTask"
-    android:exported="true">
+    android:exported="true"
+    android:windowSoftInputMode="stateAlwaysHidden|adjustResize">
```

**B) capacitor.config.json** – Plugin szintű konfiguráció:
```diff
 {
   "appId": "com.gava.pda",
   "appName": "GAVA PDA",
   "webDir": "../PDA UI",
   "server": { ... },
-  "android": { "allowMixedContent": true }
+  "android": { "allowMixedContent": true },
+  "plugins": {
+    "Keyboard": {
+      "resize": "none",
+      "style": "dark"
+    }
+  }
 }
```

**C) app.js** – JavaScript szintű javítás (jobb `focusin` kezelés):
```diff
-// ── Billentyűzet elrejtése szkenneléshez ──────────────────
-window.addEventListener('focusin', (e) => {
-  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') {
-    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard) {
-      window.Capacitor.Plugins.Keyboard.hide().catch(() => {});
-    }
-  }
-});
+// ── Billentyűzet elrejtése szkenneléshez ──────────────────
+// Az inputMode="none" attribútum megakadályozza a billentyűzet megjelenését,
+// de a szkenner KeyEvent-jei továbbra is bekerülnek az inputba.
+// Plusz biztonsági háló: ha mégis megjelenne, elrejtjük.
+document.addEventListener('focusin', (e) => {
+  const el = e.target;
+  if (el && el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
+    // inputMode="none" megakadályozza a billentyűzet felugását
+    if (!el.hasAttribute('inputmode')) {
+      el.setAttribute('inputmode', 'none');
+    }
+    // Biztonsági háló: ha mégis megjelent a billentyűzet, rejtjük el
+    if (window.Capacitor?.Plugins?.Keyboard) {
+      setTimeout(() => {
+        window.Capacitor.Plugins.Keyboard.hide().catch(() => {});
+      }, 50);
+    }
+  }
+});
```

> [!IMPORTANT]
> A kulcsmegoldás az `inputmode="none"` HTML attribútum. Ez az Android WebView-ban natívan megakadályozza, hogy a virtuális billentyűzet felugrik – de a hardveres szkenner `KeyEvent`-jei továbbra is normálisan beérkeznek az inputba. Ez a legtisztább megoldás, mert nem ütközik a szkennerrel.

---

## 🐛 2. HIBA: Visszalépés gomb kilép az alkalmazásból

### Gyökérok

A Capacitor keretrendszer alapértelmezetten elkapja a fizikai Back gombot. Ha a WebView-ban nincs `history.back()` lehetőség (mert SPA-ként egy `index.html`-en belül fut minden), a Capacitor/Android **bezárja az Activity-t** = kilép az alkalmazásból.

A jelenlegi kód megpróbálja kezelni ezt a `postMessage` + `hwBack` custom event rendszeren keresztül ([app.js:107-117](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/public/js/app.js#L107-L117)):

```javascript
window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'hw-back') {
    const hwBackEvent = new CustomEvent('hwBack');
    window.dispatchEvent(hwBackEvent);
  }
});
```

> [!CAUTION]
> **DE:** A fizikai Back gomb NEM küld `postMessage`-et a WebView-nak! Ez a kód soha nem fut le fizikai gomblenyomásra. A Capacitor saját `backButton` eseményt használ (`@capacitor/app` plugin), vagy a `popstate` / `hashchange` szintű history API-t figyeli.

### Problémák részletezve

1. **Nincs `@capacitor/app` plugin**: Ez a Capacitor beépített pluginja, ami elkapja a fizikai Back gombot és enged rá listenereket írni. Nincs telepítve.
2. **`scanPallet.js` memory leak**: A [107-109. sorok](file:///c:/Users/klara/Documents/Nepelemes%20%C3%BCgyek/Gav%C3%A1/ERP%20Access/PDA-App/android/app/src/main/assets/public/js/views/scanPallet.js#L107-L109) hozzáadnak egy anonim `hwBack` listenert a `showView` cleanup nélkül (nem regisztrálja `window._currentHwBack`-ra).
3. **`dashboard.js`-ben nincs hwBack handler**: Ha a dashboardon nyomják meg a Back gombot, nincs handler → a Capacitor alapértelmezése fut → kilép az appból.

### Javítás

**A) `@capacitor/app` plugin használata** az `app.js`-ben:
```diff
+// ── Fizikai Back gomb kezelése (Capacitor App plugin) ──────
+document.addEventListener('ionBackButton', (ev) => {
+  ev.detail.register(10, () => {
+    if (window._currentHwBack) {
+      window._currentHwBack();
+    } else if (appState.currentView !== 'dashboard' && appState.currentView !== 'login') {
+      showView('dashboard');
+    }
+    // Ha dashboard-on vagyunk: ne csináljunk semmit → ne lépjen ki
+  });
+});
```

> [!NOTE]
> A Capacitor automatikusan kibocsátja az `ionBackButton` custom DOM eventet a fizikai gomb megnyomásakor. Nem szükséges külön `@capacitor/app` plugint importálni, de ha jobban szeretnéd kontrollálni, telepíthető.

**ALTERNATÍV (egyszerűbb, plugin nélküli) megoldás – `popstate` trükk:**

```javascript
// ── Fizikai Back gomb kezelése history API-val ──────
// Minden showView híváskor tolunk egy history állapotot,
// így a Back gomb a popstate eseményt váltja ki (nem lép ki az appból).
const originalShowView = showView;
// ... (history.pushState a showView-ban)
window.addEventListener('popstate', () => {
  if (window._currentHwBack) {
    window._currentHwBack();
  } else if (appState.currentView !== 'dashboard') {
    showView('dashboard');
  }
});
```

**B) `scanPallet.js` javítása** – hwBack regisztrálása a globális rendszerbe:
```diff
-  window.addEventListener('hwBack', () => {
-    goDashboard();
-  });
+  const hwBackHandler = () => goDashboard();
+  if (window._currentHwBack) window.removeEventListener('hwBack', window._currentHwBack);
+  window._currentHwBack = hwBackHandler;
+  window.addEventListener('hwBack', hwBackHandler);
```

**C) `dashboard.js` javítása** – Back a dashboardon ne csináljon semmit:
```diff
+  // hwBack a dashboardon: ne lépjen ki az appból
+  const hwBackHandler = () => { /* szándékosan üres - dashboardon marad */ };
+  if (window._currentHwBack) window.removeEventListener('hwBack', window._currentHwBack);
+  window._currentHwBack = hwBackHandler;
+  window.addEventListener('hwBack', hwBackHandler);
```

---

## 📋 Implementációs sorrend

| # | Fájl | Módosítás | Hatás |
|---|------|-----------|-------|
| 1 | `AndroidManifest.xml` | `windowSoftInputMode="stateAlwaysHidden\|adjustResize"` | OS szinten tiltja a billentyűzetet |
| 2 | `capacitor.config.json` (mindkét!) | `plugins.Keyboard.resize: "none"` | Plugin szinten tiltja |
| 3 | `app.js` | `inputmode="none"` + javított `focusin` | WebView szinten tiltja |
| 4 | `app.js` | `popstate` / `ionBackButton` kezelés | Fizikai Back gomb |
| 5 | `scanPallet.js` | hwBack handler regisztráció | Memory leak javítás |
| 6 | `dashboard.js` | Üres hwBack handler | Ne lépjen ki az appból |

> [!IMPORTANT]
> Az APK újraépítése szükséges a Manifest és Capacitor config változtatások érvényesítéséhez!
