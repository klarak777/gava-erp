/**
 * app.js – GAVA WMS PDA főalkalmazás és router
 */

import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderCommission } from './views/commission.js';
import { renderConsolidation } from './views/consolidation.js';
import { renderScanPallet } from './views/scanPallet.js';

const root = document.getElementById('pda-app-root');
const isNative = !!window.Capacitor?.isNativePlatform?.();

// ── Global Barcode Listener ──────────────────
let barcodeBuffer = '';
let barcodeTimer = null;

document.addEventListener('keydown', (e) => {
  if (e.target && ((e.target.tagName === 'INPUT' && !e.target.readOnly && e.target.type !== 'radio' && e.target.type !== 'checkbox') || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
    return;
  }
  
  if (e.key.length === 1) {
    barcodeBuffer += e.key;
    clearTimeout(barcodeTimer);
    barcodeTimer = setTimeout(() => {
      if (barcodeBuffer.length > 0) {
        window.dispatchEvent(new CustomEvent('pda-barcode-scanned', { detail: barcodeBuffer }));
        barcodeBuffer = '';
      }
    }, 150);
  } else if (e.key === 'Enter') {
    clearTimeout(barcodeTimer);
    if (barcodeBuffer.length > 0) {
      window.dispatchEvent(new CustomEvent('pda-barcode-scanned', { detail: barcodeBuffer }));
      barcodeBuffer = '';
    }
  }
});

// ── Állapot ────────────────────────────────────
export const appState = {
  token: localStorage.getItem('pda_token') || null,
  user: JSON.parse(localStorage.getItem('pda_user') || 'null'),
  apiBaseUrl: isNative ? 'http://138.68.143.223:3001' : '',
  currentView: null,
};

// ── Nézetváltó ────────────────────────────────

// -- Történet kezelés fizikai back gombhoz --
window.addEventListener('popstate', (e) => {
  if (window._currentHwBack) {
    window._currentHwBack();
    history.pushState({ view: appState.currentView }, '');
  } else if (appState.currentView !== 'dashboard' && appState.currentView !== 'login') {
    showView('dashboard');
  } else {
    window.history.back();
  }
});

let isFirstView = true;

// ── Nézetváltó ────────────────────────────────
export function showView(viewName, params = {}) {
  window._currentViewCleanup?.();
  window._currentViewCleanup = null;
  if (window._currentBarcodeHandler) {
    window.removeEventListener('pda-barcode-scanned', window._currentBarcodeHandler);
    window._currentBarcodeHandler = null;
  }
  if (window._currentHwBack) {
    window.removeEventListener('hwBack', window._currentHwBack);
    window._currentHwBack = null;
  }
  
  if (isFirstView) {
    history.replaceState({ view: viewName }, '');
    isFirstView = false;
  } else if (appState.currentView !== viewName) {
    history.pushState({ view: viewName }, '');
  }
  
  root.innerHTML = '';
  appState.currentView = viewName;

  switch (viewName) {
    case 'login':
      renderLogin(root);
      break;
    case 'dashboard':
      renderDashboard(root, params);
      break;
    case 'commission':
      renderCommission(root, params);
      break;
    case 'consolidation':
      renderConsolidation(root, params);
      break;
    case 'scan-pallet':
      renderScanPallet(root, params);
      break;
    default:
      renderDashboard(root, params);
  }
}

// ── Token kezelés ──────────────────────────────
export function setAuth(token, user) {
  appState.token = token;
  appState.user = user;
  localStorage.setItem('pda_token', token);
  localStorage.setItem('pda_user', JSON.stringify(user));
}

export function clearAuth() {
  appState.token = null;
  appState.user = null;
  localStorage.removeItem('pda_token');
  localStorage.removeItem('pda_user');
}

// ── API hívó wrapper ───────────────────────────
let emulatorLoginPromise = null;
async function signInWebEmulator() {
  if (isNative) return false;
  if (!emulatorLoginPromise) {
    emulatorLoginPromise = (async () => {
      const configRes = await fetch('/api/v1/pda/emulator-config');
      if (!configRes.ok || !(await configRes.json()).enabled) return false;
      const res = await fetch('/api/v1/pda/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'WEB_EMULATOR_TEST' })
      });
      if (!res.ok) return false;
      const data = await res.json();
      setAuth(data.token, data.user);
      return true;
    })().catch(() => false).finally(() => { emulatorLoginPromise = null; });
  }
  return emulatorLoginPromise;
}

export async function apiFetch(path, options = {}, retryEmulator = true) {
  const currentToken = appState.token;
  const headers = {
    'Content-Type': 'application/json',
    ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
    ...(options.headers || {}),
  };
  
  const baseUrl = appState.apiBaseUrl ? appState.apiBaseUrl.replace(/\/+$/, '') : '';
  const fullPath = baseUrl ? `${baseUrl}${path}` : path;
  
  const res = await fetch(fullPath, { ...options, headers });
  
  if (res.status === 401) {
    if (currentToken && currentToken !== appState.token) {
      // Ignoráljuk a kései 401-et, ha időközben már új bejelentkezés történt
      if (!isNative && retryEmulator) return apiFetch(path, options, false);
      return res;
    }
    if (!isNative && retryEmulator && path !== '/api/v1/pda/login' && await signInWebEmulator()) {
      return apiFetch(path, options, false);
    }
    clearAuth();
    appState.authMessage = 'A munkamenet lejárt vagy más eszközön bejelentkeztek.';
    showView('login');
    throw new Error('A munkamenet lejárt vagy más eszközön bejelentkeztek.');
  }
  
  return res;
}

// ── Indítás ────────────────────────────────────
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const startView = urlParams.get('view');
  const truckId = urlParams.get('truck_id');

  if (!isNative && (!appState.token || !appState.user)) {
    if (!await signInWebEmulator()) { showView('login'); return; }
  }

  if (appState.token && appState.user) {
    if (startView === 'commission' && truckId) {
      showView('commission', { truckId: truckId });
    } else {
      showView('dashboard');
    }
  } else {
    showView('login');
  }
}

// ── Hardver gomb üzenetek ──────────────────────
window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'hw-home') {
    if (appState.token) {
      showView('dashboard');
    }
  } else if (event.data && event.data.action === 'hw-back') {
    window.dispatchEvent(new CustomEvent('hwBack'));
  }
});

// ── Fizikai Back gomb kezelése (Capacitor) ──────
document.addEventListener('ionBackButton', (ev) => {
  ev.detail.register(10, () => {
    if (window._currentHwBack) {
      window._currentHwBack();
    } else if (appState.currentView !== 'dashboard' && appState.currentView !== 'login') {
      showView('dashboard');
    }
  });
});

// ── Szám típusú beviteli mezők: léptetés letiltása (csak kézi gépelés engedélyezett) ──
document.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  }
});
document.addEventListener('wheel', (e) => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
    e.preventDefault();
  }
}, { passive: false });

init();
