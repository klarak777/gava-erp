/**
 * GAVA ERP – ALDI Rendelések modul
 * v1.2.0 – ALDI Napi rendelések, Heti lekötés és Termékek adat tábla (PostgreSQL adatbázis integrációval)
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

  // State
  let state = {
    activeTab: 'napi', // 'napi' | 'heti' | 'termekek'
    filterDate: '',
    filterOrderNo: '',
    productSearch: '',
    isLoadingProducts: false,
    orders: [
      { id: '1', date: '2026-07-29', orderNo: '4531552076', fileName: 'ALDI_Order_4531552076.pdf' }
    ],
    products: DEFAULT_PRODUCTS
  };

  // Database sync functions
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
        }
      }
    } catch (e) {
      console.warn('Nem sikerült az ALDI termékek lekérése az API-ból, helyi adatok használata:', e);
    } finally {
      state.isLoadingProducts = false;
      renderModule();
    }
  }

  async function addProductToDb(newProd) {
    try {
      const res = await fetch('/api/v1/chain-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain: 'ALDI',
          product_name: newProd.name,
          article_number: newProd.articleNo,
          gtin: newProd.gtin,
          ean: newProd.ean,
          label: newProd.label
        })
      });
      if (res.ok) {
        const saved = await res.json();
        return saved.id;
      }
    } catch (e) {
      console.error('Hiba az új termék mentésekor az adatbázisba:', e);
    }
    return null;
  }

  async function updateProductInDb(id, fields) {
    if (!id || String(id).startsWith('tmp-')) return;
    try {
      await fetch(`/api/v1/chain-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
    } catch (e) {
      console.error('Hiba a termék módosításakor az adatbázisban:', e);
    }
  }

  async function deleteProductFromDb(id) {
    if (!id || String(id).startsWith('tmp-')) return;
    try {
      await fetch(`/api/v1/chain-products/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Hiba a termék törlésekor az adatbázisból:', e);
    }
  }

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding: 16px 28px; display:flex; flex-direction:column; gap:16px; flex:1; min-height:100%;';
  container.appendChild(wrapper);

  function renderModule() {
    wrapper.innerHTML = `
      <!-- Header with Tabs matching Screenshot 1 -->
      <div style="display:flex; align-items:center; gap:28px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
        <button id="aldi-tab-napi" class="aldi-tab ${state.activeTab === 'napi' ? 'active' : ''}" style="position:relative; background:none; border:none; font-size:14px; font-weight:700; color:${state.activeTab === 'napi' ? '#0284c7' : '#64748b'}; cursor:pointer; padding:8px 12px; transition:color 0.2s;">
          ${state.activeTab === 'napi' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Napi rendelés
        </button>
        <button id="aldi-tab-heti" class="aldi-tab ${state.activeTab === 'heti' ? 'active' : ''}" style="position:relative; background:none; border:none; font-size:14px; font-weight:600; color:${state.activeTab === 'heti' ? '#0284c7' : '#64748b'}; cursor:pointer; padding:8px 12px; transition:color 0.2s;">
          ${state.activeTab === 'heti' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Heti lekötés
        </button>
        <button id="aldi-tab-termekek" class="aldi-tab ${state.activeTab === 'termekek' ? 'active' : ''}" style="position:relative; background:none; border:none; font-size:14px; font-weight:600; color:${state.activeTab === 'termekek' ? '#0284c7' : '#64748b'}; cursor:pointer; padding:8px 12px; transition:color 0.2s;">
          ${state.activeTab === 'termekek' ? '<span style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); color:#0284c7; font-size:10px;">▼</span>' : ''}
          Termékek adat tábla
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="aldi-tab-content" style="display:flex; flex-direction:column; flex:1;">
        ${state.activeTab === 'napi' ? renderNapiRendelesHtml() : state.activeTab === 'heti' ? renderHetiLekotesHtml() : renderTermekekHtml()}
      </div>
    `;

    bindEvents();
  }

  function renderNapiRendelesHtml() {
    const filteredOrders = state.orders.filter(o => {
      const matchDate = !state.filterDate || o.date.includes(state.filterDate);
      const matchOrder = !state.filterOrderNo || o.orderNo.toLowerCase().includes(state.filterOrderNo.toLowerCase());
      return matchDate && matchOrder;
    });

    return `
      <!-- Toolbar Controls (Image 1) -->
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

      <!-- Orders Table (Image 1) -->
      <div style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; max-width:600px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
        <table style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:140px;">
                SZÁLLÍTÁSI DÁTUM
              </th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:180px;">
                RENDELÉSI SZÁM
              </th>
              <th style="padding:10px 14px; text-align:center; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:140px;">
                RENDELÉS MEGTEKINTÉSE
              </th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.length === 0 ? `
              <tr>
                <td colspan="3" style="padding:24px; text-align:center; color:#94a3b8; font-size:13px;">
                  Nincs megjeleníthető rendelés a megadott szűrési feltételekkel.
                </td>
              </tr>
            ` : filteredOrders.map((o, idx) => `
              <tr style="border-bottom:1px solid #f1f5f9; ${idx % 2 === 1 ? 'background:#fafafa;' : 'background:#ffffff;'}">
                <td style="padding:10px 14px; color:#1e293b; font-weight:500;">
                  ${o.date}
                </td>
                <td style="padding:10px 14px;">
                  <a href="#" class="aldi-order-link" data-id="${o.id}" style="color:#2563eb; font-weight:700; text-decoration:underline;">
                    ${o.orderNo}
                  </a>
                </td>
                <td style="padding:10px 14px; text-align:center;">
                  <button class="aldi-view-order-btn" data-id="${o.id}" style="background:none; border:none; font-size:18px; cursor:pointer; padding:2px 6px; border-radius:4px;" title="Rendelés megtekintése">
                    📋
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

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
      <!-- Toolbar for Products Table -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin:16px 0 12px 0; max-width:920px; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <!-- ➕ Új sor hozzáadása gomb -->
          <button id="aldi-btn-add-product" class="primary-btn" style="height:34px; padding:0 16px; border-radius:8px; font-size:13px; font-weight:700; background:#0284c7; display:inline-flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 2px 4px rgba(2,132,199,0.2);">
            ➕ Új termék sor hozzáadása
          </button>
          
          <span style="font-size:12px; color:#64748b; font-weight:500;">
            Összesen: <strong>${state.products.length}</strong> termék (PostgreSQL adatbázis szinkronizált)
          </span>
        </div>

        <!-- Quick search in products -->
        <div>
          <input type="text" id="aldi-product-search-input" class="access-control-input" value="${state.productSearch}" placeholder="Keresés név, cikkszám, GTIN..." style="height:32px; width:220px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
        </div>
      </div>

      <!-- Products Table (Image 3) -->
      <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; max-width:920px; box-shadow:0 1px 4px rgba(0,0,0,0.04); background:#ffffff;">
        <table style="width:100%; border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:220px;">
                TERMÉK MEGNEVEZÉSE
              </th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:130px;">
                CIKKSZÁM
              </th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:170px;">
                GTIN AZONOSÍTÓ
              </th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:140px;">
                EAN AZONOSÍTÓ
              </th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px; width:120px;">
                CÍMKE
              </th>
              <th style="padding:10px 10px; text-align:center; font-size:11px; font-weight:800; color:#64748b; letter-spacing:0.5px; width:60px;">
                MŰVELET
              </th>
            </tr>
          </thead>
          <tbody id="aldi-products-tbody">
            ${filteredProducts.length === 0 ? `
              <tr>
                <td colspan="6" style="padding:24px; text-align:center; color:#94a3b8; font-size:13px;">
                  Nincs megjeleníthető termék. Kattints a <strong>➕ Új termék sor hozzáadása</strong> gombra!
                </td>
              </tr>
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
                  <button class="aldi-prod-delete-btn" data-id="${p.id || ''}" data-index="${idx}" style="background:none; border:none; cursor:pointer; font-size:14px; opacity:0.6; padding:4px; border-radius:4px; transition:opacity 0.2s;" title="Sor törlése" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                    🗑️
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size:11px; color:#94a3b8; margin-top:8px;">
        💡 A cellákra kattintva a termékadatok közvetlenül módosíthatók és azonnal elmentődnek az adatbázisba.
      </div>
    `;
  }

  // Modal to Add New Product Row
  function openAddProductModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:440px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column;">
        
        <!-- Modal Header -->
        <div style="padding:12px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#ffffff;">
          <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:8px;">
            ➕ Új ALDI termék felvétele
          </h3>
          <button id="aldi-prod-modal-close-x" style="background:none; border:none; font-size:16px; cursor:pointer; color:#64748b; font-weight:700;">✕</button>
        </div>

        <!-- Modal Body -->
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

        <!-- Modal Footer -->
        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; background:#ffffff; display:flex; justify-content:flex-end; gap:10px;">
          <button id="aldi-prod-modal-cancel" style="padding:6px 18px; border-radius:8px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">
            Mégse
          </button>
          <button id="aldi-prod-modal-save" style="padding:6px 20px; border-radius:8px; font-size:13px; font-weight:700; border:none; background:#0284c7; color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(2,132,199,0.2);">
            💾 Mentés
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    modalOverlay.querySelector('#aldi-prod-modal-close-x')?.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.querySelector('#aldi-prod-modal-cancel')?.addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelector('#aldi-prod-modal-save')?.addEventListener('click', async () => {
      const name = modalOverlay.querySelector('#aldi-new-prod-name').value.trim();
      const articleNo = modalOverlay.querySelector('#aldi-new-prod-articleno').value.trim();
      const gtin = modalOverlay.querySelector('#aldi-new-prod-gtin').value.trim();
      const ean = modalOverlay.querySelector('#aldi-new-prod-ean').value.trim();
      const label = modalOverlay.querySelector('#aldi-new-prod-label').value.trim();

      if (!name) {
        alert('Kérlek add meg a termék megnevezését!');
        return;
      }

      const newProd = {
        name,
        articleNo,
        gtin,
        ean,
        label
      };

      const savedId = await addProductToDb(newProd);
      newProd.id = savedId || `tmp-${Date.now()}`;
      state.products.push(newProd);

      modalOverlay.remove();
      renderModule();
    });
  }

  // Upload Modal (Image 2)
  function openUploadModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

    modalOverlay.innerHTML = `
      <div style="background:#ffffff; width:92%; max-width:440px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2); overflow:hidden; border:1px solid #cbd5e1; display:flex; flex-direction:column;">
        
        <!-- Modal Header -->
        <div style="padding:12px 18px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#ffffff;">
          <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:8px;">
            📄 Rendelés feltöltése
          </h3>
          <button id="aldi-modal-close-x" style="background:none; border:none; font-size:16px; cursor:pointer; color:#64748b; font-weight:700;">✕</button>
        </div>

        <!-- Modal Body -->
        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:14px;">
          
          <!-- 1. Szállítási dátum -->
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

          <!-- 2. Rendelési szám -->
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:11px; font-weight:700; color:#334155;">Rendelési szám</label>
            <input type="text" id="aldi-modal-orderno" class="access-control-input" placeholder="Pl. PO-2024-001" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
          </div>

          <!-- 3. Drag and Drop Zone (Matching Image 2) -->
          <div id="aldi-dropzone" style="border:2px dashed #93c5fd; background:#f0f9ff; border-radius:8px; padding:24px 16px; text-align:center; cursor:pointer; transition:background 0.2s;">
            <input type="file" id="aldi-file-input" accept=".pdf" style="display:none;">
            <div style="font-size:36px; margin-bottom:6px;">📁</div>
            <div style="font-size:12px; font-weight:600; color:#1d4ed8; margin-bottom:4px;" id="aldi-dropzone-text">
              Húzza ide a fájlokat, vagy kattintson a tallózáshoz
            </div>
            <div style="font-size:11px; color:#64748b;">PDF.</div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div style="padding:12px 20px; border-top:1px solid #e2e8f0; background:#ffffff; display:flex; justify-content:center; gap:12px;">
          <button id="aldi-modal-cancel" style="padding:6px 22px; border-radius:20px; font-size:13px; font-weight:600; border:1px solid #cbd5e1; background:#ffffff; color:#334155; cursor:pointer;">
            Mégse
          </button>
          <button id="aldi-modal-save" style="padding:6px 24px; border-radius:20px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(37,99,235,0.2);">
            💾 Mentés
          </button>
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

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.background = '#e0f2fe';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.background = '#f0f9ff';
    });

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

      if (!dateVal) {
        alert('Kérlek válassz szállítási dátumot!');
        return;
      }
      if (!orderNoVal) {
        alert('Kérlek add meg a rendelési számot!');
        return;
      }

      state.orders.unshift({
        id: String(Date.now()),
        date: dateVal,
        orderNo: orderNoVal,
        fileName: selectedFile ? selectedFile.name : 'rendeles.pdf'
      });

      modalOverlay.remove();
      renderModule();
    });
  }

  function bindEvents() {
    // Tab switching
    wrapper.querySelector('#aldi-tab-napi')?.addEventListener('click', () => {
      state.activeTab = 'napi';
      renderModule();
    });
    wrapper.querySelector('#aldi-tab-heti')?.addEventListener('click', () => {
      state.activeTab = 'heti';
      renderModule();
    });
    wrapper.querySelector('#aldi-tab-termekek')?.addEventListener('click', () => {
      state.activeTab = 'termekek';
      renderModule();
    });

    // Filters (Napi rendelés)
    const dateInput = wrapper.querySelector('#aldi-filter-date');
    if (dateInput) {
      dateInput.addEventListener('input', (e) => {
        state.filterDate = e.target.value;
        renderModule();
      });
    }

    const orderInput = wrapper.querySelector('#aldi-filter-order');
    if (orderInput) {
      orderInput.addEventListener('input', (e) => {
        state.filterOrderNo = e.target.value;
        renderModule();
      });
    }

    // Upload button
    wrapper.querySelector('#aldi-btn-upload')?.addEventListener('click', openUploadModal);

    // View order
    wrapper.querySelectorAll('.aldi-view-order-btn, .aldi-order-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        const ord = state.orders.find(o => o.id === id);
        if (ord) {
          alert(`ALDI Rendelés megtekintése:\nRendelési szám: ${ord.orderNo}\nSzállítási dátum: ${ord.date}\nFájl: ${ord.fileName}`);
        }
      });
    });

    // ── Termékek adat tábla események ──
    wrapper.querySelector('#aldi-btn-add-product')?.addEventListener('click', openAddProductModal);

    const productSearchInput = wrapper.querySelector('#aldi-product-search-input');
    if (productSearchInput) {
      productSearchInput.addEventListener('input', (e) => {
        state.productSearch = e.target.value;
        renderModule();
      });
    }

    // Inline field changes in products table
    wrapper.querySelectorAll('.aldi-prod-field').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const field = e.target.dataset.field;
        const id = e.target.dataset.id;
        const val = e.target.value;

        if (!isNaN(idx) && state.products[idx] && field) {
          state.products[idx][field] = val;
          const apiFieldMap = {
            name: 'product_name',
            articleNo: 'article_number',
            gtin: 'gtin',
            ean: 'ean',
            label: 'label'
          };
          const dbField = apiFieldMap[field] || field;
          updateProductInDb(id, { [dbField]: val });
        }
      });
    });

    // Delete product row
    wrapper.querySelectorAll('.aldi-prod-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = parseInt(btn.dataset.index, 10);
        const id = btn.dataset.id;
        if (!isNaN(idx) && state.products[idx]) {
          const pName = state.products[idx].name || 'terméket';
          if (confirm(`Biztosan törölni szeretnéd a(z) "${pName}" sort az adatbázisból?`)) {
            await deleteProductFromDb(id);
            state.products.splice(idx, 1);
            renderModule();
          }
        }
      });
    });
  }

  // Initial load
  fetchProductsFromDb();
}
