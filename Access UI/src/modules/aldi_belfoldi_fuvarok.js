/**
 * GAVA ERP – ALDI Belföldi Fuvarok modul
 */

export function renderAldiBelfoldiFuvarok(container, windowManager) {
  let state = {
    data: [], // API-ból
    currentPage: 1,
    itemsPerPage: 15,
    filters: {
      truckNum: '',
      plate: '',
      date: '',
      season: 'all',
      transporter: 'all',
      missingInvoice: false
    },
    transporters: new Set()
  };

  container.innerHTML = '';
  container.style.padding = '0';
  container.style.height = '100%';
  container.style.background = 'var(--bg-main, #f8fafc)';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  // Modal HTML
  const modalHtml = `
    <div id="aldi-invoice-modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:24px; border-radius:8px; width:450px; box-shadow:0 10px 25px rgba(0,0,0,0.2); font-family:Inter, sans-serif;">
            <h3 style="margin-top:0; color:#1e293b;">Számla (Invoice) feltöltése</h3>
            
            <div style="margin-bottom:12px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px; color:#475569;">Fuvarszámla száma</label>
                <input type="text" id="aldi-invoice-modal-number" class="access-control-input" style="width:100%; height:32px; font-size:14px; padding:4px 8px; box-sizing:border-box;">
            </div>

            <div id="aldi-invoice-modal-dropzone" style="border:2px dashed #cbd5e1; border-radius:6px; padding:20px; text-align:center; background:#f8fafc; cursor:pointer; margin-bottom:12px; transition:all 0.2s;">
                <div style="font-size:24px; margin-bottom:8px;">📄</div>
                <div style="font-size:13px; color:#64748b;">Húzd ide a fájlokat, vagy kattints a tallózáshoz.</div>
                <div id="aldi-invoice-modal-filename" style="margin-top:8px; font-size:12px; font-weight:600; color:#0f172a; word-break:break-all;"></div>
            </div>
            <input type="file" id="aldi-invoice-modal-fileinput" multiple style="display:none;">
            
            <div id="aldi-invoice-modal-status" style="font-size:12px; font-weight:600; margin-bottom:12px; min-height:16px;"></div>

            <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button id="aldi-invoice-modal-cancel" class="secondary-btn" style="padding:6px 16px;">Mégsem</button>
                <button id="aldi-invoice-modal-save" class="primary-btn" style="padding:6px 16px; background:#2563eb;">Feltöltés</button>
            </div>
        </div>
    </div>
    
    <div id="aldi-invoice-view-modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:24px; border-radius:8px; width:450px; box-shadow:0 10px 25px rgba(0,0,0,0.2); font-family:Inter, sans-serif;">
            <h3 style="margin-top:0; color:#1e293b;">Feltöltött számlák</h3>
            <div id="aldi-invoice-view-list" style="max-height:300px; overflow-y:auto; margin-bottom:16px; display:flex; flex-direction:column; gap:8px;"></div>
            <div style="display:flex; justify-content:flex-end;">
                <button id="aldi-invoice-view-close" class="secondary-btn" style="padding:6px 16px;">Bezárás</button>
            </div>
        </div>
    </div>`;

  if (!document.getElementById('aldi-invoice-modal-overlay')) {
      document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  var view = document.createElement('div');
  view.className = 'module-view fade-in';
  view.style.display = 'flex';
  view.style.flexDirection = 'column';
  view.style.height = '100%';

  view.innerHTML = `
    <!-- FEJLÉC: Cím és logó -->
    <div class="view-header" style="margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; padding: 20px 20px 0 20px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="AldiNord-WorldwideLogo.svg" alt="ALDI" style="height:32px; border-radius:4px;">
        <div>
          <h2 class="view-title" style="margin:0; font-size:24px; font-weight:700; color:#0f172a;">ALDI – Belföldi fuvarok</h2>
          <p class="view-subtitle" style="margin:4px 0 0 0; font-size:14px; color:#64748b;">Belföldi szállítások és fuvarszámlák kezelése</p>
        </div>
      </div>
    </div>

    <!-- SZŰRŐK SÁVJA -->
    <div style="margin: 0 20px 16px 20px; padding: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <div style="flex:1; min-width:140px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:6px; display:block; text-transform: uppercase;">Kamion szám</label>
        <input type="text" id="filter-truck-num" placeholder="Keresés..." style="font-size:13px; padding:6px 12px; height:34px; width:100%; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing:border-box; outline:none;">
      </div>
      <div style="flex:1; min-width:140px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:6px; display:block; text-transform: uppercase;">Rendszám</label>
        <input type="text" id="filter-plate" placeholder="Keresés..." style="font-size:13px; padding:6px 12px; height:34px; width:100%; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing:border-box; outline:none;">
      </div>
      <div style="flex:1; min-width:140px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:6px; display:block; text-transform: uppercase;">Rakodási nap</label>
        <input type="date" id="filter-date" style="font-size:13px; padding:6px 12px; height:34px; width:100%; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing:border-box; outline:none;">
      </div>
      <div style="flex:1; min-width:140px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:6px; display:block; text-transform: uppercase;">Szezon</label>
        <select id="filter-season" style="font-size:13px; padding:6px 12px; height:34px; width:100%; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing:border-box; outline:none; background: #fff url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>') no-repeat right 8px center; appearance: none;">
          <option value="all">-- Összes --</option>
        </select>
      </div>
      <div style="flex:1; min-width:140px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:6px; display:block; text-transform: uppercase;">Fuvarozó cég</label>
        <select id="filter-transporter" style="font-size:13px; padding:6px 12px; height:34px; width:100%; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing:border-box; outline:none; background: #fff url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>') no-repeat right 8px center; appearance: none;">
          <option value="all" selected>-- Összes --</option>
        </select>
      </div>
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; min-width:150px;">
        <input type="checkbox" id="filter-missing-invoice" style="width:16px; height:16px; cursor:pointer;">
        <label for="filter-missing-invoice" style="font-size:12px; font-weight:600; color:#475569; cursor:pointer; text-transform: uppercase;">Hiányzó fuvarszámla</label>
      </div>
      <div>
        <button id="btn-clear-filters" style="font-size:13px; font-weight:600; color:#3b82f6; background:#fff; border:1px solid #93c5fd; border-radius:6px; height:34px; padding:0 20px; cursor:pointer; transition: all 0.2s;">Szűrők törlése</button>
      </div>
    </div>

    <!-- TÁBLÁZAT -->
    <div style="margin: 0 20px 20px 20px; flex:1; display:flex; flex-direction:column; overflow:hidden; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="flex:1; overflow:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width:1000px;">
          <thead style="position:sticky; top:0; z-index:10; background:#f8fafc; border-bottom: 2px solid #e2e8f0;">
            <tr>
              <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">KAMIONSZÁM</th>
              <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">SZÁLLÍTÁSI NAP</th>
              <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">FUVAROZÓ</th>
              <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">RENDSZÁM</th>
              <th style="padding:12px 16px; text-align:right; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">GAVA RAKLAPSZÁM</th>
              <th style="padding:12px 16px; text-align:right; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">CROSSDOKING RAKLAPSZÁM</th>
              <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">KOMMENT</th>
              <th style="padding:12px 16px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">FUVARSZÁMLA</th>
            </tr>
          </thead>
          <tbody id="belfoldi-fuvarok-tbody">
            <tr><td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">Betöltés folyamatban...</td></tr>
          </tbody>
        </table>
      </div>
      
      <!-- LAPOZÓ (Pagination) -->
      <div id="belfoldi-pagination-container" style="display:flex; justify-content:flex-end; align-items:center; padding:12px 20px; border-top:1px solid #e2e8f0; background:#fff;">
      </div>
    </div>
  `;

  container.appendChild(view);

  const tbody = view.querySelector('#belfoldi-fuvarok-tbody');
  const paginationContainer = view.querySelector('#belfoldi-pagination-container');
  
  const inTruckNum = view.querySelector('#filter-truck-num');
  const inPlate = view.querySelector('#filter-plate');
  const inDate = view.querySelector('#filter-date');
  const selSeason = view.querySelector('#filter-season');
  const selTransporter = view.querySelector('#filter-transporter');
  const chkMissingInvoice = view.querySelector('#filter-missing-invoice');
  const clearBtn = view.querySelector('#btn-clear-filters');

  // Modal elements
  const invModalOverlay = document.getElementById('aldi-invoice-modal-overlay');
  const invModalNumber = document.getElementById('aldi-invoice-modal-number');
  const invModalDropzone = document.getElementById('aldi-invoice-modal-dropzone');
  const invModalFileinput = document.getElementById('aldi-invoice-modal-fileinput');
  const invModalFilename = document.getElementById('aldi-invoice-modal-filename');
  const invModalStatus = document.getElementById('aldi-invoice-modal-status');
  const invModalCancel = document.getElementById('aldi-invoice-modal-cancel');
  const invModalSave = document.getElementById('aldi-invoice-modal-save');
  const viewModalOverlay = document.getElementById('aldi-invoice-view-modal-overlay');
  const viewModalList = document.getElementById('aldi-invoice-view-list');
  const viewModalClose = document.getElementById('aldi-invoice-view-close');

  let currentUploadTruckId = null;
  let currentUploadTruckNum = null;
  let invSelectedFiles = [];

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSeasonDropdown() {
    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    if (currentMonth < 9) currentYear -= 1;
    
    selSeason.innerHTML = '<option value="all">-- Összes --</option>';
    for (let y = currentYear + 1; y >= currentYear - 1; y--) {
      const start = y.toString().substring(2);
      const end = (y + 1).toString().substring(2);
      const val = `Season ${start}-${end}`;
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      selSeason.appendChild(opt);
    }
    const currStart = currentYear.toString().substring(2);
    const currEnd = (currentYear + 1).toString().substring(2);
    selSeason.value = `Season ${currStart}-${currEnd}`;
    state.filters.season = selSeason.value;
  }

  async function loadTransporters() {
    try {
        const res = await fetch('/api/v1/transporters');
        if (res.ok) {
            const transporters = await res.json();
            selTransporter.innerHTML = '<option value="all">-- Összes --</option>' +
                transporters.map(t => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join('');
            selTransporter.value = state.filters.transporter;
        }
    } catch (err) {
        console.error('Hiba a fuvarozók betöltésekor:', err);
    }
  }

  initSeasonDropdown();
  loadTransporters();

  async function loadData() {
    try {
      const res = await fetch('/api/v1/aldi-cross-docking/trucks?_t=' + Date.now());
      if (!res.ok) throw new Error('Hiba a betöltéskor');
      
      let allTrucks = await res.json();
      allTrucks = allTrucks.filter(t => t.is_loaded === true);
      
      // Parse invoice_files
      allTrucks.forEach(t => {
          if (t.invoice_files && typeof t.invoice_files === 'string') {
              try { t.invoice_files = JSON.parse(t.invoice_files); } catch(e) { t.invoice_files = []; }
          }
      });

      state.data = allTrucks;

      renderTable();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:red;">Hálózati hiba!</td></tr>';
    }
  }

  async function saveField(id, field, value) {
    try {
      const res = await fetch(`/api/v1/aldi-cross-docking/trucks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      if (!res.ok) throw new Error('HTTP hiba: ' + res.status);
    } catch (err) {
      console.error('Update hiba', err);
      alert('Hiba történt a mentés során: ' + err.message);
      loadData(); // reload to revert
    }
  }

  function renderTable() {
    let filtered = state.data;
    
    if (state.filters.truckNum) {
      filtered = filtered.filter(d => (d.truck_number || '').toLowerCase().includes(state.filters.truckNum.toLowerCase()));
    }
    if (state.filters.plate) {
      filtered = filtered.filter(d => 
        (d.license_plate_1 || '').toLowerCase().includes(state.filters.plate.toLowerCase()) ||
        (d.license_plate_2 || '').toLowerCase().includes(state.filters.plate.toLowerCase())
      );
    }
    if (state.filters.date) {
      filtered = filtered.filter(d => (d.delivery_date || '').startsWith(state.filters.date));
    }
    if (state.filters.transporter && state.filters.transporter !== 'all') {
      filtered = filtered.filter(d => d.transporter === state.filters.transporter);
    }
    if (state.filters.missingInvoice) {
      filtered = filtered.filter(d => 
        (!d.invoice_files || d.invoice_files.length === 0) && 
        (!d.invoice_number || d.invoice_number.trim() === '')
      );
    }
    if (state.filters.season && state.filters.season !== 'all' && state.filters.season !== '') {
      const m = state.filters.season.match(/Season (\d+)-(\d+)/i);
      if (m) {
        const y1 = 2000 + parseInt(m[1], 10);
        const y2 = 2000 + parseInt(m[2], 10);
        const d1 = `${y1}-09-01`;
        const d2 = `${y2}-09-01`;
        filtered = filtered.filter(d => {
          if (!d.delivery_date) return false;
          const dateStr = d.delivery_date.substring(0, 10);
          return dateStr >= d1 && dateStr < d2;
        });
      }
    }

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / state.itemsPerPage));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }
    if (state.currentPage < 1) state.currentPage = 1;

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const pageData = filtered.slice(startIndex, startIndex + state.itemsPerPage);

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">Nincsenek megjeleníthető adatok</td></tr>';
      paginationContainer.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageData.map(d => {
      const plates = [];
      if (d.license_plate_1) plates.push(d.license_plate_1);
      if (d.license_plate_2) plates.push(d.license_plate_2);
      
      const hasFiles = d.invoice_files && d.invoice_files.length > 0;
      
      return `
        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <td style="padding:10px 16px; color:#0f172a; font-weight:600;">${escapeHtml(d.truck_number)}</td>
          <td style="padding:10px 16px; color:#475569; white-space:nowrap;">${d.delivery_date ? d.delivery_date.substring(0,10) : ''}</td>
          <td style="padding:10px 16px; color:#475569;">${escapeHtml(d.transporter)}</td>
          <td style="padding:10px 16px; color:#475569; white-space:nowrap;">${escapeHtml(plates.join(' / '))}</td>
          <td style="padding:10px 16px; color:#334155; text-align:right;">${parseFloat(d.total_pallets) || 0}</td>
          <td style="padding:6px 16px; text-align:right;">
            <input type="number" class="belfoldi-edit-input" data-id="${d.id}" data-field="crossdock_pallets" value="${d.crossdock_pallets || ''}" style="width:70px; border:1px solid transparent; border-radius:4px; padding:4px 6px; font-size:12px; text-align:right; background:transparent;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';">
          </td>
          <td style="padding:6px 16px;">
            <input type="text" class="belfoldi-edit-input" data-id="${d.id}" data-field="truck_comment" value="${escapeHtml(d.truck_comment)}" style="width:100%; min-width: 200px; border:1px solid transparent; border-radius:4px; padding:4px 6px; font-size:12px; background:transparent;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';">
          </td>
          <td style="padding:6px 16px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <input type="text" class="belfoldi-edit-input invoice-input" data-id="${d.id}" data-field="invoice_number" value="${escapeHtml(d.invoice_number)}" ${hasFiles ? 'readonly style="width:100%; border:none; background:transparent; font-size:12px; color:#2563eb; font-weight:600; cursor:pointer; text-decoration:underline;"' : 'style="width:100%; border:1px solid transparent; border-radius:4px; padding:4px 6px; font-size:12px; background:transparent;" onfocus="this.style.border=\'1px solid #93c5fd\'; this.style.background=\'#fff\';" onblur="this.style.border=\'1px solid transparent\'; this.style.background=\'transparent\';"'} title="${hasFiles ? 'Kattints a fájlok megtekintéséhez' : ''}">
                <span class="aldi-invoice-upload-btn" data-id="${d.id}" data-truck="${escapeHtml(d.truck_number)}" data-inv="${escapeHtml(d.invoice_number)}" title="Számla feltöltése" style="cursor:pointer; font-size:14px;">📄</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.belfoldi-edit-input:not(.invoice-input[readonly])').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const field = e.target.getAttribute('data-field');
        const val = e.target.type === 'number' && e.target.value === '' ? null : e.target.value;
        const rowData = state.data.find(r => r.id === id);
        if (rowData) {
          rowData[field] = val;
          saveField(id, field, val);
        }
      });
    });

    tbody.querySelectorAll('.aldi-invoice-upload-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentUploadTruckId = btn.getAttribute('data-id');
            currentUploadTruckNum = btn.getAttribute('data-truck');
            invModalNumber.value = btn.getAttribute('data-inv') || '';
            invSelectedFiles = [];
            invModalFilename.textContent = '';
            invModalStatus.textContent = '';
            invModalOverlay.style.display = 'flex';
        });
    });

    tbody.querySelectorAll('.invoice-input[readonly]').forEach(inp => {
        inp.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const rowData = state.data.find(r => r.id === id);
            if (rowData && rowData.invoice_files && rowData.invoice_files.length > 0) {
                viewModalList.innerHTML = '';
                rowData.invoice_files.forEach(f => {
                    const item = document.createElement('div');
                    item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid #e2e8f0; border-radius:4px; background:#f8fafc;';
                    item.innerHTML = `
                        <span style="font-size:13px; font-weight:500; color:#0f172a; word-break:break-all; flex:1; margin-right:8px;">📄 ${f.fileName}</span>
                        <div style="display:flex; gap:6px;">
                            <button class="primary-btn btn-dense" style="padding:4px 10px; font-size:12px;">Letöltés</button>
                        </div>
                    `;
                    
                    item.querySelector('button').addEventListener('click', () => {
                        window.open('/api/v1/uploads/aldi-invoice/file?truckId=' + encodeURIComponent(id) + '&fileName=' + encodeURIComponent(f.fileName), '_blank');
                    });
                    
                    viewModalList.appendChild(item);
                });
                viewModalOverlay.style.display = 'flex';
            }
        });
    });

    renderPagination(totalPages);
  }

  // File Upload Logic
  invModalCancel.addEventListener('click', () => { invModalOverlay.style.display = 'none'; });
  viewModalClose.addEventListener('click', () => { viewModalOverlay.style.display = 'none'; });
  
  invModalDropzone.addEventListener('dragover', e => { e.preventDefault(); invModalDropzone.style.background = '#e2e8f0'; });
  invModalDropzone.addEventListener('dragleave', () => { invModalDropzone.style.background = '#f8fafc'; });
  invModalDropzone.addEventListener('drop', e => {
      e.preventDefault();
      invModalDropzone.style.background = '#f8fafc';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          invSelectedFiles = Array.from(e.dataTransfer.files).slice(0, 10);
          invModalFilename.textContent = '📎 ' + invSelectedFiles.map(f => f.name).join(', ');
      }
  });
  invModalDropzone.addEventListener('click', () => invModalFileinput.click());
  invModalFileinput.addEventListener('change', () => {
      if (invModalFileinput.files && invModalFileinput.files.length > 0) {
          invSelectedFiles = Array.from(invModalFileinput.files).slice(0, 10);
          invModalFilename.textContent = '📎 ' + invSelectedFiles.map(f => f.name).join(', ');
      }
  });

  invModalSave.addEventListener('click', async () => {
      const invNumber = invModalNumber.value.trim();
      if (!invNumber) {
          invModalStatus.style.color = '#dc2626';
          invModalStatus.textContent = '⚠ Kérlek add meg a számla számát!';
          return;
      }
      if (invSelectedFiles.length === 0) {
          invModalStatus.style.color = '#dc2626';
          invModalStatus.textContent = '⚠ Kérlek válassz ki legalább egy fájlt!';
          return;
      }

      invModalStatus.style.color = '#2563eb';
      invModalStatus.textContent = '⏳ Feltöltés folyamatban...';
      invModalSave.disabled = true;

      try {
          const formData = new FormData();
          invSelectedFiles.forEach(f => formData.append('files', f));
          formData.append('truckNumber', currentUploadTruckNum);
          formData.append('invoiceNumber', invNumber);
          formData.append('truckId', currentUploadTruckId);

          const uploadRes = await fetch('/api/v1/uploads/aldi-invoice', { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();

          if (!uploadRes.ok) throw new Error(uploadData.error || 'Hiba a feltöltés során');

          invModalStatus.style.color = '#16a34a';
          invModalStatus.textContent = '✅ Sikeres feltöltés!';
          
          setTimeout(() => {
              invModalOverlay.style.display = 'none';
              invModalSave.disabled = false;
              loadData(); // reload
          }, 1000);
      } catch (err) {
          console.error(err);
          invModalStatus.style.color = '#dc2626';
          invModalStatus.textContent = '❌ Hiba: ' + err.message;
          invModalSave.disabled = false;
      }
  });


  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let html = `<div style="display:flex; gap:4px; align-items:center;">`;
    
    // Prev
    html += `<button class="belf-page-btn" data-page="${state.currentPage - 1}" style="padding:4px 8px; background:transparent; border:none; color:${state.currentPage === 1 ? '#cbd5e1' : '#64748b'}; cursor:${state.currentPage === 1 ? 'default' : 'pointer'}; font-size:14px;">&lt;</button>`;

    const getBtn = (p) => {
      const active = p === state.currentPage;
      const bg = active ? '#eff6ff' : 'transparent';
      const color = active ? '#2563eb' : '#64748b';
      const border = active ? '1px solid #bfdbfe' : '1px solid transparent';
      return `<button class="belf-page-btn" data-page="${p}" style="padding:4px 10px; background:${bg}; border:${border}; color:${color}; border-radius:4px; font-size:12px; font-weight:${active ? 500 : 400}; cursor:pointer;">${p}</button>`;
    };

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) html += getBtn(i);
    } else {
      if (state.currentPage < 4) {
        for (let i = 1; i <= 4; i++) html += getBtn(i);
        html += `<span style="color:#94a3b8; padding:0 4px;">...</span>`;
        html += getBtn(totalPages);
      } else if (state.currentPage > totalPages - 3) {
        html += getBtn(1);
        html += `<span style="color:#94a3b8; padding:0 4px;">...</span>`;
        for (let i = totalPages - 3; i <= totalPages; i++) html += getBtn(i);
      } else {
        html += getBtn(1);
        html += `<span style="color:#94a3b8; padding:0 4px;">...</span>`;
        html += getBtn(state.currentPage - 1);
        html += getBtn(state.currentPage);
        html += getBtn(state.currentPage + 1);
        html += `<span style="color:#94a3b8; padding:0 4px;">...</span>`;
        html += getBtn(totalPages);
      }
    }

    // Next
    html += `<button class="belf-page-btn" data-page="${state.currentPage + 1}" style="padding:4px 8px; background:transparent; border:none; color:${state.currentPage === totalPages ? '#cbd5e1' : '#64748b'}; cursor:${state.currentPage === totalPages ? 'default' : 'pointer'}; font-size:14px;">&gt;</button>`;
    html += `</div>`;

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.belf-page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const p = parseInt(e.target.getAttribute('data-page'));
        if (p >= 1 && p <= totalPages && p !== state.currentPage) {
          state.currentPage = p;
          renderTable();
        }
      });
    });
  }

  let filterTimer;
  const onFilterChange = () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
      state.filters.truckNum = inTruckNum.value.trim();
      state.filters.plate = inPlate.value.trim();
      state.filters.date = inDate.value;
      state.filters.season = selSeason.value;
      state.filters.transporter = selTransporter.value;
      state.filters.missingInvoice = chkMissingInvoice.checked;
      
      state.currentPage = 1;
      renderTable();
    }, 300);
  };

  inTruckNum.addEventListener('input', onFilterChange);
  inPlate.addEventListener('input', onFilterChange);
  inDate.addEventListener('change', onFilterChange);
  selSeason.addEventListener('change', onFilterChange);
  selTransporter.addEventListener('change', onFilterChange);
  chkMissingInvoice.addEventListener('change', onFilterChange);

  clearBtn.addEventListener('click', () => {
    inTruckNum.value = '';
    inPlate.value = '';
    inDate.value = '';
    selSeason.value = 'all';
    selTransporter.value = 'all';
    chkMissingInvoice.checked = false;
    
    state.filters.truckNum = '';
    state.filters.plate = '';
    state.filters.date = '';
    state.filters.season = 'all';
    state.filters.transporter = 'all';
    state.filters.missingInvoice = false;
    
    state.currentPage = 1;
    renderTable();
  });

  // Initial load
  loadData();
}
