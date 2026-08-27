/**
 * GAVA ERP – ALDI Rakodás modul (Cross-docking)
 * A FUVAROK -> Rakodás modul (rakodas.js) letisztult Access ERP elrendezése és stílusa alapján
 */

export function renderAldiRakodas(container, windowManager) {
  container.innerHTML = '';
  container.style.padding = '0';
  container.style.height = '100%';
  container.style.background = 'var(--bg-main, #f8fafc)';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  var view = document.createElement('div');
  view.className = 'module-view fade-in';

  // HTML felépítés pontosan a FUVAROK -> Rakodás modul alapján
  view.innerHTML = `
    <!-- FEJLÉC: Cím és logó -->
    <div class="view-header" style="margin-bottom:16px; display:flex; align-items:center; justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="AldiNord-WorldwideLogo.svg" alt="ALDI" style="height:32px; border-radius:4px;">
        <div>
          <h2 class="view-title">ALDI – Rakodás</h2>
          <p class="view-subtitle">Kamionok és áruigények kezelése</p>
        </div>
      </div>
    </div>

    <!-- KÉT TÁBLA EGYMÁS MELLETT -->
    <div style="display:flex; gap:12px; align-items:flex-start; overflow-x:auto;">

      <!-- BAL TÁBLA: Rakodások (Kamionok) -->
      <div class="access-subform" style="flex:1.22; min-width:550px; margin-top:0;">
        <div class="access-subform-header" style="font-size:12px; padding:6px 12px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:700;">Rakodások</span>
          <button class="primary-btn btn-dense" id="btn-new-aldi-truck" style="font-size:11px; height:26px; padding:0 10px;">+ Új kamion</button>
        </div>
        <div style="overflow-x:auto;">
          <table class="access-subform-table" id="aldi-trucks-table" style="font-size:11px; table-layout:auto; width:100%;">
            <thead>
              <tr>
                <th style="width:90px; padding:6px 4px; font-size:10px;">Kamionszám</th>
                <th style="width:85px; padding:6px 4px; font-size:10px;">Szállítási nap</th>
                <th style="width:105px; padding:6px 4px; font-size:10px;">Fuvarozó</th>
                <th style="width:50px; padding:6px 4px; text-align:center; font-size:10px;" title="Küldés PDA-ra">PDA</th>
                <th style="width:80px; padding:6px 4px; text-align:center; font-size:10px;" title="Összekészítés állapota">Állapot</th>
                <th style="width:50px; padding:6px 4px; text-align:center; font-size:10px;" title="Rakodva">Rakodva</th>
                <th style="width:40px; padding:6px 4px; text-align:center; font-size:10px;" title="Törlés">TÖRLÉS</th>
              </tr>
            </thead>
            <tbody id="aldi-trucks-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- JOBB TÁBLA ÉS SZŰRŐI -->
      <div style="flex:1.35; min-width:0; display:flex; flex-direction:column; gap:6px;">

        <!-- Áru igény szűrők -->
        <div class="access-form-view" style="padding:10px 18px; margin-bottom:0; display:flex; flex-wrap:wrap; gap:10px; align-items:end;">
          <div style="flex:1; min-width:120px; max-width:200px;">
            <label style="font-size:11px; font-weight:600; display:block; margin-bottom:4px; color:#334155;">Product</label>
            <input type="text" id="filter-aldi-product" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;" placeholder="Product..." autocomplete="off">
          </div>
          <div style="flex:1; min-width:110px; max-width:150px;">
            <label style="font-size:11px; font-weight:600; display:block; margin-bottom:4px; color:#334155;">Szállítási dátum</label>
            <input type="date" id="filter-aldi-date" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;">
          </div>
          <div style="flex:1; min-width:110px; max-width:150px;">
            <label style="font-size:11px; font-weight:600; display:block; margin-bottom:4px; color:#334155;">Rendelési szám</label>
            <input type="text" id="filter-aldi-order" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;" placeholder="Rendelés..." autocomplete="off">
          </div>
          <div style="flex:none; display:flex; gap:6px;">
            <button class="secondary-btn btn-dense" id="btn-aldi-clear-filters" style="font-size:12px; height:28px; line-height:normal; padding:0 12px; box-sizing:border-box;">Szűrők törlése</button>
          </div>
        </div>

        <!-- JOBB TÁBLA (Áru igény banner nélkül) -->
        <div class="access-subform" style="margin-top:0; background:#fff; border:1px solid var(--border, #cbd5e1);">
          <div style="overflow-x:auto;">
            <table class="access-subform-table" id="aldi-demands-table" style="background:transparent; font-size:10px; width:100%;">
              <thead>
                <tr>
                  <th style="min-width:110px; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 4px;">TERMÉK</th>
                  <th style="width:46px; max-width:48px; background:rgba(14,165,233,0.1); text-align:right; font-size:9px; padding:4px 2px;" title="Rendelt kartonszám">KARTON</th>
                  <th style="width:44px; max-width:46px; background:rgba(14,165,233,0.1); text-align:right; font-size:9px; padding:4px 2px;" title="Karton / Raklap">#/PLT</th>
                  <th style="width:44px; max-width:46px; background:rgba(14,165,233,0.1); text-align:right; font-size:9px; padding:4px 2px;" title="Kalkulált raklap">RAKLAP</th>
                  <th style="width:58px; max-width:62px; background:rgba(14,165,233,0.1); font-size:9px; padding:4px 2px; text-align:center;" title="Szállítási dátum">SZÁLL. DÁTUM</th>
                  <th style="min-width:65px; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 4px;">RENDELÉSI SZÁM</th>
                  <th style="min-width:55px; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 4px;">TÍPUS</th>
                  <th style="min-width:50px; text-align:center; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 4px;">KAMIONRA</th>
                  <th style="width:28px; text-align:center; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 2px;" title="Törlés">🗑️</th>
                </tr>
              </thead>
              <tbody id="aldi-demands-tbody"></tbody>
              <tfoot style="position:sticky; bottom:0; background:#e8f4fd; z-index:2; border-top:2px solid #bde0fa; font-weight:bold; font-size:11px;">
                <tr>
                  <td style="padding:6px 4px; color:#334155;">Össz:</td>
                  <td id="aldi-sum-cartons" style="text-align:right; padding:6px 2px; color:#0369a1; font-size:10px;">0</td>
                  <td></td>
                  <td id="aldi-sum-pallets" style="text-align:right; padding:6px 2px; color:#7c3aed; font-size:10px;">0.0</td>
                  <td colspan="5" id="aldi-sum-trucks" style="text-align:right; padding:6px 14px; color:#ea580c; font-size:11px;">Szükséges kamion: 0.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>

    </div>
  `;

  container.appendChild(view);

  // Állapot
  let state = {
    trucks: [],
    demands: [],
    selectedTruckId: null,
    filterProduct: '',
    filterDate: '',
    filterOrder: ''
  };

  // Elemek referenciái
  const trucksTbody = view.querySelector('#aldi-trucks-tbody');
  const demandsTbody = view.querySelector('#aldi-demands-tbody');
  const btnNewTruck = view.querySelector('#btn-new-aldi-truck');

  const filterProductInput = view.querySelector('#filter-aldi-product');
  const filterDateInput = view.querySelector('#filter-aldi-date');
  const filterOrderInput = view.querySelector('#filter-aldi-order');
  const btnClearFilters = view.querySelector('#btn-aldi-clear-filters');

  const elSumCartons = view.querySelector('#aldi-sum-cartons');
  const elSumPallets = view.querySelector('#aldi-sum-pallets');
  const elSumTrucks = view.querySelector('#aldi-sum-trucks');

  // Szűrők visszaállítása és megőrzése böngészőfrissítés esetén is
  const pendingOrder = localStorage.getItem('aldi_rakodas_pending_order');
  const savedFilterOrder = sessionStorage.getItem('aldi_rakodas_filter_order');
  const initialOrderFilter = pendingOrder || savedFilterOrder || '';

  if (initialOrderFilter) {
    state.filterOrder = initialOrderFilter;
    sessionStorage.setItem('aldi_rakodas_filter_order', initialOrderFilter);
    localStorage.removeItem('aldi_rakodas_pending_order');
    if (filterOrderInput) filterOrderInput.value = initialOrderFilter;
  }

  // Adatbetöltés: Kamionok
  async function loadTrucks() {
    try {
      const res = await fetch('/api/v1/aldi-cross-docking/trucks?_t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        state.trucks = await res.json();
        renderTrucks();
      } else {
        trucksTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:15px; color:red;">Hiba a betöltéskor!</td></tr>';
      }
    } catch (err) {
      console.error('Kamionok betöltési hiba:', err);
      trucksTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:15px; color:red;">Hálózati hiba!</td></tr>';
    }
  }

  // Adatbetöltés: Áruigények (csak a 'sent_to_rakodas' = true rendeléseket hozza)
  async function loadDemands() {
    try {
      let url = '/api/v1/aldi-cross-docking/demands?_t=' + Date.now();
      if (state.filterDate) url += `&delivery_date=${encodeURIComponent(state.filterDate)}`;
      if (state.filterOrder) url += `&order_number=${encodeURIComponent(state.filterOrder)}`;

      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        state.demands = await res.json();
        renderDemands();
      } else {
        demandsTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:15px; color:red;">Hiba a betöltéskor!</td></tr>';
      }
    } catch (err) {
      console.error('Áruigény betöltési hiba:', err);
      demandsTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:15px; color:red;">Hálózati hiba!</td></tr>';
    }
  }

  // Renderelés: Bal oldali táblázat (Kamionok)
  function renderTrucks() {
    if (!state.trucks || state.trucks.length === 0) {
      trucksTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#94a3b8; font-size:11px;">– Nincs rögzített kamion –</td></tr>';
      return;
    }

    trucksTbody.innerHTML = state.trucks.map(t => {
      const isSelected = t.id === state.selectedTruckId;
      const bg = isSelected ? '#dbeafe' : 'transparent';
      const dateStr = t.delivery_date ? String(t.delivery_date).substring(0, 10) : '-';
      const statusPct = t.preparation_status || 0;

      return `
        <tr style="background:${bg}; transition:background 0.15s;" class="aldi-truck-row" data-id="${t.id}">
          <td style="padding:4px 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:85px;">
            <span class="aldi-open-truck-link" data-id="${t.id}" style="cursor:pointer; color:#2563eb; text-decoration:underline; font-weight:600;" title="Kattints a szerkesztéshez">
              ${escHtml(t.truck_number || '–')}
            </span>
          </td>
          <td style="padding:4px 6px; white-space:nowrap;">${dateStr}</td>
          <td style="padding:4px 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:95px;" title="${escHtml(t.transporter || '-')}">
            ${escHtml(t.transporter || '-')}
          </td>
          <td style="text-align:center; padding:4px 4px;">
            <button class="aldi-pda-btn" data-id="${t.id}" style="background:none; border:none; cursor:pointer; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Küldés PDA-ra">
              <img src="PDA logo.png" alt="PDA" style="height:16px; width:auto; max-width:40px; object-fit:contain; ${t.sent_to_pda ? 'filter:none;' : 'filter:grayscale(100%); opacity:0.3;'}">
            </button>
          </td>
          <td style="text-align:center; padding:4px 6px;">
            <div style="background:#e2e8f0; border-radius:8px; height:9px; width:100%; position:relative; overflow:hidden; border:1px solid #cbd5e1;">
              <div style="background:#22c55e; height:100%; width:${statusPct}%;"></div>
            </div>
            <div style="font-size:9px; color:#64748b; margin-top:1px;">${statusPct}%</div>
          </td>
          <td style="text-align:center; padding:4px 4px;">
            <input type="checkbox" class="aldi-loaded-chk" data-id="${t.id}" ${t.is_loaded ? 'checked' : ''} style="cursor:pointer;">
          </td>
          <td style="text-align:center; padding:2px 4px;">
            <button class="aldi-del-truck-btn" data-id="${t.id}" title="Kamion törlése" style="background:none; border:none; cursor:pointer; font-size:13px; color:#dc2626; padding:1px 3px; opacity:0.6;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">✕</button>
          </td>
        </tr>
      `;
    }).join('');

    // Sor események kötése
    trucksTbody.querySelectorAll('.aldi-open-truck-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        openEditTruckModal(id);
      });
    });

    trucksTbody.querySelectorAll('.aldi-pda-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const truck = state.trucks.find(t => t.id === id);
        if (truck) {
          const newStatus = !truck.sent_to_pda;
          truck.sent_to_pda = newStatus;
          renderTrucks();
          try {
            await fetch(`/api/v1/aldi-cross-docking/trucks/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(truck)
            });
          } catch (err) {
            console.error('PDA státusz hiba:', err);
          }
        }
      });
    });

    trucksTbody.querySelectorAll('.aldi-loaded-chk').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const isLoaded = e.target.checked;
        const truck = state.trucks.find(t => t.id === id);
        if (truck) {
          truck.is_loaded = isLoaded;
          try {
            await fetch(`/api/v1/aldi-cross-docking/trucks/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(truck)
            });
          } catch (err) {
            console.error('Rakodva státusz hiba:', err);
          }
        }
      });
    });

    trucksTbody.querySelectorAll('.aldi-del-truck-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const truck = state.trucks.find(t => t.id === id);
        const name = truck ? truck.truck_number : id;
        if (!confirm(`Biztosan törölni szeretnéd a(z) ${name} kamiont?`)) return;

        try {
          const res = await fetch(`/api/v1/aldi-cross-docking/trucks/${id}`, { method: 'DELETE' });
          if (res.ok) {
            state.trucks = state.trucks.filter(t => t.id !== id);
            renderTrucks();
          } else {
            alert('Hiba a kamion törlése során.');
          }
        } catch (err) {
          alert('Hálózati hiba: ' + err.message);
        }
      });
    });
  }

  // Renderelés: Jobb oldali táblázat (Áruigény)
  function renderDemands() {
    const valProduct = (state.filterProduct || '').toLowerCase().trim();

    let filtered = state.demands || [];
    if (valProduct) {
      filtered = filtered.filter(d => (d.product_name || '').toLowerCase().includes(valProduct));
    }

    let sumCartons = 0;
    let sumPallets = 0;

    if (filtered.length === 0) {
      demandsTbody.innerHTML = '';
      if (elSumCartons) elSumCartons.textContent = '0';
      if (elSumPallets) elSumPallets.textContent = '0.0';
      if (elSumTrucks) elSumTrucks.textContent = 'Szükséges kamion: 0.00';
      return;
    }

    demandsTbody.innerHTML = filtered.map(d => {
      const cartons = parseInt(d.ordered_cartons) || 0;
      const cpp = (d.cartons_per_pallet !== null && d.cartons_per_pallet !== undefined && d.cartons_per_pallet !== '') ? parseInt(d.cartons_per_pallet) : null;
      const pallets = d.pallets !== null && d.pallets !== undefined ? parseFloat(d.pallets) : (cpp && cpp > 0 ? (cartons / cpp) : null);

      sumCartons += cartons;
      if (pallets) sumPallets += pallets;

      const dateStr = d.delivery_date ? String(d.delivery_date).substring(0, 10) : '-';

      return `
        <tr>
          <td style="padding:4px 6px; font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;" title="${escHtml(d.product_name || '')}">
            ${escHtml(d.product_name || '')}
          </td>
          <td style="padding:4px 3px; text-align:right; font-weight:700; color:#0f172a;">${cartons}</td>
          <td style="padding:2px 3px; text-align:right;">
            <input type="number" class="aldi-demand-cpp-input" data-id="${d.id}" value="${cpp !== null ? cpp : ''}" placeholder="" min="1" style="width:46px; height:24px; padding:1px 3px; font-size:11px; text-align:right; border:1px solid #cbd5e1; border-radius:3px; background:#fff; font-weight:600; color:#0f172a;">
          </td>
          <td class="aldi-demand-pallets-cell" data-id="${d.id}" style="padding:4px 3px; text-align:right; font-weight:600; color:#2563eb;">${pallets ? pallets.toFixed(2) : '-'}</td>
          <td style="padding:4px 6px; color:#475569; white-space:nowrap;">${dateStr}</td>
          <td style="padding:4px 6px; color:#475569; white-space:nowrap;">${escHtml(d.order_number || '-')}</td>
          <td style="padding:4px 6px;">
            <span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; border:1px solid #cbd5e1; font-size:9px; color:#475569;">
              ${escHtml(d.order_type || 'Normál')}
            </span>
          </td>
          <td style="text-align:center; padding:3px 4px; display:flex; gap:4px; justify-content:center;">
            <button class="btn-split-aldi-demand" data-id="${d.id}" title="Tétel szétbontása" 
              style="background:#2563eb; color:#fff; border:1px solid #1d4ed8; border-radius:4px; padding:2px 7px; font-size:12px; font-weight:bold; cursor:pointer; transition:all 0.2s;">+</button>
            <button class="btn-send-aldi-demand" data-id="${d.id}" title="Küldés kamionra" 
              style="background:#ef4444; color:#fff; border:1px solid #dc2626; border-radius:4px; padding:2px 7px; font-size:11px; cursor:pointer; transition:all 0.2s;">➡</button>
          </td>
          <td style="text-align:center; padding:3px 2px;">
            <button class="btn-delete-aldi-demand" data-id="${d.id}" title="Törlés" 
              style="background:#ffffff; color:#dc2626; border:1px solid #fca5a5; border-radius:4px; padding:2px 6px; font-size:11px; font-weight:bold; cursor:pointer; transition:all 0.2s;"
              onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#ffffff'">✕</button>
          </td>
        </tr>
      `;
    }).join('');

    if (elSumCartons) elSumCartons.textContent = sumCartons.toLocaleString('hu-HU');
    if (elSumPallets) elSumPallets.textContent = sumPallets.toFixed(1);
    if (elSumTrucks) {
      const neededTrucks = Math.ceil(sumPallets / 33);
      elSumTrucks.textContent = `Szükséges kamion: ${neededTrucks}`;
    }

    // Input események a #/PLT mezőkhöz
    demandsTbody.querySelectorAll('.aldi-demand-cpp-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const demand = state.demands.find(d => d.id === id);
        const val = e.currentTarget.value.trim();
        const cpp = val !== '' && !isNaN(val) ? parseInt(val) : null;
        if (demand) {
          demand.cartons_per_pallet = cpp;
          const cartons = parseInt(demand.ordered_cartons) || 0;
          demand.pallets = (cpp && cpp > 0) ? (cartons / cpp) : null;
        }

        // Egyedi sor raklap cellájának frissítése
        const palletsCell = demandsTbody.querySelector(`.aldi-demand-pallets-cell[data-id="${id}"]`);
        if (palletsCell && demand) {
          palletsCell.textContent = demand.pallets ? demand.pallets.toFixed(2) : '-';
        }

        // Összesítők újraszámolása
        let totalPallets = 0;
        state.demands.forEach(d => {
          if (d.pallets) totalPallets += parseFloat(d.pallets);
        });
        if (elSumPallets) elSumPallets.textContent = totalPallets.toFixed(1);
        if (elSumTrucks) {
          const neededTrucks = Math.ceil(totalPallets / 33);
          elSumTrucks.textContent = `Szükséges kamion: ${neededTrucks}`;
        }
      });

      // Automatikus mentés adatváltozáskor (blur vagy Enter)
      input.addEventListener('change', async (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const val = e.currentTarget.value.trim();
        const cpp = val !== '' && !isNaN(val) ? parseInt(val) : null;
        
        try {
          const res = await fetch('/api/v1/aldi-cross-docking/demands/cartons-per-pallet', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: [{ id: id, cartons_per_pallet: cpp }] })
          });
          if (!res.ok) {
            console.error('Hiba az automatikus mentés során.');
            e.currentTarget.style.borderColor = '#ef4444'; // Error state
          } else {
            e.currentTarget.style.borderColor = '#22c55e'; // Success state indicator briefly
            setTimeout(() => {
              e.currentTarget.style.borderColor = '#cbd5e1'; // Reset
            }, 1000);
          }
        } catch (err) {
          console.error('Hálózati hiba mentéskor:', err);
        }
      });
    });

    // Küldés kamionra események
    demandsTbody.querySelectorAll('.btn-send-aldi-demand').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const demand = state.demands.find(d => d.id === id);
        if (demand) {
          openSendToTruckModal(demand);
        }
      });
    });

    // Szétbontás esemény
    demandsTbody.querySelectorAll('.btn-split-aldi-demand').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const demand = state.demands.find(d => d.id === id);
        if (demand) {
          openSplitDemandModal(demand);
        }
      });
    });

    // Törlés esemény
    demandsTbody.querySelectorAll('.btn-delete-aldi-demand').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        if (confirm('Biztosan törölni szeretnéd ezt a tételt? A már kamionra került mennyiségek nem törlődnek, de a hátralévő igény megszűnik.')) {
          try {
            const res = await fetch(`/api/v1/aldi-cross-docking/demands/${id}`, { method: 'DELETE' });
            if (res.ok) {
              loadDemands();
            } else {
              const err = await res.json();
              alert('Hiba törléskor: ' + (err.error || 'Ismeretlen hiba'));
            }
          } catch (err) {
            console.error('Törlés hálózati hiba:', err);
            alert('Hálózati hiba törléskor.');
          }
        }
      });
    });
  }

  // ============= SZÉTBONTÁS MODAL =============
  function openSplitDemandModal(demand) {
    const currentCartons = parseInt(demand.ordered_cartons) || 0;

    const modalContent = `
      <div style="padding:24px; display:flex; flex-direction:column; gap:20px; font-family:sans-serif;">
        <div style="display:flex; gap:24px;">
          <div style="flex:1;">
            <label style="font-size:13px; font-weight:700; color:#334155; display:block; margin-bottom:8px;">Jelenlegi kartonszám</label>
            <input type="text" disabled value="${currentCartons}" style="width:100%; height:42px; padding:8px 12px; font-size:15px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; color:#475569; font-weight:600;">
          </div>
          <div style="flex:1;">
            <label style="font-size:13px; font-weight:700; color:#334155; display:block; margin-bottom:8px;">Új kartonszám</label>
            <input type="number" id="split-new-cartons-input" min="1" max="${currentCartons - 1}" style="width:100%; height:42px; padding:8px 12px; font-size:15px; border:1px solid #cbd5e1; border-radius:8px; color:#0f172a; font-weight:600; outline:none; transition:border 0.2s;">
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:16px; margin-top:16px;">
          <button class="btn-split-cancel" style="padding:10px 24px; font-size:14px; font-weight:700; color:#0f172a; background:#fff; border:1px solid #cbd5e1; border-radius:24px; cursor:pointer; transition:all 0.2s;">Mégsem</button>
          <button class="btn-split-confirm" style="padding:10px 24px; font-size:14px; font-weight:700; color:#fff; background:#22c55e; border:none; border-radius:24px; cursor:pointer; transition:all 0.2s;">Mentés</button>
        </div>
      </div>
    `;

    const modal = windowManager.createModal({
      title: 'Rendelés szétbontása',
      width: 480,
      height: 240,
      content: modalContent
    });

    const modalEl = modal.element;
    const inputEl = modalEl.querySelector('#split-new-cartons-input');
    
    // Auto focus
    setTimeout(() => inputEl.focus(), 100);

    modalEl.querySelector('.btn-split-cancel').addEventListener('click', () => modal.close());

    modalEl.querySelector('.btn-split-confirm').addEventListener('click', async () => {
      const newCartons = parseInt(inputEl.value);
      if (!newCartons || isNaN(newCartons) || newCartons <= 0 || newCartons >= currentCartons) {
        alert('Kérlek érvényes új kartonszámot adj meg (1 és ' + (currentCartons - 1) + ' között)!');
        inputEl.focus();
        return;
      }

      try {
        const res = await fetch('/api/v1/aldi-cross-docking/demands/' + demand.id + '/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newCartons })
        });
        
        if (res.ok) {
          modal.close();
          loadDemands(); // reload the table
        } else {
          const err = await res.json();
          alert('Hiba a szétbontáskor: ' + (err.error || 'Ismeretlen hiba'));
        }
      } catch(e) {
        console.error('Szétbontás hiba', e);
        alert('Hálózati hiba a szétbontás során.');
      }
    });
  }

  // ============= KÜLDÉS KAMIONRA MODAL =============
  function openSendToTruckModal(demand) {
    const demandPallets = (demand.cartons_per_pallet && demand.cartons_per_pallet > 0)
      ? ((demand.ordered_cartons || 0) / demand.cartons_per_pallet).toFixed(2)
      : null;

    const modalContent = `
      <div style="padding:20px 24px; display:flex; flex-direction:column; gap:14px;">
        <div style="padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:13px; font-weight:700; color:#1e293b;">${escHtml(demand.product_name)}</div>
          <div style="font-size:11px; color:#64748b;">Rendelési szám: <strong>${escHtml(demand.order_number || '-')}</strong> | Dátum: <strong>${demand.delivery_date ? String(demand.delivery_date).substring(0,10) : '-'}</strong></div>
          <div style="font-size:12px; color:#334155; padding:6px 10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px;">
            Rendelkezésre álló raklap: 
            <strong style="color:#16a34a; font-size:14px;">
              ${demandPallets ? demandPallets : '<span style="color:#ef4444;">⚠️ Nincs #/PLT megadva!</span>'}
            </strong>
          </div>
          <div style="font-size:12px; color:#334155; padding:6px 10px; background:#e0f2fe; border:1px solid #7dd3fc; border-radius:6px;">
            Rendelkezésre álló raklaphely a kamionon: <strong style="color:#0369a1; font-size:14px;" id="avail-pallets-display">–</strong>
          </div>
        </div>

        <div>
          <label style="font-size:11px; font-weight:600; color:#334155; display:block; margin-bottom:4px;">Célkamion kiválasztása: <span style="color:red;">*</span></label>
          <select id="send-target-truck" class="access-control-input" style="font-size:12px; padding:4px 8px; height:32px; width:100%;">
            <option value="">-- Válasszon kamiont --</option>
            ${state.trucks.map(t => `<option value="${t.id}">${escHtml(t.truck_number)} (${escHtml(t.transporter || 'Nincs fuvarozó')})</option>`).join('')}
          </select>
        </div>

        <div>
          <label style="font-size:11px; font-weight:600; color:#334155; display:block; margin-bottom:4px;">Küldendő raklap szám: <span style="color:red;">*</span></label>
          <input type="number" id="send-pallets-input" class="access-control-input" min="0.01" step="0.01"
            style="font-size:13px; padding:4px 8px; height:32px; width:100%;"
            placeholder="pl. 2.5"
            value="${demandPallets || ''}">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:4px;">
          <button class="secondary-btn btn-send-cancel">Mégse</button>
          <button class="primary-btn btn-send-confirm" style="background:#22c55e; border-color:#16a34a;">➡ Küldés kamionra</button>
        </div>
      </div>
    `;

    const modal = windowManager.createModal({
      title: 'Tétel küldése kamionra',
      width: 420,
      height: 340,
      content: modalContent
    });

    const modalEl = modal.element;
    const selTruck = modalEl.querySelector('#send-target-truck');
    const availDisplay = modalEl.querySelector('#avail-pallets-display');
    const palletsInput = modalEl.querySelector('#send-pallets-input');

    selTruck.addEventListener('change', () => {
      const tid = parseInt(selTruck.value);
      if (!tid) {
        availDisplay.textContent = '–';
        return;
      }
      const truck = state.trucks.find(t => t.id === tid);
      if (truck) {
        const used = parseFloat(truck.total_pallets) || 0;
        const free = Math.max(0, 33 - used).toFixed(2);
        availDisplay.textContent = `${free}`;
      } else {
        availDisplay.textContent = '–';
      }
    });

    modalEl.querySelector('.btn-send-cancel').addEventListener('click', () => modal.close());

    modalEl.querySelector('.btn-send-confirm').addEventListener('click', async () => {
      const truckId = selTruck.value;
      if (!truckId) {
        alert('Kérlek válassz ki egy célkamiont!');
        return;
      }

      if (!demand.cartons_per_pallet || parseFloat(demand.cartons_per_pallet) <= 0) {
        alert('⚠️ Hiányzó adat: A tételhez nincs megadva a Karton/Raklap (#/PLT) váltási egység!\n\nA raklapszám kiszámításához szükséges ez az adat. Kérlek add meg az áru igény táblázatban a #/PLT értéket, majd próbáld újra!');
        return;
      }

      const pallets = parseFloat(palletsInput.value);
      if (!pallets || pallets <= 0) {
        alert('Kérlek add meg a küldendő raklapszámot!');
        return;
      }

      const cartonsToSend = Math.round(pallets * parseFloat(demand.cartons_per_pallet));

      const payload = {
        aldi_daily_order_line_id: demand.id,
        product_name: demand.product_name,
        ordered_cartons: cartonsToSend,
        cartons_per_pallet: demand.cartons_per_pallet,
        pallets: pallets,
        delivery_date: demand.delivery_date,
        order_number: demand.order_number,
        order_type: demand.order_type
      };

      try {
        const res = await fetch(`/api/v1/aldi-cross-docking/trucks/${truckId}/lines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          modal.close();
          loadDemands();
          loadTrucks();
        } else {
          alert('Hiba történt a tétel küldése során.');
        }
      } catch (err) {
        alert('Hálózati hiba: ' + err.message);
      }
    });
  }

  // ============= ÚJ KAMION / KAMION SZERKESZTÉSE MODAL =============
  async function openEditTruckModal(truckId = null) {
    const isNew = !truckId;
    const existing = isNew ? null : state.trucks.find(t => t.id === truckId);

    const title = isNew ? 'Új kamion rögzítése (ALDI)' : `Kamion szerkesztése: ${existing ? existing.truck_number : ''}`;

    const dateVal = existing && existing.delivery_date ? String(existing.delivery_date).substring(0, 10) : new Date().toISOString().substring(0, 10);
    const usedPallets = existing ? (parseFloat(existing.total_pallets) || 0) : 0;
    const freeSpots = Math.max(0, 33 - usedPallets).toFixed(2);

    let defaultTruckNum = '';
    if (isNew && state.trucks) {
      let maxNum = 0;
      state.trucks.forEach(t => {
        if (t.truck_number) {
          const match = t.truck_number.match(/(?:AL|ALDI)\s*0*(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      });
      defaultTruckNum = `AL${String(maxNum + 1).padStart(2, '0')}`;
    }

    const modalContent = `
      <div style="padding:16px 20px; display:flex; flex-direction:column; gap:14px; height:100%; box-sizing:border-box;">
        
        <!-- FELSŐ VEZÉRLŐSÁV / FEJLÉC ADATOK -->
        <div style="padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
          <div style="flex:0 0 90px;">
            <label style="font-size:11px; font-weight:600; color:#334155; display:block; margin-bottom:4px;">Kamionszám: <span style="color:red;">*</span></label>
            <input type="text" id="m-truck-num" class="access-control-input" style="font-size:12px; padding:4px 6px; height:30px; width:100%; text-transform:uppercase;" placeholder="Pl. AL01" value="${escHtml(existing?.truck_number || defaultTruckNum)}">
          </div>
          <div style="flex:0 0 180px;">
            <label style="font-size:11px; font-weight:600; color:#334155; display:block; margin-bottom:4px;">Rendszám (Vontató + Pótkocsi):</label>
            <input type="text" id="m-truck-plate1" class="access-control-input" style="font-size:12px; padding:4px 6px; height:30px; width:100%; text-transform:uppercase;" placeholder="Pl. ABC-123 / XYZ-789" value="${escHtml(existing?.license_plate_1 || '')}">
          </div>
          <div style="flex:0 0 125px;">
            <label style="font-size:11px; font-weight:600; color:#334155; display:block; margin-bottom:4px;">Szállítási nap: <span style="color:red;">*</span></label>
            <input type="date" id="m-truck-date" class="access-control-input" style="font-size:12px; padding:4px 6px; height:30px; width:100%;" value="${dateVal}">
          </div>
          <div style="flex:0 0 130px;">
            <label style="font-size:11px; font-weight:600; color:#334155; display:block; margin-bottom:4px;">Fuvarozó:</label>
            <input type="text" id="m-truck-transporter" class="access-control-input" style="font-size:12px; padding:4px 6px; height:30px; width:100%;" placeholder="Fuvarozó neve" value="${escHtml(existing?.transporter || '')}">
          </div>
          <div style="flex:none;">
            <button class="primary-btn btn-truck-save" style="height:30px; padding:0 16px; background:#2563eb; border-color:#1d4ed8;">Mentés</button>
          </div>
        </div>

        <!-- KAMION TARTALMA / TÉTELEK TÁBLÁZATA -->
        <div class="access-subform" style="flex:1; min-height:220px; display:flex; flex-direction:column; margin-top:0;">
          <div class="access-subform-header" style="font-size:12px; padding:6px 12px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700;">Kamionra rakott tételek</span>
          </div>
          <div style="flex:1; overflow:auto;">
            <table class="access-subform-table" style="font-size:11px; width:100%; white-space:nowrap;">
              <thead>
                <tr>
                  <th style="padding:6px 8px; text-align:center; min-width:200px;">TERMÉK</th>
                  <th style="padding:6px 4px; text-align:center; width:70px; white-space:normal; font-size:10px; line-height:1.2;">RENDELT KARTONSZÁM</th>
                  <th style="padding:6px 4px; text-align:center; width:80px; white-space:normal; font-size:10px; line-height:1.2;">SZÁLLÍTHATÓ # / RAKLAP</th>
                  <th style="padding:6px 6px; text-align:center; width:55px;">RAKLAP</th>
                  <th style="padding:6px 8px; text-align:center;">PARTNER</th>
                  <th style="padding:6px 8px; text-align:center;">RENDELÉSI SZÁM</th>
                  <th style="padding:6px 8px; text-align:center;">RENDELÉS TÍPUSA</th>
                  <th style="padding:6px 8px; text-align:center;">CÉL LOKÁCIÓ</th>
                  <th style="padding:6px 8px; text-align:center; width:65px;">BRUTTÓ KG</th>
                  <th style="padding:6px 8px; text-align:center; width:65px;">NETTÓ KG</th>
                  <th style="padding:6px 8px; text-align:center; width:55px;">MŰVELET</th>
                </tr>
              </thead>
              <tbody id="m-truck-lines-tbody">
                <tr>
                  <td colspan="11" style="padding:24px; text-align:center; color:#94a3b8; font-size:11px;">
                    ${isNew ? 'Az új kamion mentése után tudsz rá árut küldeni a jobb oldali Áru igény táblából.' : 'Betöltés...'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <div style="padding:8px 16px; background:#e0f2fe; border:1px solid #7dd3fc; border-radius:6px; font-size:13px; font-weight:700; color:#0369a1;">
            Szabad helyek száma: <span id="m-truck-free-spots">${freeSpots}</span> EU raklap
          </div>
          <button class="secondary-btn btn-truck-close">Bezárás</button>
        </div>

      </div>
    `;

    const modal = windowManager.createModal({
      title: title,
      width: 1050,
      height: 560,
      content: modalContent
    });

    const modalEl = modal.element;
    const inpNum = modalEl.querySelector('#m-truck-num');
    const inpP1 = modalEl.querySelector('#m-truck-plate1');
    const inpDate = modalEl.querySelector('#m-truck-date');
    const inpTrans = modalEl.querySelector('#m-truck-transporter');
    const linesTbody = modalEl.querySelector('#m-truck-lines-tbody');

    // Ha meglévő kamion, betöltjük a tételeit
    async function loadTruckLines() {
      if (isNew) return;
      try {
        const res = await fetch(`/api/v1/aldi-cross-docking/trucks/${truckId}/lines?_t=` + Date.now());
        if (res.ok) {
          const lines = await res.json();
          if (lines.length === 0) {
            linesTbody.innerHTML = '<tr><td colspan="11" style="padding:20px; text-align:center; color:#94a3b8;">A kamion jelenleg üres. Küldj rá tételt az Áru igény táblázatból!</td></tr>';
          } else {
            linesTbody.innerHTML = lines.map(l => `
              <tr>
                <td style="padding:6px 8px; font-weight:600; color:#1e293b; min-width:200px; white-space:normal;">${escHtml(l.product_name)}</td>
                <td style="padding:6px 4px; text-align:right; font-weight:700; width:70px;">${l.ordered_cartons}</td>
                <td style="padding:6px 4px; text-align:right; width:80px;">${l.cartons_per_pallet || '-'}</td>
                <td style="padding:6px 6px; text-align:right; color:#2563eb; width:55px;">${l.pallets ? parseFloat(l.pallets).toFixed(2) : '-'}</td>
                <td style="padding:6px 8px;">
                  <input type="text" class="inp-line-partner" data-id="${l.id}" value="${escHtml(l.partner || '')}" style="width:100px; padding:2px; font-size:11px;">
                </td>
                <td style="padding:6px 8px; color:#64748b;">${escHtml(l.order_number || '-')}</td>
                <td style="padding:6px 8px; color:#64748b;">${escHtml(l.order_type || '-')}</td>
                <td style="padding:6px 8px;">
                  <input type="text" class="inp-line-dest" data-id="${l.id}" value="${escHtml(l.destination || '')}" style="width:80px; padding:2px; font-size:11px;">
                </td>
                <td style="padding:6px 8px; width:65px;">
                  <input type="number" class="inp-line-gross" data-id="${l.id}" value="${l.gross_weight || ''}" style="width:100%; padding:2px; font-size:11px;" step="0.01">
                </td>
                <td style="padding:6px 8px; width:65px;">
                  <input type="number" class="inp-line-net" data-id="${l.id}" value="${l.net_weight || ''}" style="width:100%; padding:2px; font-size:11px;" step="0.01">
                </td>
                <td style="padding:4px 6px; text-align:center; width:55px;">
                  <button class="btn-save-truck-line" data-id="${l.id}" title="Mentés" style="background:none; border:none; cursor:pointer; color:#10b981; font-size:14px;">💾</button>
                  <button class="btn-del-truck-line" data-id="${l.id}" title="Tétel törlése a kamionról" style="background:none; border:none; cursor:pointer; color:#dc2626; font-size:14px; margin-left:4px;">✕</button>
                </td>
              </tr>
            `).join('');

            linesTbody.querySelectorAll('.btn-del-truck-line').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const lineId = e.currentTarget.getAttribute('data-id');
                if (!confirm('Biztosan visszateszed ezt a tételt a kamionról az áruigénybe?')) return;
                try {
                  const delRes = await fetch(`/api/v1/aldi-cross-docking/trucks/${truckId}/lines/${lineId}`, { method: 'DELETE' });
                  if (delRes.ok) {
                    loadTruckLines();
                    loadDemands();
                    loadTrucks();
                  }
                } catch (err) {
                  alert('Hiba a törlés során: ' + err.message);
                }
              });
            });

            linesTbody.querySelectorAll('.btn-save-truck-line').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const lineId = e.currentTarget.getAttribute('data-id');
                const row = e.currentTarget.closest('tr');
                const payload = {
                  partner: row.querySelector('.inp-line-partner')?.value,
                  destination: row.querySelector('.inp-line-dest')?.value,
                  gross_weight: parseFloat(row.querySelector('.inp-line-gross')?.value) || null,
                  net_weight: parseFloat(row.querySelector('.inp-line-net')?.value) || null
                };
                
                try {
                  const updateRes = await fetch(`/api/v1/aldi-cross-docking/truck-lines/${lineId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  if (updateRes.ok) {
                    alert('Sor sikeresen mentve!');
                  } else {
                    alert('Hiba mentéskor.');
                  }
                } catch (err) {
                  alert('Hiba: ' + err.message);
                }
              });
            });
          }
        }
      } catch (err) {
        console.error('Kamion tételek betöltési hiba:', err);
      }
    }

    if (!isNew) {
      loadTruckLines();
    }

    modalEl.querySelector('.btn-truck-close').addEventListener('click', () => modal.close());

    modalEl.querySelector('.btn-truck-save').addEventListener('click', async () => {
      const num = inpNum.value.trim().toUpperCase();
      const date = inpDate.value;
      if (!num || !date) {
        alert('Kamionszám és szállítási nap megadása kötelező!');
        return;
      }

      const payload = {
        truck_number: num,
        delivery_date: date,
        transporter: inpTrans.value.trim(),
        license_plate_1: inpP1.value.trim()
      };

      try {
        const url = isNew ? '/api/v1/aldi-cross-docking/trucks' : `/api/v1/aldi-cross-docking/trucks/${truckId}`;
        const method = isNew ? 'POST' : 'PUT';

        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          modal.close();
          loadTrucks();
        } else {
          alert('Hiba a mentés során.');
        }
      } catch (err) {
        alert('Hálózati hiba: ' + err.message);
      }
    });
  }

  // Segédfüggvény: HTML escape
  function escHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Szűrők eseményei
  filterProductInput.addEventListener('input', () => {
    state.filterProduct = filterProductInput.value;
    renderDemands();
  });

  filterDateInput.addEventListener('change', () => {
    state.filterDate = filterDateInput.value;
    loadDemands();
  });

  filterOrderInput.addEventListener('input', () => {
    state.filterOrder = filterOrderInput.value.trim();
    if (state.filterOrder) {
      sessionStorage.setItem('aldi_rakodas_filter_order', state.filterOrder);
    } else {
      sessionStorage.removeItem('aldi_rakodas_filter_order');
    }
    loadDemands();
  });

  btnClearFilters.addEventListener('click', () => {
    filterProductInput.value = '';
    filterDateInput.value = '';
    filterOrderInput.value = '';
    state.filterProduct = '';
    state.filterDate = '';
    state.filterOrder = '';
    sessionStorage.removeItem('aldi_rakodas_filter_order');
    loadDemands();
  });

  btnNewTruck.addEventListener('click', () => {
    openEditTruckModal(null);
  });

  // Inicializálás: Kamionok és Áruigények automatikus betöltése
  loadTrucks();
  loadDemands();
}
