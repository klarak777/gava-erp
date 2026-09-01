/**
 * dashboard.js – PDA főmenü képernyő
 */
import { showView, clearAuth, appState } from '../app.js';

const MENU_ITEMS = [
  { id: 'commission', label: 'Komissió', desc: 'Megrendelések összekészítése', icon: '🛒', active: true },
  { id: 'incoming',  label: 'Bevételezés', desc: 'Áru beérkeztetése', icon: '📥', active: false },
  { id: 'outgoing',  label: 'Kiadás',  desc: 'Áru kiadása', icon: '📤', active: false },
  { id: 'transfer',  label: 'Áttárolás', desc: 'Áru áttárolása', icon: '↔️', active: false },
  { id: 'return',    label: 'Visszáru', desc: 'Visszáru kezelés', icon: '↩️', active: false },
  { id: 'packing',   label: 'Csomagolás', desc: 'Csomagolási feladatok', icon: '📦', active: false },
];

export function renderDashboard(container) {
  const user = appState.user;
  const userName = user?.name || 'Felhasználó';

  container.innerHTML = `
    <div class="pda-view pda-dashboard">
      <!-- Fejléc -->
      <div class="pda-dashboard__top">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div>
            <div class="pda-dashboard__greeting">Szia,</div>
            <div class="pda-dashboard__user">${escHtml(userName)}</div>
          </div>
          <img src="/GAVA.png" alt="Gava" style="height:36px; border-radius:50%; background:#fff; padding:3px;" onerror="this.style.display='none'">
        </div>
        <div class="pda-dashboard__location">
          <span>📍</span> Központi raktár
        </div>
      </div>

      <!-- Menü rács -->
      <div class="pda-scroll pda-dashboard__scroll">
        <div class="pda-dashboard__grid">
          ${MENU_ITEMS.map(item => `
            <div
              class="pda-menu-card ${item.active ? '' : 'pda-menu-card--disabled'}"
              data-module="${item.id}"
              title="${item.active ? item.desc : 'Hamarosan elérhető'}"
            >
              <div class="pda-menu-card__icon">${item.icon}</div>
              <div class="pda-menu-card__label">${item.label}</div>
              <div class="pda-menu-card__desc">${item.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Alsó navigáció -->
      <div class="pda-bottom-nav">
        <div class="pda-bottom-nav__item pda-bottom-nav__item--active">
          <span class="pda-bottom-nav__icon">🏠</span>
          <span class="pda-bottom-nav__label">Főoldal</span>
        </div>
        <div class="pda-bottom-nav__cta">
          <button class="pda-bottom-nav__cta-btn" id="pda-dash-commission-btn" title="Komissió">🛒</button>
        </div>
        <div class="pda-bottom-nav__item" id="pda-logout-btn">
          <span class="pda-bottom-nav__icon">🚪</span>
          <span class="pda-bottom-nav__label">Kijelentkezés</span>
        </div>
      </div>
    </div>
  `;

  // Menükártya kattintás
  container.querySelectorAll('.pda-menu-card:not(.pda-menu-card--disabled)').forEach(card => {
    card.addEventListener('click', () => {
      const moduleId = card.getAttribute('data-module');
      showView(moduleId);
    });
  });

  // CTA gomb → Komissió
  container.querySelector('#pda-dash-commission-btn')?.addEventListener('click', () => {
    showView('commission');
  });

  // Kijelentkezés
  container.querySelector('#pda-logout-btn')?.addEventListener('click', () => {
    if (confirm('Biztosan kijelentkezel?')) {
      clearAuth();
      showView('login');
    }
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
