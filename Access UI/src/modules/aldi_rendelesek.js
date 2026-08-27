/**
 * GAVA ERP – ALDI Rendelések modul
 * v1.4.0 – Heti árak fül hozzáadva: XLSX feltöltés, GTIN alapú termékazonosítás,
 *           deviza időszak kezelés, hálózati fájlmentés.
 * Kézi "💾 Mentés" gombbal vezérelt mentés a PostgreSQL adatbázisba.
 */

export function renderAldiRendelesek(container, windowManager) {
  container.style.overflow = 'auto';
  container.style.padding = '0';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';
  container.style.background = 'var(--bg-main, #ffffff)';

  const DEFAULT_PRODUCTS = [
    { id: 'tmp-1', articleNo: '330166', name: 'Nektarin 7kg', gtin: '4061462848056', ean: '', label: '' },
    { id: 'tmp-2', articleNo: '330171', name: 'Nektarin 10*1kg', gtin: '4061462848001', ean: '', label: '' },
    { id: 'tmp-3', articleNo: '329885', name: 'Őszibarack 7kg', gtin: '4061462851506', ean: '', label: '' },
    { id: 'tmp-4', articleNo: '330173', name: 'Őszibarack 10*1kg', gtin: '4061462847981', ean: '', label: '' },
    { id: 'tmp-5', articleNo: '330167', name: 'Sárgabarack 5kg', gtin: '4061462848049', ean: '', label: '' },
    { id: 'tmp-6', articleNo: '330117', name: 'Sárgabarack 10*500g', gtin: '4061462848544', ean: '', label: '' },
    { id: 'tmp-7', articleNo: '330165', name: 'Lapos barack 5kg', gtin: '4061462848704', ean: '', label: '' },
    { id: 'tmp-8', articleNo: '530766', name: 'Körte Limonera 12kg', gtin: '4061459877144', ean: '', label: '' },
    { id: 'tmp-9', articleNo: '597477', name: 'Petrezselyem 10*100g', gtin: '4061462789717', ean: '', label: '' },
    { id: 'tmp-10', articleNo: '666998', name: 'Kapor 6*100g', gtin: '4061463554338', ean: '', label: '' },
    { id: 'tmp-11', articleNo: '330088', name: 'Fürtös uborka 5kg', gtin: '4061462846892', ean: '', label: '' },
    { id: 'tmp-12', articleNo: '687493', name: 'Cukkini 10kg', gtin: '4069365093832', ean: '', label: '' },
    { id: 'tmp-13', articleNo: '658525', name: 'Padlizsán 6kg', gtin: '4061463243454', ean: '', label: '' },
    { id: 'tmp-14', articleNo: '768144', name: 'Fokhagyma 5kg', gtin: '4069366402930', ean: '', label: '' },
    { id: 'tmp-15', articleNo: '329758', name: 'Paprika Palermo 12*300g', gtin: '4061462850196', ean: '', label: '' },
    { id: 'tmp-16', articleNo: '279530', name: 'Kalif Piros 5kg', gtin: '4061461995188', ean: '', label: '' }
  ];

  // ─── State ────────────────────────────────────────────────────────────────────
  let state = {
    activeTab: 'napi', // 'napi' | 'heti' | 'heti_arak' | 'termekek'
    filterDate: '',
    filterOrderNo: '',
    productSearch: '',
    isLoadingProducts: false,
    hasUnsavedChanges: false,
    orders: [
      { id: '1', date: '2026-07-29', orderNo: '4531552076', orderType: 'Normál', palletCount: 33, fileName: 'ALDI_Order_4531552076.pdf' }
    ],
    products: DEFAULT_PRODUCTS,

    // Heti árak state
    hetiArakYear: new Date().getFullYear(),
    hetiArakWeeks: [],           // [{ id, year, week_code, week_number, xlsx_file_path }, ...]
    hetiArakSelectedWeekId: null,
    hetiArakLines: [],           // Aktuálisan betöltött sorok
    hetiArakIsLoading: false,
    
    // Komissió state
    komissioView: 'summary', // 'summary' | 'detail'
    komissioFilterDate: '',
    komissioFilterTruck: '',
    komissioSummaryData: [],
    komissioDetailTruckId: null,
    komissioDetailTruckNo: '',
    komissioDetailLines: [],
    komissioAvailableProducts: [],
  };

  async function fetchKomissioSummary() {
    try {
      let url = '/api/v1/aldi-cross-docking/commission-summary?';
      if (state.komissioFilterDate) url += `date=${state.komissioFilterDate}&`;
      if (state.komissioFilterTruck) url += `truck_id=${state.komissioFilterTruck}&`;
      const res = await fetch(url);
      if (res.ok) {
        state.komissioSummaryData = await res.json();
        if (state.activeTab === 'komissio' && state.komissioView === 'summary') renderModule();
      }
    } catch (e) {
      console.warn('Nem sikerült a komissió summary lekérése:', e);
    }
  }

  async function fetchKomissioDetail(truckId, truckNo) {
    try {
      const res = await fetch(`/api/v1/aldi-cross-docking/trucks/${truckId}/lines`);
      if (res.ok) {
        const truckLines = await res.json();
        openKomissioDetailWindow(truckId, truckNo, truckLines);
      }
    } catch (e) {
      console.warn('Nem sikerült a komissió detail lekérése:', e);
    }
  }

  function openKomissioDetailWindow(truckId, truckNo, lines) {
    windowManager.open('komissio-detail-' + truckId, 'Komissió: ' + truckNo, (contentEl, wm) => {
      let sumCartons = 0, sumGross = 0, sumNet = 0, sumPallets = 0;
      lines.forEach(l => {
        sumCartons += (parseFloat(l.ordered_cartons) || parseFloat(l.cartons) || 0);
        sumGross += (parseFloat(l.gross_weight) || 0);
        sumNet += (parseFloat(l.net_weight) || 0);
        sumPallets += (parseFloat(l.pallets) || 0);
      });

      contentEl.innerHTML = `
        <div style="padding:16px; background:#fff; height:100%; box-sizing:border-box; overflow:auto;">
          <div style="display:flex; gap:16px; margin-bottom:16px; align-items:flex-end;">
            <div style="display:flex; flex-direction:column; gap:4px; flex-grow:1; max-width:300px;">
              <label style="font-size:11px; font-weight:600; color:#475569;">Termék keresése</label>
              <input type="text" id="komissio-search-${truckId}" placeholder="Keresés termék neve alapján..." style="height:32px; width:100%; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px;">
            </div>
          </div>
          
          <div style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
            <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
              <thead>
                <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155; width:160px;">TERMÉK</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">KARTONSZÁM</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">BRUTTÓ KG</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">NETTÓ KG</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">RAKLAP</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">SZÁRMAZÁSI ORSZÁG</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">KARTON TÍPUS</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">TÁRA SÚLY</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">RAKLAP TÍPUS</th>
                  <th style="padding:10px 8px; font-size:11px; font-weight:800; color:#334155;">LOT SZÁM</th>
                </tr>
              </thead>
              <tbody>
                ${lines.length === 0 ? '<tr><td colspan="10" style="padding:16px; text-align:center; color:#94a3b8;">Nincsenek tételek a kamionon.</td></tr>' : lines.map((l, idx) => `
                  <tr class="komissio-item-row" style="border-bottom:1px solid #f1f5f9; background:${idx % 2 === 1 ? '#fafafa' : '#ffffff'};">
                    <td style="padding:8px; font-weight:600; color:#1e293b;">${l.product_name || '-'}</td>
                    <td style="padding:8px;">${l.ordered_cartons || l.cartons || '-'}</td>
                    <td style="padding:8px;">${l.gross_weight || '-'}</td>
                    <td style="padding:8px;">${l.net_weight || '-'}</td>
                    <td style="padding:8px;">${l.pallets || '-'}</td>
                    <td style="padding:8px;">${l.origin_country || '-'}</td>
                    <td style="padding:8px;">${l.packaging_type || l.carton_type || '-'}</td>
                    <td style="padding:8px;">${l.tare_weight || '-'}</td>
                    <td style="padding:8px;">${l.pallet_type || '-'}</td>
                    <td style="padding:8px;">${l.lot_number || '-'}</td>
                  </tr>
                `).join('')}
                <tr style="background:#e2e8f0; font-weight:700;">
                  <td style="padding:10px; text-align:right;">ÖSSZESEN:</td>
                  <td style="padding:10px;">${sumCartons}</td>
                  <td style="padding:10px;">${sumGross.toFixed(2)}</td>
                  <td style="padding:10px;">${sumNet.toFixed(2)}</td>
                  <td style="padding:10px;">${sumPallets.toFixed(2)}</td>
                  <td colspan="5"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      const searchInput = contentEl.querySelector('#komissio-search-' + truckId);
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase().trim();
          const rows = contentEl.querySelectorAll('.komissio-item-row');
          rows.forEach(row => {
            const prodName = row.cells[0]?.textContent.toLowerCase() || '';
            if (prodName.includes(q)) {
              row.style.display = '';
            } else {
              row.style.display = 'none';
            }
          });
        });
      }
    });
  }

  async function fetchNapiRendelesek() {
    try {
      const res = await fetch('/api/v1/aldi-daily-orders');
      if (res.ok) {
        state.orders = await res.json();
        renderModule();
      }
    } catch (e) {
      console.warn('Nem sikerült a napi rendelések lekérése:', e);
    }
  }

  // ─── Termékek DB funkciók ──────────────────────────────────────────────────────

  async function fetchProductsFromDb() {
    state.isLoadingProducts = true;
    try {
      const res = await fetch('/api/v1/chain-products?chain=ALDI');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          state.products = data.map(item => ({
            id: item.id,
            name: item.product_name || '',
            articleNo: item.article_number || '',
            gtin: item.gtin || '',
            ean: item.ean || '',
            label: item.label || ''
          }));
          state.hasUnsavedChanges = false;
        }
      }
    } catch (e) {
      console.warn('Nem sikerült az ALDI termékek lekérése az API-ból:', e);
    } finally {
      state.isLoadingProducts = false;
      renderModule();
    }
  }

  async function saveProductsToDb() {
    const saveBtn = wrapper.querySelector('#aldi-btn-save-products');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Mentés...';
    }

    try {
      const res = await fetch('/api/v1/chain-products/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain: 'ALDI', products: state.products })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.products) {
          state.products = data.products.map(item => ({
            id: item.id,
            name: item.product_name || '',
            articleNo: item.article_number || '',
            gtin: item.gtin || '',
            ean: item.ean || '',
            label: item.label || ''
          }));
        }
        state.hasUnsavedChanges = false;
        renderModule();
        alert('💾 Termékadatok sikeresen elmentve az adatbázisba!');
      } else {
        alert('❌ Hiba történt az adatbázisba mentés során.');
      }
    } catch (e) {
      console.error('Hiba a termékek mentésekor:', e);
      alert('❌ Nem sikerült a mentés. Ellenőrizd a kapcsolatot!');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  // ─── Heti árak DB funkciók ────────────────────────────────────────────────────

  async function fetchHetiArakWeeks() {
    state.hetiArakIsLoading = true;
    renderModule();
    try {
      const res = await fetch(`/api/v1/aldi-weekly-prices?year=${state.hetiArakYear}`);
      if (res.ok) {
        state.hetiArakWeeks = await res.json();
        // Ha nincs kiválasztott hét, az első legyen aktív
        if (state.hetiArakWeeks.length > 0 && !state.hetiArakSelectedWeekId) {
          state.hetiArakSelectedWeekId = state.hetiArakWeeks[state.hetiArakWeeks.length - 1].id;
        }
        if (state.hetiArakSelectedWeekId) {
          await fetchHetiArakLines(state.hetiArakSelectedWeekId);
          return;
        }
      }
    } catch (e) {
      console.warn('Nem sikerült a heti árak lekérése:', e);
    } finally {
      state.hetiArakIsLoading = false;
      renderModule();
    }
  }

  async function fetchHetiArakLines(weekId) {
    try {
      const res = await fetch(`/api/v1/aldi-weekly-prices/${weekId}/lines`);
      if (res.ok) {
        state.hetiArakLines = await res.json();
      }
    } catch (e) {
      console.warn('Nem sikerült a heti ár sorok lekérése:', e);
    }
  }

  // ─── DOM container ────────────────────────────────────────────────────────────

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding: 16px 28px; display:flex; flex-direction:column; gap:16px; flex:1; min-height:100%;';
  container.appendChild(wrapper);

  // ─── Fő render ────────────────────────────────────────────────────────────────

  function renderModule() {
    // Fókusz mentése újra-renderelés előtt
    const activeEl = document.activeElement;
    let focusSelector = null;
    let selectionStart = null;
    let selectionEnd = null;
    
    if (activeEl && wrapper.contains(activeEl)) {
      if (activeEl.id) {
        focusSelector = '#' + activeEl.id;
      } else if (activeEl.dataset && activeEl.dataset.index && activeEl.dataset.field) {
        focusSelector = `input[data-index="${activeEl.dataset.index}"][data-field="${activeEl.dataset.field}"]`;
      }
      if (focusSelector && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        try {
          selectionStart = activeEl.selectionStart;
          selectionEnd = activeEl.selectionEnd;
        } catch (e) {}
      }
    }

    const tabStyle = (tabKey) => `
      position:relative; background:none; border:none; font-size:14px;
      font-weight:${state.activeTab === tabKey ? '700' : '600'};
      color:${state.activeTab === tabKey ? '#0284c7' : '#64748b'};
      cursor:pointer; padding:8px 12px; transition:color 0.2s;
    `;

    wrapper.innerHTML = `
      <!-- Header with Tabs -->
      <div style="display:flex; align-items:center; gap:28px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
        <button id="aldi-tab-napi" style="${tabStyle('napi')}">
          ${state.activeTab === 'napi' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Napi rendelés
        </button>
        <button id="aldi-tab-heti" style="${tabStyle('heti')}">
          ${state.activeTab === 'heti' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Heti lekötés
        </button>
        <button id="aldi-tab-heti-arak" style="${tabStyle('heti_arak')}">
          ${state.activeTab === 'heti_arak' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Heti árak
        </button>
        <button id="aldi-tab-komissio" style="${tabStyle('komissio')}">
          ${state.activeTab === 'komissio' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Komissió utasítás
        </button>
        <button id="aldi-tab-termekek" style="${tabStyle('termekek')}">
          ${state.activeTab === 'termekek' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Termékek adat tábla
          ${state.hasUnsavedChanges ? '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; margin-left:4px; vertical-align:middle;" title="Nem mentett módosítások"></span>' : ''}
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="aldi-tab-content" style="display:flex; flex-direction:column; flex:1;">
        ${state.activeTab === 'napi' ? renderNapiRendelesHtml() :
        state.activeTab === 'heti' ? renderHetiLekotesHtml() :
          state.activeTab === 'heti_arak' ? renderHetiArakHtml() :
          state.activeTab === 'komissio' ? renderKomissioHtml() :
            renderTermekekHtml()
      }
      </div>
    `;

    bindEvents();

    // Fókusz visszaállítása
    if (focusSelector) {
      const elToFocus = wrapper.querySelector(focusSelector);
      if (elToFocus) {
        elToFocus.focus();
        if (selectionStart !== null) {
          try {
            elToFocus.setSelectionRange(selectionStart, selectionEnd);
          } catch (e) {}
        }
      }
    }
  }

  // ─── Napi rendelés fül ────────────────────────────────────────────────────────

  function renderNapiRendelesHtml() {
    const filteredOrders = state.orders.filter(o => {
      const matchDate = !state.filterDate || (o.delivery_date && o.delivery_date.startsWith(state.filterDate));
      const matchOrder = !state.filterOrderNo || (o.order_number && o.order_number.toLowerCase().includes(state.filterOrderNo.toLowerCase()));
      return matchDate && matchOrder;
    });

    return `
      <div style="display:flex; align-items:flex-end; gap:16px; margin:16px 0 20px 0; flex-wrap:wrap;">
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size:11px; font-weight:600; color:#475569;">Szállítási dátum</label>
          <input type="text" id="aldi-filter-date" class="access-control-input" value="${state.filterDate}" placeholder="" style="height:32px; width:140px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px;">
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size:11px; font-weight:600; color:#475569;">Rendelési szám</label>
          <input type="text" id="aldi-filter-order" class="access-control-input" value="${state.filterOrderNo}" placeholder="Rendszám..." style="height:32px; width:140px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px;">
        </div>
        <div>
          <button id="aldi-btn-upload" class="primary-btn" style="height:34px; padding:0 18px; border-radius:20px; font-size:13px; font-weight:600; background:#2563eb; display:inline-flex; align-items:center; gap:8px; box-shadow:0 2px 4px rgba(37,99,235,0.2);">
            📄 Rendelés feltöltése
          </button>
        </div>
      </div>
      <div style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; max-width:920px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
        <table style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:130px;">SZÁLLÍTÁSI DÁTUM</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:160px;">RENDELÉSI SZÁM</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:120px;">VERZIÓ SZÁMA</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:150px;">RENDELÉS TÍPUSA</th>
              <th style="padding:10px 14px; text-align:center; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:110px;">RAKLAPSZÁM</th>
              <th style="padding:10px 14px; text-align:center; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:160px;">RENDELÉS MEGTEKINTÉSE</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.length === 0 ? `
              <tr><td colspan="6" style="padding:24px; text-align:center; color:#94a3b8; font-size:13px;">Nincs megjeleníthető rendelés a megadott szűrési feltételekkel.</td></tr>
            ` : filteredOrders.map((o, idx) => {
      const dt = new Date(o.delivery_date);
      const formattedDate = !isNaN(dt) ? dt.toISOString().split('T')[0] : o.delivery_date;
      // A megjelenített rendelési szám: eltávolítjuk a régi "-N" suffixet
      const displayOrderNumber = o.order_number.replace(/-\d+$/, '');
      let orderTypeBadgeBg = '#f1f5f9';
      let orderTypeBadgeColor = '#475569';
      let orderTypeBorder = '1px solid #e2e8f0';

      if (o.order_type === 'EUR') {
        orderTypeBadgeBg = '#dbeafe';
        orderTypeBadgeColor = '#1d4ed8';
        orderTypeBorder = '1px solid #bfdbfe';
      } else if (o.order_type === 'HUF') {
        orderTypeBadgeBg = '#fef9c3';
        orderTypeBadgeColor = '#854d0e';
        orderTypeBorder = '1px solid #fef08a';
      }

      return `
              <tr style="border-bottom:1px solid #f1f5f9; ${idx % 2 === 1 ? 'background:#fafafa;' : 'background:#ffffff;'}">
                <td style="padding:10px 14px; color:#1e293b; font-weight:500;">${formattedDate}</td>
                <td style="padding:10px 14px;">
                  <a href="/api/v1/aldi-daily-orders/${o.id}/file" class="aldi-order-link" target="_blank" data-id="${o.id}" data-orderno="${o.order_number}" data-date="${formattedDate}" style="color:#2563eb; font-weight:700; text-decoration:underline;">${displayOrderNumber}</a>
                </td>
                <td style="padding:10px 14px; color:#334155; font-weight:600;">
                  ${o.version || 'N/A'}
                </td>
                <td style="padding:10px 14px; color:#334155;">
                  <span style="display:inline-block; background:${orderTypeBadgeBg}; color:${orderTypeBadgeColor}; font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; border:${orderTypeBorder};">
                    ${o.order_type || 'Nincs heti ár megadva a tételhez'}
                  </span>
                </td>
                <td style="padding:10px 14px; text-align:center; font-weight:700; color:#1e293b;">
                  ${o.pallet_count != null && o.pallet_count !== '' ? o.pallet_count : '-'}
                </td>
                <td style="padding:10px 14px; text-align:center;">
                  <button class="aldi-view-order-btn" data-id="${o.id}" data-orderno="${o.order_number}" data-date="${formattedDate}" style="background:none; border:none; cursor:pointer; font-size:16px;" title="Tételek megtekintése">📋</button>
                  <button class="aldi-delete-order-btn" data-id="${o.id}" style="background:none; border:none; cursor:pointer; font-size:16px; margin-left:8px;" title="Rendelés törlése">🗑️</button>
                </td>
              </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ─── Heti lekötés fül ─────────────────────────────────────────────────────────

  function renderHetiLekotesHtml() {
    return `
      <div style="margin-top:24px; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:40px; text-align:center; max-width:650px;">
        <div style="font-size:38px; margin-bottom:10px;">📅</div>
        <h3 style="margin:0 0 6px 0; font-size:17px; font-weight:700; color:#1e293b;">Heti lekötés modul</h3>
        <p style="margin:0; font-size:13px; color:#64748b;">
          A Heti lekötés funkciók részletezése és folyamata a következő lépésben kerül kidolgozásra.
        </p>
      </div>
    `;
  }

  // ─── Heti árak fül ────────────────────────────────────────────────────────────

  function buildYearOptions() {
    const currentYear = new Date().getFullYear();
    let opts = '';
    for (let y = 2018; y <= currentYear; y++) {
      opts += `<option value="${y}" ${y === state.hetiArakYear ? 'selected' : ''}>${y}</option>`;
    }
    return opts;
  }

  function buildWeekOptions() {
    if (state.hetiArakWeeks.length === 0) {
      return `<option value="">-- Nincs feltöltött hét --</option>`;
    }
    return state.hetiArakWeeks.map(w =>
      `<option value="${w.id}" ${w.id === state.hetiArakSelectedWeekId ? 'selected' : ''}>${w.week_code} (${w.year})</option>`
    ).join('');
  }

  function renderHetiArakHtml() {
    const selectedWeek = state.hetiArakWeeks.find(w => w.id === state.hetiArakSelectedWeekId);
    const lines = state.hetiArakLines;
    const matchedCount = lines.filter(l => l.is_gtin_matched).length;

    return `
      <!-- Heti árak Toolbar -->
      <div style="display:flex; align-items:center; gap:12px; margin:16px 0 14px 0; flex-wrap:wrap;">

        <!-- Év választó -->
        <div style="display:flex; flex-direction:column; gap:3px;">
          <label style="font-size:10px; font-weight:700; color:#475569; letter-spacing:0.4px; text-transform:uppercase;">Év</label>
          <select id="aldi-arak-year-select" style="height:34px; width:90px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; border-radius:8px; padding:4px 8px; background:#fff; color:#1e293b; cursor:pointer;">
            ${buildYearOptions()}
          </select>
        </div>

        <!-- Hét választó -->
        <div style="display:flex; flex-direction:column; gap:3px;">
          <label style="font-size:10px; font-weight:700; color:#475569; letter-spacing:0.4px; text-transform:uppercase;">Hét</label>
          <select id="aldi-arak-week-select" style="height:34px; width:140px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; border-radius:8px; padding:4px 8px; background:#fff; color:#1e293b; cursor:pointer;">
            ${buildWeekOptions()}
          </select>
        </div>

        <!-- Feltöltés gomb -->
        <div style="margin-top:18px;">
          <button id="aldi-arak-upload-btn" style="height:34px; padding:0 18px; border-radius:20px; font-size:13px; font-weight:600; background:#0284c7; color:#fff; border:none; display:inline-flex; align-items:center; gap:8px; cursor:pointer; box-shadow:0 2px 6px rgba(2,132,199,0.25); transition:background 0.2s;">
            📤 Heti árak feltöltése
          </button>
        </div>

        <!-- Letöltés gomb / Információ -->
        ${state.hetiArakIsLoading ? `
          <div style="margin-top:18px; font-size:12px; color:#64748b;">⏳ Betöltés...</div>
        ` : (selectedWeek && selectedWeek.id) ? `
          <div style="margin-top:18px;">
            <a href="/api/v1/aldi-weekly-prices/${selectedWeek.id}/file" download target="_blank" style="height:34px; padding:0 16px; border-radius:20px; font-size:13px; font-weight:600; background:#10b981; color:#fff; text-decoration:none; display:inline-flex; align-items:center; gap:8px; cursor:pointer; box-shadow:0 2px 6px rgba(16,185,129,0.25); transition:background 0.2s;">
              📥 Heti árak letöltése
            </a>
          </div>
        ` : `
          <div style="margin-top:18px; font-size:12px; color:#94a3b8;">Tölts fel egy XLSX fájlt a megjelenítéshez.</div>
        `}
      </div>

      <!-- Heti árak táblázat -->
      ${lines.length === 0 && !state.hetiArakIsLoading ? `
        <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; padding:48px 24px; text-align:center; max-width:900px;">
          <div style="font-size:42px; margin-bottom:10px;">📊</div>
          <h3 style="margin:0 0 6px 0; font-size:15px; font-weight:700; color:#334155;">Nincs feltöltött heti árlista</h3>
          <p style="margin:0; font-size:13px; color:#64748b;">Kattints a <strong>📤 Heti árak feltöltése</strong> gombra az XLSX fájl feltöltéséhez.</p>
        </div>
      ` : `
        <div style="margin-bottom: 8px; font-size: 12px; color: #b45309; display: flex; align-items: center; gap: 6px; font-weight: 500;">
          <span style="display:inline-block; width:14px; height:14px; background:#fef08a; border:1px solid #eab308; border-radius:3px;"></span>
          A sárgával jelölt tételek eredeti időszaka átlépi a heti (szerda-kedd) határt, ezért a rendszer csonkolta azokat.
        </div>
        <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:auto; max-width:1200px; box-shadow:0 1px 4px rgba(0,0,0,0.04); background:#ffffff;">
          <table style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; min-width:900px;">
            <thead>
              <tr style="background:#0f172a; border-bottom:1px solid #cbd5e1;">
                <th style="padding:10px 4px; width:30px;"></th>
                <th style="padding:10px 12px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:200px;">TERMÉK</th>
                <th style="padding:10px 8px; text-align:center; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:85px;">KISZERELÉS</th>
                <th style="padding:10px 8px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:130px;">SZÁRMAZÁS</th>
                <th style="padding:10px 8px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:220px;">CSOMAGOLÁS</th>
                <th style="padding:10px 8px; text-align:right; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:120px;">REKESZKÖLTSÉG</th>
                <th style="padding:10px 8px; text-align:right; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:110px;">EGYSÉGKÖLTSÉG</th>
                <th style="padding:10px 8px; text-align:center; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:170px;">SZÁLLÍTÁSI IDŐSZAK</th>
                <th style="padding:10px 8px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:140px;">GTIN</th>
                <th style="padding:10px 6px; text-align:center; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:80px;">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return lines.map((line, idx) => {
          const isMatched = line.is_gtin_matched;
          const displayName = isMatched
            ? (line.erp_product_name || line.xlsx_product_name || '')
            : (line.xlsx_product_name || '');

          const nameStyle = isMatched
            ? 'color:#1e293b; font-weight:600;'
            : 'color:#dc2626; font-weight:600; background:#fef2f2; padding:2px 6px; border-radius:4px;';

          let rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          if (line.period_status && line.period_status !== 'valid') {
              rowBg = '#fef08a'; // Sárga kiemelés
          }

          // Aktuális mai nap szerinti aktív periódus meghatározása
          let displayedCrateCost = line.crate_cost || '';
          let displayedUnitCost = line.unit_cost || '';
          let activeCurrency = '';
          let activePeriod = null;

          if (line.currency_periods && line.currency_periods.length > 0) {
            activePeriod = line.currency_periods.find(cp => {
              const s = cp.period_start ? cp.period_start.split('T')[0] : '';
              const e = cp.period_end ? cp.period_end.split('T')[0] : '';
              return s <= todayStr && todayStr <= e;
            });

            if (!activePeriod) {
              activePeriod = line.currency_periods[0];
            }

            if (activePeriod) {
              displayedCrateCost = activePeriod.crate_cost || displayedCrateCost;
              displayedUnitCost = activePeriod.unit_cost || displayedUnitCost;
              activeCurrency = activePeriod.currency_code;
            }
          }

          if (!activeCurrency) {
            const isEur = displayedCrateCost.startsWith('€') || displayedUnitCost.startsWith('€');
            activeCurrency = isEur ? 'EUR' : 'HUF';
          }

          const isMultiPeriod = line.currency_periods && line.currency_periods.length > 1;
          const currencyBadgeColor = activeCurrency === 'EUR' ? '#1d4ed8' : '#854d0e';
          const currencyBadgeBg = activeCurrency === 'EUR' ? '#dbeafe' : '#fef9c3';

          let currencyBadge = `<span style="display:inline-block; background:${currencyBadgeBg}; color:${currencyBadgeColor}; font-size:10px; font-weight:700; border-radius:4px; padding:2px 6px;">${activeCurrency}</span>`;
          if (isMultiPeriod) {
            currencyBadge += `<span style="display:inline-block; background:#e0e7ff; color:#4338ca; font-size:9px; font-weight:700; border-radius:4px; padding:1px 4px; margin-left:3px;" title="${line.currency_periods.length} rögzített deviza időszak">🔀 ${line.currency_periods.length}</span>`;
          }

          const tooltipText = line.currency_periods && line.currency_periods.length > 0
            ? `Aktív (${activeCurrency}): ${displayedCrateCost} / ${displayedUnitCost}\n\nÖsszes időszak:\n` + line.currency_periods.map(cp => {
              const s = cp.period_start ? cp.period_start.split('T')[0] : '';
              const e = cp.period_end ? cp.period_end.split('T')[0] : '';
              const isCurActive = (cp === activePeriod);
              return `${isCurActive ? '▶ (Aktív) ' : '  '}${s} → ${e} [${cp.currency_code}] Rekesz: ${cp.crate_cost || '-'}, Egység: ${cp.unit_cost || '-'}`;
            }).join('\n')
            : 'Deviza időszak szerkesztése';

          return `
                    <tr class="aldi-arak-row" data-line-id="${line.id}" style="border-bottom:1px solid #f1f5f9; background:${rowBg};" draggable="true">
                      <td style="padding:8px 4px; text-align:center; color:#94a3b8; cursor:grab; font-size:14px;" class="aldi-drag-handle" title="Sorrend átrendezése húzással">↕️</td>
                      <td style="padding:8px 12px;">
                        <div style="${nameStyle}" title="${isMatched ? 'ERP: ' + displayName : 'ALDI XLSX név – nincs ERP match'}">
                          ${!isMatched ? '⚠️ ' : ''}${displayName}
                        </div>
                      </td>
                      <td style="padding:8px 8px; text-align:center; color:#334155; font-weight:600;">${line.carton_content || ''}</td>
                      <td style="padding:8px 8px; color:#475569; font-size:11px;">${(line.origin || '').replace(/, /g, '<br>')}</td>
                      <td style="padding:8px 8px; color:#475569; font-size:11px; line-height:1.3;">${line.packaging || ''}</td>
                      <td style="padding:8px 8px; text-align:right; font-weight:700; color:#0f172a; font-family:monospace; font-size:12px;">${displayedCrateCost || ''}</td>
                      <td style="padding:8px 8px; text-align:right; font-weight:700; color:#0f172a; font-family:monospace; font-size:12px;">${displayedUnitCost || ''}</td>
                      <td style="padding:8px 8px; text-align:center; color:#475569; font-size:11px; cursor:pointer;" class="aldi-arak-delivery-period" data-line-id="${line.id}" title="${(line.original_period_start || line.original_period_end) ? `Eredeti (Excelből): ${line.original_period_start || ''} - ${line.original_period_end || ''}\nKattints a módosításhoz` : 'Kattints a szállítási időszak módosításához'}">
                        ${line.delivery_period_start ? `<div>${line.delivery_period_start}</div>` : ''}
                        ${line.delivery_period_end ? `<div style="color:#94a3b8;">→ ${line.delivery_period_end}</div>` : ''}
                      </td>
                      <td style="padding:8px 8px; font-family:monospace; font-size:11px; color:#64748b;">${line.gtin || ''}</td>
                      <td style="padding:8px 6px; text-align:center;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                          <button class="aldi-arak-currency-btn" data-line-id="${line.id}"
                            style="background:none; border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; padding:3px 7px; font-size:11px; display:inline-flex; align-items:center; gap:2px; transition:background 0.15s;"
                            title="${tooltipText}"
                            onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                            ${currencyBadge}
                          </button>
                          <button class="aldi-arak-delete-btn" data-line-id="${line.id}" style="background:none; border:none; cursor:pointer; font-size:13px; opacity:0.5; transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'" title="Sor törlése">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  `;
        }).join('');
      })()}
            </tbody>
          </table>
        </div>
      `}
    `;
  }

  
  // ─── Komissió utasítás fül ────────────────────────────────────────────────────────

  function renderKomissioHtml() {
    return renderKomissioSummaryHtml();
  }

  function renderKomissioSummaryHtml() {
    return `
      <div style="display:flex; align-items:flex-end; gap:16px; margin:16px 0 20px 0; flex-wrap:wrap;">
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size:11px; font-weight:600; color:#475569;">Szállítási dátum</label>
          <input type="text" id="aldi-komissio-filter-date" class="access-control-input" value="${state.komissioFilterDate}" placeholder="YYYY-MM-DD" style="height:32px; width:140px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px;">
        </div>
      </div>
      <div style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
        <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; width:100px;">SZÁLLÍTÁSI DÁTUM</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; width:120px;">KAMION SZÁM</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; text-align:right;">RAKLAP</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; text-align:right;">RENDELT KARTONSZÁM</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; text-align:right;">BRUTTÓ KG</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; text-align:right;">NETTÓ KG</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; text-align:center;">ÖSSZEKÉSZÍTÉS ÁLLAPOTA</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; text-align:right;">KOMISSIÓZOTT KARTONSZÁM</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; text-align:right;">MÉG HÁTRA VAN</th>
              <th style="padding:10px; font-size:11px; font-weight:800; color:#334155; text-align:center;">KOMISSIÓ MEGTEKINTÉSE</th>
            </tr>
          </thead>
          <tbody>
            ${state.komissioSummaryData.length === 0 ? `<tr><td colspan="10" style="padding:24px; text-align:center; color:#94a3b8;">Nincs adat.</td></tr>` :
              state.komissioSummaryData.map((t, idx) => {
                const dt = new Date(t.delivery_date);
                const formattedDate = !isNaN(dt) ? dt.toISOString().split('T')[0] : t.delivery_date;
                const statusColor = t.status_percent === 100 ? '#10b981' : (t.status_percent > 0 ? '#f59e0b' : '#64748b');
                
                return `
                <tr style="border-bottom:1px solid #f1f5f9; ${idx % 2 === 1 ? 'background:#fafafa;' : 'background:#ffffff;'}">
                  <td style="padding:10px; font-weight:500;">${formattedDate}</td>
                  <td style="padding:10px; font-weight:700;">${t.truck_number}</td>
                  <td style="padding:10px; text-align:right;">${t.pallets || 0}</td>
                  <td style="padding:10px; text-align:right;">${t.ordered_cartons || 0}</td>
                  <td style="padding:10px; text-align:right;">${t.gross_weight || 0}</td>
                  <td style="padding:10px; text-align:right;">${t.net_weight || 0}</td>
                  <td style="padding:10px; text-align:center; font-weight:700; color:${statusColor};">${t.status_percent}%</td>
                  <td style="padding:10px; text-align:right;">${t.commissioned_cartons || 0}</td>
                  <td style="padding:10px; text-align:right;">${t.remaining_cartons || 0}</td>
                  <td style="padding:10px; text-align:center;">
                    <button class="aldi-view-komissio-btn" data-id="${t.id}" data-truckno="${t.truck_number}" style="background:none; border:none; cursor:pointer; font-size:18px;" title="Megtekintés">👁️</button>
                  </td>
                </tr>
                `;
              }).join('')
            }
          </tbody>
        </table>
      </div>
    `;
  }




  // ─── Termékek adat tábla fül ──────────────────────────────────────────────────

  function renderTermekekHtml() {
    const q = (state.productSearch || '').toLowerCase().trim();
    const filteredProducts = state.products.filter(p => {
      if (!q) return true;
      return (p.name && p.name.toLowerCase().includes(q)) ||
        (p.articleNo && p.articleNo.toLowerCase().includes(q)) ||
        (p.gtin && p.gtin.toLowerCase().includes(q)) ||
        (p.ean && p.ean.toLowerCase().includes(q)) ||
        (p.label && p.label.toLowerCase().includes(q));
    });

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; margin:16px 0 12px 0; max-width:920px; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <button id="aldi-btn-add-product" class="secondary-btn" style="height:34px; padding:0 16px; border-radius:8px; font-size:13px; font-weight:700; border:1px solid #cbd5e1; background:#ffffff; display:inline-flex; align-items:center; gap:6px; cursor:pointer; color:#0f172a;">
            ➕ Új termék sor hozzáadása
          </button>
          <button id="aldi-btn-save-products" class="primary-btn" style="height:34px; padding:0 18px; border-radius:8px; font-size:13px; font-weight:700; background:${state.hasUnsavedChanges ? '#16a34a' : '#2563eb'}; display:inline-flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 2px 4px rgba(37,99,235,0.2);">
            💾 Mentés ${state.hasUnsavedChanges ? '(Nem mentett adatok!)' : ''}
          </button>
          <span style="font-size:12px; color:#64748b; font-weight:500;">Összesen: <strong>${state.products.length}</strong> termék</span>
        </div>
        <div>
          <input type="text" id="aldi-product-search-input" class="access-control-input" value="${state.productSearch}" placeholder="Keresés név, cikkszám, GTIN..." style="height:32px; width:220px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
        </div>
      </div>
      <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; max-width:920px; box-shadow:0 1px 4px rgba(0,0,0,0.04); background:#ffffff;">
        <table style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:220px;">TERMÉK MEGNEVEZÉSE</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:130px;">CIKKSZÁM</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:170px;">GTIN AZONOSÍTÓ</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:140px;">EAN AZONOSÍTÓ</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:120px;">CÍMKE</th>
              <th style="padding:10px 10px; text-align:center; font-size:11px; font-weight:800; color:#64748b; letter-spacing:0.5px; width:60px;">MŰVELET</th>
            </tr>
          </thead>
          <tbody id="aldi-products-tbody">
            ${filteredProducts.length === 0 ? `
              <tr><td colspan="6" style="padding:24px; text-align:center; color:#94a3b8; font-size:13px;">Nincs megjeleníthető termék. Kattints a <strong>➕ Új termék sor hozzáadása</strong> gombra!</td></tr>
            ` : filteredProducts.map((p, idx) => `
              <tr data-index="${idx}" data-id="${p.id || ''}" style="border-bottom:1px solid #f1f5f9; ${idx % 2 === 1 ? 'background:#fafafa;' : 'background:#ffffff;'}">
                <td style="padding:6px 14px; color:#1e293b; font-weight:600;">
                  <input type="text" class="aldi-prod-field aldi-prod-name" data-field="name" data-id="${p.id || ''}" data-index="${idx}" value="${p.name || ''}" placeholder="Termék neve..." style="width:100%; border:1px solid transparent; background:transparent; font-weight:600; padding:4px 6px; border-radius:4px; font-size:13px;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';">
                </td>
                <td style="padding:6px 14px; color:#334155;">
                  <input type="text" class="aldi-prod-field aldi-prod-article" data-field="articleNo" data-id="${p.id || ''}" data-index="${idx}" value="${p.articleNo || ''}" placeholder="Cikkszám..." style="width:100%; border:1px solid transparent; background:transparent; padding:4px 6px; border-radius:4px; font-size:13px;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';">
                </td>
                <td style="padding:6px 14px; color:#334155; font-family:monospace;">
                  <input type="text" class="aldi-prod-field aldi-prod-gtin" data-field="gtin" data-id="${p.id || ''}" data-index="${idx}" value="${p.gtin || ''}" placeholder="GTIN..." style="width:100%; border:1px solid transparent; background:transparent; font-family:monospace; padding:4px 6px; border-radius:4px; font-size:13px;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';">
                </td>
                <td style="padding:6px 14px; color:#334155; font-family:monospace;">
                  <input type="text" class="aldi-prod-field aldi-prod-ean" data-field="ean" data-id="${p.id || ''}" data-index="${idx}" value="${p.ean || ''}" placeholder="EAN..." style="width:100%; border:1px solid transparent; background:transparent; font-family:monospace; padding:4px 6px; border-radius:4px; font-size:13px;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';">
                </td>
                <td style="padding:6px 14px; color:#334155;">
                  <input type="text" class="aldi-prod-field aldi-prod-label" data-field="label" data-id="${p.id || ''}" data-index="${idx}" value="${p.label || ''}" placeholder="Címke..." style="width:100%; border:1px solid transparent; background:transparent; padding:4px 6px; border-radius:4px; font-size:13px;" onfocus="this.style.border='1px solid #93c5fd'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';">
                </td>
                <td style="padding:6px 10px; text-align:center;">
                  <button class="aldi-prod-delete-btn" data-id="${p.id || ''}" data-index="${idx}" style="background:none; border:none; cursor:pointer; font-size:14px; opacity:0.6; padding:4px; border-radius:4px; transition:opacity 0.2s;" title="Sor törlése" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size:11px; color:#64748b; margin-top:8px;">
        💡 A cellák módosítása és új sor felvétele után kattints a fenti <strong>💾 Mentés</strong> gombra a végleges adatbázisba íráshoz!
      </div>
    `;
  }

  // ─── Modálok ──────────────────────────────────────────────────────────────────

  function openAddProductModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:440px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column;">
        <div style="padding:12px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#ffffff;">
          <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:8px;">➕ Új ALDI termék felvétele</h3>
          <button id="aldi-prod-modal-close-x" style="background:none; border:none; font-size:16px; cursor:pointer; color:#64748b; font-weight:700;">✕</button>
        </div>
        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:700; color:#334155;">Termék megnevezése: *</label>
            <input type="text" id="aldi-new-prod-name" class="access-control-input" placeholder="Pl. Nektarin 7kg" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:700; color:#334155;">Cikkszám: *</label>
            <input type="text" id="aldi-new-prod-articleno" class="access-control-input" placeholder="Pl. 330166" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:700; color:#334155;">GTIN azonosító: *</label>
            <input type="text" id="aldi-new-prod-gtin" class="access-control-input" placeholder="Pl. 4061462848056" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:700; color:#334155;">EAN azonosító:</label>
            <input type="text" id="aldi-new-prod-ean" class="access-control-input" placeholder="Opcionális..." style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:700; color:#334155;">Címke:</label>
            <input type="text" id="aldi-new-prod-label" class="access-control-input" placeholder="Opcionális..." style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
          </div>
        </div>
        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; background:#ffffff; display:flex; justify-content:flex-end; gap:10px;">
          <button id="aldi-prod-modal-cancel" style="padding:6px 18px; border-radius:8px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">Mégse</button>
          <button id="aldi-prod-modal-add-row" style="padding:6px 20px; border-radius:8px; font-size:13px; font-weight:700; border:none; background:#0284c7; color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(2,132,199,0.2);">➕ Sor hozzáadása</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    modalOverlay.querySelector('#aldi-prod-modal-close-x')?.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.querySelector('#aldi-prod-modal-cancel')?.addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelector('#aldi-prod-modal-add-row')?.addEventListener('click', () => {
      const name = modalOverlay.querySelector('#aldi-new-prod-name').value.trim();
      const articleNo = modalOverlay.querySelector('#aldi-new-prod-articleno').value.trim();
      const gtin = modalOverlay.querySelector('#aldi-new-prod-gtin').value.trim();
      const ean = modalOverlay.querySelector('#aldi-new-prod-ean').value.trim();
      const label = modalOverlay.querySelector('#aldi-new-prod-label').value.trim();

      if (!name) { alert('Kérlek add meg a termék megnevezését!'); return; }

      state.products.push({ id: `tmp-${Date.now()}`, name, articleNo, gtin, ean, label });
      state.hasUnsavedChanges = true;
      modalOverlay.remove();
      renderModule();
    });
  }

  function openPdfViewerModal(url, title) {
    if (windowManager && typeof windowManager.createModal === 'function') {
      const contentHtml = `
        <div style="display:flex; flex-direction:column; height:100%;">
          <div style="padding:8px 12px; border-bottom:1px solid #e2e8f0; background:#f8fafc; display:flex; justify-content:flex-end;">
            <a href="${url}" target="_blank" style="padding:4px 12px; border-radius:4px; font-size:12px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; text-decoration:none;">Új lapon nyit</a>
          </div>
          <div style="flex:1; background:#94a3b8;">
            <iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>
          </div>
        </div>
      `;
      windowManager.createModal({
        title: title,
        width: 850,
        height: 600,
        content: contentHtml
      });
    } else {
      // Fallback if windowManager is missing
      const modalOverlay = document.createElement('div');
      modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';

      modalOverlay.innerHTML = `
        <div style="background:#ffffff; width:95%; height:95%; max-width:1200px; border-radius:12px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); display:flex; flex-direction:column; overflow:hidden;">
          <div style="padding:12px 20px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#f8fafc;">
            <h3 style="margin:0; font-size:15px; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:8px;">📄 ${title}</h3>
            <div style="display:flex; gap:10px;">
              <a href="${url}" target="_blank" style="padding:6px 16px; border-radius:6px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; text-decoration:none; display:inline-flex; align-items:center;">Új lapon nyit</a>
              <button id="aldi-pdf-close" style="background:#ef4444; color:white; border:none; border-radius:6px; padding:6px 16px; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 2px 4px rgba(239,68,68,0.2);">Bezárás</button>
            </div>
          </div>
          <div style="flex:1; background:#94a3b8; position:relative;">
            <iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>
          </div>
        </div>
      `;

      document.body.appendChild(modalOverlay);
      modalOverlay.querySelector('#aldi-pdf-close').addEventListener('click', () => modalOverlay.remove());
    }
  }

  async function openOrderViewModal(id, orderNo, dateStr) {
    const windowId = 'order-view-' + id;
    const title = `Rendelés: ${orderNo} | Dátum: ${dateStr}`;

    let lines = [];
    try {
      const res = await fetch('/api/v1/aldi-daily-orders/' + id + '/lines');
      lines = await res.json();
    } catch(err) {
      alert("Hiba történt a tételek betöltése során!");
      return;
    }

    let tableHtml = '';
    if (lines && lines.length > 0) {
      tableHtml = `
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
              <th style="padding:8px 12px; text-align:left; font-weight:700; color:#334155;">Cikkszám</th>
              <th style="padding:8px 12px; text-align:left; font-weight:700; color:#334155;">Termék megnevezése</th>
              <th style="padding:8px 12px; text-align:left; font-weight:700; color:#334155;">GTIN szám</th>
              <th style="padding:8px 12px; text-align:right; font-weight:700; color:#334155;">Rendelt kartonszám</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map((l, i) => {
              const prod = state.products.find(p => p.gtin === l.gtin || p.product_name === l.product_name);
              const cikk = prod ? (prod.articleNo || prod.article_number || '') : '';
              return `
              <tr style="${i % 2 === 1 ? 'background:#fafafa;' : 'background:#ffffff;'} border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 12px; color:#475569; font-weight:600;">${cikk}</td>
                <td style="padding:8px 12px; color:#1e293b;">${l.product_name}</td>
                <td style="padding:8px 12px; color:#64748b; font-family:monospace;">${l.gtin || ''}</td>
                <td style="padding:8px 12px; text-align:right; font-weight:600; color:#2563eb;">${Number(l.ordered_cartons)}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHtml = '<div style="text-align:center; padding:20px; color:#64748b; font-size:13px;">Nem találhatók tételsorok.</div>';
    }

    const contentHtml = `
      <div style="display:flex; flex-direction:column; height:100%; background:#ffffff;">
        <div style="flex:1; padding:16px 20px; overflow-y:auto;">
          ${tableHtml}
        </div>
        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; background:#f8fafc; display:flex; justify-content:space-between; align-items:center;">
          <button id="export-btn-${id}" style="padding:6px 18px; border-radius:20px; font-size:13px; font-weight:600; border:1px solid #10b981; background:#ffffff; color:#10b981; cursor:pointer; display:${lines.length > 0 ? 'inline-flex' : 'none'}; align-items:center; gap:6px;">⬇️ Excel Export</button>
          <button id="send-to-demands-btn-${id}" class="primary-btn" style="padding:6px 18px; border-radius:20px; font-size:13px; font-weight:600; display:${lines.length > 0 ? 'inline-flex' : 'none'}; align-items:center; gap:6px; background:#2563eb; color:white; border:none; cursor:pointer;">Rakodásra küldés &gt;&gt;&gt;</button>
        </div>
      </div>
    `;

    if (windowManager && typeof windowManager.createModal === 'function') {
      windowManager.createModal({
        title: title,
        width: 750,
        height: 500,
        content: contentHtml
      });
      
      setTimeout(() => {
        // Modal id is auto-generated by WindowManager, so we just search for the button inside the DOM
        const exportBtn = document.getElementById(`export-btn-${id}`);
        if (exportBtn) {
          exportBtn.addEventListener('click', () => doExcelExport(lines, orderNo, dateStr));
        }

        const sendBtn = document.getElementById(`send-to-demands-btn-${id}`);
        if (sendBtn) {
          sendBtn.addEventListener('click', async () => {
             // API hívás, ami beállítja a sent_to_rakodas = true taget az adatbázisban
             try {
               const res = await fetch(`/api/v1/aldi-daily-orders/${id}/send-to-rakodas`, {
                 method: 'PATCH'
               });
               if (!res.ok) {
                 if (res.status === 409) {
                     alert(`Figyelem! A tétel - SZÁLLÍTÁSI DÁTUM: ${dateStr}, RENDELÉSI SZÁM: ${orderNo}, VERZIÓ SZÁMA - hármas azonosítóval már át lett küldve a Rakodás modulba! Ezt a műveletet nem hajthatja végre még egyszer.`);
                 } else {
                     alert('Hiba történt a tétel átküldésekor.');
                 }
                 return;
               }
             } catch (err) {
               console.error(err);
               alert('Hálózati hiba.');
               return;
             }

             sendBtn.textContent = '✓ Sikeresen elküldve!';
             sendBtn.style.backgroundColor = '#16a34a';
             sendBtn.style.color = 'white';
             sendBtn.disabled = true;

             setTimeout(() => {
               const closeBtn = document.querySelector('.window-manager-modal-close');
               if (closeBtn) closeBtn.click();
             }, 1000);
          });
        }
      }, 100);
    } else {
      // Fallback
      alert('WindowManager nem elérhető, kérlek frissítsd az oldalt!');
    }
  }

  function doExcelExport(lines, orderNo, dateStr) {
    if (typeof XLSX === 'undefined') {
      alert('Az Excel generáló modul még töltődik, kérlek próbáld újra pár másodperc múlva!');
      return;
    }
    
    const aoa = [
      ["Szállítási dátum:", dateStr],
      ["Rendelési szám:", orderNo],
      [], // üres sor
      ["Göngyöleg", "Cikkszám", "Termék megnevezése", "GTIN szám", "Rendelt kartonszám"]
    ];

    lines.forEach(l => {
      const prod = state.products.find(p => p.gtin === l.gtin || p.product_name === l.product_name);
      // Fallback for article number mapping differences
      const cikk = prod ? (prod.article_number || prod.articleNo || '') : '';
      aoa.push([
        "", // Göngyöleg
        cikk,
        l.product_name || '',
        l.gtin || '',
        Number(l.ordered_cartons) || 0
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Apply styles to header row (row index 3)
    const headerRow = 3;
    const cols = ['A', 'B', 'C', 'D', 'E'];
    cols.forEach(col => {
      const cellRef = col + (headerRow + 1); // 1-based index in Excel, so 'A4'
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "d9ead3" } } // light green
        };
      }
    });

    ws['!cols'] = [
      { wch: 15 }, // Göngyöleg
      { wch: 15 }, // Cikkszám
      { wch: 40 }, // Termék megnevezése
      { wch: 20 }, // GTIN
      { wch: 20 }  // Kartonszám
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rendelés");
    XLSX.writeFile(wb, `rendeles_${orderNo}.xlsx`);
  }

  function openUploadModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:440px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column;">
        <div style="padding:12px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#ffffff;">
          <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:8px;">📄 Rendelés feltöltése (PDF)</h3>
          <button id="aldi-modal-close-x" style="background:none; border:none; font-size:16px; cursor:pointer; color:#64748b; font-weight:700;">✕</button>
        </div>
        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:14px;">
          <div id="aldi-dropzone" style="border:2px dashed #93c5fd; background:#f0f9ff; border-radius:8px; padding:30px 16px; text-align:center; cursor:pointer; transition:background 0.2s;">
            <input type="file" id="aldi-file-input" accept=".pdf" style="display:none;">
            <div style="font-size:36px; margin-bottom:6px;">📁</div>
            <div style="font-size:13px; font-weight:600; color:#1d4ed8; margin-bottom:4px;" id="aldi-dropzone-text">Húzza ide a PDF fájlt, vagy kattintson a tallózáshoz</div>
          </div>
        </div>
        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; background:#ffffff; display:flex; justify-content:center; gap:12px;">
          <button id="aldi-modal-cancel" style="padding:6px 22px; border-radius:20px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">Mégse</button>
          <button id="aldi-modal-save" style="padding:6px 24px; border-radius:20px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(37,99,235,0.2);">📤 Feltöltés</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    let selectedFile = null;
    const fileInput = modalOverlay.querySelector('#aldi-file-input');
    const dropzone = modalOverlay.querySelector('#aldi-dropzone');
    const dropzoneText = modalOverlay.querySelector('#aldi-dropzone-text');

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        selectedFile = e.target.files[0];
        dropzoneText.textContent = `Kiválasztva: ${selectedFile.name}`;
      }
    });
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.background = '#e0f2fe'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.background = '#f0f9ff'; });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.background = '#f0f9ff';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        selectedFile = e.dataTransfer.files[0];
        dropzoneText.textContent = `Kiválasztva: ${selectedFile.name}`;
      }
    });

    modalOverlay.querySelector('#aldi-modal-close-x')?.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.querySelector('#aldi-modal-cancel')?.addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelector('#aldi-modal-save')?.addEventListener('click', async () => {
      if (!selectedFile) { alert('Kérlek válassz ki egy PDF fájlt!'); return; }

      const saveBtn = modalOverlay.querySelector('#aldi-modal-save');
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Feltöltés...';

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch('/api/v1/aldi-daily-orders/upload', {
          method: 'POST',
          body: formData
        });

        const result = await res.json();
        if (res.ok) {
          alert('✅ Sikeres feltöltés!');
          modalOverlay.remove();
          fetchNapiRendelesek(); // Frissítjük a táblázatot
        } else {
          alert('❌ Hiba: ' + (result.error || 'Ismeretlen hiba'));
        }
      } catch (err) {
        console.error('Feltöltési hiba:', err);
        alert('❌ Hiba történt a fájl feltöltésekor!');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '📤 Feltöltés';
      }
    });
  }

  // ─── Heti árak feltöltő modal ─────────────────────────────────────────────────

  function openHetiArakUploadModal() {
    const currentYear = new Date().getFullYear();
    let yearOptions = '';
    for (let y = 2018; y <= currentYear; y++) {
      yearOptions += `<option value="${y}" ${y === state.hetiArakYear ? 'selected' : ''}>${y}</option>`;
    }

    // Csak a ténylegesen feltöltött hetek + "Új hét" opció
    const existingWeekOpts = state.hetiArakWeeks
      .filter(w => w.year === state.hetiArakYear)
      .sort((a, b) => (a.week_number || 0) - (b.week_number || 0))
      .map(w => `<option value="existing:${w.week_code}">${w.week_code} – frissítés</option>`)
      .join('');

    // Következő KW javasolt szám (eggyel a legnagyobb meglévő fölé)
    const existingForYear = state.hetiArakWeeks.filter(w => w.year === state.hetiArakYear);
    const maxKw = existingForYear.length > 0
      ? Math.max(...existingForYear.map(w => w.week_number || 0))
      : Math.min(53, Math.max(1, Math.ceil((Date.now() - new Date(`${state.hetiArakYear}-01-01`)) / (7 * 24 * 3600 * 1000))));
    const nextKwSuggestion = Math.min(53, maxKw + (existingForYear.length > 0 ? 1 : 0));

    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:480px; border-radius:14px; box-shadow:0 20px 60px rgba(0,0,0,0.25); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column;">

        <!-- Modal Header -->
        <div style="padding:14px 20px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#0f172a;">
          <h3 style="margin:0; font-size:14px; font-weight:700; color:#f8fafc; display:flex; align-items:center; gap:8px;">📤 Heti árak feltöltése</h3>
          <button id="aldi-arak-modal-close" style="background:none; border:none; font-size:16px; cursor:pointer; color:#94a3b8; font-weight:700;">✕</button>
        </div>

        <!-- Modal Body -->
        <div style="padding:18px 22px; display:flex; flex-direction:column; gap:14px;">

          <!-- Év és Hét választó -->
          <div style="display:flex; gap:12px; align-items:flex-end;">
            <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
              <label style="font-size:11px; font-weight:700; color:#334155; text-transform:uppercase; letter-spacing:0.4px;">Év</label>
              <select id="aldi-arak-modal-year" style="height:36px; font-size:13px; border:1px solid #cbd5e1; border-radius:8px; padding:4px 10px; background:#fff; color:#1e293b;">
                ${yearOptions}
              </select>
            </div>

            <!-- Hét: csak a már feltöltöttek + Új hét -->
            <div style="display:flex; flex-direction:column; gap:4px; flex:2;">
              <label style="font-size:11px; font-weight:700; color:#334155; text-transform:uppercase; letter-spacing:0.4px;">Hét</label>
              <select id="aldi-arak-modal-week" style="height:36px; font-size:13px; border:1px solid #cbd5e1; border-radius:8px; padding:4px 10px; background:#fff; color:#1e293b;">
                <option value="new">➕ Új hét</option>
                ${existingWeekOpts}
              </select>
            </div>
          </div>

          <!-- Új hét KW szám beviteli mező (csak "Új hét" esetén látható) -->
          <div id="aldi-arak-new-kw-wrap" style="display:flex; align-items:center; gap:10px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:10px 14px;">
            <span style="font-size:12px; color:#0369a1; font-weight:600;">KW száma (1–53):</span>
            <input type="number" id="aldi-arak-new-kw-input" min="1" max="53" value="${nextKwSuggestion}"
              style="height:32px; width:80px; font-size:14px; font-weight:700; border:1px solid #7dd3fc; border-radius:6px; padding:4px 8px; background:#ffffff; color:#0284c7; text-align:center;">
            <span id="aldi-arak-new-kw-preview" style="font-size:13px; font-weight:700; color:#0284c7;">→ KW${String(nextKwSuggestion).padStart(2, '0')}</span>
          </div>

          <!-- Drag & Drop zone -->
          <div id="aldi-arak-dropzone" style="border:2px dashed #7dd3fc; background:#f0f9ff; border-radius:10px; padding:28px 16px; text-align:center; cursor:pointer; transition:all 0.2s;">
            <input type="file" id="aldi-arak-file-input" accept=".xlsx,.xls" style="display:none;">
            <div style="font-size:40px; margin-bottom:8px;">📊</div>
            <div style="font-size:13px; font-weight:700; color:#0369a1; margin-bottom:4px;" id="aldi-arak-dropzone-text">
              Húzza ide az XLSX fájlt, vagy kattintson a tallózáshoz
            </div>
            <div style="font-size:11px; color:#64748b;">Csak XLSX / XLS formátum</div>
          </div>

          <!-- Státusz üzenet -->
          <div id="aldi-arak-upload-status" style="display:none; padding:10px 14px; border-radius:8px; font-size:12px; font-weight:600;"></div>
        </div>

        <!-- Modal Footer -->
        <div style="padding:14px 22px; border-top:1px solid #e2e8f0; background:#f8fafc; display:flex; justify-content:flex-end; gap:10px;">
          <button id="aldi-arak-modal-cancel" style="padding:7px 22px; border-radius:20px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">
            Mégsem
          </button>
          <button id="aldi-arak-modal-upload-btn" style="padding:7px 24px; border-radius:20px; font-size:13px; font-weight:700; border:none; background:#0284c7; color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 2px 6px rgba(2,132,199,0.3);">
            📤 Feltöltés
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    let selectedFile = null;
    const fileInput = modalOverlay.querySelector('#aldi-arak-file-input');
    const dropzone = modalOverlay.querySelector('#aldi-arak-dropzone');
    const dropzoneText = modalOverlay.querySelector('#aldi-arak-dropzone-text');
    const weekSelect = modalOverlay.querySelector('#aldi-arak-modal-week');
    const yearSelect = modalOverlay.querySelector('#aldi-arak-modal-year');
    const statusDiv = modalOverlay.querySelector('#aldi-arak-upload-status');
    const newKwWrap = modalOverlay.querySelector('#aldi-arak-new-kw-wrap');
    const newKwInput = modalOverlay.querySelector('#aldi-arak-new-kw-input');
    const newKwPreview = modalOverlay.querySelector('#aldi-arak-new-kw-preview');

    // KW preview frissítése gépelés közben
    newKwInput.addEventListener('input', () => {
      const v = parseInt(newKwInput.value, 10);
      newKwPreview.textContent = (v >= 1 && v <= 53) ? `→ KW${String(v).padStart(2, '0')}` : '→ ?';
    });

    // Hét választó változásakor: mutjuk/rejtjük a KW beviteli mezőt
    function updateNewKwVisibility() {
      newKwWrap.style.display = weekSelect.value === 'new' ? 'flex' : 'none';
    }
    updateNewKwVisibility();
    weekSelect.addEventListener('change', updateNewKwVisibility);

    // Év változásakor frissítjük a hét legördülőt (csak az adott évhez tartozó hetek)
    yearSelect.addEventListener('change', () => {
      const selectedYear = parseInt(yearSelect.value, 10);
      const weeksForYear = state.hetiArakWeeks
        .filter(w => w.year === selectedYear)
        .sort((a, b) => (a.week_number || 0) - (b.week_number || 0));
      let opts = '<option value="new">➕ Új hét</option>';
      weeksForYear.forEach(w => {
        opts += `<option value="existing:${w.week_code}">${w.week_code} – frissítés</option>`;
      });
      weekSelect.innerHTML = opts;
      updateNewKwVisibility();
    });

    // Fájl kezelés
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        selectedFile = e.target.files[0];
        dropzoneText.textContent = `✅ ${selectedFile.name}`;
        dropzone.style.border = '2px solid #22c55e';
        dropzone.style.background = '#f0fdf4';
      }
    });
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.background = '#e0f2fe'; });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.background = selectedFile ? '#f0fdf4' : '#f0f9ff';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        selectedFile = e.dataTransfer.files[0];
        dropzoneText.textContent = `✅ ${selectedFile.name}`;
        dropzone.style.border = '2px solid #22c55e';
        dropzone.style.background = '#f0fdf4';
      }
    });

    modalOverlay.querySelector('#aldi-arak-modal-close')?.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.querySelector('#aldi-arak-modal-cancel')?.addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelector('#aldi-arak-modal-upload-btn')?.addEventListener('click', async () => {
      if (!selectedFile) {
        statusDiv.style.display = 'block';
        statusDiv.style.background = '#fef2f2';
        statusDiv.style.color = '#dc2626';
        statusDiv.textContent = '❌ Kérlek válassz XLSX fájlt!';
        return;
      }

      const yearVal = parseInt(modalOverlay.querySelector('#aldi-arak-modal-year').value, 10);
      const weekVal = weekSelect.value;
      let weekNumber, weekCode;

      if (weekVal === 'new') {
        weekNumber = parseInt(newKwInput.value, 10);
        if (!weekNumber || weekNumber < 1 || weekNumber > 53) {
          statusDiv.style.display = 'block';
          statusDiv.style.background = '#fef2f2';
          statusDiv.style.color = '#dc2626';
          statusDiv.textContent = '❌ Érvényes KW számot adj meg (1–53)!';
          return;
        }
        weekCode = `KW${String(weekNumber).padStart(2, '0')}`;
        // Ellenőrizzük, hogy ez a KW már nem létezik-e ebben az évben
        const alreadyExists = state.hetiArakWeeks.some(w => w.year === yearVal && w.week_code === weekCode);
        if (alreadyExists) {
          statusDiv.style.display = 'block';
          statusDiv.style.background = '#fef9c3';
          statusDiv.style.color = '#854d0e';
          statusDiv.textContent = `⚠️ ${weekCode} (${yearVal}) már létezik! Válaszd ki a legördülőből a frissítéshez.`;
          return;
        }
      } else if (weekVal.startsWith('existing:')) {
        weekCode = weekVal.replace('existing:', '');
        const existingWeek = state.hetiArakWeeks.find(w => w.week_code === weekCode && w.year === yearVal);
        weekNumber = existingWeek ? existingWeek.week_number : parseInt(weekCode.replace('KW', ''), 10);
      }

      // Upload
      const uploadBtn = modalOverlay.querySelector('#aldi-arak-modal-upload-btn');
      uploadBtn.disabled = true;
      uploadBtn.textContent = '⏳ Feltöltés...';
      statusDiv.style.display = 'block';
      statusDiv.style.background = '#eff6ff';
      statusDiv.style.color = '#1d4ed8';
      statusDiv.textContent = '⏳ XLSX feldolgozása folyamatban...';

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('year', yearVal);
        formData.append('weekCode', weekCode);
        formData.append('weekNumber', weekNumber);

        const res = await fetch('/api/v1/aldi-weekly-prices/upload', {
          method: 'POST',
          body: formData
        });

        const result = await res.json();

        if (res.ok && result.success) {
          // Frissítjük a state-et
          state.hetiArakYear = yearVal;
          await fetchHetiArakWeeks();
          // Aktív hétnek az újonnan feltöltöttet állítjuk be
          if (result.weekRecord) {
            state.hetiArakSelectedWeekId = result.weekRecord.id;
            state.hetiArakLines = result.lines || [];
          }

          statusDiv.style.background = '#f0fdf4';
          statusDiv.style.color = '#16a34a';
          statusDiv.textContent = `✅ ${result.message}${result.fileWriteError ? ' (⚠️ Hálózati mentés sikertelen: ' + result.fileWriteError + ')' : ''}`;

          if (result.warnings && result.warnings.length > 0) {
              const warnOverlay = document.createElement('div');
              warnOverlay.style.position = 'fixed';
              warnOverlay.style.top = '0';
              warnOverlay.style.left = '0';
              warnOverlay.style.width = '100%';
              warnOverlay.style.height = '100%';
              warnOverlay.style.background = 'rgba(0,0,0,0.5)';
              warnOverlay.style.display = 'flex';
              warnOverlay.style.alignItems = 'center';
              warnOverlay.style.justifyContent = 'center';
              warnOverlay.style.zIndex = '11000';
              
              let warnHtml = `
                <div style="background:#fff; width:600px; max-width:90%; border-radius:12px; padding:24px; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                  <h3 style="margin-top:0; color:#b45309; border-bottom:1px solid #fef08a; padding-bottom:10px;">⚠️ Figyelmeztetés a feltöltésnél</h3>
                  <p style="font-size:13px; color:#475569; margin-bottom:16px;">Több tétel időszaka is módosítva vagy elutasítva lett a heti határok miatt:</p>
                  <div style="max-height:300px; overflow-y:auto; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:12px; color:#334155;">
                    <ul style="margin:0; padding-left:20px;">
              `;
              
              result.warnings.forEach(w => {
                  warnHtml += `<li style="margin-bottom:6px;"><strong>Sor ${w.row}</strong> (${w.item}): ${w.msg}</li>`;
              });
              
              warnHtml += `
                    </ul>
                  </div>
                  <div style="margin-top:20px; text-align:right;">
                    <button id="aldi-warn-ok-btn" style="padding:8px 16px; background:#f59e0b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Értettem</button>
                  </div>
                </div>
              `;
              warnOverlay.innerHTML = warnHtml;
              document.body.appendChild(warnOverlay);
              
              warnOverlay.querySelector('#aldi-warn-ok-btn').addEventListener('click', () => {
                  warnOverlay.remove();
                  modalOverlay.remove();
                  renderModule();
              });
          } else {
              setTimeout(() => {
                modalOverlay.remove();
                renderModule();
              }, 2000);
          }
        } else {
          statusDiv.style.background = '#fef2f2';
          statusDiv.style.color = '#dc2626';
          statusDiv.textContent = `❌ Hiba: ${result.error || 'Ismeretlen hiba'}`;
          uploadBtn.disabled = false;
          uploadBtn.textContent = '📤 Feltöltés';
        }
      } catch (e) {
        console.error('Upload hiba:', e);
        statusDiv.style.background = '#fef2f2';
        statusDiv.style.color = '#dc2626';
        statusDiv.textContent = `❌ Hálózati hiba: ${e.message}`;
        uploadBtn.disabled = false;
        uploadBtn.textContent = '📤 Feltöltés';
      }
    });
  }

  // ─── Dátum segédfüggvény ───────────────────────────────────────────────────────
  function addDaysToDateStr(dateStr, days) {
    if (!dateStr) return dateStr;
    const parts = dateStr.split('T')[0].split('-').map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    dt.setDate(dt.getDate() + days);
    const ry = dt.getFullYear();
    const rm = String(dt.getMonth() + 1).padStart(2, '0');
    const rd = String(dt.getDate()).padStart(2, '0');
    return `${ry}-${rm}-${rd}`;
  }

  // ─── Incoterm / Kereskedelmi kód eltávolító segédfüggvény (csak a modalhoz) ───
  function stripIncoterm(str) {
    if (!str) return '';
    return String(str)
      .replace(/\b(DDP|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ─── Deviza időszak modal ─────────────────────────────────────────────────────

  async function openCurrencyPeriodModal(lineId) {
    const line = state.hetiArakLines.find(l => l.id == lineId);
    if (!line) return;

    // Betöltjük az aktuális periódusokat és az Admin devizákat
    let periods = [];
    let adminCurrencies = [{ code: 'EUR' }, { code: 'HUF' }, { code: 'USD' }]; // Fallback
    try {
      const [periodsRes, currRes] = await Promise.all([
        fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}/currency-periods`),
        fetch(`/api/v1/admin/currencies`)
      ]);

      if (periodsRes.ok) periods = await periodsRes.json();
      if (currRes.ok) adminCurrencies = await currRes.json();
    } catch (e) {
      console.warn('Currency periods / admin currencies lekérési hiba:', e);
    }

    // Ha még nem volt rögzített periódus, állítsunk be egy alapértelmezettet a teljes időszakra
    const isLineEur = (line.crate_cost && line.crate_cost.startsWith('€')) || (line.unit_cost && line.unit_cost.startsWith('€'));
    if (periods.length === 0 && line.delivery_period_start && line.delivery_period_end) {
      periods = [{
        price_line_id: line.id,
        currency_code: isLineEur ? 'EUR' : 'HUF',
        period_start: line.delivery_period_start.split('T')[0],
        period_end: line.delivery_period_end.split('T')[0],
        crate_cost: stripIncoterm(line.crate_cost || ''),
        unit_cost: stripIncoterm(line.unit_cost || ''),
        note: 'Alapértelmezett'
      }];
    }

    // Ha valamelyik korábbi rekordból hiányzik az ár, kitöltjük az alapárral (DDP nélkül)
    periods.forEach(p => {
      if (!p.crate_cost && p.currency_code === (isLineEur ? 'EUR' : 'HUF')) {
        p.crate_cost = stripIncoterm(line.crate_cost || '');
      }
      if (!p.unit_cost && p.currency_code === (isLineEur ? 'EUR' : 'HUF')) {
        p.unit_cost = stripIncoterm(line.unit_cost || '');
      }
    });

    const termekNev = line.is_gtin_matched
      ? (line.erp_product_name || line.xlsx_product_name)
      : line.xlsx_product_name;

    let editingPeriodIndex = null; // null = Új időszak hozzáadása, szám = adott indexű időszak szerkesztése

    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    function buildPeriodsHtml() {
      if (periods.length === 0) {
        return `<div style="font-size:12px; color:#94a3b8; text-align:center; padding:12px 0;">Még nincs rögzített deviza időszak.</div>`;
      }
      return periods.map((p, idx) => {
        const isEditing = editingPeriodIndex === idx;
        const borderStyle = isEditing ? 'border:1.5px solid #0284c7; background:#eff6ff;' : 'border:1px solid #e2e8f0; background:#ffffff;';
        const crateClean = stripIncoterm(p.crate_cost);
        const unitClean = stripIncoterm(p.unit_cost);

        return `
          <div class="cp-period-item" data-index="${idx}"
            style="display:flex; flex-direction:column; gap:4px; padding:8px 10px; margin-bottom:6px; border-radius:8px; cursor:pointer; transition:all 0.15s; ${borderStyle}"
            title="Kattints az időszak és árak szerkesztéséhez">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="cp-edit-trigger" data-index="${idx}" style="display:inline-block; width:44px; background:${p.currency_code === 'EUR' ? '#dbeafe' : '#fef9c3'}; color:${p.currency_code === 'EUR' ? '#1d4ed8' : '#854d0e'}; font-size:11px; font-weight:700; border-radius:4px; padding:2px 6px; text-align:center; cursor:pointer;" title="Szerkesztés">${p.currency_code}</span>
              <span style="font-size:12px; color:#1e293b; font-weight:600;">${p.period_start ? p.period_start.split('T')[0] : ''}</span>
              <span style="font-size:11px; color:#94a3b8;">→</span>
              <span style="font-size:12px; color:#1e293b; font-weight:600;">${p.period_end ? p.period_end.split('T')[0] : ''}</span>
              ${isEditing ? `<span style="font-size:10px; font-weight:700; color:#0284c7; background:#dbeafe; padding:1px 6px; border-radius:4px;">✏️ Szerkesztés alatt</span>` : ''}
              <div style="display:flex; align-items:center; gap:6px; margin-left:auto;">
                <span style="font-size:11px; font-family:monospace; font-weight:700; color:#0f172a; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; padding:2px 6px;" title="Rekeszköltség">📦 ${crateClean || '-'}</span>
                <span style="font-size:11px; font-family:monospace; font-weight:700; color:#0f172a; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; padding:2px 6px;" title="Egységköltség">🏷️ ${unitClean || '-'}</span>
                <button class="cp-edit-trigger" data-index="${idx}" style="background:none; border:none; cursor:pointer; font-size:12px; padding:2px;" title="Szerkesztés">✏️</button>
                <button class="cp-delete-btn" data-index="${idx}" data-id="${p.id || ''}" style="background:none; border:none; cursor:pointer; font-size:13px; opacity:0.5; transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'" title="Törlés">🗑️</button>
              </div>
            </div>
            ${p.note ? `<div style="font-size:11px; color:#64748b; font-style:italic; padding-left:52px;">💬 ${p.note}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:550px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column; position:relative;">
        <div style="padding:12px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#0f172a;">
          <div>
            <div style="font-size:13px; font-weight:700; color:#f8fafc;">💱 Deviza időszakok & Árak</div>
            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${termekNev}</div>
          </div>
          <button id="cp-modal-close" style="background:none; border:none; font-size:16px; cursor:pointer; color:#94a3b8; font-weight:700;">✕</button>
        </div>

        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:14px; max-height:75vh; overflow-y:auto;">

          <!-- Meglévő periódusok -->
          <div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <span style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.4px;">Rögzített időszakok & Árak</span>
              <span style="font-size:11px; color:#64748b;">(Kattints a sorra a módosításhoz)</span>
            </div>
            <div id="cp-periods-list">
              ${buildPeriodsHtml()}
            </div>
          </div>

          <!-- Új periódus / Szerkesztés űrlap -->
          <div id="cp-form-container" style="background:#f8fafc; border-radius:8px; padding:14px; border:1px solid #e2e8f0;">
            <div id="cp-form-title" style="font-size:12px; font-weight:700; color:#0369a1; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between;">
              <span>➕ Új időszak és árak hozzáadása</span>
              <button id="cp-cancel-edit-btn" style="display:none; background:none; border:1px solid #cbd5e1; border-radius:4px; font-size:11px; font-weight:600; padding:2px 8px; color:#64748b; cursor:pointer;">Mégsem (Új hozzáadása)</button>
            </div>
            
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
              <div style="display:flex; flex-direction:column; gap:3px;">
                <label style="font-size:10px; font-weight:600; color:#64748b;">Deviza</label>
                <select id="cp-new-currency" style="height:32px; width:80px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
                  ${adminCurrencies.map(c => `<option value="${c.code}">${c.code}</option>`).join('')}
                </select>
              </div>
              <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:115px;">
                <label style="font-size:10px; font-weight:600; color:#64748b;">Kezdete</label>
                <input type="date" id="cp-new-start" min="${line.delivery_period_start ? line.delivery_period_start.split('T')[0] : ''}" max="${line.delivery_period_end ? line.delivery_period_end.split('T')[0] : ''}" style="height:32px; width:100%; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
              </div>
              <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:115px;">
                <label style="font-size:10px; font-weight:600; color:#64748b;">Vége</label>
                <input type="date" id="cp-new-end" min="${line.delivery_period_start ? line.delivery_period_start.split('T')[0] : ''}" max="${line.delivery_period_end ? line.delivery_period_end.split('T')[0] : ''}" style="height:32px; width:100%; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
              </div>
            </div>

            <!-- Árak megadása (DDP nélkül) -->
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
              <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:140px;">
                <label style="font-size:10px; font-weight:600; color:#64748b;">Rekeszköltség</label>
                <input type="text" id="cp-new-crate-cost" placeholder="pl. € 14,50 vagy 5200 Ft" value="${stripIncoterm(line.crate_cost || '')}" style="height:32px; font-size:12px; font-weight:600; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
              </div>
              <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:140px;">
                <label style="font-size:10px; font-weight:600; color:#64748b;">Egységköltség</label>
                <input type="text" id="cp-new-unit-cost" placeholder="pl. € 1,45 vagy 520 Ft" value="${stripIncoterm(line.unit_cost || '')}" style="height:32px; font-size:12px; font-weight:600; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
              </div>
            </div>

            <div style="margin-top:8px; display:flex; flex-direction:column; gap:3px;">
              <label style="font-size:10px; font-weight:600; color:#64748b;">Megjegyzés (opcionális)</label>
              <input type="text" id="cp-new-note" placeholder="..." style="height:32px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
            </div>

            <div style="display:flex; align-items:center; gap:8px; margin-top:12px;">
              <button id="cp-add-btn" style="padding:7px 20px; border-radius:8px; font-size:12px; font-weight:700; border:none; background:#0284c7; color:#fff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(2,132,199,0.25);">
                ➕ Hozzáadás / Felosztás
              </button>
            </div>
          </div>
        </div>

        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end;">
          <button id="cp-close-btn" style="padding:7px 22px; border-radius:20px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">Bezárás</button>
        </div>

        <!-- Megerősítő / Előnézet panel (Átfedés esetén) -->
        <div id="cp-confirm-overlay" style="display:none; position:absolute; inset:0; background:rgba(15,23,42,0.7); z-index:10; backdrop-filter:blur(2px); padding:20px; align-items:center; justify-content:center;">
          <div style="background:#ffffff; border-radius:10px; border:1px solid #cbd5e1; box-shadow:0 10px 30px rgba(0,0,0,0.3); width:100%; max-height:90%; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; align-items:center; gap:8px; color:#d97706; font-size:14px; font-weight:700;">
              <span>⚠️</span>
              <span>Átfedő / Köztes időszak észlelve</span>
            </div>
            <div style="font-size:12px; color:#475569; line-height:1.4;">
              A megadott időszak átfedésben van egy vagy több már rögzített időszakkal.<br>
              A rendszer automatikusan átszámolta az új időszak- és árfelosztást:
            </div>
            <div id="cp-confirm-preview-list" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; display:flex; flex-direction:column; gap:6px;">
            </div>
            <div style="font-size:11px; color:#64748b; font-style:italic;">
              Kérlek hagyd jóvá, hogy szeretnéd-e a fenti új időszak- és árbeosztást rögzíteni!
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;">
              <button id="cp-confirm-cancel-btn" style="padding:6px 14px; border-radius:6px; font-size:12px; font-weight:600; border:1px solid #cbd5e1; background:#fff; color:#334155; cursor:pointer;">
                Mégsem
              </button>
              <button id="cp-confirm-save-btn" style="padding:6px 16px; border-radius:6px; font-size:12px; font-weight:700; border:none; background:#0284c7; color:#fff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(2,132,199,0.3);">
                ✅ Jóváhagyom és mentem
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const closeModal = () => {
      line.currency_periods = [...periods];
      modalOverlay.remove();
      renderModule();
    };
    modalOverlay.querySelector('#cp-modal-close')?.addEventListener('click', closeModal);
    modalOverlay.querySelector('#cp-close-btn')?.addEventListener('click', closeModal);

    // Form állapot frissítése (Szerkesztés vs Új hozzáadás)
    function updateFormMode() {
      const formTitle = modalOverlay.querySelector('#cp-form-title span');
      const cancelEditBtn = modalOverlay.querySelector('#cp-cancel-edit-btn');
      const addBtn = modalOverlay.querySelector('#cp-add-btn');

      if (editingPeriodIndex !== null && periods[editingPeriodIndex]) {
        const p = periods[editingPeriodIndex];
        if (formTitle) formTitle.textContent = `✏️ #${editingPeriodIndex + 1}. Időszak módosítása (${p.currency_code}: ${p.period_start} → ${p.period_end})`;
        if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
        if (addBtn) {
          addBtn.textContent = '💾 Módosítás mentése';
          addBtn.style.background = '#16a34a';
        }
      } else {
        if (formTitle) formTitle.textContent = '➕ Új időszak és árak hozzáadása';
        if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        if (addBtn) {
          addBtn.textContent = '➕ Hozzáadás / Felosztás';
          addBtn.style.background = '#0284c7';
        }
      }
    }

    function setEditingIndex(idx) {
      editingPeriodIndex = idx;
      const p = periods[idx];
      if (p) {
        modalOverlay.querySelector('#cp-new-currency').value = p.currency_code || 'EUR';
        modalOverlay.querySelector('#cp-new-start').value = p.period_start ? p.period_start.split('T')[0] : '';
        modalOverlay.querySelector('#cp-new-end').value = p.period_end ? p.period_end.split('T')[0] : '';
        modalOverlay.querySelector('#cp-new-crate-cost').value = stripIncoterm(p.crate_cost || '');
        modalOverlay.querySelector('#cp-new-unit-cost').value = stripIncoterm(p.unit_cost || '');
        modalOverlay.querySelector('#cp-new-note').value = p.note || '';
      }
      updateFormMode();
      refreshPeriodsList();
    }

    function resetFormToAddMode() {
      editingPeriodIndex = null;
      modalOverlay.querySelector('#cp-new-currency').value = isLineEur ? 'EUR' : 'HUF';
      modalOverlay.querySelector('#cp-new-start').value = '';
      modalOverlay.querySelector('#cp-new-end').value = '';
      modalOverlay.querySelector('#cp-new-crate-cost').value = stripIncoterm(line.crate_cost || '');
      modalOverlay.querySelector('#cp-new-unit-cost').value = stripIncoterm(line.unit_cost || '');
      modalOverlay.querySelector('#cp-new-note').value = '';
      updateFormMode();
      refreshPeriodsList();
    }

    modalOverlay.querySelector('#cp-cancel-edit-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      resetFormToAddMode();
    });

    // Periódus lista újrarajzolása és eseménykezelők
    function refreshPeriodsList() {
      const listEl = modalOverlay.querySelector('#cp-periods-list');
      if (listEl) listEl.innerHTML = buildPeriodsHtml();
      bindPeriodEvents();
    }

    function bindPeriodEvents() {
      // Csak a deviza ikonra vagy a szerkesztés gombra kattintva tölt be szerkesztésbe
      modalOverlay.querySelectorAll('.cp-period-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.cp-delete-btn')) return;
          const trigger = e.target.closest('.cp-edit-trigger');
          if (trigger) {
            const idx = parseInt(trigger.dataset.index, 10);
            if (!isNaN(idx)) setEditingIndex(idx);
          }
        });
      });

      modalOverlay.querySelectorAll('.cp-edit-row-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index, 10);
          if (!isNaN(idx)) setEditingIndex(idx);
        });
      });

      modalOverlay.querySelectorAll('.cp-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index, 10);
          const cpId = btn.dataset.id;
          if (!confirm('Törlöd ezt az időszakot?')) return;
          try {
            if (cpId) {
              await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}/currency-periods/${cpId}`, { method: 'DELETE' });
            }
            periods.splice(idx, 1);
            if (editingPeriodIndex === idx) resetFormToAddMode();
            else if (editingPeriodIndex !== null && editingPeriodIndex > idx) editingPeriodIndex--;
            line.currency_periods = [...periods];
            refreshPeriodsList();
          } catch (err) {
            alert('Törlési hiba: ' + err.message);
          }
        });
      });
    }
    bindPeriodEvents();

    // Átfedés számítás algoritmusa (árak öröklésével és Incoterm tisztítással)
    function calculateSplitPeriods(existingPeriods, newPeriod) {
      const nStart = newPeriod.period_start.split('T')[0];
      const nEnd = newPeriod.period_end.split('T')[0];

      let hasOverlap = false;
      const resultPeriods = [];

      for (const p of existingPeriods) {
        const pStart = p.period_start ? p.period_start.split('T')[0] : '';
        const pEnd = p.period_end ? p.period_end.split('T')[0] : '';

        // Átfedés ellenőrzése
        const overlaps = (nStart <= pEnd && nEnd >= pStart);
        if (!overlaps) {
          resultPeriods.push({ ...p, period_start: pStart, period_end: pEnd, isNew: false, isOriginal: true });
          continue;
        }

        hasOverlap = true;

        // 1. Teljes felülírás
        if (nStart <= pStart && nEnd >= pEnd) {
          continue;
        }
        // 2. Köztes időszak (pStart < nStart ÉS nEnd < pEnd) -> 2 részre bontás
        else if (nStart > pStart && nEnd < pEnd) {
          const part1End = addDaysToDateStr(nStart, -1);
          const part2Start = addDaysToDateStr(nEnd, 1);

          resultPeriods.push({
            currency_code: p.currency_code,
            period_start: pStart,
            period_end: part1End,
            crate_cost: stripIncoterm(p.crate_cost),
            unit_cost: stripIncoterm(p.unit_cost),
            note: p.note,
            isNew: false,
            isSplit: true
          });
          resultPeriods.push({
            currency_code: p.currency_code,
            period_start: part2Start,
            period_end: pEnd,
            crate_cost: stripIncoterm(p.crate_cost),
            unit_cost: stripIncoterm(p.unit_cost),
            note: p.note,
            isNew: false,
            isSplit: true
          });
        }
        // 3. Bal oldali átfedés (nStart <= pStart ÉS nEnd < pEnd)
        else if (nStart <= pStart && nEnd < pEnd) {
          const newPStart = addDaysToDateStr(nEnd, 1);
          resultPeriods.push({
            currency_code: p.currency_code,
            period_start: newPStart,
            period_end: pEnd,
            crate_cost: stripIncoterm(p.crate_cost),
            unit_cost: stripIncoterm(p.unit_cost),
            note: p.note,
            isNew: false,
            isTrimmed: true
          });
        }
        // 4. Jobb oldali átfedés (nStart > pStart ÉS nEnd >= pEnd)
        else if (nStart > pStart && nEnd >= pEnd) {
          const newPEnd = addDaysToDateStr(nStart, -1);
          resultPeriods.push({
            currency_code: p.currency_code,
            period_start: pStart,
            period_end: newPEnd,
            crate_cost: stripIncoterm(p.crate_cost),
            unit_cost: stripIncoterm(p.unit_cost),
            note: p.note,
            isNew: false,
            isTrimmed: true
          });
        }
      }

      // Hozzáadjuk az új / módosított időszakot az új árakkal
      resultPeriods.push({
        currency_code: newPeriod.currency_code,
        period_start: nStart,
        period_end: nEnd,
        crate_cost: stripIncoterm(newPeriod.crate_cost) || null,
        unit_cost: stripIncoterm(newPeriod.unit_cost) || null,
        note: newPeriod.note || null,
        isNew: true
      });

      // Dátum szerint növekvőbe rendezzük
      resultPeriods.sort((a, b) => a.period_start.localeCompare(b.period_start));

      return { hasOverlap, resultPeriods };
    }

    // Elmenti a teljes periódus listát a szerverre (PUT)
    async function saveCalculatedPeriods(newPeriodsList) {
      try {
        const res = await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}/currency-periods`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periods: newPeriodsList })
        });
        if (res.ok) {
          periods = await res.json();
          line.currency_periods = [...periods];
          resetFormToAddMode();
          return true;
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(`Hiba a mentés során: ${errData.error || 'Ismeretlen hiba'}`);
          return false;
        }
      } catch (e) {
        alert('Hiba: ' + e.message);
        return false;
      }
    }

    // Hozzáadás / Módosítás mentése gomb kattintás
    modalOverlay.querySelector('#cp-add-btn')?.addEventListener('click', async () => {
      const currency = modalOverlay.querySelector('#cp-new-currency').value;
      const start = modalOverlay.querySelector('#cp-new-start').value;
      const end = modalOverlay.querySelector('#cp-new-end').value;
      const crateCost = stripIncoterm(modalOverlay.querySelector('#cp-new-crate-cost').value.trim());
      const unitCost = stripIncoterm(modalOverlay.querySelector('#cp-new-unit-cost').value.trim());
      const note = modalOverlay.querySelector('#cp-new-note').value.trim();

      if (!start || !end) { alert('Add meg a kezdő és végdátumot!'); return; }
      if (start > end) { alert('A kezdő dátum nem lehet a végdátumnál korábbi!'); return; }

      const lineStart = line.delivery_period_start ? line.delivery_period_start.split('T')[0] : null;
      const lineEnd = line.delivery_period_end ? line.delivery_period_end.split('T')[0] : null;

      if (lineStart && start < lineStart) {
        alert(`A kezdő dátum nem lehet korábbi, mint a termék időszakának kezdete (${lineStart})!`);
        return;
      }
      if (lineEnd && end > lineEnd) {
        alert(`A végdátum nem lehet későbbi, mint a termék időszakának vége (${lineEnd})!`);
        return;
      }

      const newPeriodObj = {
        currency_code: currency,
        period_start: start,
        period_end: end,
        crate_cost: crateCost,
        unit_cost: unitCost,
        note
      };

      // Ha egy adott sort szerkesztünk, a többi sorhoz viszonyítjuk az átfedést
      const basePeriods = (editingPeriodIndex !== null)
        ? periods.filter((_, i) => i !== editingPeriodIndex)
        : periods;

      const { hasOverlap, resultPeriods } = calculateSplitPeriods(basePeriods, newPeriodObj);

      if (!hasOverlap) {
        // Nincs átfedés más periódusokkal, mentés
        await saveCalculatedPeriods(resultPeriods);
      } else {
        // Átfedés van -> Megerősítő felugró ablak / Előnézet megjelenítése
        const confirmOverlay = modalOverlay.querySelector('#cp-confirm-overlay');
        const previewList = modalOverlay.querySelector('#cp-confirm-preview-list');

        let previewHtml = '';
        resultPeriods.forEach(p => {
          const isNew = p.isNew;
          const badgeBg = p.currency_code === 'EUR' ? '#dbeafe' : '#fef9c3';
          const badgeCol = p.currency_code === 'EUR' ? '#1d4ed8' : '#854d0e';
          const rowBg = isNew ? '#f0fdf4' : '#ffffff';
          const rowBorder = isNew ? '#86efac' : '#e2e8f0';
          const tagText = isNew ? (editingPeriodIndex !== null ? '⭐ Módosított időszak' : '⭐ Új köztes időszak') : (p.isSplit ? '📅 Felosztott rész' : (p.isTrimmed ? '✂️ Módosult rész' : 'Eredeti'));

          previewHtml += `
            <div style="display:flex; align-items:center; justify-content:space-between; background:${rowBg}; border:1px solid ${rowBorder}; border-radius:6px; padding:6px 10px; font-size:11px; flex-wrap:wrap; gap:4px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; background:${badgeBg}; color:${badgeCol}; font-weight:700; border-radius:3px; padding:1px 5px;">${p.currency_code}</span>
                <strong style="color:#1e293b;">${p.period_start}</strong>
                <span style="color:#94a3b8;">→</span>
                <strong style="color:#1e293b;">${p.period_end}</strong>
                <span style="font-size:11px; font-family:monospace; color:#0f172a; background:#f1f5f9; padding:1px 5px; border-radius:3px;">📦 ${stripIncoterm(p.crate_cost) || '-'}</span>
                <span style="font-size:11px; font-family:monospace; color:#0f172a; background:#f1f5f9; padding:1px 5px; border-radius:3px;">🏷️ ${stripIncoterm(p.unit_cost) || '-'}</span>
              </div>
              <span style="font-size:10px; font-weight:600; color:${isNew ? '#16a34a' : '#64748b'};">${tagText}</span>
            </div>
          `;
        });

        previewList.innerHTML = previewHtml;
        confirmOverlay.style.display = 'flex';

        // Gomb eseménykezelők a megerősítéshez
        const cancelBtn = modalOverlay.querySelector('#cp-confirm-cancel-btn');
        const saveBtn = modalOverlay.querySelector('#cp-confirm-save-btn');

        const onCancel = () => {
          confirmOverlay.style.display = 'none';
          cancelBtn.removeEventListener('click', onCancel);
          saveBtn.removeEventListener('click', onSave);
        };

        const onSave = async () => {
          saveBtn.disabled = true;
          saveBtn.textContent = '⏳ Mentés...';
          const ok = await saveCalculatedPeriods(resultPeriods);
          confirmOverlay.style.display = 'none';
          saveBtn.disabled = false;
          saveBtn.textContent = '✅ Jóváhagyom és mentem';
          cancelBtn.removeEventListener('click', onCancel);
          saveBtn.removeEventListener('click', onSave);
        };

        cancelBtn.addEventListener('click', onCancel);
        saveBtn.addEventListener('click', onSave);
      }
    });
  }

  // ─── Szállítási időszak modal ──────────────────────────────────────────────────
  function openDeliveryPeriodModal(lineId) {
    const line = state.hetiArakLines.find(l => l.id == lineId);
    if (!line) return;

    const termekNev = line.is_gtin_matched
      ? (line.erp_product_name || line.xlsx_product_name)
      : line.xlsx_product_name;

    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:400px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column; position:relative;">
        <div style="padding:12px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#0f172a;">
          <div>
            <div style="font-size:13px; font-weight:700; color:#f8fafc;">📅 Szállítási Időszak</div>
            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${termekNev}</div>
          </div>
          <button id="dp-modal-close" style="background:none; border:none; font-size:16px; cursor:pointer; color:#94a3b8; font-weight:700;">✕</button>
        </div>

        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:14px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:600; color:#475569;">Időszak kezdete (Tól)</label>
            <input type="date" id="dp-start" value="${line.delivery_period_start ? line.delivery_period_start.split('T')[0] : ''}" style="height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:600; color:#475569;">Időszak vége (Ig)</label>
            <input type="date" id="dp-end" value="${line.delivery_period_end ? line.delivery_period_end.split('T')[0] : ''}" style="height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px;">
          </div>
        </div>

        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:8px;">
          <button id="dp-cancel-btn" style="padding:7px 16px; border-radius:6px; font-size:12px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">Mégsem</button>
          <button id="dp-save-btn" style="padding:7px 18px; border-radius:6px; font-size:12px; font-weight:700; border:none; background:#0284c7; color:#fff; cursor:pointer; box-shadow:0 2px 4px rgba(2,132,199,0.25);">💾 Mentés</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const close = () => modalOverlay.remove();
    modalOverlay.querySelector('#dp-modal-close').addEventListener('click', close);
    modalOverlay.querySelector('#dp-cancel-btn').addEventListener('click', close);

    modalOverlay.querySelector('#dp-save-btn').addEventListener('click', async () => {
      const newStart = modalOverlay.querySelector('#dp-start').value;
      const newEnd = modalOverlay.querySelector('#dp-end').value;

      // Ellenőrizzük a rögzített deviza periódusokkal való egyezést
      if (line.currency_periods && line.currency_periods.length > 0) {
        const minPeriodStart = line.currency_periods.reduce((min, p) => p.period_start && p.period_start < min ? p.period_start : min, '9999-99-99');
        const maxPeriodEnd = line.currency_periods.reduce((max, p) => p.period_end && p.period_end > max ? p.period_end : max, '0000-00-00');
        
        // Sérülés akkor van, ha a deviza periódusok KILÓGNAK az új szállítási időszakból
        // (azaz a deviza periódus korábban kezdődik, mint az új szállítás, vagy később ér véget)
        const isOutside = (newStart && minPeriodStart < newStart) || (newEnd && maxPeriodEnd > newEnd);
        
        if (isOutside) {
          const proceed = confirm('⚠️ Figyelem!\n\nA megadott szűkebb szállítási időszak miatt a rögzített "Deviza időszakok" túllógnak a szállítási tartományon.\n\nHa folytatod, a rendszer automatikusan törli a régi deviza periódusokat, hogy a következő megnyitáskor egy újat hozzon létre.\n\nSzeretnéd folytatni?');
          if (!proceed) return;

          try {
            const btn = modalOverlay.querySelector('#dp-save-btn');
            btn.disabled = true;
            btn.textContent = '⏳ Mentés...';

            for (const cp of line.currency_periods) {
              if (cp.id) {
                await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}/currency-periods/${cp.id}`, { method: 'DELETE' });
              }
            }
            line.currency_periods = [];
          } catch(e) {
             alert('Hiba történt a régi időszakok törlésekor.');
             return;
          }
        }
      }

      try {
        const btn = modalOverlay.querySelector('#dp-save-btn');
        btn.disabled = true;
        btn.textContent = '⏳ Mentés...';
        
        const res = await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}/delivery-period`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: newStart, end: newEnd })
        });
        
        if (res.ok) {
          line.delivery_period_start = newStart;
          line.delivery_period_end = newEnd;
          close();
          renderModule();
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(`Hiba a mentés során: ${errData.error || 'Ismeretlen hiba'}`);
          btn.disabled = false;
        }
      } catch(e) {
        alert('Hálózati hiba mentéskor.');
      }
    });
  }

  // ─── Event binding ────────────────────────────────────────────────────────────

  function bindEvents() {
    // Tab switching
    wrapper.querySelector('#aldi-tab-napi')?.addEventListener('click', () => { state.activeTab = 'napi'; renderModule(); });
    wrapper.querySelector('#aldi-tab-heti')?.addEventListener('click', () => { state.activeTab = 'heti'; renderModule(); });
    wrapper.querySelector('#aldi-tab-heti-arak')?.addEventListener('click', () => {
      state.activeTab = 'heti_arak';
      if (state.hetiArakWeeks.length === 0) {
        fetchHetiArakWeeks();
      } else {
        renderModule();
      }
    });
    wrapper.querySelector('#aldi-tab-termekek')?.addEventListener('click', () => { state.activeTab = 'termekek'; renderModule(); });


    wrapper.querySelector('#aldi-tab-komissio')?.addEventListener('click', () => { 
      state.activeTab = 'komissio'; 
      fetchKomissioSummary();
    });
    
    // Komissió summary events
    const komDateInput = wrapper.querySelector('#aldi-komissio-filter-date');
    if (komDateInput) {
      komDateInput.addEventListener('change', (e) => { state.komissioFilterDate = e.target.value; fetchKomissioSummary(); });
    }
    const komTruckInput = wrapper.querySelector('#aldi-komissio-filter-truck');
    if (komTruckInput) {
      komTruckInput.addEventListener('change', (e) => { state.komissioFilterTruck = e.target.value; fetchKomissioSummary(); });
    }
    wrapper.querySelectorAll('.aldi-view-komissio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        fetchKomissioDetail(btn.dataset.id, btn.dataset.truckno);
      });
    });
    


    // Napi rendelés filterek
    const dateInput = wrapper.querySelector('#aldi-filter-date');
    if (dateInput) dateInput.addEventListener('input', (e) => { state.filterDate = e.target.value; renderModule(); });

    const orderInput = wrapper.querySelector('#aldi-filter-order');
    if (orderInput) orderInput.addEventListener('input', (e) => { state.filterOrderNo = e.target.value; renderModule(); });

    // Napi upload
    wrapper.querySelector('#aldi-btn-upload')?.addEventListener('click', openUploadModal);

    // PDF view
    wrapper.querySelectorAll('.aldi-order-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openPdfViewerModal(link.href, `Rendelés PDF: ${link.dataset.orderno} (${link.dataset.date})`);
      });
    });

    // Order delete
    wrapper.querySelectorAll('.aldi-delete-order-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        if (confirm('Biztosan törölni szeretnéd ezt a rendelést? A művelet nem vonható vissza, és a PDF fájl is törlődik!')) {
          try {
            const res = await fetch(`/api/v1/aldi-daily-orders/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Hiba a törlés során');
            alert('A rendelés sikeresen törölve lett.');
            fetchNapiRendelesek(); // Frissítjük az oldalt a törlés után
          } catch (err) {
            console.error(err);
            alert('Sikertelen törlés!');
          }
        }
      });
    });

    // Order view
    wrapper.querySelectorAll('.aldi-view-order-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        const orderno = btn.dataset.orderno;
        const dateStr = btn.dataset.date;
        openOrderViewModal(id, orderno, dateStr);
      });
    });

    // Heti árak vezérlők
    const yearSelect = wrapper.querySelector('#aldi-arak-year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        state.hetiArakYear = parseInt(e.target.value, 10);
        state.hetiArakSelectedWeekId = null;
        state.hetiArakLines = [];
        fetchHetiArakWeeks();
      });
    }

    const weekSelect = wrapper.querySelector('#aldi-arak-week-select');
    if (weekSelect) {
      weekSelect.addEventListener('change', async (e) => {
        const weekId = parseInt(e.target.value, 10);
        if (!isNaN(weekId)) {
          state.hetiArakSelectedWeekId = weekId;
          state.hetiArakIsLoading = true;
          renderModule();
          await fetchHetiArakLines(weekId);
          state.hetiArakIsLoading = false;
          renderModule();
        }
      });
    }

    wrapper.querySelector('#aldi-arak-upload-btn')?.addEventListener('click', openHetiArakUploadModal);

    // Deviza periódus gombok
    wrapper.querySelectorAll('.aldi-arak-currency-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lineId = btn.dataset.lineId;
        openCurrencyPeriodModal(lineId);
      });
    });

    // Sor törlése
    wrapper.querySelectorAll('.aldi-arak-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const lineId = btn.dataset.lineId;
        const line = state.hetiArakLines.find(l => l.id == lineId);
        if (!line) return;
        const pName = line.erp_product_name || line.xlsx_product_name || 'termék';
        if (confirm(`Biztosan törölni szeretnéd a(z) "${pName}" sort?`)) {
          try {
            const res = await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}`, { method: 'DELETE' });
            if (res.ok) {
              state.hetiArakLines = state.hetiArakLines.filter(l => l.id != lineId);
              renderModule();
            } else {
              alert('Hiba történt a sor törlésekor.');
            }
          } catch (e) {
            console.error(e);
            alert('Hálózati hiba a törléskor.');
          }
        }
      });
    });

    // Szállítási időszak (dátum picker modal)
    wrapper.querySelectorAll('.aldi-arak-delivery-period').forEach(td => {
      td.addEventListener('click', () => {
        const lineId = td.dataset.lineId;
        openDeliveryPeriodModal(lineId);
      });
    });

    // Drag and Drop (Sorrend)
    let draggedRow = null;
    const tbody = wrapper.querySelector('tbody');
    if (tbody) {
      wrapper.querySelectorAll('.aldi-arak-row').forEach(row => {
        row.addEventListener('dragstart', (e) => {
          draggedRow = row;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', row.dataset.lineId);
          setTimeout(() => row.style.opacity = '0.5', 0);
        });
        row.addEventListener('dragend', () => {
          if (draggedRow) draggedRow.style.opacity = '1';
          draggedRow = null;
          row.style.background = '';
        });
        row.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const bounding = row.getBoundingClientRect();
          const offset = bounding.y + (bounding.height / 2);
          if (e.clientY - offset > 0) {
            row.style.borderBottom = '2px solid #0284c7';
            row.style.borderTop = '';
          } else {
            row.style.borderTop = '2px solid #0284c7';
            row.style.borderBottom = '';
          }
        });
        row.addEventListener('dragleave', () => {
          row.style.borderTop = '';
          row.style.borderBottom = '1px solid #f1f5f9';
        });
        row.addEventListener('drop', async (e) => {
          e.preventDefault();
          row.style.borderTop = '';
          row.style.borderBottom = '1px solid #f1f5f9';
          if (!draggedRow || draggedRow === row) return;
          
          const bounding = row.getBoundingClientRect();
          const offset = bounding.y + (bounding.height / 2);
          if (e.clientY - offset > 0) {
            row.after(draggedRow);
          } else {
            row.before(draggedRow);
          }
          
          // Auto-save új sorrend
          const newOrder = [];
          tbody.querySelectorAll('.aldi-arak-row').forEach((tr, index) => {
            newOrder.push({
              id: parseInt(tr.dataset.lineId, 10),
              row_order: index + 1
            });
          });
          
          try {
            await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/reorder`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order: newOrder })
            });
            // Át is vezetjük a state.hetiArakLines tömbben
            const orderedIds = newOrder.map(o => o.id);
            state.hetiArakLines.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
          } catch (err) {
            console.error('Reorder hiba:', err);
          }
        });
      });
    }

    // Termékek adat tábla
    wrapper.querySelector('#aldi-btn-add-product')?.addEventListener('click', openAddProductModal);
    wrapper.querySelector('#aldi-btn-save-products')?.addEventListener('click', saveProductsToDb);

    const productSearchInput = wrapper.querySelector('#aldi-product-search-input');
    if (productSearchInput) {
      productSearchInput.addEventListener('input', (e) => { state.productSearch = e.target.value; renderModule(); });
    }

    // Inline field changes
    wrapper.querySelectorAll('.aldi-prod-field').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const field = e.target.dataset.field;
        const val = e.target.value;
        if (!isNaN(idx) && state.products[idx] && field) {
          state.products[idx][field] = val;
          state.hasUnsavedChanges = true;
          const saveBtn = wrapper.querySelector('#aldi-btn-save-products');
          if (saveBtn) {
            saveBtn.style.background = '#16a34a';
            saveBtn.textContent = '💾 Mentés (Nem mentett adatok!)';
          }
        }
      });
    });

    // Delete product row
    wrapper.querySelectorAll('.aldi-prod-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (!isNaN(idx) && state.products[idx]) {
          const pName = state.products[idx].name || 'terméket';
          if (confirm(`Biztosan törölni szeretnéd a(z) "${pName}" sort? (A végleges törléshez kattints a Mentés gombra)`)) {
            state.products.splice(idx, 1);
            state.hasUnsavedChanges = true;
            renderModule();
          }
        }
      });
    });
  }

  // ─── Initial load ─────────────────────────────────────────────────────────────
  fetchProductsFromDb();
  fetchKomissioSummary();
  fetchNapiRendelesek();
}
