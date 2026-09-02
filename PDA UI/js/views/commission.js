/**
 * commission.js – PDA Komissió modul
 */
import { showView, apiFetch } from '../app.js';

export async function renderCommission(container, params = {}) {
  container.innerHTML = `
    <style>
      .pda-comm-header {
        background: #fff;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #edf2f7;
      }
      .pda-comm-back {
        background: none; border: none; color: var(--clr-primary); font-size: 18px; cursor: pointer; padding: 0 10px 0 0;
      }
      .pda-comm-title {
        font-size: 14px; font-weight: 700; color: var(--clr-text);
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
        background: #fef08a; /* Sárga kiemelés a képen a Termék oszlopon */
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
    </style>
    <div class="pda-view" style="display:flex;flex-direction:column;height:100%;background:#f8fafc;">
      <!-- Fejléc -->
      <div class="pda-comm-header">
        <button id="pda-commission-back" class="pda-comm-back">←</button>
        <span class="pda-comm-title">Komissió</span>
      </div>

      <!-- Vezérlők -->
      <div class="pda-comm-controls">
        <label class="pda-comm-label">Terület kiválasztás</label>
        <select class="pda-comm-select" id="pda-terulet-select">
          <option value="penny">Penny</option>
          <option value="spar">Spar</option>
          <option value="tesco">Tesco</option>
          <option value="aldi" selected>Aldi</option>
          <option value="crossdocking">Crossdocking</option>
        </select>
      </div>

      <!-- Táblázat -->
      <div class="pda-comm-table-wrap">
        <table class="pda-comm-table">
          <thead>
            <tr>
              <th class="th-termek">Termék</th>
              <th>Kamionszám</th>
              <th>Kartonszám</th>
              <th>Típus</th>
              <th>Partner</th>
              <th>Cél raktár</th>
            </tr>
          </thead>
          <tbody id="pda-comm-tbody">
            <tr>
              <td colspan="6" style="text-align:center; padding: 20px; color: #94a3b8;">Adatok betöltése...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector('#pda-commission-back')?.addEventListener('click', () => showView('dashboard'));

  const select = container.querySelector('#pda-terulet-select');
  const tbody = container.querySelector('#pda-comm-tbody');

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
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: #94a3b8;">Nincs PDA-ra küldött aktív kamion / tétel.</td></tr>';
        } else {
          tbody.innerHTML = lines.map(row => `
            <tr>
              <td style="font-weight:600;">${row.termek || '-'}</td>
              <td><span class="pda-comm-truck-badge">${row.kamionszam || '-'}</span></td>
              <td style="text-align:center;"><span class="pda-comm-carton-box">${row.kartonszam != null ? row.kartonszam : 0}</span></td>
              <td>${row.tipus || '-'}</td>
              <td>${row.partner || '-'}</td>
              <td><strong>${row.celraktar || '-'}</strong></td>
            </tr>
          `).join('');
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

  select.addEventListener('change', loadData);
  loadData();
}

