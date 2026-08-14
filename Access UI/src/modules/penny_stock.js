/**
 * GAVA ERP – PENNY Stock modul
 * v1.1.0 – PENNY partner stock nyilvántartó, összevető és lezárt készlet kezelő modul
 */

export function renderPennyStock(container, windowManager) {
  container.style.overflow = 'auto';
  container.style.padding = '0';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';
  container.style.background = 'var(--bg-main, #f8fafc)';

  // All columns definition
  const COLUMNS = [
    { id: 'truck_no', label: 'Truck No', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '90px' },
    { id: 'arrival_date', label: 'Arrival Date', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '85px' },
    { id: 'product', label: 'Product', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '180px' },
    { id: 'quality', label: 'Quality', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '60px', align: 'center' },
    { id: 'box_type', label: 'Box Type', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '70px', align: 'center' },
    { id: 'partida', label: 'Partida', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '100px', align: 'center' },
    { id: 'lot', label: 'Lot', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '70px', align: 'center' },
    { id: 'opening_stock', label: 'Opening STOCK', bg: '#cbd5e1', color: '#000', defaultVisible: true, minWidth: '85px', align: 'right' },
    { id: 'alsonemedi', label: 'Alsónémedi', bg: '#bbf7d0', color: '#000', defaultVisible: true, minWidth: '85px', align: 'right' },
    { id: 'karcag', label: 'Karcag', bg: '#bbf7d0', color: '#000', defaultVisible: true, minWidth: '75px', align: 'right' },
    { id: 'veszprem', label: 'Veszprém', bg: '#bbf7d0', color: '#000', defaultVisible: true, minWidth: '85px', align: 'right' },
    { id: 'total_deliver', label: 'TOTAL DELIVER', bg: '#bfdbfe', color: '#000', defaultVisible: true, minWidth: '95px', align: 'right' },
    { id: 'depreciate', label: 'DEPRECIATE', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '90px', align: 'right' },
    { id: 'clase_ii', label: 'CLASE II. box', bg: '#fed7aa', color: '#000', defaultVisible: true, minWidth: '95px', align: 'right' },
    { id: 'final_stock', label: 'FINAL STOCK', bg: '#fed7aa', color: '#000', defaultVisible: true, minWidth: '95px', align: 'right' },
    { id: 'transport_date', label: 'Transport date', bg: '#fef08a', color: '#000', defaultVisible: true, minWidth: '95px', align: 'center' },
  ];

  // Load saved column visibility
  let visibleCols = {};
  try {
    const saved = localStorage.getItem('penny_stock_visible_columns');
    if (saved) visibleCols = JSON.parse(saved);
  } catch (e) {}

  COLUMNS.forEach(c => {
    if (visibleCols[c.id] === undefined) {
      visibleCols[c.id] = c.defaultVisible;
    }
  });

  // State
  let state = {
    activeTab: 'current', // 'current' | 'closed'
    pennyPartners: [],
    seasons: [],
    
    // Aktuális Stock állapot
    selectedPartnerId: '',
    selectedPartnerName: '',
    transportDate: '',
    preparationPercent: 0, // Összekészítés állapota %

    // Lezárt Stockok állapot
    closedPartnerId: '',
    closedPartnerName: '',
    selectedSeason: '25-26',
    selectedClosedStockId: '',
    selectedClosedStockLabel: '',

    loadingPartners: true,
  };

  // Mock lezárt stockok a szezonokhoz (később backendből érkezik)
  const MOCK_CLOSED_STOCKS = {
    '25-26': [
      { id: 'c1', date: '2026.07.20', user: 'Kovács János', label: '2026.07.20 – Kovács János' },
      { id: 'c2', date: '2026.07.13', user: 'Admin', label: '2026.07.13 – Admin' },
      { id: 'c3', date: '2026.07.06', user: 'Iroda1', label: '2026.07.06 – Iroda1' },
    ],
    '24-25': [
      { id: 'c4', date: '2025.07.21', user: 'Kovács János', label: '2025.07.21 – Kovács János' },
      { id: 'c5', date: '2025.07.14', user: 'Admin', label: '2025.07.14 – Admin' },
    ],
  };

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding: 16px 24px; display:flex; flex-direction:column; gap:12px; flex:1; min-height:100%;';
  container.appendChild(wrapper);

  function renderModule() {
    wrapper.innerHTML = `
      <!-- Header -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="Penny logo.jpg" alt="PENNY" style="height:28px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <div>
            <h2 style="margin:0; font-size:20px; font-weight:700; color:var(--text-primary, #0f172a); display:flex; align-items:center; gap:8px;">
              PENNY – Stock Kezelés
            </h2>
            <p style="margin:0; font-size:12px; color:var(--text-muted, #64748b);">Aktuális készletek és lezárt időszakok kezelése</p>
          </div>
        </div>

        <!-- Main Tabs -->
        <div style="display:flex; background:#e2e8f0; padding:3px; border-radius:10px; gap:4px;">
          <button id="penny-tab-current" class="penny-tab-btn ${state.activeTab === 'current' ? 'active' : ''}" style="border:none; padding:6px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; ${state.activeTab === 'current' ? 'background:#fff; color:#b91c1c; box-shadow:0 2px 4px rgba(0,0,0,0.08);' : 'background:transparent; color:#64748b;'}">
            📦 Aktuális Stock
          </button>
          <button id="penny-tab-closed" class="penny-tab-btn ${state.activeTab === 'closed' ? 'active' : ''}" style="border:none; padding:6px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; ${state.activeTab === 'closed' ? 'background:#fff; color:#b91c1c; box-shadow:0 2px 4px rgba(0,0,0,0.08);' : 'background:transparent; color:#64748b;'}">
            🔒 Lezárt Stockok
          </button>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div id="penny-tab-content" style="display:flex; flex-direction:column; flex:1;">
        ${state.activeTab === 'current' ? renderAktualisStockHtml() : renderLezartStockokHtml()}
      </div>
    `;

    bindEvents();
  }

  function renderAktualisStockHtml() {
    return `
      <!-- Toolbar Controls -->
      <div class="access-form-view" style="background:#ffffff; border:1px solid var(--border, #cbd5e1); border-radius:12px; padding:12px 18px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end;">
        
        <!-- 1. Partner Dropdown (Kötelező) -->
        <div style="flex:1; min-width:240px; max-width:320px;">
          <label style="font-size:11px; font-weight:700; display:block; margin-bottom:4px; color:#b91c1c;">
            Partner: * <span style="font-size:10px; font-weight:normal; color:#64748b;">(Penny partner)</span>
          </label>
          <select id="penny-filter-partner" class="access-control-input" style="width:100%; font-size:13px; padding:6px 10px; height:34px; border:1px solid ${!state.selectedPartnerId ? '#f87171' : 'var(--border, #cbd5e1)'}; border-radius:8px; background:#fff; font-weight:600;">
            <option value="">– Válasszon Partnert –</option>
            ${state.pennyPartners.map(p => `
              <option value="${p.id}" ${String(state.selectedPartnerId) === String(p.id) ? 'selected' : ''}>${p.name}</option>
            `).join('')}
          </select>
        </div>

        <!-- 2. Szállítási Dátum -->
        <div style="min-width:140px; max-width:170px;">
          <label style="font-size:11px; font-weight:600; display:block; margin-bottom:4px; color:#334155;">
            Szállítási dátum:
          </label>
          <input type="date" id="penny-filter-date" class="access-control-input" value="${state.transportDate}" style="width:100%; font-size:12px; padding:5px 8px; height:34px; border-radius:8px; background:#fff;" title="Ha nincs kitöltve, a legfrissebb adatot listázza">
        </div>

        <!-- 3. Beállítás (Oszlopok) -->
        <div>
          <button id="penny-btn-settings" class="secondary-btn" style="height:34px; padding:0 12px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; border:1px solid var(--border, #cbd5e1);" title="Oszlopok testreszabása">
            ⚙️ Beállítás
          </button>
        </div>

        <!-- 4. Rendelés megtekintése -->
        <div>
          <button id="penny-btn-view-order" class="secondary-btn" style="height:34px; padding:0 12px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; border:1px solid var(--border, #cbd5e1);">
            👁️ Rendelés megtekintése
          </button>
        </div>

        <!-- 5. Összekészítés állapota -->
        <div style="display:flex; flex-direction:column; justify-content:center; padding:0 8px; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">
          <span style="font-size:10px; color:#64748b; font-weight:600; text-transform:uppercase;">Összekészítés állapota:</span>
          <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
            <div style="width:80px; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
              <div style="width:${state.preparationPercent}%; height:100%; background:#22c55e; border-radius:4px;"></div>
            </div>
            <span style="font-size:12px; font-weight:700; color:#0f172a;">${state.preparationPercent}%</span>
          </div>
        </div>

        <!-- 6. Ellenőrzőlap nyomtatása -->
        <div>
          <button id="penny-btn-print" class="secondary-btn" style="height:34px; padding:0 12px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; border:1px solid var(--border, #cbd5e1);" title="Ellenőrzőlap nyomtatása">
            🖨️ Ellenőrzőlap nyomtatása
          </button>
        </div>

        <!-- Exportálás excelbe (Aktuális Stock) -->
        <div>
          <button id="penny-btn-export-excel-current" class="secondary-btn" style="height:34px; padding:0 12px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; border:1px solid #16a34a; color:#15803d; background:#f0fdf4;" title="Exportálás Excel formátumba">
            📊 Exportálás excelbe
          </button>
        </div>

        <!-- 7. Stock lezárása -->
        <div>
          <button id="penny-btn-close-stock" class="primary-btn" style="height:34px; padding:0 14px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; background:#b91c1c;" title="Stock lezárása">
            🔒 Stock lezárása
          </button>
        </div>
      </div>

      <!-- Main Stock Table Area -->
      ${!state.selectedPartnerId ? `
        <!-- Empty Prompt when no partner is selected -->
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#ffffff; border:2px dashed #cbd5e1; border-radius:14px; padding:48px 24px; text-align:center; min-height:350px;">
          <div style="font-size:44px; margin-bottom:12px;">🏪</div>
          <h3 style="margin:0 0 6px 0; font-size:17px; font-weight:700; color:#1e293b;">Nincs kiválasztva Partner</h3>
          <p style="margin:0 0 16px 0; font-size:13px; color:#64748b; max-width:420px;">
            A Stock táblázat megjelenítéséhez kérjük, válassz ki egy <strong>PENNY partnert</strong> a fenti legördülő mezőből!
          </p>
          <div style="font-size:12px; color:#94a3b8; background:#f1f5f9; padding:6px 14px; border-radius:20px;">
            💡 Csak a Partner szerkesztőben <em>PENNY</em> láncjellemzővel ellátott partnerek listázódnak.
          </div>
        </div>
      ` : `
        <!-- Table container with Partner Header -->
        <div style="background:#ffffff; border:1px solid #94a3b8; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.06); display:flex; flex-direction:column; flex:1;">
          
          <!-- Table Top Title Banner (Matching Screenshot) -->
          <div style="background:#ffffff; border-bottom:2px solid #000000; text-align:center; padding:8px 16px; font-size:16px; font-weight:800; color:#000000; letter-spacing:0.5px;">
            ${state.selectedPartnerName || 'Eurogroup Espana'}
          </div>

          <!-- Table Wrapper -->
          <div style="overflow:auto; max-height:calc(100vh - 280px);">
            <table id="penny-current-stock-table" style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px;">
              <thead>
                <tr>
                  ${COLUMNS.filter(c => visibleCols[c.id]).map(c => `
                    <th style="background:${c.bg}; color:${c.color}; padding:6px 8px; border:1px solid #64748b; font-weight:700; font-size:11px; white-space:nowrap; text-align:${c.align || 'left'}; min-width:${c.minWidth};">
                      ${c.label}
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                <!-- Empty Placeholder Rows matching layout -->
                ${Array.from({ length: 8 }).map((_, idx) => `
                  <tr style="height:26px; ${idx % 2 === 1 ? 'background:rgba(241,245,249,0.5);' : ''}">
                    ${COLUMNS.filter(c => visibleCols[c.id]).map(c => `
                      <td style="border:1px solid #cbd5e1; padding:4px 8px; text-align:${c.align || 'left'}; color:#334155;">
                        &nbsp;
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Table Footer Info -->
          <div style="padding:8px 14px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; display:flex; justify-content:space-between; align-items:center;">
            <span>Sorok száma: <strong>0</strong> (Egyelőre nincs adat rögzítve a kiválasztott partnerhez)</span>
            <span>Szállítási dátum: <strong>${state.transportDate || 'Legfrissebb'}</strong></span>
          </div>
        </div>
      `}
    `;
  }

  function renderLezartStockokHtml() {
    const closedStocksForSeason = MOCK_CLOSED_STOCKS[state.selectedSeason] || [];

    return `
      <!-- Toolbar Controls for Lezárt Stockok -->
      <div class="access-form-view" style="background:#ffffff; border:1px solid var(--border, #cbd5e1); border-radius:12px; padding:12px 18px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end;">
        
        <!-- 1. Partner Dropdown (Kötelező) -->
        <div style="flex:1; min-width:220px; max-width:280px;">
          <label style="font-size:11px; font-weight:700; display:block; margin-bottom:4px; color:#b91c1c;">
            Partner: * <span style="font-size:10px; font-weight:normal; color:#64748b;">(Penny partner)</span>
          </label>
          <select id="penny-closed-partner" class="access-control-input" style="width:100%; font-size:13px; padding:6px 10px; height:34px; border:1px solid ${!state.closedPartnerId ? '#f87171' : 'var(--border, #cbd5e1)'}; border-radius:8px; background:#fff; font-weight:600;">
            <option value="">– Válasszon Partnert –</option>
            ${state.pennyPartners.map(p => `
              <option value="${p.id}" ${String(state.closedPartnerId) === String(p.id) ? 'selected' : ''}>${p.name}</option>
            `).join('')}
          </select>
        </div>

        <!-- 2. Season Dropdown -->
        <div style="min-width:130px; max-width:160px;">
          <label style="font-size:11px; font-weight:600; display:block; margin-bottom:4px; color:#334155;">
            Season:
          </label>
          <select id="penny-closed-season" class="access-control-input" style="width:100%; font-size:12px; height:34px; border-radius:8px; background:#fff; font-weight:600;">
            ${(state.seasons.length ? state.seasons : [{ code: '25-26' }, { code: '24-25' }, { code: '23-24' }]).map(s => `
              <option value="${s.code}" ${state.selectedSeason === s.code ? 'selected' : ''}>Season ${s.code}</option>
            `).join('')}
          </select>
        </div>

        <!-- 3. Lezárt stock dátuma / választó Dropdown -->
        <div style="min-width:220px; max-width:280px;">
          <label style="font-size:11px; font-weight:600; display:block; margin-bottom:4px; color:#334155;">
            Lezárt stock:
          </label>
          <select id="penny-closed-stock-select" class="access-control-input" style="width:100%; font-size:12px; height:34px; border-radius:8px; background:#fff;">
            <option value="">– Válasszon lezárt stockot –</option>
            ${closedStocksForSeason.map(cs => `
              <option value="${cs.id}" ${state.selectedClosedStockId === cs.id ? 'selected' : ''}>${cs.label}</option>
            `).join('')}
          </select>
        </div>

        <!-- 4. Beállítás (Oszlopok) -->
        <div>
          <button id="penny-btn-settings-closed" class="secondary-btn" style="height:34px; padding:0 12px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; border:1px solid var(--border, #cbd5e1);" title="Oszlopok testreszabása">
            ⚙️ Beállítás
          </button>
        </div>

        <!-- 5. Exportálás excelbe -->
        <div>
          <button id="penny-btn-export-excel-closed" class="secondary-btn" style="height:34px; padding:0 12px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; border:1px solid #16a34a; color:#15803d; background:#f0fdf4;" title="Exportálás Excel formátumba">
            📊 Exportálás excelbe
          </button>
        </div>
      </div>

      <!-- Lezárt Stockok Táblázat Nézet -->
      ${!state.closedPartnerId ? `
        <!-- Nincs partner kiválasztva -->
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#ffffff; border:2px dashed #cbd5e1; border-radius:14px; padding:48px 24px; text-align:center; min-height:350px;">
          <div style="font-size:44px; margin-bottom:12px;">🔒</div>
          <h3 style="margin:0 0 6px 0; font-size:17px; font-weight:700; color:#1e293b;">Nincs kiválasztva Partner</h3>
          <p style="margin:0 0 16px 0; font-size:13px; color:#64748b; max-width:420px;">
            A Lezárt Stockok táblázat megjelenítéséhez kérjük, válassz ki egy <strong>PENNY partnert</strong> a fenti legördülő mezőből!
          </p>
        </div>
      ` : !state.selectedClosedStockId ? `
        <!-- Partner ki van választva, de stock még nincs -->
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:48px 24px; text-align:center; min-height:350px;">
          <div style="font-size:36px; margin-bottom:12px;">📅</div>
          <h3 style="margin:0 0 6px 0; font-size:16px; font-weight:700; color:#1e293b;">Válassz ki egy lezárt stock időpontot</h3>
          <p style="margin:0; font-size:13px; color:#64748b; max-width:420px;">
            A(z) <strong>${state.closedPartnerName}</strong> partnerhez válassz ki egy lezárt stockot a fenti legördülőből!
          </p>
        </div>
      ` : `
        <!-- Táblázat a kiválasztott lezárt stockhoz (Világos, letisztult stílus) -->
        <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05); display:flex; flex-direction:column; flex:1;">
          
          <!-- Header Banner -->
          <div style="background:#ffffff; border-bottom:2px solid #000000; text-align:center; padding:8px 16px; font-size:16px; font-weight:800; color:#000000; letter-spacing:0.5px;">
            ${state.closedPartnerName} – ${state.selectedClosedStockLabel}
          </div>

          <!-- Table Wrapper -->
          <div style="overflow:auto; max-height:calc(100vh - 280px);">
            <table id="penny-closed-stock-table" style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px;">
              <thead>
                <tr>
                  ${COLUMNS.filter(c => visibleCols[c.id]).map(c => `
                    <th style="background:${c.bg}; color:${c.color}; padding:6px 8px; border:1px solid #94a3b8; font-weight:700; font-size:11px; white-space:nowrap; text-align:${c.align || 'left'}; min-width:${c.minWidth};">
                      ${c.label}
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: 6 }).map((_, idx) => `
                  <tr style="height:26px; ${idx % 2 === 1 ? 'background:rgba(241,245,249,0.5);' : ''}">
                    ${COLUMNS.filter(c => visibleCols[c.id]).map(c => `
                      <td style="border:1px solid #cbd5e1; padding:4px 8px; text-align:${c.align || 'left'}; color:#334155;">
                        &nbsp;
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Table Footer Info -->
          <div style="padding:8px 14px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; display:flex; justify-content:space-between; align-items:center;">
            <span>Lezárt stock állomány: <strong>${state.selectedClosedStockLabel}</strong></span>
            <span>Szezon: <strong>Season ${state.selectedSeason}</strong></span>
          </div>
        </div>
      `}
    `;
  }

  function exportTableToExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) {
      alert('Nincs exportálható táblázat adat.');
      return;
    }

    const rows = [];
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
      headers.push(`"${th.innerText.replace(/"/g, '""').trim()}"`);
    });
    rows.push(headers.join(';'));

    table.querySelectorAll('tbody tr').forEach(tr => {
      const row = [];
      tr.querySelectorAll('td').forEach(td => {
        const text = td.innerText.replace(/\u00a0/g, ' ').replace(/"/g, '""').trim();
        row.push(`"${text}"`);
      });
      rows.push(row.join(';'));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename || 'penny_stock_export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function openSettingsModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; align-items:center; justify-content:center;';
    
    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:90%; max-width:460px; border-radius:14px; box-shadow:0 20px 60px rgba(0,0,0,0.3); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column;">
        <div style="padding:14px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#f8fafc;">
          <h3 style="margin:0; font-size:15px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:6px;">
            ⚙️ Oszlopok megjelenítése
          </h3>
          <button id="penny-modal-close-x" style="background:none; border:none; font-size:18px; cursor:pointer; color:#64748b;">✕</button>
        </div>
        
        <div style="padding:16px 18px; max-height:400px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
            <button id="penny-select-all-cols" style="background:none; border:none; color:#2563eb; cursor:pointer; font-weight:600; padding:0;">Mindet bejelöl</button>
            <button id="penny-deselect-all-cols" style="background:none; border:none; color:#64748b; cursor:pointer; font-weight:600; padding:0;">Mindet töröl</button>
          </div>
          ${COLUMNS.map(c => `
            <label style="display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:6px; background:#f8fafc; font-size:13px; font-weight:500; color:#1e293b; cursor:pointer;">
              <input type="checkbox" class="penny-col-checkbox" data-col-id="${c.id}" ${visibleCols[c.id] ? 'checked' : ''} style="width:16px; height:16px; accent-color:#b91c1c;">
              <span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:${c.bg}; border:1px solid #94a3b8; margin-right:2px;"></span>
              ${c.label}
            </label>
          `).join('')}
        </div>

        <div style="padding:12px 18px; border-top:1px solid #e2e8f0; background:#f8fafc; display:flex; justify-content:flex-end; gap:8px;">
          <button id="penny-modal-cancel-btn" class="secondary-btn" style="padding:6px 14px; border-radius:8px; font-size:12px;">Mégse</button>
          <button id="penny-modal-save-btn" class="primary-btn" style="padding:6px 16px; border-radius:8px; font-size:12px; background:#b91c1c;">Mentés</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    modalOverlay.querySelector('#penny-modal-close-x')?.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.querySelector('#penny-modal-cancel-btn')?.addEventListener('click', () => modalOverlay.remove());
    
    modalOverlay.querySelector('#penny-select-all-cols')?.addEventListener('click', () => {
      modalOverlay.querySelectorAll('.penny-col-checkbox').forEach(cb => cb.checked = true);
    });
    modalOverlay.querySelector('#penny-deselect-all-cols')?.addEventListener('click', () => {
      modalOverlay.querySelectorAll('.penny-col-checkbox').forEach(cb => cb.checked = false);
    });

    modalOverlay.querySelector('#penny-modal-save-btn')?.addEventListener('click', () => {
      modalOverlay.querySelectorAll('.penny-col-checkbox').forEach(cb => {
        visibleCols[cb.dataset.colId] = cb.checked;
      });
      try {
        localStorage.setItem('penny_stock_visible_columns', JSON.stringify(visibleCols));
      } catch (e) {}
      modalOverlay.remove();
      renderModule();
    });
  }

  function bindEvents() {
    // Tabs
    wrapper.querySelector('#penny-tab-current')?.addEventListener('click', () => {
      state.activeTab = 'current';
      renderModule();
    });
    wrapper.querySelector('#penny-tab-closed')?.addEventListener('click', () => {
      state.activeTab = 'closed';
      renderModule();
    });

    // Aktuális Stock: Partner select
    const partnerSelect = wrapper.querySelector('#penny-filter-partner');
    if (partnerSelect) {
      partnerSelect.addEventListener('change', (e) => {
        state.selectedPartnerId = e.target.value;
        const pObj = state.pennyPartners.find(p => String(p.id) === String(e.target.value));
        state.selectedPartnerName = pObj ? pObj.name : '';
        renderModule();
      });
    }

    // Aktuális Stock: Date picker
    const dateInput = wrapper.querySelector('#penny-filter-date');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        state.transportDate = e.target.value;
      });
    }

    // Aktuális Stock: Settings
    wrapper.querySelector('#penny-btn-settings')?.addEventListener('click', openSettingsModal);

    // Aktuális Stock: Export Excel
    wrapper.querySelector('#penny-btn-export-excel-current')?.addEventListener('click', () => {
      if (!state.selectedPartnerId) {
        alert('Kérlek válassz ki egy partnert az exportáláshoz!');
        return;
      }
      const safeName = (state.selectedPartnerName || 'penny_stock').replace(/[^a-zA-Z0-9_-]/g, '_');
      exportTableToExcel('penny-current-stock-table', `Penny_Stock_${safeName}_${state.transportDate || 'aktualis'}`);
    });

    // Aktuális Stock: View Order
    wrapper.querySelector('#penny-btn-view-order')?.addEventListener('click', () => {
      if (!state.selectedPartnerId) {
        alert('Kérlek válassz ki egy partnert a rendelések megtekintéséhez!');
        return;
      }
      alert(`Rendelés megtekintése: ${state.selectedPartnerName}`);
    });

    // Aktuális Stock: Print
    wrapper.querySelector('#penny-btn-print')?.addEventListener('click', () => {
      if (!state.selectedPartnerId) {
        alert('Kérlek válassz ki egy partnert az ellenőrzőlap nyomtatásához!');
        return;
      }
      window.print();
    });

    // Aktuális Stock: Close Stock
    wrapper.querySelector('#penny-btn-close-stock')?.addEventListener('click', () => {
      if (!state.selectedPartnerId) {
        alert('Kérlek válassz ki egy partnert a stock lezárásához!');
        return;
      }
      if (confirm(`Biztosan lezárod a(z) "${state.selectedPartnerName}" partner aktuális stockját?`)) {
        alert('Stock sikeresen lezárva!');
      }
    });

    // ── Lezárt Stockok eseménykezelők ──
    const closedPartnerSelect = wrapper.querySelector('#penny-closed-partner');
    if (closedPartnerSelect) {
      closedPartnerSelect.addEventListener('change', (e) => {
        state.closedPartnerId = e.target.value;
        const pObj = state.pennyPartners.find(p => String(p.id) === String(e.target.value));
        state.closedPartnerName = pObj ? pObj.name : '';
        renderModule();
      });
    }

    const closedSeasonSelect = wrapper.querySelector('#penny-closed-season');
    if (closedSeasonSelect) {
      closedSeasonSelect.addEventListener('change', (e) => {
        state.selectedSeason = e.target.value;
        state.selectedClosedStockId = '';
        state.selectedClosedStockLabel = '';
        renderModule();
      });
    }

    const closedStockSelect = wrapper.querySelector('#penny-closed-stock-select');
    if (closedStockSelect) {
      closedStockSelect.addEventListener('change', (e) => {
        state.selectedClosedStockId = e.target.value;
        const list = MOCK_CLOSED_STOCKS[state.selectedSeason] || [];
        const item = list.find(x => x.id === e.target.value);
        state.selectedClosedStockLabel = item ? item.label : '';
        renderModule();
      });
    }

    wrapper.querySelector('#penny-btn-settings-closed')?.addEventListener('click', openSettingsModal);

    wrapper.querySelector('#penny-btn-export-excel-closed')?.addEventListener('click', () => {
      if (!state.closedPartnerId || !state.selectedClosedStockId) {
        alert('Kérlek válassz ki egy partnert és egy lezárt stockot az exportáláshoz!');
        return;
      }
      const safeName = (state.closedPartnerName || 'lezart_stock').replace(/[^a-zA-Z0-9_-]/g, '_');
      exportTableToExcel('penny-closed-stock-table', `Penny_Lezart_Stock_${safeName}_${state.selectedSeason}`);
    });
  }

  // Initial Data Load
  async function loadInitialData() {
    try {
      const [partnersRes, seasonsRes] = await Promise.all([
        fetch('/api/v1/partners?status=active&chain=Penny&limit=500'),
        fetch('/api/v1/seasons').catch(() => null)
      ]);

      if (partnersRes && partnersRes.ok) {
        state.pennyPartners = await partnersRes.json();
      }
      if (seasonsRes && seasonsRes.ok) {
        state.seasons = await seasonsRes.json();
        if (state.seasons.length > 0 && !state.selectedSeason) {
          state.selectedSeason = state.seasons[0].code;
        }
      }
    } catch (err) {
      console.error('Hiba az adatok betöltésekor:', err);
    } finally {
      state.loadingPartners = false;
      renderModule();
    }
  }

  renderModule();
  loadInitialData();
}
