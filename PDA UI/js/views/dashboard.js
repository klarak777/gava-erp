/**
 * dashboard.js – PDA főmenü képernyő
 */
import { showView, clearAuth, appState } from '../app.js';

const MENU_ITEMS = [
  {
    id: 'incoming',
    label: 'Bevételezés',
    desc: 'Áru beérkeztetése',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12v9"></path><path d="M12 12L3 7"></path><path d="M12 12l9-5"></path><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><path d="M12 2v6"></path><path d="M9 5l3 3 3-3"></path></svg>',
    active: false
  },
  {
    id: 'outgoing',
    label: 'Kiadás',
    desc: 'Áru kiadása',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12v9"></path><path d="M12 12L3 7"></path><path d="M12 12l9-5"></path><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><path d="M12 12V6"></path><path d="M9 9l3-3 3 3"></path></svg>',
    active: false
  },
  {
    id: 'commission',
    label: 'Komissió',
    desc: 'Megrendelések összekészítése',
    iconSvg: '<svg viewBox="0 0 612 612" fill="currentColor"><path d="M61.246,411.197c-31.376,0-56.811,25.434-56.811,56.809c0,31.377,25.436,56.811,56.811,56.811c31.375,0,56.81-25.434,56.81-56.811C118.056,436.631,92.621,411.197,61.246,411.197z M61.246,496.412c-15.688,0-28.405-12.717-28.405-28.404s12.718-28.406,28.405-28.406c15.687,0,28.405,12.719,28.405,28.406S76.934,496.412,61.246,496.412z M498.347,356.172l-77.277,47.848c-1.429-3.311-2.235-6.951-2.235-10.785v-75.26c0-3.486,0.715-6.791,1.907-9.855L498.347,356.172z M430.615,295.559c4.404-3.051,9.732-4.861,15.495-4.861h138.614c4.91,0,9.454,1.401,13.435,3.673l-84.731,52.463L430.615,295.559z M528.508,356.172l80.717-49.979c1.725,3.58,2.775,7.543,2.775,11.783v75.258c0,4.584-1.238,8.838-3.236,12.631L528.508,356.172z M404.942,434.277h144.623v28.924h-138.62c-1.62-24.09-15.225-44.896-34.927-56.537v-0.051c0.116,0.068,0.246,0.117,0.361,0.186l-0.361-0.713V116.107h28.924V434.277z M597.182,417.367c-3.75,1.941-7.943,3.143-12.458,3.143H446.109c-5.375,0-10.354-1.607-14.578-4.293l81.896-50.709L597.182,417.367z M498.347,210.854l-77.277,47.849c-1.429-3.311-2.235-6.952-2.235-10.786v-75.259c0-3.486,0.715-6.791,1.907-9.855L498.347,210.854z M430.615,150.242c4.404-3.051,9.732-4.86,15.495-4.86h138.614c4.91,0,9.454,1.4,13.435,3.672l-84.731,52.463L430.615,150.242z M528.508,210.854l80.717-49.978c1.725,3.58,2.775,7.542,2.775,11.782v75.259c0,4.584-1.238,8.838-3.236,12.629L528.508,210.854z M597.182,272.05c-3.75,1.941-7.943,3.143-12.458,3.143H446.109c-5.375,0-10.354-1.609-14.578-4.294l81.896-50.708L597.182,272.05z M226.38,110.95c-7.392-14.579-22.35-23.766-38.697-23.766H94.005c-15.975,0-28.925,12.95-28.925,28.925v151.854H36.155C16.188,267.961,0,284.148,0,304.116v127.485c12.438-20.898,35.216-34.855,61.248-34.855c37.674,0,68.624,29.359,71.154,66.455H268.78c2.531-37.096,33.408-66.455,71.154-66.455c13.16,0,25.529,3.631,36.084,9.867v-0.529L226.38,110.95z M281.146,326.1H117.578c-4.05,0-7.23-3.254-7.23-7.23V139.103c0-3.977,3.182-7.23,7.23-7.23h71.226c2.748,0,5.207,1.519,6.436,3.904l92.342,179.767C290.04,320.387,286.569,326.1,281.146,326.1z M339.915,411.197c-31.376,0-56.811,25.434-56.811,56.809c0,31.377,25.436,56.811,56.811,56.811s56.811-25.434,56.811-56.811C396.726,436.631,371.29,411.197,339.915,411.197z M339.915,496.412c-15.688,0-28.405-12.717-28.405-28.404s12.718-28.406,28.405-28.406c15.687,0,28.405,12.719,28.405,28.406S355.603,496.412,339.915,496.412z"/></svg>',
    active: true
  },
  {
    id: 'transfer',
    label: 'Áttárolás',
    desc: 'Áru áttárolása',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16"></path><path d="M16 5l4 4-4 4"></path><path d="M20 15H4"></path><path d="M8 19l-4-4 4-4"></path></svg>',
    active: false
  },
  {
    id: 'return',
    label: 'Visszáru',
    desc: 'Visszáru kezelés',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"></path></svg>',
    active: false
  },
  {
    id: 'packing',
    label: 'Csomagolás',
    desc: 'Csomagolási feladatok',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><path d="M3.27 6.96L12 12.01l8.73-5.05"></path><path d="M12 22.08V12"></path></svg>',
    active: false
  },
];

export function renderDashboard(container) {
  const user = appState.user;
  const userName = user?.name || 'Felhasználó';

  // Fill up to 10 slots
  const allItems = [...MENU_ITEMS];
  while (allItems.length < 10) {
    allItems.push({ id: `empty_${allItems.length}`, label: '', desc: '', iconSvg: '', empty: true });
  }

  container.innerHTML = `
    <div class="pda-view pda-dashboard">
      <!-- Fejléc -->
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 12.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">Gava Hungria Kft.</div>
            <div class="pda-dashboard__role" style="font-size: 7.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; line-height: 1;">FELHASZNÁLÓ</div>
            <div class="pda-dashboard__name" style="font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px; margin-top: 1px; line-height: 1.15;">${escHtml(userName)}</div>
          </div>
        </div>
        
        <div class="pda-dashboard__header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
          <!-- Értesítés harang ikon (felül a jobb sarokban) -->
          <div class="pda-dashboard__notifications" style="position: relative; color: #6366f1; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; margin-right: 2px;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
            <span style="position: absolute; top: -2px; right: -2px; background: #6366f1; color: white; font-size: 7.5px; font-weight: 800; border-radius: 50%; width: 13px; height: 13px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #f8f9fc;">2</span>
          </div>

          <!-- Raktár / Terület kártya (a harang alatt) -->
          <div class="pda-dashboard__location" style="display: flex; align-items: center; background: #fff; border-radius: 6px; padding: 3px 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; gap: 4px;">
            <div style="color: #6366f1; display: flex; align-items: center; flex-shrink: 0;">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0px;">
              <div style="font-size: 6.5px; color: #64748b; font-weight: 700; text-transform: uppercase; line-height: 1; letter-spacing: 0.2px;">RAKTÁR / TERÜLET</div>
              <div style="font-size: 9.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 2px; line-height: 1.15; white-space: nowrap;">
                Központi raktár
                <svg width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
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
                ${item.iconSvg}
              </div>
              <div class="pda-menu-card__content">
                <div class="pda-menu-card__label">${item.label}</div>
              </div>
              <svg class="pda-menu-card__arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Alsó navigáció -->
      <div class="pda-bottom-nav">
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
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
