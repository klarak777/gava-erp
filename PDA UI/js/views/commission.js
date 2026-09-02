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
        padding: 12px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pda-comm-label {
        font-size: 12px;
        font-weight: 700;
        color: var(--clr-text);
      }
      .pda-comm-select {
        flex: 1;
        padding: 6px;
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
        min-width: 320px; /* Hogy ne folyjon össze, inkább görgethető legyen picit oldalra */
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
      .pda-comm-table th:first-child {
        background: #fef08a; /* Sárga kiemelés a képen a Termék oszlopon */
        color: #854d0e;
      }
      .pda-comm-table td {
        padding: 8px 6px;
        border-bottom: 1px solid #f1f5f9;
        color: var(--clr-text);
        font-weight: 500;
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
          <option value="aldi">Aldi</option>
          <option value="crossdocking">Crossdocking</option>
        </select>
      </div>

      <!-- Táblázat -->
      <div class="pda-comm-table-wrap">
        <table class="pda-comm-table">
          <thead>
            <tr>
              <th>Termék</th>
              <th>Kartonszám</th>
              <th>Típus</th>
              <th>Partner</th>
              <th>Cél raktár</th>
            </tr>
          </thead>
          <tbody id="pda-comm-tbody">
            <tr>
              <td colspan="5" style="text-align:center; padding: 20px; color: #94a3b8;">Nincs kiválasztott kamion vagy adatok betöltése folyamatban...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector('#pda-commission-back')?.addEventListener('click', () => showView('dashboard'));

  if (params.truckId) {
    const select = container.querySelector('#pda-terulet-select');
    select.value = 'aldi'; // ALDI-ból jövünk

    const tbody = container.querySelector('#pda-comm-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Adatok betöltése...</td></tr>';
    
    try {
      const res = await apiFetch(`/api/v1/aldi-cross-docking/trucks/${params.truckId}/lines`);
      if (res.ok) {
        const lines = await res.json();
        if (lines.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #94a3b8;">Nincs tétel a kamionon.</td></tr>';
        } else {
          tbody.innerHTML = lines.map(row => `
            <tr>
              <td>${row.product_name || ''}</td>
              <td style="text-align:center;">${row.ordered_cartons || 0}</td>
              <td>${row.order_type || ''}</td>
              <td>${row.partner || ''}</td>
              <td><strong>${row.destination || ''}</strong></td>
            </tr>
          `).join('');
        }
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #ef4444;">Hiba a betöltéskor!</td></tr>';
      }
    } catch(err) {
      console.error('PDA Commission fetch error:', err);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #ef4444;">Hálózati hiba!</td></tr>';
    }
  }
}

