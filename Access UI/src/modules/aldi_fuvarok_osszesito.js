/**
 * GAVA ERP – ALDI Fuvarok összesítő modul
 */

export function renderAldiFuvarokOsszesito(container, windowManager) {
  container.style.overflow = 'auto';
  container.style.padding = '0';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';
  container.style.background = 'var(--bg-main, #f8fafc)';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding: 20px; display:flex; flex-direction:column; gap:16px; height: 100%; box-sizing: border-box;';

  wrapper.innerHTML = `
    <!-- Top Header -->
    <div style="display:flex; flex-direction: column; gap: 16px;">
      
      <!-- Top Row: Title and Settings Button -->
      <div style="display:flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="AldiNord-WorldwideLogo.svg" alt="ALDI" style="height:32px; border-radius:4px;">
          <h2 style="margin:0; font-size:24px; font-weight:700; color:var(--text-primary, #0f172a);">
            ALDI – Fuvarok összesítő
          </h2>
        </div>
        
        <div style="display:flex; gap:8px; align-items:center;">
          <button id="fuvarok-btn-clear" style="background:#eff6ff; border:1px solid #bfdbfe; color:#2563eb; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:600; cursor:pointer;">
            Szűrők törlése
          </button>
          <button id="fuvarok-btn-settings" style="display:flex; align-items:center; gap:6px; background:#fff; border:1px solid #cbd5e1; color:#334155; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
            <span style="font-size:14px; color:#6366f1;">⚙️</span> Beállítás
          </button>
        </div>
      </div>
      
      <!-- Bottom Row: Filters -->
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap; width: 100%;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;">Kamion szám:</label>
          <input type="text" id="fuvarok-filter-kamion" placeholder="Keresés..." style="padding: 6px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; width: 140px; outline: none;">
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;">Termék:</label>
          <input type="text" id="fuvarok-filter-termek" placeholder="Keresés..." style="padding: 6px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; width: 140px; outline: none;">
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;">Partner:</label>
          <input type="text" id="fuvarok-filter-partner" placeholder="Keresés..." style="padding: 6px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; width: 140px; outline: none;">
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;">Szezon:</label>
          <select id="fuvarok-filter-szezon" style="padding: 6px 28px 6px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; appearance: none; background: #fff url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>') no-repeat right 8px center;">
            <option value="">-- Összes --</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;">Fuvarozó cég:</label>
          <select id="fuvarok-filter-fuvarozo" style="padding: 6px 28px 6px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; appearance: none; background: #fff url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>') no-repeat right 8px center;">
            <option value="">-- Összes --</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div style="flex-grow: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="overflow-x: auto; flex-grow: 1; position: relative;">
        <table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; min-width: 1200px;">
          <thead style="position: sticky; top: 0; z-index: 10;">
            <tr id="aldi-fuvarok-thead-tr" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <!-- Populated by JS -->
            </tr>
          </thead>
          <tbody id="aldi-fuvarok-tbody">
            <tr><td colspan="13" style="text-align:center; padding: 20px; color:#94a3b8;">Betöltés folyamatban...</td></tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Footer -->
      <div style="padding: 12px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; align-items: center; background: #fff;">
        <div style="display: flex; gap: 4px; align-items: center;" id="aldi-fuvarok-pagination">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  `;

  container.appendChild(wrapper);

  let state = {
    data: [],
    page: 1,
    perPage: 15,
    kamionFilt: '',
    termekFilt: '',
    partnerFilt: '',
    szezonFilt: '',
    fuvarozoFilt: '',
    transporters: new Set()
  };

  const ALL_COLUMNS = [
    { key: 'raklap', label: 'RAKLAP', align: 'left' },
    { key: 'termek', label: 'TERMÉK', align: 'left' },
    { key: 'partner', label: 'PARTNER', align: 'left' },
    { key: 'komment', label: 'KOMMENT', align: 'left' },
    { key: 'brutto_kg', label: 'BRUTTÓ KG', align: 'right' },
    { key: 'netto_kg', label: 'NETTÓ KG', align: 'right' },
    { key: 'atlag_suly', label: 'ÁTLAG SÚLY', align: 'right' },
    { key: 'szallitasi_nap', label: 'SZÁLLÍTÁSI NAP', align: 'left' },
    { key: 'kamionszam', label: 'KAMIONSZÁM', align: 'left' },
    { key: 'fuvarozo_ceg', label: 'FUVAROZÓ CÉG', align: 'left' },
    { key: 'rendszam', label: 'RENDSZÁM', align: 'left' },
    { key: 'fuvar_koltseg', label: 'FUVAR KÖLTSÉG', align: 'right' },
    { key: 'raklap_ar', label: 'RAKLAP ÁR', align: 'right' }
  ];

  let visibleColumnKeys = null;
  try {
      const stored = localStorage.getItem('aldi_fuvarok_visible_columns');
      if (stored) {
          visibleColumnKeys = JSON.parse(stored);
      }
  } catch (e) {}
  if (!Array.isArray(visibleColumnKeys) || visibleColumnKeys.length === 0) {
      visibleColumnKeys = ALL_COLUMNS.map(c => c.key);
  }

  const tbody = wrapper.querySelector('#aldi-fuvarok-tbody');
  const pagination = wrapper.querySelector('#aldi-fuvarok-pagination');
  
  const inKamion = wrapper.querySelector('#fuvarok-filter-kamion');
  const inTermek = wrapper.querySelector('#fuvarok-filter-termek');
  const inPartner = wrapper.querySelector('#fuvarok-filter-partner');
  const selFuvarozo = wrapper.querySelector('#fuvarok-filter-fuvarozo');
  const selSeason = wrapper.querySelector('#fuvarok-filter-szezon');
  const btnClear = wrapper.querySelector('#fuvarok-btn-clear');

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
    
    const selSeason = wrapper.querySelector('#fuvarok-filter-szezon');
    selSeason.innerHTML = '<option value="">-- Összes --</option>';
    for (let y = currentYear + 1; y >= currentYear - 1; y--) {
      const start = y.toString().substring(2);
      const end = (y + 1).toString().substring(2);
      const val = `Season ${start}-${end}`;
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      selSeason.appendChild(opt);
    }
    selSeason.value = state.szezonFilt || '';
  }

  async function loadTransporters() {
    try {
        const res = await fetch('/api/v1/transporters');
        if (res.ok) {
            const transporters = await res.json();
            selFuvarozo.innerHTML = '<option value="">-- Összes --</option>' +
                transporters.map(t => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join('');
            selFuvarozo.value = state.fuvarozoFilt;
        }
    } catch (err) {
        console.error('Hiba a fuvarozók betöltésekor:', err);
    }
  }

  initSeasonDropdown();
  loadTransporters();

  async function loadData() {
    try {
      let url = '/api/v1/aldi-fuvarok?_t=' + Date.now();
      if (state.kamionFilt) url += `&kamion_szam=${encodeURIComponent(state.kamionFilt)}`;
      if (state.termekFilt) url += `&termek=${encodeURIComponent(state.termekFilt)}`;
      if (state.partnerFilt) url += `&partner=${encodeURIComponent(state.partnerFilt)}`;
      if (state.fuvarozoFilt) url += `&fuvarozo_ceg=${encodeURIComponent(state.fuvarozoFilt)}`;
      if (state.szezonFilt) url += `&szezon=${encodeURIComponent(state.szezonFilt)}`;

      const res = await fetch(url);
      if (res.ok) {
        state.data = await res.json();
        
        renderTable();
      } else {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 20px; color:red;">Hiba a betöltéskor!</td></tr>';
      }
    } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 20px; color:red;">Hálózati hiba!</td></tr>';
    }
  }

  async function saveField(id, field, value) {
    try {
      const res = await fetch(`/api/v1/aldi-fuvarok/${id}`, {
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

  function updateTableStructure() {
      const activeCols = ALL_COLUMNS.filter(col => visibleColumnKeys.includes(col.key));
      const theadTr = wrapper.querySelector('#aldi-fuvarok-thead-tr');
      theadTr.innerHTML = activeCols.map(c => 
          `<th style="padding: 12px 16px; text-align: ${c.align}; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; white-space: nowrap;">${c.label}</th>`
      ).join('');
  }

  function renderTable() {
    updateTableStructure();
    
    if (state.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="15" style="text-align:center; padding: 20px; color:#94a3b8;">Nincs megjeleníthető adat.</td></tr>';
      pagination.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(state.data.length / state.perPage);
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const startIdx = (state.page - 1) * state.perPage;
    const endIdx = startIdx + state.perPage;
    const pageData = state.data.slice(startIdx, endIdx);

    const activeCols = ALL_COLUMNS.filter(col => visibleColumnKeys.includes(col.key));

    tbody.innerHTML = pageData.map(d => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        ${activeCols.map(c => {
           if (c.key === 'raklap') return `<td style="padding: 10px 16px; color: #334155; text-align:${c.align};">${parseFloat(d.raklap) || 0}</td>`;
           if (c.key === 'termek') return `<td style="padding: 10px 16px; color: #0f172a; font-weight: 500; text-align:${c.align};">${escapeHtml(d.termek)}</td>`;
           if (c.key === 'partner') return `<td style="padding: 10px 16px; color: #475569; text-align:${c.align};">${escapeHtml(d.partner)}</td>`;
           if (c.key === 'komment') return `<td style="padding: 6px 16px; text-align:${c.align};"><input type="text" class="fuvarok-edit-input" data-id="${d.id}" data-field="komment" value="${escapeHtml(d.komment)}" style="width:100%; min-width: 200px; border:1px solid transparent; border-radius:4px; padding:4px 6px; font-size:12px; background:transparent;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';"></td>`;
           if (c.key === 'brutto_kg') return `<td style="padding: 10px 16px; color: #334155; text-align:${c.align};">${d.brutto_kg}</td>`;
           if (c.key === 'netto_kg') return `<td style="padding: 10px 16px; color: #334155; text-align:${c.align};">${d.netto_kg}</td>`;
           if (c.key === 'atlag_suly') return `<td style="padding: 10px 16px; color: #2563eb; font-weight: 600; text-align:${c.align};">${d.atlag_suly}</td>`;
           if (c.key === 'szallitasi_nap') return `<td style="padding: 10px 16px; color: #475569; white-space: nowrap; text-align:${c.align};">${d.szallitasi_nap ? d.szallitasi_nap.substring(0,10) : ''}</td>`;
           if (c.key === 'kamionszam') return `<td style="padding: 10px 16px; color: #0f172a; font-weight: 600; text-align:${c.align};">${escapeHtml(d.kamionszam)}</td>`;
           if (c.key === 'fuvarozo_ceg') return `<td style="padding: 10px 16px; color: #475569; text-align:${c.align};">${escapeHtml(d.fuvarozo_ceg)}</td>`;
           if (c.key === 'rendszam') return `<td style="padding: 10px 16px; color: #475569; white-space: nowrap; text-align:${c.align};">${escapeHtml(d.rendszam)}</td>`;
           if (c.key === 'fuvar_koltseg') return `<td style="padding: 6px 16px; text-align:${c.align};"><input type="number" class="fuvarok-edit-input" data-id="${d.id}" data-field="fuvar_koltseg" value="${d.fuvar_koltseg}" style="width:70px; border:1px solid transparent; border-radius:4px; padding:4px 6px; font-size:12px; text-align:right; background:transparent;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';"></td>`;
           if (c.key === 'raklap_ar') return `<td style="padding: 6px 16px; text-align:${c.align};"><input type="number" class="fuvarok-edit-input" data-id="${d.id}" data-field="raklap_ar" value="${d.raklap_ar}" style="width:70px; border:1px solid transparent; border-radius:4px; padding:4px 6px; font-size:12px; text-align:right; background:transparent;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';"></td>`;
           return `<td></td>`;
        }).join('')}
      </tr>
    `).join('');

    // Bind change events to inputs
    tbody.querySelectorAll('.fuvarok-edit-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const val = e.target.value;
        const rowData = state.data.find(r => r.id == id);
        if (rowData) {
          rowData[field] = val;
          saveField(id, field, val);
        }
      });
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    let html = '';
    
    // Prev
    html += `<button class="fuv-page-btn" data-page="${state.page - 1}" style="padding: 4px 8px; background: transparent; border: none; color: ${state.page === 1 ? '#cbd5e1' : '#64748b'}; cursor: ${state.page === 1 ? 'default' : 'pointer'}; font-size: 14px;">&lt;</button>`;

    const getBtn = (p) => {
      const active = p === state.page;
      const bg = active ? '#eff6ff' : 'transparent';
      const color = active ? '#2563eb' : '#64748b';
      const border = active ? '1px solid #bfdbfe' : '1px solid transparent';
      return `<button class="fuv-page-btn" data-page="${p}" style="padding: 4px 10px; background: ${bg}; border: ${border}; color: ${color}; border-radius: 4px; font-size: 12px; font-weight: ${active ? 500 : 400}; cursor: pointer;">${p}</button>`;
    };

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) html += getBtn(i);
    } else {
      if (state.page < 4) {
        for (let i = 1; i <= 4; i++) html += getBtn(i);
        html += `<span style="color: #94a3b8; padding: 0 4px;">...</span>`;
        html += getBtn(totalPages);
      } else if (state.page > totalPages - 3) {
        html += getBtn(1);
        html += `<span style="color: #94a3b8; padding: 0 4px;">...</span>`;
        for (let i = totalPages - 3; i <= totalPages; i++) html += getBtn(i);
      } else {
        html += getBtn(1);
        html += `<span style="color: #94a3b8; padding: 0 4px;">...</span>`;
        html += getBtn(state.page - 1);
        html += getBtn(state.page);
        html += getBtn(state.page + 1);
        html += `<span style="color: #94a3b8; padding: 0 4px;">...</span>`;
        html += getBtn(totalPages);
      }
    }

    // Next
    html += `<button class="fuv-page-btn" data-page="${state.page + 1}" style="padding: 4px 8px; background: transparent; border: none; color: ${state.page === totalPages ? '#cbd5e1' : '#64748b'}; cursor: ${state.page === totalPages ? 'default' : 'pointer'}; font-size: 14px;">&gt;</button>`;

    pagination.innerHTML = html;

    pagination.querySelectorAll('.fuv-page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const p = parseInt(e.target.getAttribute('data-page'));
        if (p >= 1 && p <= totalPages && p !== state.page) {
          state.page = p;
          renderTable();
        }
      });
    });
  }

  function openColumnSettingsModal() {
      const modalContent = `
          <div style="display:flex; flex-direction:column; height:100%; padding:18px 22px; box-sizing:border-box; background:#fff;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-shrink:0; flex-wrap:wrap; gap:8px;">
                  <span style="font-size:13px; color:#475569; font-weight:500;">Jelölje be a táblázatban megjelenítendő oszlopokat:</span>
                  <div style="display:flex; gap:6px;">
                      <button type="button" class="secondary-btn btn-dense" id="btn-col-select-all" style="font-size:11px; padding:3px 8px;">Mind kijelöl</button>
                      <button type="button" class="secondary-btn btn-dense" id="btn-col-deselect-all" style="font-size:11px; padding:3px 8px;">Mind töröl</button>
                      <button type="button" class="secondary-btn btn-dense" id="btn-col-reset" style="font-size:11px; padding:3px 8px;">Alapértelmezett</button>
                  </div>
              </div>
              <div id="col-checkboxes-container" style="flex:1; overflow-y:auto; border:1px solid #cbd5e1; border-radius:8px; padding:12px 14px; background:#f8fafc; display:grid; grid-template-columns:repeat(2, 1fr); gap:6px 14px; align-content:start;">
                  ${ALL_COLUMNS.map(col => `
                      <label class="col-checkbox-label" style="display:flex; align-items:center; gap:8px; font-size:12px; color:#1e293b; cursor:pointer; padding:5px 8px; border-radius:6px; background:#fff; border:1px solid #e2e8f0; transition:all 0.15s;" data-col-name="${col.label.toLowerCase()}">
                          <input type="checkbox" class="col-toggle-chk" value="${col.key}" ${visibleColumnKeys.includes(col.key) ? 'checked' : ''} style="cursor:pointer; width:15px; height:15px;">
                          <span style="font-weight:500;">${col.label}</span>
                      </label>
                  `).join('')}
              </div>
              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px; flex-shrink:0;">
                  <button type="button" class="secondary-btn" id="btn-col-cancel" style="font-size:12px;">Mégsem</button>
                  <button type="button" class="primary-btn" id="btn-col-apply" style="font-size:12px;">Alkalmazás</button>
              </div>
          </div>
      `;
      const win = windowManager.createModal({
          title: 'Oszlopok beállítása',
          width: 500,
          height: 450,
          content: modalContent
      });

      const chks = win.element.querySelectorAll('.col-toggle-chk');
      
      win.element.querySelector('#btn-col-select-all').addEventListener('click', () => {
          chks.forEach(chk => chk.checked = true);
      });
      win.element.querySelector('#btn-col-deselect-all').addEventListener('click', () => {
          chks.forEach(chk => chk.checked = false);
      });
      win.element.querySelector('#btn-col-reset').addEventListener('click', () => {
          chks.forEach(chk => {
              chk.checked = true; // reset all to true basically
          });
      });

      win.element.querySelector('#btn-col-cancel').addEventListener('click', () => {
          win.close();
      });

      win.element.querySelector('#btn-col-apply').addEventListener('click', () => {
          const newKeys = [];
          chks.forEach(chk => {
              if (chk.checked) newKeys.push(chk.value);
          });
          if (newKeys.length === 0) {
              alert('Legalább egy oszlopot ki kell választani!');
              return;
          }
          visibleColumnKeys = newKeys;
          localStorage.setItem('aldi_fuvarok_visible_columns', JSON.stringify(visibleColumnKeys));
          renderTable();
          win.close();
      });
  }

  // Event listeners for settings
  wrapper.querySelector('#fuvarok-btn-settings').addEventListener('click', openColumnSettingsModal);

  // Event listeners for filters
  let filterTimer;
  const onFilterChange = () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
      state.kamionFilt = inKamion.value.trim();
      state.termekFilt = inTermek.value.trim();
      state.partnerFilt = inPartner.value.trim();
      state.fuvarozoFilt = selFuvarozo.value;
      state.szezonFilt = selSeason.value;
      state.page = 1; // reset page on filter
      loadData();
    }, 300);
  };

  inKamion.addEventListener('input', onFilterChange);
  inTermek.addEventListener('input', onFilterChange);
  inPartner.addEventListener('input', onFilterChange);
  selFuvarozo.addEventListener('change', onFilterChange);
  selSeason.addEventListener('change', onFilterChange);

  btnClear.addEventListener('click', () => {
    inKamion.value = '';
    inTermek.value = '';
    inPartner.value = '';
    selFuvarozo.value = '';
    selSeason.value = '';
    state.kamionFilt = '';
    state.termekFilt = '';
    state.partnerFilt = '';
    state.fuvarozoFilt = '';
    state.szezonFilt = '';
    state.page = 1;
    loadData();
  });

  // Initial load
  loadData();
}
