import { renderPalletFlow, renderAllowedRows } from '../components/palletFlow.js?v=3';
/**
 * commission.js – PDA Komissió modul
 */
import { showView, apiFetch, appState } from '../app.js';

export async function renderCommission(container, params = {}) {
  const user = appState.user;
  const userName = user?.name || 'Felhasználó';
  const escHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };

  // SSCC esetén a vonalkódolvasó adhat GS1-előtagot, szóközt vagy sortörést.
  // Az SSCC maga numerikus, ezért a kliens és a szerver ugyanazt a normalizált
  // értéket hasonlítja össze.
  const normalizeSscc = (value) => {
    const raw = String(value ?? '').trim().replace(/^\]C1/i, '').replace(/^\(00\)/, '');
    const digits = raw.replace(/\D/g, '');
    return digits.length > 18 ? digits.slice(-18) : digits;
  };

  container.innerHTML = `
    <style>
      .pda-comm-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 9px;
      }
      .pda-comm-badge--normal {
        background: #dcfce7;
        color: #166534;
      }
      .pda-comm-badge--gyartas {
        background: #fee2e2;
        color: #991b1b;
      }
      .pda-comm-badge--pakolas {
        background: #fef9c3;
        color: #854d0e;
      }
      .pda-comm-header {
        background: #f8fafc;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #e2e8f0;
      }
      .pda-comm-back {
        background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; padding: 0 16px 0 0;
      }
      .pda-comm-title {
        font-size: 16px; font-weight: 700; color: #1e293b;
      }
      .pda-comm-controls {
        padding: 10px 12px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pda-comm-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--clr-text);
        white-space: nowrap;
      }
      .pda-comm-select {
        width: 110px;
        flex: 0 0 110px;
        padding: 5px 8px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 12px;
        background: #fff;
        color: var(--clr-text);
      }
      .pda-btn-osszeemeles {
        background: #ffffff;
        color: #334155;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        transition: all 0.15s ease;
      }
      .pda-btn-osszeemeles:active {
        background: #f1f5f9;
        transform: scale(0.98);
      }
      .pda-comm-table-wrap {
        flex: 1;
        overflow: auto;
        padding: 4px;
        background: #fff;
      }
      .pda-comm-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .pda-comm-table th {
        text-align: left;
        padding: 8px 4px;
        border-bottom: 2px solid #e2e8f0;
        background: #eef2ff;
        color: #312e81;
        font-weight: 700;
        white-space: nowrap;
        font-size: 10px;
        line-height: 1.3;
      }
      .pda-comm-table th.th-centered {
        text-align: center;
      }
      .pda-comm-table td {
        padding: 8px 4px;
        border-bottom: 1px solid #f1f5f9;
        color: var(--clr-text);
        font-weight: 500;
        white-space: nowrap;
        vertical-align: top;
      }
      .pda-comm-carton-box {
        display: inline-block;
        padding: 2px 6px;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        background: #f8fafc;
        font-weight: 700;
        color: #0f172a;
      }
      .pda-comm-truck-badge {
        display: inline-block;
        padding: 1px 5px;
        border-radius: 4px;
        background: #dbeafe;
        color: #1d4ed8;
        font-weight: 600;
        font-size: 9px;
      }
      .pda-comm-row {
        cursor: pointer;
        transition: background 0.1s;
      }
      .pda-comm-row:active {
        background: #f1f5f9;
      }
      .pda-input-error {
        border: 2px solid #ef4444 !important;
        background: #fef2f2 !important;
        color: #991b1b !important;
      }
      .pda-form-error-msg {
        color: #dc2626;
        font-size: 12px;
        font-weight: 600;
        background: #fef2f2;
        border: 1px solid #fca5a5;
        border-radius: 6px;
        padding: 8px 10px;
        text-align: center;
        display: none;
        margin-top: 4px;
      }
      .pda-form-error-msg.visible {
        display: block;
      }
      .pda-comm-row.picked {
        background: #f0fdf4;
      }
      
      .pda-form-group {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 12px;
        gap: 8px;
      }
      .pda-form-group label {
        font-size: 12px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 0;
        flex: 1;
        text-align: left;
        line-height: 1.2;
      }
      .pda-form-group input, .pda-form-group select {
        width: 50%;
        max-width: 160px;
        padding: 10px 10px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 14px;
        background: #fff;
        color: #0f172a;
        text-align: center;
      }
      .pda-form-group input::-webkit-outer-spin-button,
      .pda-form-group input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .pda-form-group input[type=number] {
        -moz-appearance: textfield;
        appearance: textfield;
      }
      .pda-form-group input[readonly] {
        background: #f1f5f9;
        color: #475569;
      }
      .pda-form-footer {
        padding: 16px;
        display: flex;
        gap: 12px;
        background: #fff;
        border-top: 1px solid #e2e8f0;
      }
      .pda-btn {
        flex: 1;
        padding: 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 15px;
        border: none;
        cursor: pointer;
        text-align: center;
      }
      .pda-btn-primary {
        background: #0ea5e9;
        color: #fff;
      }
      .pda-btn-default {
        background: #e2e8f0;
        color: #475569;
      }
    </style>

    <!-- LISTA NÉZET -->
    <div class="pda-pane active" id="pane-list">
      
      <!-- Fejléc (Dashboard stílus) -->
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <!-- Left Block -->
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 13.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">Komissiózás</div>
            <div class="pda-dashboard__role" style="font-size: 7.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; line-height: 1;">FELHASZNÁLÓ</div>
            <div class="pda-dashboard__name" style="font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px; margin-top: 1px; line-height: 1.15;">${escHtml(userName)}</div>
          </div>
        </div>
        
        <!-- Right Block -->
        <div class="pda-dashboard__header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
          
          <!-- Értesítés harang ikon (felül a jobb sarokban) -->
          <div class="pda-dashboard__notifications" style="position: relative; color: #6366f1; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; margin-right: 2px;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
            <span style="position: absolute; top: -2px; right: -2px; background: #6366f1; color: white; font-size: 7.5px; font-weight: 800; border-radius: 50%; width: 13px; height: 13px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #f8f9fc;">2</span>
          </div>

          <!-- Bottom Right: KOMISSIÓZANDÓ TÉTELEK -->
          <div class="pda-dashboard__location" style="display: flex; flex-direction: column; align-items: center; background: #fff; border-radius: 6px; padding: 3px 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; gap: 2px;">
            <div style="font-size: 6px; color: #64748b; font-weight: 700; text-transform: uppercase; line-height: 1; letter-spacing: 0.2px;">KOMISSIÓZANDÓ TÉTELEK</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <!-- Tétel db -->
              <div style="display: flex; align-items: center; gap: 2px; color: #0f172a; font-size: 10px; font-weight: 700;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #6366f1;"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="M3.27 6.96L12 12.01l8.73-5.05"></path><path d="M12 22.08V12"></path></svg>
                <span id="hdr-total-items">0</span>
              </div>
              <!-- Karton db -->
              <div style="display: flex; align-items: center; gap: 2px; color: #0f172a; font-size: 10px; font-weight: 700;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #6366f1;"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="M3.27 6.96L12 12.01l8.73-5.05"></path><path d="M12 22.08V12"></path><path d="m7.5 4.21 4.5 2.6 4.5-2.6"></path><path d="m7.5 19.79 4.5-2.6 4.5 2.6"></path><path d="m3.27 17.04 4.23-2.45"></path><path d="m20.73 17.04-4.23-2.45"></path></svg>
                <span id="hdr-total-cartons">0</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <div class="pda-comm-controls">
        <label class="pda-comm-label">Terület</label>
        <select class="pda-comm-select" id="pda-terulet-select">
          <option value="penny">Penny</option>
          <option value="spar">Spar</option>
          <option value="tesco">Tesco</option>
          <option value="aldi" selected>Aldi</option>
          <option value="crossdocking">Crossdocking</option>
        </select>
        <button id="pda-btn-osszeemeles" class="pda-btn-osszeemeles">Összeemelés</button>
      </div>
      <div class="pda-comm-table-wrap">
        <table class="pda-comm-table">
          <thead>
            <tr>
              <th style="width: 14%; padding-right: 1px; padding-left: 2px;">Komissió<br>típusa</th>
              <th style="width: 34%; padding-left: 1px; padding-right: 2px;">
                <div style="font-weight:700;">Termék</div>
                <div style="font-size: 8px; font-weight: 700;">Karton</div>
              </th>
              <th class="th-centered" style="width: 52%; padding-left: 2px; padding-right: 2px;">
                <div style="font-weight:700;">Partner</div>
                <div style="font-size: 8px; font-weight: 700;">Cél raktár</div>
              </th>
            </tr>
          </thead>
          <tbody id="pda-comm-tbody">
            <tr><td colspan="3" style="text-align:center; padding: 20px; color: #94a3b8;">Betöltés...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Alsó navigáció -->
      <div class="pda-bottom-nav">
        <div class="pda-bottom-nav__item" id="pda-nav-back" style="cursor: pointer;">
          <svg class="pda-bottom-nav__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span class="pda-bottom-nav__label">Vissza</span>
        </div>
        <div class="pda-bottom-nav__item" id="pda-nav-home" style="cursor: pointer;">
          <svg class="pda-bottom-nav__icon" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span class="pda-bottom-nav__label">Főoldal</span>
        </div>
      </div>
    </div>

    <!-- ŰRLAP NÉZET (1. Lépés: Komissió Adatlap) -->
    <div class="pda-pane" id="pane-form">
      
      <!-- Fejléc (Dashboard / Komissió stílus - csak össz. karton számmal) -->
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <!-- Left Block -->
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 13.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">Komissiózás</div>
            <div class="pda-dashboard__role" style="font-size: 7.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; line-height: 1;">FELHASZNÁLÓ</div>
            <div class="pda-dashboard__name" style="font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px; margin-top: 1px; line-height: 1.15;">${escHtml(userName)}</div>
          </div>
        </div>
        
        <!-- Right Block -->
        <div class="pda-dashboard__header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
          
          <!-- Értesítés harang ikon (felül a jobb sarokban) -->
          <div class="pda-dashboard__notifications" style="position: relative; color: #6366f1; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; margin-right: 2px;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
            <span style="position: absolute; top: -2px; right: -2px; background: #6366f1; color: white; font-size: 7.5px; font-weight: 800; border-radius: 50%; width: 13px; height: 13px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #f8f9fc;">2</span>
          </div>

          <!-- Bottom Right: ÖSSZ. KARTON KÁRTYA -->
          <div class="pda-dashboard__location" style="display: flex; flex-direction: column; align-items: center; background: #fff; border-radius: 6px; padding: 3px 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; gap: 2px;">
            <div style="font-size: 6px; color: #64748b; font-weight: 700; text-transform: uppercase; line-height: 1; letter-spacing: 0.2px;">KOMISSIÓZANDÓ KARTONOK</div>
            <div style="display: flex; align-items: center; gap: 4px; color: #0f172a; font-size: 10px; font-weight: 700;">
              <!-- Karton db -->
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #6366f1;"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="M3.27 6.96L12 12.01l8.73-5.05"></path><path d="M12 22.08V12"></path><path d="m7.5 4.21 4.5 2.6 4.5-2.6"></path><path d="m7.5 19.79 4.5-2.6 4.5 2.6"></path><path d="m3.27 17.04 4.23-2.45"></path><path d="m20.73 17.04-4.23-2.45"></path></svg>
              <span id="form-hdr-total-cartons">0</span>
            </div>
          </div>
          
        </div>
      </div>

      <div class="pda-form-title" id="form-title" style="padding: 10px 14px; font-size: 15px;">Termék név</div>
      <div class="pda-form-body">
        <div class="pda-form-group">
          <label id="form-karton-label">Kartonszám <span style="color:red;">*</span></label>
          <input type="number" id="form-karton" min="1" required />
          <div class="pda-form-error-msg" id="form-karton-error">⛔ A megadott mennyiség több mint a rendelt kartonszám!</div>
        </div>
        <div class="pda-form-group">
          <label>Bruttó kg <span style="color:red;">*</span></label>
          <input type="number" step="0.01" id="form-brutto" required />
        </div>
        <div class="pda-form-group">
          <label>Göngyöleg típus <span style="color:red;">*</span></label>
          <select id="form-gongyoleg" required></select>
        </div>
        <div class="pda-form-group">
          <label>Göngyöleg tára (/un) <span style="color:red;">*</span></label>
          <input type="number" step="0.001" id="form-tara" readonly required />
        </div>
        <div class="pda-form-group">
          <label>Származási ország <span style="color:red;">*</span></label>
          <select id="form-orszag" required></select>
        </div>
        <div class="pda-form-group">
          <label>Lot szám <span style="color:red;">*</span></label>
          <input type="text" id="form-lot" required />
        </div>
        <div class="pda-form-group">
          <label>Raklap típus <span style="color:red;">*</span></label>
          <!-- Már hozzáadott raklapok listája -->
          <div id="form-raklap-list" style="display:none; margin-bottom:8px;"></div>
          <div style="display:flex; gap:6px; align-items:center;">
            <select id="form-raklap" required style="flex:1;"></select>
            <button type="button" id="form-raklap-add-btn" style="flex-shrink:0; padding:8px 10px; background:#0ea5e9; color:#fff; border:none; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap;">+ Raklap</button>
          </div>
          <div id="form-raklap-error" style="display:none; color:#ef4444; font-size:11.5px; font-weight:700; margin-top:5px; line-height:1.3;"></div>
        </div>
      </div>
      <div class="pda-form-footer">
        <button class="pda-btn pda-btn-primary" id="form-submit">Megadás</button>
      </div>

      <!-- Alsó navigáció -->
      <div class="pda-bottom-nav">
        <div class="pda-bottom-nav__item pda-nav-back-btn" id="pda-form-nav-back" style="cursor: pointer;">
          <svg class="pda-bottom-nav__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span class="pda-bottom-nav__label">Vissza</span>
        </div>
        <div class="pda-bottom-nav__item pda-nav-home-btn" id="pda-form-nav-home" style="cursor: pointer;">
          <svg class="pda-bottom-nav__icon" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span class="pda-bottom-nav__label">Főoldal</span>
        </div>
      </div>
    </div>

    ${renderPalletFlow({ userName })}
  `;

  let currentDestBarcode = null;

  // Panes
  const paneList = container.querySelector('#pane-list');
  const paneForm = container.querySelector('#pane-form');
  const panePrint = container.querySelector('#pane-print');
  const paneDest = container.querySelector('#pane-dest');
  const paneSscc = container.querySelector('#pane-sscc');

  function showPane(paneEl) {
    paneList.classList.remove('active');
    paneForm.classList.remove('active');
    panePrint.classList.remove('active');
    paneDest.classList.remove('active');
    paneSscc.classList.remove('active');
    paneEl.classList.add('active');
    if (paneEl === paneDest) {
      renderAllowedRowsBox();
    }
  }

  // Navigation events
  const deleteProvisionalLabel = async () => {
    if (currentLabel && currentLabel.id) {
      try {
        await apiFetch(`/api/v1/pda/provisional-label/${currentLabel.id}`, { method: 'DELETE' });
      } catch (e) { console.warn('Hiba az ideiglenes címke törlésekor', e); }
      currentLabel = null;
    }
  };

  const goDashboard = async () => { await deleteProvisionalLabel(); lastPickPayload = null; showView('dashboard'); };
  const goList = async () => { await deleteProvisionalLabel(); lastPickPayload = null; showPane(paneList); };

  container.querySelector('#pda-btn-osszeemeles')?.addEventListener('click', () => {
    showView('consolidation');
  });

  const hwBackHandler = async () => {
    if (paneForm.classList.contains('active')) {
      await goList();
    } else if (paneList.classList.contains('active')) {
      await goDashboard();
    } else if (panePrint.classList.contains('active')) {
      await deleteProvisionalLabel();
      showPane(paneForm);
    } else if (paneDest.classList.contains('active')) {
      showPane(panePrint);
    } else if (paneSscc.classList.contains('active')) {
      showPane(paneDest);
    }
  };

  container.querySelectorAll('.pda-nav-back-btn, #pda-nav-back, #pda-form-back').forEach(btn => {
    btn.addEventListener('click', hwBackHandler);
  });
  container.querySelectorAll('.pda-nav-home-btn, #pda-nav-home').forEach(btn => {
    btn.addEventListener('click', goDashboard);
  });
  // Nézetváltáskor a showView eltávolítja a hardvergomb eseménykezelőjét.
  if (window._currentHwBack) {
    window.removeEventListener('hwBack', window._currentHwBack);
  }
  window._currentHwBack = hwBackHandler;
  window.addEventListener('hwBack', hwBackHandler);

  const select = container.querySelector('#pda-terulet-select');
  const tbody = container.querySelector('#pda-comm-tbody');

  let currentLineId = null;
  let currentDestination = '';
  let currentRemaining = 0;
  let currentRowEl = null;
  let lastPickedQuantity = 0;
  let lastPickPayload = {}; // A "Megadás" képernyőn megadott adatok ideiglenes tárolása
  let currentLabel = null; // A generált raklapcimke adatai
  let currentTargetLocations = []; // A kamion fejlécén megadott engedélyezett sorok
  let lines = []; // Az aktuális komissió sorok (a kamionszám kiirásához)

  // Dictionaries
  let packagingTypes = [];
  let originCountries = [];
  let palletTypes = [];

  async function loadDictionaries() {
    try {
      const [packRes, origRes] = await Promise.all([
        apiFetch('/api/v1/pda/packaging-types'),
        apiFetch('/api/v1/pda/origin-countries')
      ]);

      let allPackagings = [];
      if (packRes.ok) allPackagings = await packRes.json();
      if (origRes.ok) originCountries = await origRes.json();

      // A meglévő törzsben a Raklap a Fajta mezőben szerepel (például Raklap / EU).
      const isPallet = p => [p.name, p.category].some(value => String(value || '').toLowerCase().includes('raklap'));
      palletTypes = allPackagings.filter(isPallet);
      packagingTypes = allPackagings.filter(p => !isPallet(p));

      const renderOpts = (items, val, text) => '<option value="">Válassz...</option>' + items.map(i => `<option value="${i[val]}">${i[text]}</option>`).join('');

      const gongyolegSel = container.querySelector('#form-gongyoleg');
      gongyolegSel.innerHTML = '<option value="">Válassz...</option>' + packagingTypes.map(p =>
        `<option value="${p.name}" data-tare="${p.tare_weight_kg || 0}">${p.category ? p.category + ' ' : ''}${p.name}</option>`
      ).join('');

      container.querySelector('#form-orszag').innerHTML = renderOpts(originCountries, 'name', 'name');

      const raklapSel = container.querySelector('#form-raklap');
      // ID-t (p.id) használunk value-ként a raklapoknál, hogy a backend ki tudja olvasni a súlyát
      raklapSel.innerHTML = '<option value="">Válassz...</option>' + palletTypes.map(p =>
        `<option value="${p.id}">${p.category ? p.category + ' ' : ''}${p.name}</option>`
      ).join('');
    } catch (e) {
      console.warn('Szótárak betöltése sikertelen', e);
    }
  }

  function getBadgeHtml(type) {
    const normT = (type || 'Normál').toLowerCase();
    if (normT.includes('gyártás') || normT.includes('gyartas')) {
      return `<span class="pda-comm-badge pda-comm-badge--gyartas">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        Gyártás
      </span>`;
    } else if (normT.includes('pakolás') || normT.includes('pakolas')) {
      return `<span class="pda-comm-badge pda-comm-badge--pakolas">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.21 4.5 2.6 4.5-2.6"></path><path d="m7.5 19.79 4.5-2.6 4.5 2.6"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.27 17.04 4.23-2.45"></path><path d="m20.73 17.04-4.23-2.45"></path><path d="M12 22.08V12"></path></svg>
        Pakolás
      </span>`;
    }
    return `<span class="pda-comm-badge pda-comm-badge--normal">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="M3.27 6.96L12 12.01l8.73-5.05"></path><path d="M12 22.08V12"></path></svg>
      Normál
    </span>`;
  }

  // Auto kalkuláció
  const gongyolegSel = container.querySelector('#form-gongyoleg');
  const kartonInput = container.querySelector('#form-karton');
  const taraInput = container.querySelector('#form-tara');
  const kartonError = container.querySelector('#form-karton-error');
  const kartonLabel = container.querySelector('#form-karton-label');
  const submitBtn = container.querySelector('#form-submit');

  // Szám beviteli mezők léptetésének tiltása (le/fel nyilak és egérgörgő tiltása) - csak kézi gépelés engedélyezett
  container.querySelectorAll('input[type="number"]').forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
    });
    inp.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });
  });

  // true, ha a kiválasztott göngyöleg típushoz NINCS tára súly megadva (admin: Göngyöleg Típusok)
  // → ilyenkor a rendszer nem számol automatikusan, a felhasználó adja meg kézzel.
  let taraManual = false;

  // Már hozzáadott raklapok tömbje: [{id, name, tare_weight_kg}, ...]
  let addedPallets = [];

  function renderAddedPalletsList() {
    const listDiv = container.querySelector('#form-raklap-list');
    if (!listDiv) return;
    if (addedPallets.length === 0) {
      listDiv.style.display = 'none';
      listDiv.innerHTML = '';
      return;
    }
    listDiv.style.display = 'block';
    listDiv.innerHTML = addedPallets.map((p, idx) => `
      <div style="display:flex; align-items:center; justify-content:space-between; background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:5px 8px; margin-bottom:4px; font-size:12px;">
        <span style="font-weight:700; color:#0369a1;">🪵 ${escHtml(p.name)} <span style="color:#64748b; font-weight:500;">(tára: ${p.tare_weight_kg.toFixed(1)} kg)</span></span>
        <button type="button" data-idx="${idx}" class="raklap-remove-btn" style="background:none; border:none; cursor:pointer; color:#ef4444; font-size:14px; font-weight:700; padding:0 4px; line-height:1;">✕</button>
      </div>
    `).join('');
    listDiv.querySelectorAll('.raklap-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        addedPallets.splice(idx, 1);
        renderAddedPalletsList();
      });
    });
  }

  function validateCartonInput() {
    const val = parseInt(kartonInput.value);
    if (currentRemaining > 0 && Number.isInteger(val) && val > currentRemaining) {
      kartonInput.classList.add('pda-input-error');
      kartonError.classList.add('visible');
      kartonError.textContent = `⛔ A megadott mennyiség (${val} db) több mint a rendelt kartonszám (${currentRemaining} db)!`;
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    } else {
      kartonInput.classList.remove('pda-input-error');
      kartonError.classList.remove('visible');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }

  function updateTara() {
    const selectedOption = gongyolegSel.options[gongyolegSel.selectedIndex];
    if (selectedOption && selectedOption.value) {
      const tareKg = parseFloat(selectedOption.getAttribute('data-tare')) || 0;
      if (tareKg > 0) {
        taraManual = false;
        taraInput.readOnly = true;
        taraInput.value = (tareKg).toFixed(3);
      } else {
        // Nincs tára súly a típushoz → kézi bevitel, üres mező, nem írjuk felül
        taraManual = true;
        taraInput.readOnly = false;
        taraInput.value = '';
      }
    } else {
      taraManual = false;
      taraInput.readOnly = true;
      taraInput.value = '';
    }
  }
  gongyolegSel.addEventListener('change', updateTara);
  kartonInput.addEventListener('input', () => {
    if (!taraManual) updateTara(); // Kézi tára esetén a kartonszám nem írja felül
    validateCartonInput();
  });

  const raklapSel = container.querySelector('#form-raklap');
  const raklapError = container.querySelector('#form-raklap-error');

  function validatePalletSelection() {
    if (!raklapSel.value) {
      if (raklapError) { raklapError.style.display = 'none'; raklapError.textContent = ''; }
      return true;
    }
    const selected = palletTypes.find(p => String(p.id) === String(raklapSel.value));
    if (selected && (!selected.tare_weight_kg || parseFloat(selected.tare_weight_kg) <= 0)) {
      if (raklapError) {
        raklapError.style.display = 'block';
        raklapError.textContent = `⚠️ Ennek a raklaptípusnak (${selected.name}) nincs megadva a tára súlya a törzsadatokban! Válassz másikat vagy pótold az Adminban.`;
      }
      return false;
    } else {
      if (raklapError) { raklapError.style.display = 'none'; raklapError.textContent = ''; }
      return true;
    }
  }

  raklapSel.addEventListener('change', validatePalletSelection);

  // + Raklap gomb: hozzáadja az aktuálisan kiválasztott raklapot a listához és üríti a select-et
  const raklapAddBtn = container.querySelector('#form-raklap-add-btn');
  if (raklapAddBtn) {
    raklapAddBtn.addEventListener('click', () => {
      if (!raklapSel.value) {
        if (raklapError) {
          raklapError.style.display = 'block';
          raklapError.textContent = '⚠️ Előbb válassz raklaptípust a hozzáadáshoz!';
        }
        return;
      }
      const selected = palletTypes.find(p => String(p.id) === String(raklapSel.value));
      if (!selected) return;
      if (!selected.tare_weight_kg || parseFloat(selected.tare_weight_kg) <= 0) {
        if (raklapError) {
          raklapError.style.display = 'block';
          raklapError.textContent = `⚠️ A(z) "${selected.name}" raklaptípusnak nincs tára súlya. Pótold az Adminban, vagy válassz másikat!`;
        }
        return;
      }
      // Hozzáadjuk a listához
      addedPallets.push({ id: selected.id, name: selected.name, tare_weight_kg: parseFloat(selected.tare_weight_kg) });
      renderAddedPalletsList();
      // Selectet ürítjük
      raklapSel.value = '';
      if (raklapError) { raklapError.style.display = 'none'; raklapError.textContent = ''; }
    });
  }

  async function loadData() {
    const area = select.value;
    if (area !== 'aldi' && area !== 'crossdocking') {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: #94a3b8;">Nincs komissiózandó feladat ehhez a területhez.</td></tr>';
      container.querySelector('#hdr-total-items').textContent = '0';
      container.querySelector('#hdr-total-cartons').textContent = '0';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">Adatok betöltése...</td></tr>';

    try {
      let url = '/api/v1/pda/commission-lines';
      if (params.truckId) {
        url += `?truck_id=${params.truckId}`;
      }
      const res = await apiFetch(url);
      if (res.ok) {
        lines = await res.json();
        if (!lines || lines.length === 0) {
          tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 24px; color: #94a3b8;">Nincs PDA-ra küldött aktív tétel.</td></tr>';
          container.querySelector('#hdr-total-items').textContent = '0';
          container.querySelector('#hdr-total-cartons').textContent = '0';
          const formCartonsEl = container.querySelector('#form-hdr-total-cartons');
          if (formCartonsEl) formCartonsEl.textContent = '0';
        } else {
          tbody.innerHTML = '';
          // Csak a még nem teljesen komissiózott sorok jelennek meg
          const pendingLines = lines.filter(row => !row.is_picked);

          if (pendingLines.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 24px; color: #16a34a; font-weight:700;">✔ Minden tétel komissiózva!</td></tr>';
            container.querySelector('#hdr-total-items').textContent = '0';
            container.querySelector('#hdr-total-cartons').textContent = '0';
            const formCartonsEl = container.querySelector('#form-hdr-total-cartons');
            if (formCartonsEl) formCartonsEl.textContent = '0';
          } else {
            // Összesítők kiszámolása a fejléc kártyához
            const totalItems = pendingLines.length;
            const totalCartons = pendingLines.reduce((sum, row) => {
              const ordered = parseInt(row.kartonszam) || 0;
              const commissioned = parseInt(row.komissziozott_kartonszam) || 0;
              return sum + Math.max(0, ordered - commissioned);
            }, 0);

            container.querySelector('#hdr-total-items').textContent = totalItems;
            container.querySelector('#hdr-total-cartons').textContent = totalCartons;
            const formCartonsEl = container.querySelector('#form-hdr-total-cartons');
            if (formCartonsEl) formCartonsEl.textContent = totalCartons;

            pendingLines.forEach(row => {
              const tr = document.createElement('tr');
              tr.className = 'pda-comm-row';

              const ordered = row.kartonszam != null ? parseInt(row.kartonszam) : 0;
              const commissioned = row.komissziozott_kartonszam != null ? parseInt(row.komissziozott_kartonszam) : 0;
              const remaining = Math.max(0, ordered - commissioned);

              let targetStr = '-';
              if (row.target_locations && Array.isArray(row.target_locations) && row.target_locations.length > 0) {
                targetStr = row.target_locations.map(t => (t && typeof t === 'object') ? (t.name || '') : String(t)).filter(Boolean).join(', ');
              } else if (row.celraktar) {
                targetStr = row.celraktar;
              }

              tr.innerHTML = `
                <td style="padding-top: 10px; padding-left: 2px; padding-right: 1px;">
                  ${getBadgeHtml(row.tipus)}
                </td>
                <td style="padding-top: 10px; padding-left: 1px; padding-right: 2px;">
                  <div style="font-weight:700; font-size: 11px; color: #0f172a; margin-bottom: 2px; white-space: normal;">${row.termek || '-'}</div>
                  <div style="font-size: 14px; font-weight: 800; color: #0284c7;">${remaining}</div>
                </td>
                <td style="text-align: center; padding-top: 10px; padding-left: 2px; padding-right: 2px;">
                  <div style="font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 2px; white-space: normal; word-break: break-word;">${row.partner || '-'}</div>
                  <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${targetStr}</div>
                </td>
              `;

              tr.addEventListener('click', () => {
                openForm(row, tr);
              });
              tbody.appendChild(tr);
            });
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: #ef4444;">Hiba a betöltéskor (${res.status}: ${errData.error || res.statusText || 'Ismeretlen hiba'})</td></tr>`;
      }
    } catch (err) {
      console.error('PDA Commission fetch error:', err);
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: #ef4444;">Hálózati hiba: ${err.message || 'Kapcsolódás sikertelen'}</td></tr>`;
    }
  }

  function openForm(row, rowEl) {
    currentLineId = row.id;
    currentDestination = row.celraktar || '';
    currentRemaining = Math.max(0, (row.kartonszam || 0) - (row.komissziozott_kartonszam || 0));
    currentRowEl = rowEl || null;

    // Store target locations from truck header for this line
    let tl = row.target_locations;
    if (typeof tl === 'string') { try { tl = JSON.parse(tl); } catch { tl = []; } }
    currentTargetLocations = Array.isArray(tl) ? tl : [];

    const formCartonsEl = container.querySelector('#form-hdr-total-cartons');
    if (formCartonsEl) {
      formCartonsEl.textContent = currentRemaining;
    }

    container.querySelector('#form-title').innerText = row.termek || 'Termék';
    kartonLabel.innerHTML = ((row.plt != null && row.plt !== '') ? `Kartonszám (${row.plt} db/plt)` : `Kartonszám`) + ' <span style="color:red;">*</span>';
    kartonInput.value = ''; // A kartonszámot mindig a felhasználó adja meg, nincs előtöltés
    kartonInput.placeholder = '';
    kartonInput.max = currentRemaining;
    kartonInput.classList.remove('pda-input-error');
    kartonError.classList.remove('visible');
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    container.querySelector('#form-brutto').value = '';
    gongyolegSel.value = '';
    taraManual = false;
    taraInput.readOnly = true;
    taraInput.value = '';
    container.querySelector('#form-orszag').value = '';
    container.querySelector('#form-lot').value = '';
    container.querySelector('#form-raklap').value = '';
    addedPallets = [];
    renderAddedPalletsList();
    validatePalletSelection();
    container.querySelector('#print-printer-barcode').value = '';
    lastPickedQuantity = 0;
    currentLabel = null;

    showPane(paneForm);
  }

  function renderAllowedRowsBox() {
    const line = lines.find(l => l.id === currentLineId);
    renderAllowedRows(container, currentTargetLocations, line?.kamionszam || '');
  }

  submitBtn.addEventListener('click', async () => {
    if (!currentLineId) return;

    // 1. Kartonszám ellenőrzése
    const qty = parseInt(kartonInput.value);
    if (!kartonInput.value || !Number.isInteger(qty) || qty <= 0) {
      alert('Kérlek add meg a komissiózott kartonszámot (pozitív egész szám)!');
      kartonInput.focus();
      return;
    }
    // Hard block: qty > remaining
    if (currentRemaining > 0 && qty > currentRemaining) {
      kartonInput.classList.add('pda-input-error');
      kartonError.classList.add('visible');
      kartonError.textContent = `⛔ A rendelt karton mennyisége (${currentRemaining} db) kevesebb, mint a megadott mennyiség (${qty} db). Csökkentsd a mennyiséget!`;
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      kartonInput.focus();
      return;
    }

    // 2. Bruttó kg ellenőrzése
    const bruttoInput = container.querySelector('#form-brutto');
    const grossValue = Number(bruttoInput.value);
    if (!bruttoInput.value || !Number.isFinite(grossValue) || grossValue <= 0) {
      alert('Kérlek add meg a bruttó súlyt (pozitív szám)!');
      bruttoInput.focus();
      return;
    }

    // 3. Göngyöleg típus ellenőrzése
    if (!gongyolegSel.value) {
      alert('Kérlek válaszd ki a göngyöleg típust!');
      gongyolegSel.focus();
      return;
    }

    // 4. Göngyöleg tára ellenőrzése
    if (taraInput.value === '' || !Number.isFinite(Number(taraInput.value)) || Number(taraInput.value) < 0) {
      alert('Kérlek add meg a göngyöleg tára súlyát (nem negatív szám)!');
      taraInput.focus();
      return;
    }

    // 5. Származási ország ellenőrzése
    const orszagSel = container.querySelector('#form-orszag');
    if (!orszagSel.value) {
      alert('Kérlek válaszd ki a származási országot!');
      orszagSel.focus();
      return;
    }

    // 6. Lot szám ellenőrzése
    const lotInput = container.querySelector('#form-lot');
    if (!lotInput.value || !lotInput.value.trim()) {
      alert('Kérlek add meg a Lot számot!');
      lotInput.focus();
      return;
    }

    // 7. Raklap ellenőrzés: a listában lévő + az aktuális select összes raklapát ellenőrizzük
    // Gyűjtsük össze az összes raklap-ID-ta
    const allPalletIds = [...addedPallets.map(p => p.id)];
    const currentRaklapSel = container.querySelector('#form-raklap');
    if (currentRaklapSel.value) {
      // Az aktuálisan a selectben lévő raklap is számít
      allPalletIds.push(Number(currentRaklapSel.value));
    }

    if (allPalletIds.length === 0) {
      alert('Kérlek válassz legalább egy raklaptípust!');
      currentRaklapSel.focus();
      return;
    }

    // Minden raklap tárasúlyát ellenőrizzük
    const currentSelectPallet = currentRaklapSel.value
      ? palletTypes.find(p => String(p.id) === String(currentRaklapSel.value))
      : null;
    if (currentSelectPallet && (!currentSelectPallet.tare_weight_kg || parseFloat(currentSelectPallet.tare_weight_kg) <= 0)) {
      validatePalletSelection();
      alert(`Hiba! A kiválasztott raklaptípusnak (${currentSelectPallet.name}) nincs megadva a tára súlya a rendszerben. Kérlek válassz másikat, vagy állítsátok be az ADMIN felületen!`);
      currentRaklapSel.focus();
      return;
    }

    // Összes raklap tára súlyának összeszedése
    let totalPalletTareForCheck = 0;
    for (const pid of allPalletIds) {
      const p = palletTypes.find(pt => String(pt.id) === String(pid));
      if (p) totalPalletTareForCheck += parseFloat(p.tare_weight_kg) || 0;
    }

    const totalTare = (Number(taraInput.value) * qty) + totalPalletTareForCheck;
    if (grossValue < totalTare) {
      const palletNames = allPalletIds.map(pid => {
        const p = palletTypes.find(pt => String(pt.id) === String(pid));
        return p ? `${p.name} (${(parseFloat(p.tare_weight_kg)||0).toFixed(1)} kg)` : String(pid);
      }).join(', ');
      alert(`A bruttó súly (${grossValue} kg) kisebb, mint a göngyöleg és a raklap(ok) tára összege!\nRaklapok: ${palletNames}`);
      bruttoInput.focus();
      return;
    }

    // Tároljuk a form adatait
    lastPickedQuantity = qty;
    lastPickPayload = {
      picked_cartons: qty,
      gross_weight: grossValue,
      packaging_type: gongyolegSel.value,
      tare_weight: Number(taraInput.value),
      origin_country: orszagSel.value,
      lot_number: lotInput.value.trim(),
      pallet_types: allPalletIds,           // Tömb: összes raklap ID-ja
      pickSessionId: Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    };

    try {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      const areaVal = container.querySelector('#pda-terulet-select').value;
      const res = await apiFetch('/api/v1/pda/generate-pallet-label', {
        method: 'POST',
        body: JSON.stringify({
          lineId: currentLineId,
          pickedCartons: qty,
          originCountry: orszagSel.value,
          area: areaVal
        })
      });
      const data = await res.json();
      if (res.ok && data.label) {
        currentLabel = data.label;
        lastPickPayload.labelId = currentLabel.id; // Később átadjuk a pick-and-assign végpontnak
        renderLabelPreview(currentLabel);
        
        container.querySelector('#print-printer-barcode').value = '';
        showPane(panePrint);
        setTimeout(() => container.querySelector('#print-printer-barcode').focus(), 100);
      } else {
        alert(data.error || 'Hiba a címke generálásakor.');
      }
    } catch(err) {
      alert('Hálózati hiba a címke generálásakor.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });

  function renderLabelPreview(label) {
    // Előnézet eltávolítva a kérésnek megfelelően
    currentLabel = label;
  }





  // Zebra nyomtatás gomb / eseménykezelő -> Automatikus nyomtatás vonalkód beolvasásakor
  const printPrinterInput = container.querySelector('#print-printer-barcode');
  const printSubmitBtn = container.querySelector('#btn-print-submit');

  const submitPrinterBarcode = async () => {
    if (!printPrinterInput || printPrinterInput.disabled) return;

    const printerBarcode = printPrinterInput.value.trim();
    if (!printerBarcode) {
      alert('Kérlek add meg a nyomtató azonosítóját / vonalkódját!');
      if (printPrinterInput) printPrinterInput.focus();
      return;
    }

    try {
      printPrinterInput.disabled = true;
      if (printSubmitBtn) {
        printSubmitBtn.disabled = true;
        printSubmitBtn.style.opacity = '0.5';
      }

      // Hívjuk a nyomtatás végpontot
      const res = await apiFetch(`/api/v1/pda/print-pallet-label`, {
        method: 'POST',
        body: JSON.stringify({ 
          labelId: currentLabel?.id || null,
          commissionLineId: currentLineId,
          printerBarcode: printerBarcode,
          pickedCartons: lastPickedQuantity
        })
      });

      if (res.ok) {
        printPrinterInput.value = '';
    
        // Nyomtatás után átlépünk a Cél lokációra
        container.querySelector('#dest-title').textContent = currentDestination || 'Ismeretlen';
        const destInputEl = container.querySelector('#dest-vonalkod');
        if (destInputEl) destInputEl.value = '';
        showPane(paneDest);
        setTimeout(() => { if (destInputEl) destInputEl.focus(); }, 100);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Hiba a nyomtatás során!');
      }
    } catch (e) {
      alert('Hálózati hiba a nyomtatás során!');
    } finally {
      if (printPrinterInput) printPrinterInput.disabled = false;
      if (printSubmitBtn) {
        printSubmitBtn.disabled = false;
        printSubmitBtn.style.opacity = '1';
      }
    }
  };

  if (printPrinterInput) {
    printPrinterInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await submitPrinterBarcode();
      }
    });
    
    // Auto-továbbítás, ha a formátum megfelel az IP cím + 4 jegyű port mintának
    printPrinterInput.addEventListener('input', async (e) => {
      const val = printPrinterInput.value.trim();
      const ipPortRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{4}$/;
      if (ipPortRegex.test(val) && !printPrinterInput.disabled) {
        await submitPrinterBarcode();
      }
    });
  }

  if (printSubmitBtn) {
    printSubmitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await submitPrinterBarcode();
    });
  }

  // Cél lokáció vonalkód beolvasása (3. Lépés)
  const destInput = container.querySelector('#dest-vonalkod');
  const destSaveBtn = container.querySelector('#btn-dest-save');

  const saveDestination = async () => {
    const barcode = destInput ? destInput.value.trim() : '';
    if (!barcode) {
      alert('Kérjük, add meg vagy olvasd be a cél tárhely vonalkódját!');
      if (destInput) destInput.focus();
      return;
    }
    
    if (!currentLineId) {
      alert('Hiba: Nincs aktív komissiózás.');
      return;
    }

    try {
      if (destSaveBtn) {
        destSaveBtn.disabled = true;
        destSaveBtn.style.opacity = '0.5';
      }

      const res = await apiFetch(`/api/v1/pda/commission-lines/${currentLineId}/validate-location`, {
        method: 'POST',
        body: JSON.stringify({ barcode })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Érvénytelen lokáció vagy megtelt tárhely.');
        if (destInput) {
          destInput.value = '';
          destInput.focus();
        }
        return;
      }

      currentDestBarcode = data.resolved_barcode || barcode;
    } catch (err) {
      alert('Hálózati hiba a lokáció ellenőrzésekor: ' + (err.message || err));
      return;
    } finally {
      if (destSaveBtn) {
        destSaveBtn.disabled = false;
        destSaveBtn.style.opacity = '1';
      }
    }

    const hintDiv = container.querySelector('#test-sscc-hint');
    if (hintDiv) {
      hintDiv.innerHTML = `<em>(Teszteléshez generált SSCC: <strong>${currentLabel?.sscc || ''}</strong>)</em>`;
    }

    showPane(paneSscc);
    setTimeout(() => {
      const ssccInput = container.querySelector('#sscc-vonalkod');
      if (ssccInput) ssccInput.focus();
    }, 100);
  };

  if (destInput) {
    destInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await saveDestination();
      }
    });

    destInput.addEventListener('input', async (e) => {
      const val = destInput.value.trim();
      if (val.length === 9 && !destInput.disabled) {
        await saveDestination();
      }
    });
  }

  if (destSaveBtn) {
    destSaveBtn.addEventListener('click', async () => {
      await saveDestination();
    });
  }

  const saveCommissionFinal = async () => {
    const ssccInput = container.querySelector('#sscc-vonalkod');
    const ssccSaveBtn = container.querySelector('#btn-sscc-save');
    const scannedSscc = ssccInput.value.trim();
    if (!scannedSscc) return;

    const normalizedScannedSscc = normalizeSscc(scannedSscc);
    const normalizedExpectedSscc = normalizeSscc(currentLabel?.sscc);
    if (!normalizedScannedSscc || normalizedScannedSscc !== normalizedExpectedSscc) {
      alert('Hiba: A beszkennelt SSCC nem egyezik a generált címkével!');
      ssccInput.value = '';
      ssccInput.focus();
      return;
    }

    if (!currentLineId || !lastPickPayload) {
      alert('Hiba: Nincs aktív komissiózás.');
      return;
    }

    try {
      ssccInput.disabled = true;
      if (ssccSaveBtn) {
        ssccSaveBtn.disabled = true;
        ssccSaveBtn.style.opacity = '0.5';
      }
      const payload = { ...lastPickPayload, barcode: currentDestBarcode, scannedSscc: normalizedScannedSscc };

      const res = await apiFetch(`/api/v1/pda/commission-lines/${currentLineId}/pick-and-assign`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        currentLabel = data.label || null;
        destInput.value = '';
        ssccInput.value = '';
        showPane(paneList);
        loadData();
        lastPickPayload = null;
        currentDestBarcode = null;
      } else {
        alert(data.error || 'Hiba a mentéskor.');
        ssccInput.value = '';
        ssccInput.focus();
      }
    } catch (err) {
      alert('Hálózati hiba a mentéskor.');
    } finally {
      ssccInput.disabled = false;
      if (ssccSaveBtn) {
        ssccSaveBtn.disabled = false;
        ssccSaveBtn.style.opacity = '1';
      }
    }
  };



  const ssccInput = container.querySelector('#sscc-vonalkod');
  const ssccSaveBtn = container.querySelector('#btn-sscc-save');
  
  if (ssccInput) {
    ssccInput.addEventListener('input', async () => {
      const scannedSscc = ssccInput.value.trim();
      if (scannedSscc.length === 18 && !ssccInput.disabled) {
        await saveCommissionFinal();
      }
    });

    ssccInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await saveCommissionFinal();
      }
    });
  }
  
  if (ssccSaveBtn) {
    ssccSaveBtn.addEventListener('click', async () => {
      await saveCommissionFinal();
    });
  }

  select.addEventListener('change', loadData);

  await loadDictionaries();
  loadData();
}
