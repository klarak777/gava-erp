/**
 * commission.js – PDA Komissió modul
 * Listázza az ALDI kamionokat, amelyek PDA-ra lettek jelölve (sent_to_pda = true).
 */
import { showView, apiFetch } from '../app.js';

export async function renderCommission(container) {
  container.innerHTML = `
    <div class="pda-view" style="display:flex;flex-direction:column;height:100%;">
      <!-- Fejléc -->
      <div class="pda-header">
        <div>
          <button id="pda-commission-back" style="
            background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0;margin-right:8px;
          ">←</button>
          <span class="pda-header__title">Komissió feladatok</span>
        </div>
        <div>
          <button id="pda-commission-refresh" style="
            background:none;border:1px solid rgba(255,255,255,0.4);border-radius:8px;
            color:#fff;font-size:16px;cursor:pointer;padding:3px 9px;
          ">↺</button>
        </div>
      </div>

      <!-- Lista -->
      <div class="pda-scroll" id="pda-commission-list" style="flex:1;overflow-y:auto;">
        <div class="pda-spinner">⏳ Betöltés...</div>
      </div>

      <!-- Alsó nav -->
      <div class="pda-bottom-nav">
        <div class="pda-bottom-nav__item" id="pda-comm-home">
          <span class="pda-bottom-nav__icon">🏠</span>
          <span class="pda-bottom-nav__label">Főoldal</span>
        </div>
        <div class="pda-bottom-nav__cta">
          <button class="pda-bottom-nav__cta-btn" id="pda-comm-refresh-btn" title="Frissítés">↺</button>
        </div>
        <div class="pda-bottom-nav__item">
          <span class="pda-bottom-nav__icon">⚙️</span>
          <span class="pda-bottom-nav__label">Beállítások</span>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#pda-commission-back')?.addEventListener('click', () => showView('dashboard'));
  container.querySelector('#pda-comm-home')?.addEventListener('click', () => showView('dashboard'));
  container.querySelector('#pda-comm-refresh-btn')?.addEventListener('click', () => loadTasks());
  container.querySelector('#pda-commission-refresh')?.addEventListener('click', () => loadTasks());

  const listEl = container.querySelector('#pda-commission-list');

  async function loadTasks() {
    listEl.innerHTML = '<div class="pda-spinner">⏳ Betöltés...</div>';
    try {
      const res = await apiFetch('/api/v1/pda/commission-tasks');
      if (!res.ok) throw new Error('API hiba: ' + res.status);
      const tasks = await res.json();
      renderTasks(tasks);
    } catch (err) {
      listEl.innerHTML = `
        <div class="pda-empty">
          ⚠️ Nem sikerült betölteni a feladatokat.<br>
          <small style="color:#94a3b8;">${err.message}</small>
        </div>
      `;
    }
  }

  function renderTasks(tasks) {
    if (!tasks || tasks.length === 0) {
      listEl.innerHTML = `
        <div class="pda-empty">
          ✅ Nincs aktív komissió feladat.<br>
          <small style="color:#94a3b8;">Az asztali ERP-ből jelölhetsz kamionokat PDA-ra.</small>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="pda-section-header">AKTÍV FELADATOK (${tasks.length})</div>
      <div class="pda-list">
        ${tasks.map(t => {
          const date = t.delivery_date ? String(t.delivery_date).substring(0, 10) : '-';
          const status = t.preparation_status || 0;
          const badgeClass = status >= 100 ? 'pda-badge--done' : (status > 0 ? 'pda-badge--active' : 'pda-badge--pending');
          const badgeLabel = status >= 100 ? '✅ Kész' : (status > 0 ? `🔄 ${status}%` : '⏳ Várakozik');
          return `
            <div class="pda-list-card" data-truck-id="${t.id}">
              <div class="pda-list-card__title">🚛 ${escHtml(t.truck_number || 'Ismeretlen kamion')}</div>
              <div class="pda-list-card__sub">
                📅 Szállítás: ${date} &nbsp;|&nbsp; 🏢 ${escHtml(t.transporter || '-')}
              </div>
              <span class="pda-badge ${badgeClass}">${badgeLabel}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  loadTasks();
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
