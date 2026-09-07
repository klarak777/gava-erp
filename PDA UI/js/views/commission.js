/**
 * commission.js – PDA Komissió modul
 */
import { showView, apiFetch } from '../app.js';

export async function renderCommission(container, params = {}) {
  container.innerHTML = `
    <style>
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
        flex: 1;
        padding: 5px 8px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 12px;
        background: #fff;
        color: var(--clr-text);
      }
      .pda-comm-table-wrap {
        flex: 1;
        overflow: auto;
        padding: 8px;
        background: #fff;
      }
      .pda-comm-table {
        width: 100%;
        min-width: 380px;
        border-collapse: collapse;
        font-size: 10px;
      }
      .pda-comm-table th {
        text-align: left;
        padding: 6px;
        border-bottom: 2px solid #e2e8f0;
        color: var(--clr-text-muted);
        font-weight: 700;
        white-space: nowrap;
      }
      .pda-comm-table th.th-termek {
        background: #fef08a;
        color: #854d0e;
      }
      .pda-comm-table td {
        padding: 6px;
        border-bottom: 1px solid #f1f5f9;
        color: var(--clr-text);
        font-weight: 500;
        white-space: nowrap;
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
      
      /* Pane styling (Next screens) */
      .pda-pane {
        display: none;
        flex-direction: column;
        height: 100%;
        background: #f8fafc;
      }
      .pda-pane.active {
        display: flex;
      }
      .pda-form-title {
        padding: 16px;
        text-align: center;
        font-size: 18px;
        font-weight: 800;
        color: #0f172a;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
      }
      .pda-form-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #f8fafc;
      }
      .pda-form-group {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .pda-form-group label {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 6px;
      }
      .pda-form-group input, .pda-form-group select {
        width: 100%;
        max-width: 300px;
        padding: 10px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 15px;
        background: #fff;
        color: #0f172a;
        text-align: left;
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
      <div class="pda-comm-header">
        <button id="pda-commission-back" class="pda-comm-back">←</button>
        <span class="pda-comm-title">Komissió</span>
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
      </div>
      <div class="pda-comm-table-wrap">
        <table class="pda-comm-table">
          <thead>
            <tr>
              <th class="th-termek">Termék</th>
              <th>Karton</th>
              <th>Típus</th>
              <th>Partner</th>
              <th>Cél raktár</th>
            </tr>
          </thead>
          <tbody id="pda-comm-tbody">
            <tr><td colspan="5" style="text-align:center; padding: 20px; color: #94a3b8;">Betöltés...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ŰRLAP NÉZET (1. Lépés) -->
    <div class="pda-pane" id="pane-form">
      <div class="pda-comm-header">
        <button id="pda-form-back" class="pda-comm-back">←</button>
        <span class="pda-comm-title">Komissió Adatok</span>
      </div>
      <div class="pda-form-title" id="form-title">Termék név</div>
      <div class="pda-form-body">
        <div class="pda-form-group">
          <label id="form-karton-label">Kartonszám</label>
          <input type="number" id="form-karton" min="1" />
          <div class="pda-form-error-msg" id="form-karton-error">⛔ A megadott mennyiség több mint a rendelt kartonszám!</div>
        </div>
        <div class="pda-form-group">
          <label>Bruttó kg</label>
          <input type="number" step="0.01" id="form-brutto" />
        </div>
        <div class="pda-form-group">
          <label>Göngyöleg típus</label>
          <select id="form-gongyoleg"></select>
        </div>
        <div class="pda-form-group">
          <label>Göngyöleg tára súly</label>
          <input type="number" step="0.001" id="form-tara" readonly />
        </div>
        <div class="pda-form-group">
          <label>Származási ország</label>
          <select id="form-orszag"></select>
        </div>
        <div class="pda-form-group">
          <label>Lot szám</label>
          <input type="text" id="form-lot" />
        </div>
        <div class="pda-form-group">
          <label>Raklap típus</label>
          <select id="form-raklap"></select>
        </div>
      </div>
      <div class="pda-form-footer">
        <button class="pda-btn pda-btn-primary" id="form-submit">Megadás</button>
      </div>
    </div>

    <!-- LOKÁCIÓ NÉZET (2. Lépés) -->
    <div class="pda-pane" id="pane-dest">
      <div class="pda-comm-header">
        <span class="pda-comm-title">Cél Lokáció</span>
      </div>
      <div class="pda-form-title" id="dest-title" style="font-size: 20px; color: #0ea5e9;">Cél lokáció neve jön ide</div>
      <div class="pda-form-body">
        <div class="pda-form-group">
          <label>Cél tárhely vonalkód</label>
          <input type="text" id="dest-vonalkod" placeholder="Vonalkód beolvasása..." />
        </div>
      </div>
      <div class="pda-form-footer">
        <button class="pda-btn pda-btn-primary" id="dest-ok">Kész</button>
      </div>
    </div>
  `;

  // Panes
  const paneList = container.querySelector('#pane-list');
  const paneForm = container.querySelector('#pane-form');
  const paneDest = container.querySelector('#pane-dest');
  
  function showPane(paneEl) {
    paneList.classList.remove('active');
    paneForm.classList.remove('active');
    paneDest.classList.remove('active');
    paneEl.classList.add('active');
  }

  // Navigation events
  const goDashboard = () => showView('dashboard');
  const goList = () => showPane(paneList);

  container.querySelector('#pda-commission-back')?.addEventListener('click', goDashboard);
  container.querySelector('#pda-form-back')?.addEventListener('click', goList);

  const hwBackHandler = () => {
    if (paneForm.classList.contains('active')) {
      goList();
    } else if (paneList.classList.contains('active')) {
      goDashboard();
    } else if (paneDest.classList.contains('active')) {
      goList();
      loadData(); // frissítjük az adatokat visszalépéskor
    }
  };
  window.addEventListener('hwBack', hwBackHandler);

  // Később, ha view váltás van, érdemes lenne leiratkozni, 
  // de mivel az egész `container.innerHTML` felülíródik, 
  // a legegyszerűbb, ha a showView kitakarítja, viszont a window listener felgyűlhet.
  // Mivel SPA, egy globális változóban tároljuk a feliratkozást vagy felülírjuk:
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
        const cartons = parseFloat(kartonInput.value) || 0;
        taraInput.value = (tareKg * cartons).toFixed(3);
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

  async function loadData() {
    const area = select.value;
    if (area !== 'aldi' && area !== 'crossdocking') {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: #94a3b8;">Nincs komissiózandó feladat ehhez a területhez.</td></tr>';
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
        const lines = await res.json();
        if (!lines || lines.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px; color: #94a3b8;">Nincs PDA-ra küldött aktív tétel.</td></tr>';
        } else {
          tbody.innerHTML = '';
          // Csak a még nem teljesen komissiózott sorok jelennek meg
          const pendingLines = lines.filter(row => !row.is_picked);
          if (pendingLines.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px; color: #16a34a; font-weight:700;">✔ Minden tétel komissiózva!</td></tr>';
          } else {
            pendingLines.forEach(row => {
              const tr = document.createElement('tr');
              tr.className = 'pda-comm-row';

              const ordered = row.kartonszam != null ? parseInt(row.kartonszam) : 0;
              const commissioned = row.komissziozott_kartonszam != null ? parseInt(row.komissziozott_kartonszam) : 0;
              const remaining = Math.max(0, ordered - commissioned);

              tr.innerHTML = `
                <td style="font-weight:600;">${row.termek || '-'}</td>
                <td style="text-align:center;"><span class="pda-comm-carton-box" title="Rendelt: ${ordered}, Komissiózott: ${commissioned}. Hátralévő: ${remaining}">${remaining}</span></td>
                <td>${row.tipus || '-'}</td>
                <td>${row.partner || '-'}</td>
                <td><strong>${row.celraktar || '-'}</strong></td>
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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #ef4444;">Hiba a betöltéskor (${res.status}: ${errData.error || res.statusText || 'Ismeretlen hiba'})</td></tr>`;
      }
    } catch (err) {
      console.error('PDA Commission fetch error:', err);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #ef4444;">Hálózati hiba: ${err.message || 'Kapcsolódás sikertelen'}</td></tr>`;
    }
  }

  function openForm(row, rowEl) {
    currentLineId = row.id;
    currentDestination = row.celraktar || '';
    currentRemaining = Math.max(0, (row.kartonszam || 0) - (row.komissziozott_kartonszam || 0));
    currentRowEl = rowEl || null;

    container.querySelector('#form-title').innerText = row.termek || 'Termék';
    container.querySelector('#dest-title').innerText = currentDestination;
    kartonLabel.textContent = (row.plt != null && row.plt !== '') ? `Kartonszám (${row.plt} db/plt)` : `Kartonszám (max. ${currentRemaining} db)`;
    kartonInput.value = ''; // A kartonszámot mindig a felhasználó adja meg, nincs előtöltés
    kartonInput.placeholder = currentRemaining > 0 ? `pl. ${currentRemaining}` : '0';
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
    let selectedPalletId = '';
    if (row.tipus && typeof palletTypes !== 'undefined') {
      const p = palletTypes.find(pt => pt.name === row.tipus);
      if (p) selectedPalletId = p.id;
    }
    container.querySelector('#form-raklap').value = selectedPalletId;
    container.querySelector('#dest-vonalkod').value = '';
    lastPickedQuantity = 0;

    showPane(paneForm);
  }

  submitBtn.addEventListener('click', async () => {
    if (!currentLineId) return;

    const qty = parseInt(kartonInput.value);

    if (!Number.isInteger(qty) || qty <= 0) {
      alert('Add meg a komissiózott kartonszámot (pozitív egész szám)!');
      return;
    }
    // Hard block: qty > remaining
    if (currentRemaining > 0 && qty > currentRemaining) {
      kartonInput.classList.add('pda-input-error');
      kartonError.classList.add('visible');
      kartonError.textContent = `⛔ A rendelt karton mennyisége (${currentRemaining} db) kevesebb, mint a megadott mennyiség (${qty} db). Csökkentsd a mennyiséget!`;
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      return;
    }
    if (taraManual && !taraInput.value) {
      alert('A göngyöleg típushoz nincs tára súly megadva – add meg kézzel a tára súlyt!');
      return;
    }

    if (!container.querySelector('#form-raklap').value) {
      alert('Válassz raklaptípust!');
      return;
    }
    const grossValue = Number(container.querySelector('#form-brutto').value);
    if (!Number.isFinite(grossValue) || grossValue <= 0 || taraInput.value === '' || !Number.isFinite(Number(taraInput.value)) || Number(taraInput.value) < 0) {
      alert('Adj meg pozitív bruttó súlyt és nem negatív göngyölegtárát!');
      return;
    }
    // Tároljuk a form adatait – az API hívás csak a "Kész" gombra történik,
    // hogy a komissiózás és a lokáció-hozzárendelés ATOMIAN, egy tranzakcióban menjen.
    lastPickedQuantity = qty;
    lastPickPayload = {
      picked_cartons: qty,
      gross_weight: parseFloat(container.querySelector('#form-brutto').value) || null,
      packaging_type: gongyolegSel.value || null,
      tare_weight: taraInput.value === '' ? null : Number(taraInput.value),
      origin_country: container.querySelector('#form-orszag').value || null,
      lot_number: container.querySelector('#form-lot').value || null,
      pallet_type: container.querySelector('#form-raklap').value || null
    };

    // Átlépünk a lokáció képernyőre (API hívás NÉLKÜL)
    container.querySelector('#dest-vonalkod').value = '';
    showPane(paneDest);
    setTimeout(() => container.querySelector('#dest-vonalkod').focus(), 100);
  });

  container.querySelector('#dest-ok').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    
    const barcodeInput = container.querySelector('#dest-vonalkod');
    const barcode = barcodeInput.value.trim();
    
    if (!barcode) {
      alert('Kérlek add meg a cél tárhely vonalkódját!');
      return;
    }
    
    try {
      btn.disabled = true;
      btn.style.opacity = '0.5';

      // Egyetlen atomi kérés: komissiózás + lokáció hozzárendelés egyszerre.
      // Ha a lokáció megtelt → a picked_cartons NEM módosul (rollback).
      const res = await apiFetch(`/api/v1/pda/commission-lines/${currentLineId}/pick-and-assign`, {
        method: 'PUT',
        body: JSON.stringify({ ...lastPickPayload, barcode })
      });
      
      if (res.ok) {
        const data = await res.json();
        barcodeInput.value = '';

        if (data.is_picked) {
          // Tétel teljesen komissiózva: sor eltüntetése a listából
          if (currentRowEl && currentRowEl.parentNode) {
            currentRowEl.parentNode.removeChild(currentRowEl);
          }
          if (tbody.querySelectorAll('tr').length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: #16a34a; font-weight:700;">✔ Minden tétel komissiózva!</td></tr>';
          }
        } else {
          // Részleges: frissítsük a sor kartonszámát a listában
          if (currentRowEl) {
            const box = currentRowEl.querySelector('.pda-comm-carton-box');
            if (box) {
              box.textContent = data.remaining;
              box.title = `Rendelt: ${data.ordered_cartons}, Komissiózott: ${data.picked_cartons}`;
            }
          }
        }

        showPane(paneList);
        loadData();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Hiba a lokáció mentésekor!');
        // A vonalkód mező kiürítése, hogy a felhasználó másik lokációt próbáljon
        barcodeInput.value = '';
        barcodeInput.focus();
      }
    } catch (e) {
      alert('Hálózati hiba a lokáció mentésekor!');
    } finally {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });

  select.addEventListener('change', loadData);
  
  await loadDictionaries();
  loadData();
}
