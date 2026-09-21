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
    <!-- PANE 1: Raklapok beolvasása -->
    <div id="pane-scan-member" class="pda-pane active" style="flex-direction:column; height:100%; background:#f8fafc;">
      <div class="pda-dashboard__header" style="display:flex; align-items:center; padding:8px 14px; background:#f8f9fc; gap:4px;">
        <img src="/logo.ico" alt="Gava Logo" onerror="this.style.display='none'" style="width:32px; height:32px; flex-shrink:0;">
        <div>
          <div style="font-size:13.5px; font-weight:800; color:#0f172a;">Összeemelés</div>
          <div id="scan-truck-name" style="font-size:10px; color:#0369a1; font-weight:700; margin-top:1px;">Nincs kamion azonosítva</div>
        </div>
      </div>

      <div style="padding:10px 16px 4px; font-size:13px; font-weight:700; color:#0f172a;">Olvasd be az összeemelendő raklapokat:</div>
      
      <div style="padding: 0 16px; margin-bottom: 8px; position: relative; display: flex; align-items: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 28px;">
          <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
        </svg>
        <input type="text" id="member-barcode" placeholder="Raklap SSCC vonalkód" style="width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: #fff; color: #0f172a;">
      </div>
      <div id="member-scan-error" style="display:none; color:#dc2626; font-size:12px; font-weight:600; text-align:center; margin:0 16px 8px;"></div>

      <div style="flex:1; overflow-y:auto; padding:0 12px 8px;">
        <div id="scanned-members-list" style="display:flex; flex-direction:column; gap:6px;">
          <div id="empty-members-msg" style="color:#94a3b8; font-size:12px; text-align:center; padding:20px; font-style:italic;">Még nincs raklap beolvasva.</div>
        </div>
      </div>

      <div class="pda-bottom-nav" style="display:flex; padding:12px 16px; background:#fff; border-top:1px solid #e2e8f0; align-items:center; justify-content:space-between;">
        <div class="pda-nav-home-btn" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; color:#64748b;">
          <svg fill="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span style="font-size:10px; font-weight:600; margin-top:2px;">Főoldal</span>
        </div>
        <button id="btn-scan-next" style="cursor:pointer; border:none; display:flex; align-items:center; justify-content:center; background:#4f46e5; color:white; border-radius:8px; padding:0 16px; height:44px; font-size:12px; font-weight:700; opacity:0.5;" disabled>
          Címke nyomtatása →
        </button>
      </div>
    </div>

    ${renderPalletFlow({ userName, title: 'Összeemelés' })}
  `;

  // ── DOM ELEMEK ────────────────────────────────────────────────────
  const paneScanMember = container.querySelector('#pane-scan-member');
  const panePrint      = container.querySelector('#pane-print');
  const paneLocation   = container.querySelector('#pane-dest');
  const paneScan       = container.querySelector('#pane-sscc');

  const scanTruckName      = container.querySelector('#scan-truck-name');
  const memberBarcode      = container.querySelector('#member-barcode');
  const memberScanError    = container.querySelector('#member-scan-error');
  const scannedMembersList = container.querySelector('#scanned-members-list');
  const emptyMembersMsg    = container.querySelector('#empty-members-msg');
  const btnScanNext        = container.querySelector('#btn-scan-next');
  const scannedMembers = new Map(); // id -> label data

  const printPrinterInput = container.querySelector('#print-printer-barcode');
  const printBtn          = container.querySelector('#print-btn');

  const locBarcode         = container.querySelector('#dest-vonalkod');
  const locError           = container.querySelector('#dest-error');
  const btnLocNext         = container.querySelector('#btn-dest-save');

  const scanBarcodeInput = container.querySelector('#sscc-vonalkod');
  const scanError        = container.querySelector('#scan-error');

  // ── NAVIGÁCIÓ ────────────────────────────────────────────────────
  const showPane = (pane) => {
    [paneScanMember, panePrint, paneLocation, paneScan].forEach(p => {
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
    else if (panePrint.classList.contains('active')) showPane(paneScanMember);
    else goDashboard();
  };
  container.querySelectorAll('.pda-nav-home-btn').forEach(b => b.addEventListener('click', goDashboard));
  container.querySelectorAll('.pda-nav-back-btn, .pda-nav-labels-back-btn').forEach(b => b.addEventListener('click', goBack));
  if (window._currentHwBack) window.removeEventListener('hwBack', window._currentHwBack);
  window._currentHwBack = goBack;
  window.addEventListener('hwBack', goBack);

  // ── PANE 1: Raklapok beolvasása ───────────────────────────────────────
  function renderScannedMembers() {
    scannedMembersList.innerHTML = '';
    if (scannedMembers.size === 0) {
      emptyMembersMsg.style.display = 'block';
      scannedMembersList.appendChild(emptyMembersMsg);
    } else {
      emptyMembersMsg.style.display = 'none';
      scannedMembers.forEach(label => {
        const item = document.createElement('div');
        item.style.cssText = 'background:#fff; border:1.5px solid #e2e8f0; border-radius:8px; padding:10px 10px 10px 12px; display:flex; align-items:center; gap:10px; justify-content:space-between;';
        item.innerHTML = `
          <div style="flex:1; min-width:0;">
            <div style="font-size:12px; font-weight:800; color:#0f172a; font-family:monospace; letter-spacing:0.5px; word-break:break-all;">${escHtml(label.sscc)}</div>
            <div style="font-size:11px; color:#334155; font-weight:600; margin-top:2px;">${escHtml(label.product_name || '-')}</div>
          </div>
          <button class="remove-member-btn" data-id="${label.id}" style="cursor:pointer; background:none; border:none; color:#dc2626; padding:8px; border-radius:4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path>
            </svg>
          </button>
        `;
        
        item.querySelector('.remove-member-btn').addEventListener('click', () => {
          if (generatingLabel) return;
          scannedMembers.delete(label.id);
          selectedLabelIds.delete(label.id);
          if (scannedMembers.size === 0) {
            selectedTruck = null;
            scanTruckName.textContent = 'Nincs kamion azonosítva';
          }
          updateScanNextBtn();
          renderScannedMembers();
          setTimeout(() => memberBarcode.focus(), 50);
        });

        scannedMembersList.appendChild(item);
      });
    }
  }

  function updateScanNextBtn() {
    const enough = !generatingLabel && scannedMembers.size >= 2;
    btnScanNext.disabled = !enough;
    btnScanNext.style.opacity = enough ? '1' : '0.5';
  }

  setTimeout(() => { if (!isBusy()) memberBarcode.focus(); }, 150);

  memberBarcode.addEventListener('keydown', async (e) => {
    if (generatingLabel) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const sscc = memberBarcode.value.trim();
      if (!sscc) return;
      memberBarcode.disabled = true;
      memberScanError.style.display = 'none';
      memberScanError.textContent = '';

      try {
        const res = await apiFetch(`/api/v1/pda/consolidation-member?sscc=${encodeURIComponent(sscc)}`);
        const data = await res.json();
        
        if (res.ok && data.success && data.label) {
          const lbl = data.label;
          if (scannedMembers.has(lbl.id)) {
            memberScanError.textContent = 'Ezt a raklapot már hozzáadtad.';
            memberScanError.style.display = 'block';
          } else {
            if (!selectedTruck) {
              selectedTruck = {
                id: lbl.truck_id,
                truck_number: lbl.truck_number,
                target_locations: lbl.target_locations
              };
              scanTruckName.textContent = lbl.truck_number;
            } else if (selectedTruck.id !== lbl.truck_id) {
              memberScanError.textContent = 'Ez a raklap egy másik kamionhoz tartozik! Ezért nem lehetséges az összeemelése a megelőzővel.';
              memberScanError.style.display = 'block';
              memberBarcode.disabled = false;
              memberBarcode.value = '';
              memberBarcode.focus();
              return;
            }
            
            scannedMembers.set(lbl.id, lbl);
            selectedLabelIds.add(lbl.id);
            memberBarcode.value = '';
            renderScannedMembers();
            updateScanNextBtn();
          }
        } else {
          memberScanError.textContent = (data && data.error) || 'Hiba a raklap ellenőrzésekor.';
          memberScanError.style.display = 'block';
        }
      } catch (err) {
        memberScanError.textContent = 'Hálózati hiba a raklap ellenőrzésekor.';
        memberScanError.style.display = 'block';
      } finally {
        memberBarcode.disabled = false;
        setTimeout(() => memberBarcode.focus(), 50);
      }
    }
  });

  btnScanNext.addEventListener('click', async () => {
    if (scannedMembers.size < 2 || btnScanNext.disabled) return;

    const originalHtml = btnScanNext.innerHTML;
    generatingLabel = true;
    btnScanNext.innerHTML = '⌛ Generálás...';
    btnScanNext.disabled = true;

    try {
      const res = await apiFetch('/api/v1/pda/consolidation-preview', {
        method: 'POST',
        body: JSON.stringify({ labelIds: Array.from(scannedMembers.keys()) })
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
      btnScanNext.innerHTML = originalHtml;
      updateScanNextBtn();
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
