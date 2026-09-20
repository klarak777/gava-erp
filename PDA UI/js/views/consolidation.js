/**
 * consolidation.js – Összeemelés modul (átdolgozott, kamion-alapú, 4 pane)
 *
 * PANE 1: Kamion kiválasztás legördülőből (csak nem rakodott, PDA-ra küldött kamionok)
 * PANE 2: Raklap lista jelölőnégyzetekkel (az adott kamion komissiózott raklapjai)
 * PANE 3: Céllokáció megadása vonalkód beolvasással (kötelező)
 * PANE 4: Mester összeemelő raklapcímke nyomtatása
 */
import { showView, apiFetch, appState } from '../app.js';

export async function renderConsolidation(container, params = {}) {
  const user = appState.user;
  const userName = user?.name || 'Felhasználó';
  const escHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
    );
  };

  // Állapot
  let selectedTruck = null;        // { id, truck_number, delivery_date }
  let availableLabels = [];        // az API-ból betöltött raklapok
  let selectedLabelIds = new Set(); // kijelölt jelölőnégyzetek
  let locationName = '';           // beolvasott céllokáció
  let consolidatedLabel = null;    // a visszakapott mester rekord

  // ── HTML ──────────────────────────────────────────────────────────
  container.innerHTML = `
    <!-- PANE 1: Kamion kiválasztás -->
    <div id="pane-truck" class="pda-pane active" style="display:flex; flex-direction:column; height:100%; background:#f8fafc;">
      <div class="pda-dashboard__header" style="display:flex; align-items:center; justify-content:space-between; padding:8px 14px 8px 10px; background:#f8f9fc; gap:4px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <img src="/logo.ico" alt="Gava Logo" onerror="this.style.display='none'" style="width:32px; height:32px; flex-shrink:0;">
          <div>
            <div style="font-size:13.5px; font-weight:800; color:#0f172a; line-height:1.15;">Összeemelés</div>
            <div style="font-size:7.5px; color:#64748b; font-weight:700; text-transform:uppercase; margin-top:1px;">FELHASZNÁLÓ</div>
            <div style="font-size:11px; font-weight:700; color:#0f172a; max-width:95px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escHtml(userName)}</div>
          </div>
        </div>
      </div>

      <div style="padding:16px; font-size:16px; color:#0f172a; text-align:center; font-weight:800;">Kamion kiválasztása</div>

      <div style="flex:1; overflow-y:auto; padding:12px 16px;">
        <div style="font-size:12px; font-weight:600; color:#334155; margin-bottom:8px;">Válassz egy kamiont az összeemeléshez:</div>
        <div id="truck-loading" style="color:#94a3b8; font-size:13px; text-align:center; padding:20px;">Betöltés...</div>
        <select id="truck-select" style="display:none; width:100%; padding:12px; border:2px solid #cbd5e1; border-radius:8px; font-size:14px; font-weight:600; color:#0f172a; background:#fff; margin-bottom:16px;">
          <option value="">-- Válassz kamiont --</option>
        </select>
        <div id="truck-error" style="display:none; color:#dc2626; font-size:12px; font-weight:600; margin-top:8px;"></div>
      </div>

      <div class="pda-bottom-nav" style="display:flex; padding:12px 16px; background:#fff; border-top:1px solid #e2e8f0; align-items:center; justify-content:space-between;">
        <div class="pda-nav-home-btn" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; color:#64748b;">
          <svg fill="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span style="font-size:10px; font-weight:600; margin-top:2px;">Főoldal</span>
        </div>
        <button id="btn-truck-next" style="cursor:pointer; border:none; display:flex; align-items:center; justify-content:center; background:#4f46e5; color:white; border-radius:8px; padding:0 20px; height:44px; font-size:12px; font-weight:700; opacity:0.5;" disabled>
          Következő →
        </button>
      </div>
    </div>

    <!-- PANE 2: Raklap lista jelölőnégyzetekkel -->
    <div id="pane-labels" class="pda-pane" style="display:none; flex-direction:column; height:100%; background:#f8fafc;">
      <div class="pda-dashboard__header" style="display:flex; align-items:center; padding:8px 14px; background:#f8f9fc; gap:4px;">
        <img src="/logo.ico" alt="Gava Logo" onerror="this.style.display='none'" style="width:32px; height:32px; flex-shrink:0;">
        <div>
          <div style="font-size:13.5px; font-weight:800; color:#0f172a;">Összeemelés</div>
          <div id="labels-truck-name" style="font-size:10px; color:#0369a1; font-weight:700; margin-top:1px;"></div>
        </div>
      </div>

      <div style="padding:10px 16px 4px; font-size:13px; font-weight:700; color:#0f172a;">Válaszd ki az összeemelendő raklapokat:</div>
      <div id="labels-count-info" style="padding:0 16px 6px; font-size:11px; color:#64748b;"></div>

      <div style="flex:1; overflow-y:auto; padding:0 12px 8px;">
        <div id="labels-list" style="display:flex; flex-direction:column; gap:6px;">
          <div style="color:#94a3b8; font-size:13px; text-align:center; padding:20px;">Betöltés...</div>
        </div>
      </div>

      <div class="pda-bottom-nav" style="display:flex; padding:12px 16px; background:#fff; border-top:1px solid #e2e8f0; align-items:center; justify-content:space-between;">
        <div class="pda-nav-labels-back-btn" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; color:#64748b;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:24px;height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span style="font-size:10px; font-weight:600; margin-top:2px;">Vissza</span>
        </div>
        <button id="btn-labels-next" style="cursor:pointer; border:none; display:flex; align-items:center; justify-content:center; background:#4f46e5; color:white; border-radius:8px; padding:0 16px; height:44px; font-size:12px; font-weight:700; opacity:0.5;" disabled>
          Összeemelés befejezése →
        </button>
      </div>
    </div>

    <!-- PANE 3: Céllokáció megadása -->
    <div id="pane-location" class="pda-pane" style="display:none; flex-direction:column; height:100%; background:#f8fafc;">
      <div class="pda-dashboard__header" style="display:flex; align-items:center; padding:8px 14px; background:#f8f9fc; gap:4px;">
        <img src="/logo.ico" alt="Gava Logo" onerror="this.style.display='none'" style="width:32px; height:32px; flex-shrink:0;">
        <div>
          <div style="font-size:13.5px; font-weight:800; color:#0f172a;">Összeemelés</div>
          <div style="font-size:10px; color:#0369a1; font-weight:700; margin-top:1px;">Céllokáció megadása</div>
        </div>
      </div>

      <div style="flex:1; overflow-y:auto; padding:12px 16px;">
        <!-- Kiválasztott raklapok összefoglalója -->
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px; margin-bottom:14px;">
          <div style="font-size:11px; font-weight:700; color:#1e40af; margin-bottom:6px;">Összeemelendő raklapok:</div>
          <div id="loc-selected-summary" style="font-size:11px; color:#1e293b; display:flex; flex-direction:column; gap:3px;"></div>
        </div>

        <!-- Lokáció beolvasás -->
        <div style="font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Olvasd be a céllokáció vonalkódját: <span style="color:#dc2626;">*</span></div>
        <div style="position:relative; display:flex; align-items:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" style="position:absolute; left:12px;">
            <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
          </svg>
          <input type="text" id="loc-barcode" placeholder="Olvasd be a lokáció kódját" autofocus
            style="width:100%; padding:14px 12px 14px 40px; border:2px solid #cbd5e1; border-radius:8px; font-size:14px; font-weight:600; background:#fff; color:#0f172a;">
        </div>
        <div id="loc-confirmed" style="display:none; margin-top:8px; padding:8px 12px; background:#dcfce7; border:1px solid #86efac; border-radius:6px; font-size:12px; font-weight:700; color:#15803d;"></div>
        <div id="loc-error" style="display:none; color:#dc2626; margin-top:8px; font-size:12px; font-weight:600;"></div>
      </div>

      <div class="pda-bottom-nav" style="display:flex; padding:12px 16px; background:#fff; border-top:1px solid #e2e8f0; align-items:center; justify-content:space-between;">
        <div class="pda-nav-loc-back-btn" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; color:#64748b;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:24px;height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span style="font-size:10px; font-weight:600; margin-top:2px;">Vissza</span>
        </div>
        <button id="btn-loc-next" style="cursor:pointer; border:none; display:flex; align-items:center; justify-content:center; background:#4f46e5; color:white; border-radius:8px; padding:0 16px; height:44px; font-size:12px; font-weight:700; opacity:0.5;" disabled>
          Nyomtatáshoz →
        </button>
      </div>
    </div>

    <!-- PANE 4: Nyomtatás -->
    <div id="pane-print" class="pda-pane" style="display:none; flex-direction:column; height:100%; background:#f8fafc;">
      <div class="pda-dashboard__header" style="display:flex; align-items:center; padding:8px 14px; background:#f8f9fc; gap:4px;">
        <img src="/logo.ico" alt="Gava Logo" onerror="this.style.display='none'" style="width:32px; height:32px; flex-shrink:0;">
        <div>
          <div style="font-size:13.5px; font-weight:800; color:#0f172a;">Összeemelés</div>
          <div style="font-size:10px; color:#0369a1; font-weight:700; margin-top:1px;">Raklapcímke nyomtatása</div>
        </div>
      </div>

      <div style="flex:1; overflow-y:auto; padding:0 12px 14px; background:#fff;">
        <div id="pallet-label-preview-card" style="border:2px solid #0f172a; border-radius:6px; background:#fff; padding:10px 12px; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
          <div id="lbl-truck" style="font-size:19px; font-weight:900; color:#0f172a; line-height:1.1;"></div>
          <div style="font-size:9.5px; font-weight:700; color:#64748b; text-transform:uppercase;">Kamionszám</div>
          <div style="border-top:1.5px solid #0f172a; margin:5px 0;"></div>
          <div id="lbl-product" style="font-size:15px; font-weight:800; color:#0f172a; line-height:1.2;"></div>
          <div style="font-size:9.5px; font-weight:700; color:#64748b; text-transform:uppercase;">Összeemelés</div>
          <div style="border-top:1.5px solid #0f172a; margin:5px 0;"></div>
          <div style="display:flex; flex-direction:column; gap:2px; font-size:11.5px; color:#1e293b;">
            <div>Karton szám: <strong id="lbl-cartons"></strong></div>
            <div>Lokáció: <strong id="lbl-location" style="color:#0369a1;"></strong></div>
            <div>Befoglalt raklapok: <strong id="lbl-members"></strong></div>
          </div>
          <div style="border-top:1.5px solid #0f172a; margin:5px 0;"></div>
          <div style="text-align:center; padding-top:2px;">
            <svg id="preview-sscc-svg" style="max-width:100%; height:auto; display:block; margin:0 auto;"></svg>
            <div style="font-size:10.5px; font-weight:800; color:#0f172a; margin-top:2px;">SSCC – Összeemelő mester</div>
          </div>
        </div>

        <div style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px;">
          <div style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:5px;">Címkenyomtató vonalkód (Zebra ZPL)</div>
          <div style="position:relative; display:flex; align-items:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" style="position:absolute; left:10px;">
              <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
            </svg>
            <input type="text" id="print-printer-barcode" placeholder="Olvasd be a nyomtatót"
              style="width:100%; padding:8px 8px 8px 34px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; background:#fff; color:#0f172a;">
          </div>
        </div>
        <button class="pda-btn" id="print-btn" style="width:100%; height:42px; display:flex; align-items:center; justify-content:center; gap:8px; background:#0ea5e9; color:#fff; border:none; border-radius:6px; font-weight:700;">
          🖨️ Nyomtatás címkenyomtatóra
        </button>
      </div>

      <div class="pda-bottom-nav" style="display:flex; padding:16px; background:#fff; border-top:1px solid #e2e8f0; gap:12px;">
        <div class="pda-nav-home-btn" style="cursor:pointer; flex:1; display:flex; flex-direction:column; align-items:center; color:#64748b;">
          <svg fill="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span style="font-size:10px; font-weight:600; margin-top:4px;">Főoldal</span>
        </div>
      </div>
    </div>
  `;

  // ── DOM ELEMEK ────────────────────────────────────────────────────
  const paneTruck     = container.querySelector('#pane-truck');
  const paneLabels    = container.querySelector('#pane-labels');
  const paneLocation  = container.querySelector('#pane-location');
  const panePrint     = container.querySelector('#pane-print');

  const truckLoading  = container.querySelector('#truck-loading');
  const truckSelect   = container.querySelector('#truck-select');
  const truckError    = container.querySelector('#truck-error');
  const btnTruckNext  = container.querySelector('#btn-truck-next');

  const labelsTruckName = container.querySelector('#labels-truck-name');
  const labelsCountInfo = container.querySelector('#labels-count-info');
  const labelsList      = container.querySelector('#labels-list');
  const btnLabelsNext   = container.querySelector('#btn-labels-next');

  const locSelectedSummary = container.querySelector('#loc-selected-summary');
  const locBarcode         = container.querySelector('#loc-barcode');
  const locConfirmed       = container.querySelector('#loc-confirmed');
  const locError           = container.querySelector('#loc-error');
  const btnLocNext         = container.querySelector('#btn-loc-next');

  const printPrinterInput = container.querySelector('#print-printer-barcode');
  const printBtn          = container.querySelector('#print-btn');

  // ── NAVIGÁCIÓ ────────────────────────────────────────────────────
  const showPane = (pane) => {
    [paneTruck, paneLabels, paneLocation, panePrint].forEach(p => {
      p.style.display = 'none';
      p.classList.remove('active');
    });
    pane.style.display = 'flex';
    pane.classList.add('active');
  };

  const goDashboard = () => showView('dashboard');
  container.querySelectorAll('.pda-nav-home-btn').forEach(b => b.addEventListener('click', goDashboard));
  container.querySelector('.pda-nav-labels-back-btn').addEventListener('click', () => showPane(paneTruck));
  container.querySelector('.pda-nav-loc-back-btn').addEventListener('click', () => showPane(paneLabels));
  window.addEventListener('hwBack', goDashboard);

  // ── PANE 1: Kamion betöltés ───────────────────────────────────────
  try {
    const res = await apiFetch('/api/v1/pda/trucks-for-consolidation');
    let trucks = null;
    try { trucks = await res.json(); } catch (_) {}
    truckLoading.style.display = 'none';
    if (!res.ok || !Array.isArray(trucks) || trucks.length === 0) {
      if (trucks && trucks.error) {
        truckError.textContent = trucks.error;
      } else if (Array.isArray(trucks) && trucks.length === 0) {
        truckError.textContent = 'Nincs rakodásra váró kamion.';
      } else {
        truckError.textContent = `Hiba a kamionok betöltésekor (HTTP ${res.status}).`;
      }
      truckError.style.display = 'block';
    } else {
      trucks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.dataset.truckNumber = t.truck_number;
        opt.textContent = `${t.truck_number}${t.delivery_date ? ' – ' + t.delivery_date : ''}`;
        truckSelect.appendChild(opt);
      });
      truckSelect.style.display = 'block';
    }
  } catch (err) {
    truckLoading.style.display = 'none';
    truckError.textContent = 'Hálózati hiba a kamionok betöltésekor.';
    truckError.style.display = 'block';
  }

  truckSelect.addEventListener('change', () => {
    const val = truckSelect.value;
    if (val) {
      const opt = truckSelect.options[truckSelect.selectedIndex];
      selectedTruck = { id: Number(val), truck_number: opt.dataset.truckNumber || opt.textContent };
      btnTruckNext.disabled = false;
      btnTruckNext.style.opacity = '1';
    } else {
      selectedTruck = null;
      btnTruckNext.disabled = true;
      btnTruckNext.style.opacity = '0.5';
    }
  });

  btnTruckNext.addEventListener('click', async () => {
    if (!selectedTruck) return;
    showPane(paneLabels);
    await loadLabels();
  });

  // ── PANE 2: Raklap lista betöltés ────────────────────────────────
  async function loadLabels() {
    selectedLabelIds.clear();
    updateLabelsNextBtn();
    labelsTruckName.textContent = selectedTruck.truck_number;
    labelsCountInfo.textContent = 'Betöltés...';
    labelsList.innerHTML = '<div style="color:#94a3b8; font-size:13px; text-align:center; padding:20px;">Betöltés...</div>';

    try {
      const res = await apiFetch(`/api/v1/pda/labels-for-truck/${selectedTruck.id}`);
      let data = null;
      try { data = await res.json(); } catch (_) {}
      availableLabels = data;
      if (!res.ok || !Array.isArray(availableLabels)) {
        labelsList.innerHTML = `<div style="color:#dc2626; font-size:13px; text-align:center; padding:16px;">${escHtml((data && data.error) || `Hiba a betöltéskor (HTTP ${res.status}).`)}</div>`;
        labelsCountInfo.textContent = '';
        return;
      }
      if (availableLabels.length === 0) {
        labelsList.innerHTML = '<div style="color:#94a3b8; font-size:13px; text-align:center; padding:20px;">Nincs összeemelésre váró raklap ennél a kamiononál.</div>';
        labelsCountInfo.textContent = '';
        return;
      }
      renderLabelsList();
      labelsCountInfo.textContent = `${availableLabels.length} raklap érhető el – válassz legalább 2-t.`;
    } catch (err) {
      labelsList.innerHTML = '<div style="color:#dc2626; font-size:13px; text-align:center; padding:16px;">Hálózati hiba a raklapok betöltésekor.</div>';
    }
  }

  function renderLabelsList() {
    labelsList.innerHTML = '';
    availableLabels.forEach(label => {
      // Raklap típus meghatározása pallets_json-ból
      let palletTypeTxt = '-';
      if (label.pallets_json) {
        try {
          const pallets = JSON.parse(label.pallets_json);
          if (Array.isArray(pallets) && pallets.length > 0) {
            palletTypeTxt = pallets.map(p => `${p.name || p} (${Number(p.tare_weight_kg || 0).toFixed(3)} kg)`).join(', ');
          }
        } catch (_) {}
      }

      const item = document.createElement('div');
      item.style.cssText = 'background:#fff; border:1.5px solid #e2e8f0; border-radius:8px; padding:10px 10px 10px 12px; display:flex; align-items:flex-start; gap:10px;';
      item.innerHTML = `
        <input type="checkbox" data-id="${label.id}" style="width:20px; height:20px; margin-top:2px; cursor:pointer; accent-color:#4f46e5; flex-shrink:0;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:12px; font-weight:800; color:#0f172a; font-family:monospace; letter-spacing:0.5px; word-break:break-all;">${escHtml(label.sscc)}</div>
          <div style="font-size:11px; color:#334155; font-weight:600; margin-top:2px;">${escHtml(label.product_name || '-')}</div>
          <div style="display:flex; gap:8px; margin-top:3px; flex-wrap:wrap;">
            <span style="font-size:10px; background:#dbeafe; color:#1d4ed8; border-radius:4px; padding:1px 5px; font-weight:700;">${label.picked_cartons || 0} karton</span>
            ${label.location_name ? `<span style="font-size:10px; background:#dcfce7; color:#15803d; border-radius:4px; padding:1px 5px; font-weight:700;">📍 ${escHtml(label.location_name)}</span>` : ''}
          </div>
          <div style="font-size:10px; color:#64748b; margin-top:2px;">${escHtml(palletTypeTxt)}</div>
        </div>
      `;

      const cb = item.querySelector('input[type="checkbox"]');
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selectedLabelIds.add(label.id);
          item.style.borderColor = '#4f46e5';
          item.style.background = '#f5f3ff';
        } else {
          selectedLabelIds.delete(label.id);
          item.style.borderColor = '#e2e8f0';
          item.style.background = '#fff';
        }
        updateLabelsNextBtn();
        labelsCountInfo.textContent = `${availableLabels.length} raklap – ${selectedLabelIds.size} kijelölve (min. 2 szükséges)`;
      });

      labelsList.appendChild(item);
    });
  }

  function updateLabelsNextBtn() {
    const enough = selectedLabelIds.size >= 2;
    btnLabelsNext.disabled = !enough;
    btnLabelsNext.style.opacity = enough ? '1' : '0.5';
  }

  btnLabelsNext.addEventListener('click', () => {
    if (selectedLabelIds.size < 2) return;
    // Összefoglaló feltöltése a lokáció pane-be
    const selected = availableLabels.filter(l => selectedLabelIds.has(l.id));
    locSelectedSummary.innerHTML = selected.map(l =>
      `<div style="display:flex; justify-content:space-between; padding:2px 0;">
        <span style="font-family:monospace; font-size:10px; color:#1e40af;">${escHtml(l.sscc)}</span>
        <span style="font-size:10px; color:#475569;">${escHtml(l.product_name || '')} – ${l.picked_cartons || 0} karton</span>
      </div>`
    ).join('');
    locationName = '';
    locBarcode.value = '';
    locConfirmed.style.display = 'none';
    locError.style.display = 'none';
    btnLocNext.disabled = true;
    btnLocNext.style.opacity = '0.5';
    showPane(paneLocation);
    setTimeout(() => locBarcode.focus(), 150);
  });

  // ── PANE 3: Lokáció beolvasás ─────────────────────────────────────
  locBarcode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = locBarcode.value.trim();
      if (!val) return;
      locationName = val;
      locConfirmed.textContent = `✅ Lokáció elfogadva: ${locationName}`;
      locConfirmed.style.display = 'block';
      locError.style.display = 'none';
      btnLocNext.disabled = false;
      btnLocNext.style.opacity = '1';
    }
  });

  btnLocNext.addEventListener('click', async () => {
    if (!locationName) return;
    const originalHtml = btnLocNext.innerHTML;
    btnLocNext.innerHTML = '⌛ Mentés...';
    btnLocNext.disabled = true;

    try {
      const res = await apiFetch('/api/v1/pda/consolidation', {
        method: 'POST',
        body: JSON.stringify({
          labelIds: Array.from(selectedLabelIds),
          locationName
        })
      });
      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (res.ok && data && data.success) {
        consolidatedLabel = data.label;
        renderPrintPane();
        showPane(panePrint);
      } else {
        locError.textContent = (data && data.error) ? data.error : `Hiba az összeemelés során (HTTP ${res.status}).`;
        locError.style.display = 'block';
        btnLocNext.innerHTML = originalHtml;
        btnLocNext.disabled = false;
      }
    } catch (err) {
      locError.textContent = 'Hálózati hiba az összeemelés során.';
      locError.style.display = 'block';
      btnLocNext.innerHTML = originalHtml;
      btnLocNext.disabled = false;
    }
  });

  // ── PANE 4: Nyomtatás ─────────────────────────────────────────────
  function renderPrintPane() {
    if (!consolidatedLabel) return;
    container.querySelector('#lbl-truck').textContent = consolidatedLabel.truck_number || '-';
    container.querySelector('#lbl-product').textContent = consolidatedLabel.product_name || '-';
    container.querySelector('#lbl-cartons').textContent = consolidatedLabel.picked_cartons || '0';
    container.querySelector('#lbl-location').textContent = consolidatedLabel.location_name || '-';

    // Tag SSCC-k listázása
    let memberList = '-';
    if (consolidatedLabel.pallets_json) {
      try {
        const members = JSON.parse(consolidatedLabel.pallets_json);
        if (Array.isArray(members) && members.length > 0) {
          memberList = members.length + ' db';
        }
      } catch (_) {}
    }
    container.querySelector('#lbl-members').textContent = memberList;

    if (window.JsBarcode) {
      window.JsBarcode('#preview-sscc-svg', consolidatedLabel.sscc, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 16,
        height: 40,
        margin: 0
      });
    }
  }

  printPrinterInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') { e.preventDefault(); await triggerZplPrint(); }
  });
  printBtn.addEventListener('click', () => triggerZplPrint());

  async function triggerZplPrint() {
    if (!consolidatedLabel) return;
    const pBarcode = printPrinterInput.value.trim();
    if (!pBarcode) {
      alert('Olvasd be a nyomtató vonalkódját!');
      printPrinterInput.focus();
      return;
    }

    const originalHtml = printBtn.innerHTML;
    printBtn.innerHTML = '⌛ Nyomtatás...';
    printBtn.disabled = true;

    try {
      const res = await apiFetch('/api/v1/pda/print-pallet-label', {
        method: 'POST',
        body: JSON.stringify({
          labelId: consolidatedLabel.id,
          printerBarcode: pBarcode
        })
      });
      let data = null;
      try { data = await res.json(); } catch (_) {}
      if (res.ok && data && data.success) {
        alert('Nyomtatás sikeresen elküldve! Az összeemelés véglegesítve.');
        showView('dashboard');
      } else {
        alert('Hiba a nyomtatás során: ' + ((data && data.error) || `HTTP ${res.status}`));
      }
    } catch (e) {
      alert('Hálózati hiba a nyomtatás során.');
    } finally {
      printBtn.innerHTML = originalHtml;
      printBtn.disabled = false;
    }
  }

  // Kezdeti pane megjelenítés
  showPane(paneTruck);
}
