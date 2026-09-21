import { renderPalletFlow, renderAllowedRows } from '../components/palletFlow.js?v=2';
/**
 * consolidation.js – Összeemelés modul (átdolgozott, kamion-alapú, 5 pane)
 *
 * PANE 1: Kamion kiválasztás legördülőből (csak nem rakodott, PDA-ra küldött kamionok)
 * PANE 2: Raklap lista jelölőnégyzetekkel (az adott kamion komissiózott raklapjai)
 * PANE 3–5: A normál komissiózással közös nyomtatás, céllokáció és SSCC felület
 * PANE 4: Céllokáció megadása vonalkód beolvasással (validálás a kamion target_locations alapján)
 * PANE 5: Mester címke visszaolvasása a véglegesítéshez
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
  const normalizeSscc = (value) => {
    const raw = String(value ?? '').trim().replace(/^\]C1/i, '').replace(/^\(00\)/, '');
    const digits = raw.replace(/\D/g, '');
    return digits.length > 18 ? digits.slice(-18) : digits;
  };

  // Állapot
  let selectedTruck = null;        // { id, truck_number, delivery_date }
  let availableTrucks = [];
  let availableLabels = [];        // az API-ból betöltött raklapok
  let selectedLabelIds = new Set(); // kijelölt jelölőnégyzetek
  let locationName = '';           // beolvasott céllokáció
  let locationId = null;
  let previewLabel = null;         // a szerver által generált (de nem mentett) mester címke
  let generatingLabel = false;

  // ── HTML ──────────────────────────────────────────────────────────
  container.innerHTML = `
    <!-- PANE 1: Kamion kiválasztás -->
    <div id="pane-truck" class="pda-pane active">
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
    <div id="pane-labels" class="pda-pane">
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
          Címke nyomtatása →
        </button>
      </div>
    </div>

    ${renderPalletFlow({ userName, title: 'Összeemelés' })}
  `;

  // ── DOM ELEMEK ────────────────────────────────────────────────────
  const paneTruck     = container.querySelector('#pane-truck');
  const paneLabels    = container.querySelector('#pane-labels');
  const panePrint     = container.querySelector('#pane-print');
  const paneLocation  = container.querySelector('#pane-dest');
  const paneScan      = container.querySelector('#pane-sscc');

  const truckLoading  = container.querySelector('#truck-loading');
  const truckSelect   = container.querySelector('#truck-select');
  const truckError    = container.querySelector('#truck-error');
  const btnTruckNext  = container.querySelector('#btn-truck-next');

  const labelsTruckName = container.querySelector('#labels-truck-name');
  const labelsCountInfo = container.querySelector('#labels-count-info');
  const labelsList      = container.querySelector('#labels-list');
  const btnLabelsNext   = container.querySelector('#btn-labels-next');

  const printPrinterInput = container.querySelector('#print-printer-barcode');
  const printBtn          = container.querySelector('#print-btn');

  const locBarcode         = container.querySelector('#dest-vonalkod');
  const locError           = container.querySelector('#dest-error');
  const btnLocNext         = container.querySelector('#btn-dest-save');

  const scanBarcodeInput = container.querySelector('#sscc-vonalkod');
  const scanError        = container.querySelector('#scan-error');

  // ── NAVIGÁCIÓ ────────────────────────────────────────────────────
  const showPane = (pane) => {
    [paneTruck, paneLabels, panePrint, paneLocation, paneScan].forEach(p => {
      p.classList.remove('active');
    });
    pane.classList.add('active');
  };

  const isBusy = () => generatingLabel || printBtn.disabled || locBarcode.disabled || scanBarcodeInput.disabled;
  const goDashboard = () => { if (!isBusy()) showView('dashboard'); };
  const goBack = () => {
    if (isBusy()) return;
    if (paneScan.classList.contains('active')) showPane(paneLocation);
    else if (paneLocation.classList.contains('active')) showPane(panePrint);
    else if (panePrint.classList.contains('active')) showPane(paneLabels);
    else if (paneLabels.classList.contains('active')) showPane(paneTruck);
    else goDashboard();
  };
  container.querySelectorAll('.pda-nav-home-btn').forEach(b => b.addEventListener('click', goDashboard));
  container.querySelectorAll('.pda-nav-back-btn, .pda-nav-labels-back-btn').forEach(b => b.addEventListener('click', goBack));
  if (window._currentHwBack) window.removeEventListener('hwBack', window._currentHwBack);
  window._currentHwBack = goBack;
  window.addEventListener('hwBack', goBack);

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
      availableTrucks = trucks;
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
      selectedTruck = availableTrucks.find(t => Number(t.id) === Number(val));
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
      const eligible = availableLabels.filter(label => label.can_consolidate !== false).length;
      labelsCountInfo.textContent = `${eligible} raklap választható – legalább 2 szükséges.${eligible < availableLabels.length ? ` ${availableLabels.length - eligible} raklap készletadata hibás.` : ''}`;
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
            palletTypeTxt = pallets.map(p => `${p.name || p} (${Number(p.tare_weight_kg || 0).toFixed(1)} kg)`).join(', ');
          }
        } catch (_) {}
      }

      const item = document.createElement('div');
      item.style.cssText = 'background:#fff; border:1.5px solid #e2e8f0; border-radius:8px; padding:10px 10px 10px 12px; display:flex; align-items:flex-start; gap:10px;';
      item.innerHTML = `
        <input type="checkbox" data-id="${label.id}" ${label.can_consolidate === false ? 'disabled' : ''} style="width:20px; height:20px; margin-top:2px; cursor:pointer; accent-color:#4f46e5; flex-shrink:0;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:12px; font-weight:800; color:#0f172a; font-family:monospace; letter-spacing:0.5px; word-break:break-all;">${escHtml(label.sscc)}</div>
          <div style="font-size:11px; color:#334155; font-weight:600; margin-top:2px;">${escHtml(label.product_name || '-')}</div>
          <div style="display:flex; gap:8px; margin-top:3px; flex-wrap:wrap;">
            <span style="font-size:10px; background:#dbeafe; color:#1d4ed8; border-radius:4px; padding:1px 5px; font-weight:700;">${label.picked_cartons || 0} karton</span>
            ${label.location_name ? `<span style="font-size:10px; background:#dcfce7; color:#15803d; border-radius:4px; padding:1px 5px; font-weight:700;">📍 ${escHtml(label.location_name)}</span>` : ''}
          </div>
          <div style="font-size:10px; color:#64748b; margin-top:2px;">${escHtml(palletTypeTxt)}</div>
          ${label.can_consolidate === false ? `<div role="alert" style="font-size:11px; color:#b91c1c; margin-top:6px;">${escHtml(label.consolidation_error || 'A raklap készletadatai hiányosak.')}</div>` : ''}
        </div>
      `;

      const cb = item.querySelector('input[type="checkbox"]');
      cb.addEventListener('change', () => {
        if (label.can_consolidate === false) return;
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
    const enough = !generatingLabel && selectedLabelIds.size >= 2;
    btnLabelsNext.disabled = !enough;
    btnLabelsNext.style.opacity = enough ? '1' : '0.5';
  }

  btnLabelsNext.addEventListener('click', async () => {
    if (selectedLabelIds.size < 2 || btnLabelsNext.disabled) return;

    // Címke előkészítése / előnézet generálása
    const originalHtml = btnLabelsNext.innerHTML;
    generatingLabel = true;
    btnLabelsNext.innerHTML = '⌛ Generálás...';
    btnLabelsNext.disabled = true;

    try {
      const res = await apiFetch('/api/v1/pda/consolidation-preview', {
        method: 'POST',
        body: JSON.stringify({ labelIds: Array.from(selectedLabelIds) })
      });
      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (res.ok && data && data.success) {
        previewLabel = data.label;
        printPrinterInput.value = '';
        showPane(panePrint);
        setTimeout(() => printPrinterInput.focus(), 150);
      } else {
        alert('Hiba a címke generálása során: ' + ((data && data.error) ? data.error : `HTTP ${res.status}`));
      }
    } catch (err) {
      alert('Hálózati hiba a címke generálása során.');
    } finally {
      generatingLabel = false;
      btnLabelsNext.innerHTML = originalHtml;
      updateLabelsNextBtn();
    }
  });



  printPrinterInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') { e.preventDefault(); await triggerZplPrint(); }
  });
  printBtn.addEventListener('click', () => triggerZplPrint());

  async function triggerZplPrint() {
    if (!previewLabel || printBtn.disabled || !panePrint.classList.contains('active')) return;
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
          labelData: previewLabel, // Direkt átadjuk a címke adatokat az API-nak
          printerBarcode: pBarcode
        })
      });
      let data = null;
      try { data = await res.json(); } catch (_) {}
      if (res.ok && data && data.success) {
        // Sikeres nyomtatás után tovább a lokációra
        alert('Címke kinyomtatva!');
        goToLocationPane();
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


  function goToLocationPane() {
    renderAllowedRows(container, selectedTruck.target_locations, selectedTruck.truck_number);
    locationName = '';
    locationId = null;
    locBarcode.value = '';
    locError.style.display = 'none';
    showPane(paneLocation);
    setTimeout(() => locBarcode.focus(), 150);
  }

  // ── PANE 4: Lokáció beolvasás ─────────────────────────────────────
  async function saveDestination() {
    if (btnLocNext.disabled || !paneLocation.classList.contains('active')) return;
    const val = locBarcode.value.trim();
    locationName = '';
    locationId = null;
    if (!val) {
      locError.textContent = 'Olvasd be a cél tárhely vonalkódját!';
      locError.style.display = 'block';
      locBarcode.focus();
      return;
    }
    locError.style.display = 'none';
    locBarcode.disabled = true;
    btnLocNext.disabled = true;
    try {
      const res = await apiFetch('/api/v1/pda/consolidation-validate-location', {
        method: 'POST',
        body: JSON.stringify({ truckId: selectedTruck.id, locationInput: val, labelIds: Array.from(selectedLabelIds) })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        locationId = data.locationId || null;
        locationName = data.locationName || val;
        if (container.contains(paneLocation)) goToScanPane();
      } else {
        locError.textContent = data.error || 'Érvénytelen lokáció.';
        locError.style.display = 'block';
      }
    } catch (err) {
      locError.textContent = 'Hiba a lokáció ellenőrzése során.';
      locError.style.display = 'block';
    } finally {
      locBarcode.disabled = false;
      btnLocNext.disabled = false;
    }
  }
  locBarcode.addEventListener('input', () => { locationName = ''; locationId = null; });
  locBarcode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveDestination(); }
  });
  btnLocNext.addEventListener('click', saveDestination);

  function goToScanPane() {
    scanBarcodeInput.value = '';
    scanError.style.display = 'none';

    const hintDiv = container.querySelector('#test-sscc-hint');
    if (hintDiv) {
      hintDiv.innerHTML = `<em>(Teszteléshez generált SSCC: <strong>${escHtml(previewLabel?.sscc || '')}</strong>)</em>`;
    }

    showPane(paneScan);
    setTimeout(() => scanBarcodeInput.focus(), 150);
  }

  // ── PANE 5: Összeemelt címke beolvasása és mentés ─────────────────────
  async function saveScanFinal() {
    if (scanBarcodeInput.disabled || !previewLabel || !locationName || !paneScan.classList.contains('active')) return;
    const val = scanBarcodeInput.value.trim();
    if (!val) return;

    if (normalizeSscc(val) !== normalizeSscc(previewLabel.sscc)) {
      scanError.textContent = 'A beolvasott vonalkód nem egyezik az imént kinyomtatott összeemelt raklapcímkével!';
      scanError.style.display = 'block';
      scanBarcodeInput.value = '';
      return;
    }

    scanError.style.display = 'none';
    scanBarcodeInput.disabled = true;
    const prevPlaceholder = scanBarcodeInput.placeholder;
    scanBarcodeInput.placeholder = 'Mentés folyamatban...';

    const btnSsccSave = container.querySelector('#btn-sscc-save');
    if (btnSsccSave) {
      btnSsccSave.disabled = true;
      btnSsccSave.style.opacity = '0.5';
    }

    try {
      const res = await apiFetch('/api/v1/pda/consolidation', {
        method: 'POST',
        body: JSON.stringify({
          labelIds: Array.from(selectedLabelIds),
          truckId: selectedTruck.id,
          locationId: locationId,
          locationName: locationName,
          scannedSscc: val,
          masterLabel: previewLabel
        })
      });
      let data = null;
      try { data = await res.json(); } catch (_) {}

      if (res.ok && data && data.success) {
        alert('Összeemelés sikeresen megtörtént!');
        showView('dashboard');
      } else {
        scanError.textContent = (data && data.error) ? data.error : 'Hiba történt az összeemelés véglegesítése során.';
        scanError.style.display = 'block';
      }
    } catch (err) {
      scanError.textContent = 'Hálózati hiba a véglegesítés során.';
      scanError.style.display = 'block';
    } finally {
      scanBarcodeInput.disabled = false;
      scanBarcodeInput.placeholder = prevPlaceholder;
      scanBarcodeInput.value = '';
      if (btnSsccSave) {
        btnSsccSave.disabled = false;
        btnSsccSave.style.opacity = '1';
      }
    }
  }

  scanBarcodeInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveScanFinal();
    }
  });

  const btnSsccSave = container.querySelector('#btn-sscc-save');
  if (btnSsccSave) {
    btnSsccSave.addEventListener('click', async () => {
      await saveScanFinal();
    });
  }

  // Kezdeti pane megjelenítés
  showPane(paneTruck);
}
