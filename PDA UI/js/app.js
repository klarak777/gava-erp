/**
 * app.js – GAVA WMS PDA főalkalmazás és router
 */

import { renderLogin } from './views/login.js?v=2';
import { renderDashboard } from './views/dashboard.js?v=2';
import { renderCommission } from './views/commission.js?v=2';

const root = document.getElementById('pda-app-root');

// ── Állapot ────────────────────────────────────
export const appState = {
  token: localStorage.getItem('pda_token') || null,
  user: JSON.parse(localStorage.getItem('pda_user') || 'null'),
  currentView: null,
};

// ── Nézetváltó ────────────────────────────────
export function showView(viewName, params = {}) {
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
  const res = await fetch(path, { ...options, headers });
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

init();
