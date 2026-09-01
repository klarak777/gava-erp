/**
 * dashboard.js – PDA főmenü képernyő
 */
import { showView, clearAuth, appState } from '../app.js';

const MENU_ITEMS = [
  { id: 'incoming',  label: 'Bevételezés', desc: 'Áru beérkeztetése', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', active: false },
  { id: 'outgoing',  label: 'Kiadás',  desc: 'Áru kiadása', icon: 'M5 10l7-7m0 0l7 7m-7-7v18', active: false },
  { id: 'commission', label: 'Komissió', desc: 'Megrendelések összekészítése', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', active: true },
  { id: 'transfer',  label: 'Áttárolás', desc: 'Áru áttárolása', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', active: false },
  { id: 'return',    label: 'Visszáru', desc: 'Visszáru kezelés', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', active: false },
  { id: 'packing',   label: 'Csomagolás', desc: 'Csomagolási feladatok', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', active: false },
];

export function renderDashboard(container) {
  const user = appState.user;
  const userName = user?.name || 'Teszt Felhasználó';

  // Fill up to 10 slots
  const allItems = [...MENU_ITEMS];
  while (allItems.length < 10) {
    allItems.push({ id: `empty_${allItems.length}`, label: '', desc: '', icon: '', empty: true });
  }

  container.innerHTML = `
    <div class="pda-view pda-dashboard">
      <!-- Fejléc -->
      <div class="pda-dashboard__header">
        <div class="pda-dashboard__header-left">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'">
          <div class="pda-dashboard__user-info">
            <div class="pda-dashboard__company">Gava Hungria Kft.</div>
            <div class="pda-dashboard__role">FELHASZNÁLÓ</div>
            <div class="pda-dashboard__name">${escHtml(userName)}</div>
          </div>
        </div>
        <div class="pda-dashboard__header-right">
          <div class="pda-dashboard__location-box">
            <svg class="pda-dashboard__loc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <div class="pda-dashboard__loc-text">
              <div class="pda-dashboard__loc-label">RAKTÁR / TERÜLET</div>
              <div class="pda-dashboard__loc-value">Központi raktár</div>
            </div>
            <svg class="pda-dashboard__loc-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div class="pda-dashboard__notification">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span class="pda-dashboard__notif-badge">2</span>
          </div>
        </div>
      </div>

      <!-- Menü rács -->
      <div class="pda-scroll pda-dashboard__scroll">
        <div class="pda-dashboard__grid">
          ${allItems.map(item => item.empty ? `
            <div class="pda-menu-card pda-menu-card--empty">
               <div class="pda-menu-card__content"></div>
               <svg class="pda-menu-card__arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          ` : `
            <div
              class="pda-menu-card ${item.active ? '' : 'pda-menu-card--disabled'}"
              data-module="${item.id}"
              title="${item.active ? item.desc : 'Hamarosan elérhető'}"
            >
              <div class="pda-menu-card__icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${item.icon}"></path></svg>
              </div>
              <div class="pda-menu-card__content">
                <div class="pda-menu-card__label">${item.label}</div>
                <div class="pda-menu-card__desc">${item.desc}</div>
              </div>
              <svg class="pda-menu-card__arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Alsó navigáció -->
      <div class="pda-bottom-nav">
        <div class="pda-bottom-nav__item pda-bottom-nav__item--active">
          <svg class="pda-bottom-nav__icon" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span class="pda-bottom-nav__label">Főoldal</span>
        </div>
        <div class="pda-bottom-nav__item">
          <svg class="pda-bottom-nav__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span class="pda-bottom-nav__label">Beállítások</span>
        </div>
        <div class="pda-bottom-nav__cta">
          <button class="pda-bottom-nav__cta-btn" id="pda-logout-btn" title="Kijelentkezés">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
          <span class="pda-bottom-nav__label" style="color:var(--clr-primary); margin-top:2px;">Kijelentkezés</span>
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
