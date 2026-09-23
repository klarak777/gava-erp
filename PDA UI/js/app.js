/**
 * app.js – GAVA WMS PDA főalkalmazás és router
 */

import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderCommission } from './views/commission.js';
import { renderConsolidation } from './views/consolidation.js';
import { renderScanPallet } from './views/scanPallet.js';

const root = document.getElementById('pda-app-root');

// ── Állapot ────────────────────────────────────
export const appState = {
  token: localStorage.getItem('pda_token') || null,
  user: JSON.parse(localStorage.getItem('pda_user') || 'null'),
  apiBaseUrl: 'http://138.68.143.223:3001',
  currentView: null,
};

// ── Billentyűzet elrejtése szkenneléshez ──────────────────
window.addEventListener('focusin', (e) => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard) {
      window.Capacitor.Plugins.Keyboard.hide().catch(() => {});
    }
  }
});

// ── Nézetváltó ────────────────────────────────
export function showView(viewName, params = {}) {
  if (window._currentHwBack) {
    window.removeEventListener('hwBack', window._currentHwBack);
    window._currentHwBack = null;
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
export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(appState.token ? { 'Authorization': `Bearer ${appState.token}` } : {}),
    ...(options.headers || {}),
  };
  
  const baseUrl = appState.apiBaseUrl ? appState.apiBaseUrl.replace(/\/+$/, '') : '';
  const fullPath = baseUrl ? `${baseUrl}${path}` : path;
  
  const res = await fetch(fullPath, { ...options, headers });
  return res;
}

// ── Indítás ────────────────────────────────────
function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const startView = urlParams.get('view');
  const truckId = urlParams.get('truck_id');

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
    const hwBackEvent = new CustomEvent('hwBack');
    window.dispatchEvent(hwBackEvent);
  }
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
