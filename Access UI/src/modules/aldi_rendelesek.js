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
  };

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
        <button id="aldi-tab-termekek" style="${tabStyle('termekek')}">
          ${state.activeTab === 'termekek' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Termékek adat tábla
          ${state.hasUnsavedChanges ? '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; margin-left:4px; vertical-align:middle;" title="Nem mentett módosítások"></span>' : ''}
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="aldi-tab-content" style="display:flex; flex-direction:column; flex:1;">
        ${
          state.activeTab === 'napi' ? renderNapiRendelesHtml() :
          state.activeTab === 'heti' ? renderHetiLekotesHtml() :
          state.activeTab === 'heti_arak' ? renderHetiArakHtml() :
          renderTermekekHtml()
        }
      </div>
    `;

    bindEvents();
  }

  // ─── Napi rendelés fül ────────────────────────────────────────────────────────

  function renderNapiRendelesHtml() {
    const filteredOrders = state.orders.filter(o => {
      const matchDate = !state.filterDate || o.date.includes(state.filterDate);
      const matchOrder = !state.filterOrderNo || o.orderNo.toLowerCase().includes(state.filterOrderNo.toLowerCase());
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
      <div style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; max-width:820px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
        <table style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:130px;">SZÁLLÍTÁSI DÁTUM</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:160px;">RENDELÉSI SZÁM</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:150px;">RENDELÉS TÍPUSA</th>
              <th style="padding:10px 14px; text-align:center; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:110px;">RAKLAPSZÁM</th>
              <th style="padding:10px 14px; text-align:center; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:140px;">RENDELÉS MEGTEKINTÉSE</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.length === 0 ? `
              <tr><td colspan="5" style="padding:24px; text-align:center; color:#94a3b8; font-size:13px;">Nincs megjeleníthető rendelés a megadott szűrési feltételekkel.</td></tr>
            ` : filteredOrders.map((o, idx) => `
              <tr style="border-bottom:1px solid #f1f5f9; ${idx % 2 === 1 ? 'background:#fafafa;' : 'background:#ffffff;'}">
                <td style="padding:10px 14px; color:#1e293b; font-weight:500;">${o.date}</td>
                <td style="padding:10px 14px;">
                  <a href="#" class="aldi-order-link" data-id="${o.id}" style="color:#2563eb; font-weight:700; text-decoration:underline;">${o.orderNo}</a>
                </td>
                <td style="padding:10px 14px; color:#334155;">
                  <span style="display:inline-block; background:#f1f5f9; color:#475569; font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; border:1px solid #e2e8f0;">
                    ${o.orderType || 'Normál'}
                  </span>
                </td>
                <td style="padding:10px 14px; text-align:center; font-weight:700; color:#1e293b;">
                  ${o.palletCount != null && o.palletCount !== '' ? o.palletCount : '-'}
                </td>
                <td style="padding:10px 14px; text-align:center;">
                  <button class="aldi-view-order-btn" data-id="${o.id}" style="background:none; border:none; font-size:18px; cursor:pointer; padding:2px 6px; border-radius:4px;" title="Rendelés megtekintése">📋</button>
                </td>
              </tr>
            `).join('')}
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

        <!-- Összefoglaló -->
        ${state.hetiArakIsLoading ? `
          <div style="margin-top:18px; font-size:12px; color:#64748b;">⏳ Betöltés...</div>
        ` : selectedWeek ? `
          <div style="margin-top:18px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="font-size:12px; color:#64748b; background:#f1f5f9; border-radius:6px; padding:4px 10px;">
              📋 <strong>${lines.length}</strong> sor betöltve
            </span>
            <span style="font-size:12px; color:#16a34a; background:#f0fdf4; border-radius:6px; padding:4px 10px; border:1px solid #bbf7d0;">
              ✅ <strong>${matchedCount}</strong> ERP azonosítva
            </span>
            ${lines.length - matchedCount > 0 ? `
              <span style="font-size:12px; color:#dc2626; background:#fef2f2; border-radius:6px; padding:4px 10px; border:1px solid #fecaca;">
                ⚠️ <strong>${lines.length - matchedCount}</strong> GTIN nem azonosított
              </span>
            ` : ''}
            ${selectedWeek.xlsx_file_path ? `
              <span style="font-size:11px; color:#94a3b8;" title="${selectedWeek.xlsx_file_path}">
                📁 ${selectedWeek.xlsx_file_path.split(/[\\/]/).pop()}
              </span>
            ` : ''}
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
        <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:auto; max-width:1200px; box-shadow:0 1px 4px rgba(0,0,0,0.04); background:#ffffff;">
          <table style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; min-width:900px;">
            <thead>
              <tr style="background:#0f172a; border-bottom:1px solid #cbd5e1;">
                <th style="padding:10px 12px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:200px;">TERMÉK</th>
                <th style="padding:10px 8px; text-align:center; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:60px;">KARTON</th>
                <th style="padding:10px 8px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:130px;">SZÁRMAZÁS</th>
                <th style="padding:10px 8px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:220px;">CSOMAGOLÁS</th>
                <th style="padding:10px 8px; text-align:right; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:120px;">REKESZKÖLTSÉG</th>
                <th style="padding:10px 8px; text-align:right; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:110px;">EGYSÉGKÖLTSÉG</th>
                <th style="padding:10px 8px; text-align:center; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:170px;">SZÁLLÍTÁSI IDŐSZAK</th>
                <th style="padding:10px 8px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:140px;">GTIN</th>
                <th style="padding:10px 6px; text-align:center; font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.6px; text-transform:uppercase; width:60px;">€/Ft</th>
              </tr>
            </thead>
            <tbody>
              ${lines.map((line, idx) => {
                const isMatched = line.is_gtin_matched;
                const displayName = isMatched
                  ? (line.erp_product_name || line.xlsx_product_name || '')
                  : (line.xlsx_product_name || '');

                const nameStyle = isMatched
                  ? 'color:#1e293b; font-weight:600;'
                  : 'color:#dc2626; font-weight:600; background:#fef2f2; padding:2px 6px; border-radius:4px;';

                const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

                // Valuta detect from crate_cost
                const crateCost = line.crate_cost || '';
                const isEur = crateCost.startsWith('€');
                const currencyBadge = isEur
                  ? '<span style="display:inline-block; background:#dbeafe; color:#1d4ed8; font-size:9px; font-weight:700; border-radius:4px; padding:1px 5px;">EUR</span>'
                  : '<span style="display:inline-block; background:#fef9c3; color:#854d0e; font-size:9px; font-weight:700; border-radius:4px; padding:1px 5px;">HUF</span>';

                return `
                  <tr style="border-bottom:1px solid #f1f5f9; background:${rowBg};">
                    <td style="padding:8px 12px;">
                      <div style="${nameStyle}" title="${isMatched ? 'ERP: ' + displayName : 'ALDI XLSX név – nincs ERP match'}">
                        ${!isMatched ? '⚠️ ' : ''}${displayName}
                      </div>
                    </td>
                    <td style="padding:8px 8px; text-align:center; color:#334155; font-weight:600;">${line.carton_content || ''}</td>
                    <td style="padding:8px 8px; color:#475569; font-size:11px;">${(line.origin || '').replace(/, /g, '<br>')}</td>
                    <td style="padding:8px 8px; color:#475569; font-size:11px; line-height:1.3;">${line.packaging || ''}</td>
                    <td style="padding:8px 8px; text-align:right; font-weight:600; color:#0f172a; font-family:monospace; font-size:12px;">${line.crate_cost || ''}</td>
                    <td style="padding:8px 8px; text-align:right; font-weight:600; color:#0f172a; font-family:monospace; font-size:12px;">${line.unit_cost || ''}</td>
                    <td style="padding:8px 8px; text-align:center; color:#475569; font-size:11px;">
                      ${line.delivery_period_start ? `<div>${line.delivery_period_start}</div>` : ''}
                      ${line.delivery_period_end ? `<div style="color:#94a3b8;">→ ${line.delivery_period_end}</div>` : ''}
                    </td>
                    <td style="padding:8px 8px; font-family:monospace; font-size:11px; color:#64748b;">${line.gtin || ''}</td>
                    <td style="padding:8px 6px; text-align:center;">
                      <button class="aldi-arak-currency-btn" data-line-id="${line.id}"
                        style="background:none; border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; padding:3px 7px; font-size:11px; display:inline-flex; align-items:center; gap:4px; transition:background 0.15s;"
                        title="Deviza időszak szerkesztése"
                        onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                        ${currencyBadge}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
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

  // Upload modal (Napi rendelés)
  function openUploadModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:440px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column;">
        <div style="padding:12px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#ffffff;">
          <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:8px;">📄 Rendelés feltöltése</h3>
          <button id="aldi-modal-close-x" style="background:none; border:none; font-size:16px; cursor:pointer; color:#64748b; font-weight:700;">✕</button>
        </div>
        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:14px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:700; color:#334155;">Szállítási dátum</label>
            <select id="aldi-modal-date" class="access-control-input" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
              <option value="">-- Válasszon --</option>
              <option value="2026-08-14">2026-08-14</option>
              <option value="2026-08-15">2026-08-15</option>
              <option value="2026-08-16">2026-08-16</option>
              <option value="2026-08-17">2026-08-17</option>
              <option value="2026-08-18">2026-08-18</option>
              <option value="2026-08-19">2026-08-19</option>
              <option value="2026-08-20">2026-08-20</option>
            </select>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:700; color:#334155;">Rendelési szám</label>
            <input type="text" id="aldi-modal-orderno" class="access-control-input" placeholder="Pl. PO-2024-001" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
          </div>
          <div style="display:flex; gap:10px;">
            <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
              <label style="font-size:11px; font-weight:700; color:#334155;">Rendelés típusa</label>
              <select id="aldi-modal-ordertype" class="access-control-input" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
                <option value="Normál">Normál</option>
                <option value="Akciós">Akciós</option>
                <option value="Kiegészítő">Kiegészítő</option>
                <option value="Egyéb">Egyéb</option>
              </select>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px; width:120px;">
              <label style="font-size:11px; font-weight:700; color:#334155;">Raklapszám</label>
              <input type="number" id="aldi-modal-palletcount" class="access-control-input" placeholder="Pl. 33" min="1" max="99" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
            </div>
          </div>
          <div id="aldi-dropzone" style="border:2px dashed #93c5fd; background:#f0f9ff; border-radius:8px; padding:24px 16px; text-align:center; cursor:pointer; transition:background 0.2s;">
            <input type="file" id="aldi-file-input" accept=".pdf" style="display:none;">
            <div style="font-size:36px; margin-bottom:6px;">📁</div>
            <div style="font-size:12px; font-weight:600; color:#1d4ed8; margin-bottom:4px;" id="aldi-dropzone-text">Húzza ide a fájlokat, vagy kattintson a tallózáshoz</div>
            <div style="font-size:11px; color:#64748b;">PDF.</div>
          </div>
        </div>
        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; background:#ffffff; display:flex; justify-content:center; gap:12px;">
          <button id="aldi-modal-cancel" style="padding:6px 22px; border-radius:20px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">Mégse</button>
          <button id="aldi-modal-save" style="padding:6px 24px; border-radius:20px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(37,99,235,0.2);">💾 Mentés</button>
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

    modalOverlay.querySelector('#aldi-modal-save')?.addEventListener('click', () => {
      const dateVal = modalOverlay.querySelector('#aldi-modal-date').value;
      const orderNoVal = modalOverlay.querySelector('#aldi-modal-orderno').value.trim();
      const orderTypeVal = modalOverlay.querySelector('#aldi-modal-ordertype').value;
      const palletCountVal = modalOverlay.querySelector('#aldi-modal-palletcount').value.trim();

      if (!dateVal) { alert('Kérlek válassz szállítási dátumot!'); return; }
      if (!orderNoVal) { alert('Kérlek add meg a rendelési számot!'); return; }

      state.orders.unshift({
        id: String(Date.now()),
        date: dateVal,
        orderNo: orderNoVal,
        orderType: orderTypeVal || 'Normál',
        palletCount: palletCountVal ? parseInt(palletCountVal, 10) : null,
        fileName: selectedFile ? selectedFile.name : 'rendeles.pdf'
      });
      modalOverlay.remove();
      renderModule();
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
            <span id="aldi-arak-new-kw-preview" style="font-size:13px; font-weight:700; color:#0284c7;">→ KW${String(nextKwSuggestion).padStart(2,'0')}</span>
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
      newKwPreview.textContent = (v >= 1 && v <= 53) ? `→ KW${String(v).padStart(2,'0')}` : '→ ?';
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

          setTimeout(() => {
            modalOverlay.remove();
            renderModule();
          }, 2000);
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

  // ─── Deviza időszak modal ─────────────────────────────────────────────────────

  async function openCurrencyPeriodModal(lineId) {
    const line = state.hetiArakLines.find(l => l.id == lineId);
    if (!line) return;

    // Betöltjük az aktuális periódusokat
    let periods = [];
    try {
      const res = await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}/currency-periods`);
      if (res.ok) periods = await res.json();
    } catch (e) {
      console.warn('Currency periods lekérési hiba:', e);
    }

    const termekNev = line.is_gtin_matched
      ? (line.erp_product_name || line.xlsx_product_name)
      : line.xlsx_product_name;

    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    function buildPeriodsHtml() {
      if (periods.length === 0) {
        return `<div style="font-size:12px; color:#94a3b8; text-align:center; padding:12px 0;">Még nincs rögzített deviza időszak.</div>`;
      }
      return periods.map(p => `
        <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #f1f5f9;">
          <span style="display:inline-block; width:44px; background:${p.currency_code === 'EUR' ? '#dbeafe' : '#fef9c3'}; color:${p.currency_code === 'EUR' ? '#1d4ed8' : '#854d0e'}; font-size:11px; font-weight:700; border-radius:4px; padding:2px 6px; text-align:center;">${p.currency_code}</span>
          <span style="font-size:12px; color:#1e293b; font-weight:600;">${p.period_start}</span>
          <span style="font-size:11px; color:#94a3b8;">→</span>
          <span style="font-size:12px; color:#1e293b; font-weight:600;">${p.period_end}</span>
          ${p.note ? `<span style="font-size:11px; color:#64748b; font-style:italic;">${p.note}</span>` : ''}
          <button class="cp-delete-btn" data-id="${p.id}" style="margin-left:auto; background:none; border:none; cursor:pointer; font-size:13px; opacity:0.5; transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'" title="Törlés">🗑️</button>
        </div>
      `).join('');
    }

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:460px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column;">
        <div style="padding:12px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#0f172a;">
          <div>
            <div style="font-size:13px; font-weight:700; color:#f8fafc;">💱 Deviza időszakok</div>
            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${termekNev}</div>
          </div>
          <button id="cp-modal-close" style="background:none; border:none; font-size:16px; cursor:pointer; color:#94a3b8; font-weight:700;">✕</button>
        </div>

        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:14px;">

          <!-- Meglévő periódusok -->
          <div>
            <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:8px;">Rögzített időszakok</div>
            <div id="cp-periods-list">
              ${buildPeriodsHtml()}
            </div>
          </div>

          <!-- Új periódus hozzáadása -->
          <div style="background:#f8fafc; border-radius:8px; padding:14px; border:1px solid #e2e8f0;">
            <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:10px;">➕ Új időszak hozzáadása</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
              <div style="display:flex; flex-direction:column; gap:3px;">
                <label style="font-size:10px; font-weight:600; color:#64748b;">Deviza</label>
                <select id="cp-new-currency" style="height:32px; width:80px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
                  <option value="EUR">EUR</option>
                  <option value="HUF">HUF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div style="display:flex; flex-direction:column; gap:3px;">
                <label style="font-size:10px; font-weight:600; color:#64748b;">Kezdete</label>
                <input type="date" id="cp-new-start" min="${line.delivery_period_start ? line.delivery_period_start.split('T')[0] : ''}" max="${line.delivery_period_end ? line.delivery_period_end.split('T')[0] : ''}" style="height:32px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
              </div>
              <div style="display:flex; flex-direction:column; gap:3px;">
                <label style="font-size:10px; font-weight:600; color:#64748b;">Vége</label>
                <input type="date" id="cp-new-end" min="${line.delivery_period_start ? line.delivery_period_start.split('T')[0] : ''}" max="${line.delivery_period_end ? line.delivery_period_end.split('T')[0] : ''}" style="height:32px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
              </div>
            </div>
            <div style="margin-top:8px; display:flex; flex-direction:column; gap:3px;">
              <label style="font-size:10px; font-weight:600; color:#64748b;">Megjegyzés (opcionális)</label>
              <input type="text" id="cp-new-note" placeholder="..." style="height:32px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; background:#fff;">
            </div>
            <button id="cp-add-btn" style="margin-top:10px; padding:6px 18px; border-radius:8px; font-size:12px; font-weight:700; border:none; background:#0284c7; color:#fff; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
              ➕ Hozzáadás
            </button>
          </div>
        </div>

        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end;">
          <button id="cp-close-btn" style="padding:7px 22px; border-radius:20px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">Bezárás</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const closeModal = () => modalOverlay.remove();
    modalOverlay.querySelector('#cp-modal-close')?.addEventListener('click', closeModal);
    modalOverlay.querySelector('#cp-close-btn')?.addEventListener('click', closeModal);

    // Periódus lista újrarajzolása
    function refreshPeriodsList() {
      const listEl = modalOverlay.querySelector('#cp-periods-list');
      if (listEl) listEl.innerHTML = buildPeriodsHtml();
      bindDeleteBtns();
    }

    function bindDeleteBtns() {
      modalOverlay.querySelectorAll('.cp-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const cpId = btn.dataset.id;
          if (!confirm('Törlöd ezt az időszakot?')) return;
          try {
            await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}/currency-periods/${cpId}`, { method: 'DELETE' });
            periods = periods.filter(p => String(p.id) !== String(cpId));
            refreshPeriodsList();
          } catch (e) {
            alert('Törlési hiba: ' + e.message);
          }
        });
      });
    }
    bindDeleteBtns();

    // Hozzáadás
    modalOverlay.querySelector('#cp-add-btn')?.addEventListener('click', async () => {
      const currency = modalOverlay.querySelector('#cp-new-currency').value;
      const start = modalOverlay.querySelector('#cp-new-start').value;
      const end = modalOverlay.querySelector('#cp-new-end').value;
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

      try {
        const res = await fetch(`/api/v1/aldi-weekly-prices/${state.hetiArakSelectedWeekId}/lines/${lineId}/currency-periods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currency_code: currency, period_start: start, period_end: end, note })
        });
        if (res.ok) {
          const newPeriod = await res.json();
          periods.push(newPeriod);
          // Reset inputs
          modalOverlay.querySelector('#cp-new-start').value = '';
          modalOverlay.querySelector('#cp-new-end').value = '';
          modalOverlay.querySelector('#cp-new-note').value = '';
          refreshPeriodsList();
        } else {
          alert('Hiba a mentés során!');
        }
      } catch (e) {
        alert('Hiba: ' + e.message);
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

    // Napi rendelés filterek
    const dateInput = wrapper.querySelector('#aldi-filter-date');
    if (dateInput) dateInput.addEventListener('input', (e) => { state.filterDate = e.target.value; renderModule(); });

    const orderInput = wrapper.querySelector('#aldi-filter-order');
    if (orderInput) orderInput.addEventListener('input', (e) => { state.filterOrderNo = e.target.value; renderModule(); });

    // Napi upload
    wrapper.querySelector('#aldi-btn-upload')?.addEventListener('click', openUploadModal);

    // Order view
    wrapper.querySelectorAll('.aldi-view-order-btn, .aldi-order-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        const ord = state.orders.find(o => o.id === id);
        if (ord) alert(`ALDI Rendelés:\nRendelési szám: ${ord.orderNo}\nSzállítási dátum: ${ord.date}\nFájl: ${ord.fileName}`);
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
}
