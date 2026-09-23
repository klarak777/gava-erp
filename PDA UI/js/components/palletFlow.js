/** Shared print, destination and SSCC screens for both pallet workflows. */
const escHtml = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])
);

export function renderPalletFlow({ userName, title = 'Komissiózás' }) {
  return `
    <!-- LOKÁCIÓ NÉZET HELYETT NYOMTATÁS (2. Lépés) -->
    <div class="pda-pane" id="pane-print">
      <!-- Fejléc (Dashboard / Komissió stílus - csak össz. karton számmal) -->
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <!-- Left Block -->
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 13.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">${escHtml(title)}</div>
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
        </div>
      </div>

      <div class="pda-form-title" style="padding: 12px 14px 6px; font-size: 17px; color: #0f172a; text-align: center; font-weight: 800;">Raklap címke nyomtatása</div>
      
      <div class="pda-form-body" style="padding: 0 12px 14px; background: #fff; overflow-y: auto;">
        
        <!-- Zebra Címkenyomtató Beolvasó Doboz -->
        <div class="pda-print-box" style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
          <div style="font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 5px;">Címkenyomtató vonalkód</div>
          <div style="position: relative; display: flex; align-items: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 10px;">
              <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
            </svg>
            <input type="text" id="print-printer-barcode" placeholder="Olvasd be a nyomtatót" style="width: 100%; padding: 8px 8px 8px 34px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; background: #fff; color: #0f172a;">
          </div>
          <button type="button" id="btn-print-submit" style="display: none; margin-top: 10px; width: 100%; padding: 12px; background: #0ea5e9; color: #fff; font-weight: 700; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Tovább / Nyomtatás</button>
        </div>
        </div>
      </div>

      <!-- Alsó navigáció -->
      <div class="pda-bottom-nav">
        <div class="pda-bottom-nav__item pda-nav-home-btn" style="cursor: pointer; flex: 1;">
          <svg class="pda-bottom-nav__icon" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span class="pda-bottom-nav__label">Főoldal</span>
        </div>
        <div class="pda-bottom-nav__item pda-nav-back-btn" style="cursor: pointer; flex: 1;">
          <svg class="pda-bottom-nav__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span class="pda-bottom-nav__label">Vissza</span>
        </div>
      </div>
    </div>

    <!-- LOKÁCIÓ NÉZET (3. Lépés) -->
    <div class="pda-pane" id="pane-dest">
      <!-- Fejléc (Dashboard / Komissió stílus) -->
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 13.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">${escHtml(title)}</div>
            <div class="pda-dashboard__role" style="font-size: 7.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; line-height: 1;">FELHASZNÁLÓ</div>
            <div class="pda-dashboard__name" style="font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px; margin-top: 1px; line-height: 1.15;">${escHtml(userName)}</div>
          </div>
        </div>
        <div class="pda-dashboard__header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
          <div class="pda-dashboard__notifications" style="position: relative; color: #6366f1; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; margin-right: 2px;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
            <span style="position: absolute; top: -2px; right: -2px; background: #6366f1; color: white; font-size: 7.5px; font-weight: 800; border-radius: 50%; width: 13px; height: 13px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #f8f9fc;">2</span>
          </div>
        </div>
      </div>

      <div class="pda-form-title" style="padding: 24px 16px 8px; font-size: 18px; color: #0f172a; text-align: center;">Cél lokáció</div>
      <div class="pda-form-title" id="dest-title" style="display:none; font-size: 20px; color: #0ea5e9; text-align: center; padding-top: 0;">XXXX</div>
      
      <div class="pda-form-body" style="padding: 0; background: #fff;">
        <div class="pda-print-box">
          <div id="allowed-rows-box" style="display:none;"></div>
          <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px;">Cél tárhely vonalkód</div>
          <div style="position: relative; display: flex; align-items: center; margin-bottom: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px;">
              <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
            </svg>
            <input type="text" id="dest-vonalkod" placeholder="Vonalkód (pl. S01010000) vagy sornév (pl. 1. sor)" style="width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: #f8fafc; color: #0f172a;">
          </div>

          <button type="button" id="btn-dest-save" style="display: none; margin-bottom: 10px; width: 100%; padding: 12px; background: #0ea5e9; color: #fff; font-weight: 700; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Tovább / Lokáció mentése</button>
          <div id="dest-error" role="alert" style="display:none; color:#dc2626; font-size:12px; margin-bottom:10px;"></div>
          <div id="dest-error" role="alert" style="display:none; color:#dc2626; font-size:12px; margin-bottom:10px;"></div>
        </div>
      </div>

      <!-- Alsó navigáció -->
      <div class="pda-bottom-nav">
        <div class="pda-bottom-nav__item pda-nav-home-btn" style="cursor: pointer; flex: 1;">
          <svg class="pda-bottom-nav__icon" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span class="pda-bottom-nav__label">Főoldal</span>
        </div>
        <div class="pda-bottom-nav__item pda-nav-back-btn" style="cursor: pointer; flex: 1;">
          <svg class="pda-bottom-nav__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span class="pda-bottom-nav__label">Vissza</span>
        </div>
      </div>
    </div>

    <!-- RAKLAPCÍMKE VISSZASZKENNELÉS (4. Lépés) -->
    <div class="pda-pane" id="pane-sscc">
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 13.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">${escHtml(title)}</div>
            <div class="pda-dashboard__role" style="font-size: 7.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; line-height: 1;">FELHASZNÁLÓ</div>
            <div class="pda-dashboard__name" style="font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px; margin-top: 1px; line-height: 1.15;">${escHtml(userName)}</div>
          </div>
        </div>
      </div>

      <div class="pda-form-title" style="padding: 24px 16px 8px; font-size: 18px; color: #0f172a; text-align: center;">Raklapcímke ellenőrzése</div>
      <div class="pda-form-title" style="font-size: 14px; color: #64748b; text-align: center; padding-top: 0; font-weight: 500;">Szkennelje be a vonalkódot a befejezéshez!</div>
      
      <div class="pda-form-body" style="padding: 0; background: #fff;">
        <div class="pda-print-box">
          <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px;">Vonalkód</div>
          <div style="position: relative; display: flex; align-items: center; margin-bottom: 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px;">
              <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
            </svg>
            <input type="text" id="sscc-vonalkod" placeholder="Vonalkód" style="width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: #f8fafc; color: #0f172a;">
          </div>
          <button type="button" id="btn-sscc-save" style="display: none; margin-bottom: 10px; width: 100%; padding: 12px; background: #0ea5e9; color: #fff; font-weight: 700; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Befejezés</button>
          <div id="test-sscc-hint" style="display: none;"></div>
          <div id="scan-error" role="alert" style="display:none; color:#dc2626; font-size:12px; margin-bottom:10px;"></div>
          <div id="scan-error" role="alert" style="display:none; color:#dc2626; font-size:12px; margin-bottom:10px;"></div>
        </div>
      </div>

      <div class="pda-bottom-nav">
        <div class="pda-bottom-nav__item pda-nav-home-btn" style="cursor: pointer; flex: 1;">
          <svg class="pda-bottom-nav__icon" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span class="pda-bottom-nav__label">Főoldal</span>
        </div>
        <div class="pda-bottom-nav__item pda-nav-back-btn" style="cursor: pointer; flex: 1;">
          <svg class="pda-bottom-nav__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span class="pda-bottom-nav__label">Vissza</span>
        </div>
      </div>
    </div>
  `;
}

export function renderAllowedRows(container, targetLocations, truckNumber = '') {
  let rows = targetLocations;
  if (typeof rows === 'string') {
    try { rows = JSON.parse(rows); } catch { rows = []; }
  }
  const box = container.querySelector('#allowed-rows-box');
  const label = container.querySelector('#allowed-rows-truck-label');
  const list = container.querySelector('#allowed-rows-list');
  box.style.display = 'block';
  if (Array.isArray(rows) && rows.length) {
    label.textContent = truckNumber ? truckNumber + ' – engedélyezett célsorok:' : 'Engedélyezett cél sorok:';
    list.innerHTML = rows.map(row => {
      const name = row && typeof row === 'object' ? (row.name || '') : String(row);
      return '<span style="background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;">' + escHtml(name) + '</span>';
    }).join('');
  } else {
    label.textContent = 'Nincs engedélyezett célsor beállítva';
    list.innerHTML = '<span style="color:#b91c1c;font-size:11px;font-weight:700;">A kamion mentett célsor-konfigurációja hiányzik; a mentés le lesz tiltva.</span>';
  }
}
