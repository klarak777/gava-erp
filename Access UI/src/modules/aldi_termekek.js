import { WindowManager } from '../components/WindowManager.js';

let state = {
  products: [],
  isLoadingProducts: false,
  productSearch: '',
  productsPage: 1,
  selectedProductId: null,
  editingBlock: null,
  hasUnsavedChanges: false
};

let wrapper;

export function renderAldiTermekAdattabla(container) {
  wrapper = container;
  wrapper.innerHTML = `<div style="padding:20px; color:#334155;">⏳ Betöltés...</div>`;
  fetchProductsFromDb();
}

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
          label: item.label || '',
          label_class: item.label_class || '',
          label_size: item.label_size || '',
          label_origin: item.label_origin || '',
          label_lot: item.label_lot || '',
          label_gln: item.label_gln || '',
          label_net_weight_carton: item.label_net_weight_carton || '',
          label_net_weight_unit: item.label_net_weight_unit || '',
          label_custom_texts: item.label_custom_texts || null
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
      if (data.success) {
        state.products = data.products.map(item => ({
          id: item.id,
          name: item.product_name || '',
          articleNo: item.article_number || '',
          gtin: item.gtin || '',
          ean: item.ean || '',
          label: item.label || '',
          label_class: item.label_class || '',
          label_size: item.label_size || '',
          label_origin: item.label_origin || '',
          label_lot: item.label_lot || '',
          label_gln: item.label_gln || '',
          label_net_weight_carton: item.label_net_weight_carton || '',
          label_net_weight_unit: item.label_net_weight_unit || '',
          label_custom_texts: item.label_custom_texts || null
        }));
        state.hasUnsavedChanges = false;
        alert('✅ Termékek sikeresen elmentve!');
      } else {
        alert('❌ Hiba a mentés során: ' + (data.error || 'Ismeretlen hiba'));
      }
    } else {
      alert('❌ Szerver hiba mentéskor.');
    }
  } catch (e) {
    console.error(e);
    alert('❌ Hálózati hiba a mentés során.');
  } finally {
    renderModule();
  }
}

function openAddProductModal() {
  window.gavaWindowManager.open('aldi-add-product-modal', 'Új ALDI Termék', (contentEl, wm) => {
    contentEl.innerHTML = `
      <div style="padding:16px; background:#fff; height:100%; box-sizing:border-box;">
        <div style="display:grid; gap:12px; font-size:13px; max-width:400px;">
          <label style="display:flex; flex-direction:column; gap:4px; font-weight:600; color:#334155;">Termék neve *<input type="text" id="m-prod-name" class="access-control-input" style="height:32px; padding:4px 8px;"></label>
          <label style="display:flex; flex-direction:column; gap:4px; font-weight:600; color:#334155;">Cikkszám *<input type="text" id="m-prod-articleno" class="access-control-input" style="height:32px; padding:4px 8px;"></label>
          <label style="display:flex; flex-direction:column; gap:4px; font-weight:600; color:#334155;">GTIN<input type="text" id="m-prod-gtin" class="access-control-input" style="height:32px; padding:4px 8px;"></label>
          <label style="display:flex; flex-direction:column; gap:4px; font-weight:600; color:#334155;">EAN<input type="text" id="m-prod-ean" class="access-control-input" style="height:32px; padding:4px 8px;"></label>
          <label style="display:flex; flex-direction:column; gap:4px; font-weight:600; color:#334155;">Címke formátum<input type="text" id="m-prod-label" class="access-control-input" placeholder="pl. Aldi label" style="height:32px; padding:4px 8px;"></label>
          <button id="m-prod-save" class="primary-btn" style="height:36px; margin-top:10px;">Hozzáadás listához</button>
        </div>
      </div>
    `;
    contentEl.querySelector('#m-prod-save').addEventListener('click', () => {
      const name = contentEl.querySelector('#m-prod-name').value.trim();
      const articleNo = contentEl.querySelector('#m-prod-articleno').value.trim();
      const gtin = contentEl.querySelector('#m-prod-gtin').value.trim();
      const ean = contentEl.querySelector('#m-prod-ean').value.trim();
      const label = contentEl.querySelector('#m-prod-label').value.trim();
      if (!name || !articleNo) {
        alert('A név és a cikkszám kötelező!');
        return;
      }
      state.products.push({ id: `tmp-${Date.now()}`, name, articleNo, gtin, ean, label });
      state.hasUnsavedChanges = true;
      wm.close('aldi-add-product-modal');
      renderModule();
    });
  }, { width: 450, height: 480, x: window.innerWidth/2 - 225, y: 100 });
}

function renderTermekekHtml() {
    const q = (state.productSearch || '').toLowerCase().trim();
    // ABC sorrendbe rendezés name alapján
    let sortedProducts = [...state.products].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const filteredProducts = sortedProducts.filter(p => {
      if (!q) return true;
      return (p.name && p.name.toLowerCase().includes(q)) ||
        (p.articleNo && p.articleNo.toLowerCase().includes(q)) ||
        (p.gtin && p.gtin.toLowerCase().includes(q)) ||
        (p.ean && p.ean.toLowerCase().includes(q)) ||
        (p.label && p.label.toLowerCase().includes(q));
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    let currentPage = state.productsPage || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const selectedProd = state.selectedProductId ? state.products.find(p => String(p.id) === String(state.selectedProductId) || String(p.tempId) === String(state.selectedProductId)) : null;

    let customTexts = {};
    if (selectedProd && selectedProd.label_custom_texts) {
      try {
        customTexts = typeof selectedProd.label_custom_texts === 'string'
          ? JSON.parse(selectedProd.label_custom_texts)
          : selectedProd.label_custom_texts;
      } catch(e) {}
    }

    let defaultCartonContent = customTexts.carton_content !== undefined ? customTexts.carton_content : '';
    let defaultUnitContent = customTexts.unit_content !== undefined ? customTexts.unit_content : '';

    return `
      <div style="padding:16px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f8fafc; min-height:100vh;">
        <h2 style="margin:0 0 16px 0; color:#1e293b; font-size:22px; font-weight:800; display:flex; align-items:center; gap:8px;">
          <img src="AldiNord-WorldwideLogo.svg" alt="ALDI" style="height:24px; border-radius:3px;"> Termék adattábla
        </h2>
        
        ${state.hasUnsavedChanges ? `<div style="background:#fffbeb; color:#b45309; padding:10px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; font-weight:600; border:1px solid #fde68a;">Módosítások vannak, amik még nincsenek elmentve. Kattints a Mentés gombra.</div>` : ''}

      <div style="display:flex; align-items:center; justify-content:space-between; margin:16px 0 12px 0; max-width:1200px; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <button id="aldi-btn-add-product" class="secondary-btn" style="height:34px; padding:0 16px; border-radius:8px; font-size:13px; font-weight:700; border:1px solid #cbd5e1; background:#ffffff; display:inline-flex; align-items:center; gap:6px; cursor:pointer; color:#0f172a;">
            ➕ Új termék sor hozzáadása
          </button>
          <button id="aldi-btn-save-products" class="primary-btn" style="height:34px; padding:0 16px; border-radius:8px; font-size:13px; font-weight:700; border:none; background:#0ea5e9; color:#fff; display:inline-flex; align-items:center; gap:6px; cursor:pointer;" ${!state.hasUnsavedChanges ? 'style="opacity:0.6;" disabled' : ''}>
            💾 Mentés Adatbázisba
          </button>
        </div>
        <div>
          <input type="text" id="aldi-product-search-input" class="access-control-input" value="${state.productSearch || ''}" placeholder="Keresés név, cikkszám, GTIN..." style="height:32px; width:220px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
        </div>
      </div>
      <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; max-width:1200px; box-shadow:0 1px 4px rgba(0,0,0,0.04); background:#ffffff;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px;">TERMÉK MEGNEVEZÉSE</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px;">CIKKSZÁM</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px;">GTIN AZONOSÍTÓ</th>
              <th style="padding:10px 14px; text-align:left; font-size:11px; font-weight:800; color:#334155; letter-spacing:0.5px;">EAN AZONOSÍTÓ</th>
              <th style="padding:10px 10px; text-align:center; font-size:11px; font-weight:800; color:#64748b; letter-spacing:0.5px; width:60px;">MŰVELET</th>
            </tr>
          </thead>
          <tbody id="aldi-products-tbody">
            ${paginatedProducts.length === 0 ? `
              <tr><td colspan="5" style="padding:24px; text-align:center; color:#94a3b8; font-size:13px;">Nincs megjeleníthető termék.</td></tr>
            ` : paginatedProducts.map((p, idx) => `
              <tr class="aldi-prod-row" data-pid="${p.id || p.tempId}" style="border-bottom:1px solid #f1f5f9; cursor:pointer; transition:background 0.2s; ${String(state.selectedProductId) === String(p.id || p.tempId) ? 'background:#e0f2fe;' : (idx % 2 === 1 ? 'background:#fafafa;' : 'background:#ffffff;')}">
                <td style="padding:6px 14px; color:#1e293b; font-weight:600;">${p.name || ''}</td>
                <td style="padding:6px 14px; color:#334155;">${p.articleNo || ''}</td>
                <td style="padding:6px 14px; color:#334155; font-family:monospace;">${p.gtin || ''}</td>
                <td style="padding:6px 14px; color:#334155; font-family:monospace;">${p.ean || ''}</td>
                <td style="padding:6px 10px; text-align:center;">
                  <button class="aldi-prod-delete-btn" data-id="${p.id || p.tempId}" style="background:none; border:none; cursor:pointer; font-size:14px; opacity:0.6; padding:4px; border-radius:4px; transition:opacity 0.2s;" title="Sor törlése" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="padding:10px 14px; background:#f8fafc; border-top:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:#64748b;">Összesen: ${filteredProducts.length} termék</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <button id="aldi-prod-prev-page" style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:4px 8px; cursor:pointer; color:#334155;" ${currentPage === 1 ? 'disabled style="opacity:0.5"' : ''}>&lt;</button>
            <span style="font-size:13px; font-weight:600; color:#1e293b;">${currentPage} / ${totalPages}</span>
            <button id="aldi-prod-next-page" style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:4px 8px; cursor:pointer; color:#334155;" ${currentPage === totalPages ? 'disabled style="opacity:0.5"' : ''}>&gt;</button>
          </div>
        </div>
      </div>

      <!-- Három alsó blokk -->
      <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px; margin-top:20px; max-width:1200px;">
        
        <!-- TERMÉK RÉSZLETEI -->
        <div style="border:1px solid #cbd5e1; border-radius:8px; padding:16px; background:#fff;">
          <h4 style="margin:0 0 12px 0; color:#1e3a8a; font-size:13px; font-weight:800; letter-spacing:0.5px;">TERMÉK RÉSZLETEI</h4>
          ${selectedProd ? (
        state.editingBlock === 'base' ? `
               <div style="display:flex; flex-direction:column; gap:8px; font-size:13px; margin-bottom:16px;">
                 <div style="display:grid; grid-template-columns:120px 1fr; align-items:center;"><strong>Termék név *</strong><input type="text" id="aldi-inline-name" value="${selectedProd.name || ''}" class="access-control-input" style="height:28px; padding:2px 8px;"></div>
                 <div style="display:grid; grid-template-columns:120px 1fr; align-items:center;"><strong>Cikkszám *</strong><input type="text" id="aldi-inline-articleno" value="${selectedProd.articleNo || ''}" class="access-control-input" style="height:28px; padding:2px 8px;"></div>
                 <div style="display:grid; grid-template-columns:120px 1fr; align-items:center;"><strong>GTIN</strong><input type="text" id="aldi-inline-gtin" value="${selectedProd.gtin || ''}" class="access-control-input" style="height:28px; padding:2px 8px;"></div>
                 <div style="display:grid; grid-template-columns:120px 1fr; align-items:center;"><strong>EAN</strong><input type="text" id="aldi-inline-ean" value="${selectedProd.ean || ''}" class="access-control-input" style="height:28px; padding:2px 8px;"></div>
               </div>
               <div style="display:flex; gap:10px;">
                 <button class="secondary-btn inline-cancel-btn" style="height:32px; padding:0 12px; font-size:12px; font-weight:600;">Mégse</button>
                 <button class="primary-btn inline-save-base-btn" style="height:32px; padding:0 16px; font-size:12px; font-weight:600; background:#16a34a; border:none; color:#fff;">Mentés</button>
               </div>
             ` : `
               <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; margin-bottom:12px; color:#334155;">
                 <div style="display:grid; grid-template-columns:120px 1fr;"><strong style="color:#64748b;">Termék név:</strong><span style="font-weight:600; color:#0f172a;">${selectedProd.name || '-'}</span></div>
                 <div style="display:grid; grid-template-columns:120px 1fr;"><strong style="color:#64748b;">Cikkszám:</strong><span>${selectedProd.articleNo || '-'}</span></div>
                 <div style="display:grid; grid-template-columns:120px 1fr;"><strong style="color:#64748b;">GTIN:</strong><span>${selectedProd.gtin || '-'}</span></div>
                 <div style="display:grid; grid-template-columns:120px 1fr;"><strong style="color:#64748b;">EAN:</strong><span>${selectedProd.ean || '-'}</span></div>
               </div>
               <button class="secondary-btn inline-edit-base-btn" style="height:32px; padding:0 12px; font-size:12px; font-weight:600;">Szerkesztés</button>
             `
      ) : '<div style="color:#94a3b8; font-size:13px;">Válassz ki egy terméket a részletekhez.</div>'}
        </div>

        <!-- KARTON CÍMKE -->
        <div style="border:1px solid #cbd5e1; border-radius:8px; padding:16px; background:#fff;">
          <h4 style="margin:0 0 12px 0; color:#1e3a8a; font-size:13px; font-weight:800; letter-spacing:0.5px; display:flex; justify-content:space-between; align-items:center;">
            <span>KARTON CÍMKE RÉSZLETEI</span>
            ${(selectedProd && !String(selectedProd.id).startsWith('tmp-')) ? `<button class="inline-dl-btn" data-id="${selectedProd.id}" style="background:none; border:none; font-size:16px; cursor:pointer; opacity:0.7;" title="PDF letöltése">📥</button>` : ''}
          </h4>
          ${selectedProd ? (
        state.editingBlock === 'carton' ? `
               <div style="display:flex; flex-direction:column; gap:8px; font-size:13px; margin-bottom:16px;">
                 <div style="display:grid; grid-template-columns:120px 1fr; align-items:center;"><strong>Cím Caja (Név)</strong><input type="text" id="aldi-inline-title-caja" value="${customTexts.title_caja || ''}" class="access-control-input" style="height:28px; padding:2px 8px;"></div>
                 <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                    <strong style="color:#64748b;">Címke összetevők leírás (Spanyol):</strong>
                    <textarea id="aldi-inline-carton-content" class="access-control-input" style="width:100%; min-height:80px; padding:8px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; resize:vertical;">${defaultCartonContent}</textarea>
                 </div>
               </div>
               <div style="display:flex; gap:10px;">
                 <button class="secondary-btn inline-cancel-btn" style="height:32px; padding:0 12px; font-size:12px; font-weight:600;">Mégse</button>
                 <button class="primary-btn inline-save-label-btn" style="height:32px; padding:0 16px; font-size:12px; font-weight:600; background:#16a34a; border:none; color:#fff;">Mentés</button>
               </div>
             ` : `
               <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; margin-bottom:12px; color:#334155;">
                 <div style="display:grid; grid-template-columns:120px 1fr;"><strong style="color:#64748b;">Cím Caja (Név):</strong><span style="font-weight:600; color:#0f172a;">${customTexts.title_caja || '-'}</span></div>
               </div>
               <button class="secondary-btn inline-edit-carton-btn" style="height:32px; padding:0 12px; font-size:12px; font-weight:600;">Szerkesztés</button>
             `
      ) : '<div style="color:#94a3b8; font-size:13px;">Válassz ki egy terméket a részletekhez.</div>'}
        </div>

        <!-- UNIT CÍMKE -->
        <div style="border:1px solid #cbd5e1; border-radius:8px; padding:16px; background:#fff;">
          <h4 style="margin:0 0 12px 0; color:#1e3a8a; font-size:13px; font-weight:800; letter-spacing:0.5px; display:flex; justify-content:space-between; align-items:center;">
            <span>UNIT CÍMKE RÉSZLETEI (TÁLCÁS)</span>
            ${(selectedProd && !String(selectedProd.id).startsWith('tmp-')) ? `<button class="inline-dl-unit-btn" data-id="${selectedProd.id}" style="background:none; border:none; font-size:16px; cursor:pointer; opacity:0.7;" title="PDF letöltése">📥</button>` : ''}
          </h4>
          ${selectedProd ? (
        state.editingBlock === 'unit' ? `
               <div style="display:flex; flex-direction:column; gap:8px; font-size:13px; margin-bottom:16px;">
                 <div style="display:grid; grid-template-columns:120px 1fr; align-items:center;"><strong>Cím Pieza (Név)</strong><input type="text" id="aldi-inline-title-pieza-u" value="${customTexts.title_pieza || ''}" class="access-control-input" style="height:28px; padding:2px 8px;"></div>
                 <div style="display:grid; grid-template-columns:120px 1fr; align-items:center;"><strong>Származás</strong><select id="aldi-inline-origin-u" data-loaded="false" class="access-control-input" style="height:28px; padding:2px 8px;"><option value="${selectedProd.label_origin || ''}">${selectedProd.label_origin || 'Töltés...'}</option></select></div>
                 
                 <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                    <strong style="color:#64748b;">Tálca összetevők leírás (Spanyol):</strong>
                    <textarea id="aldi-inline-unit-content" class="access-control-input" style="width:100%; min-height:80px; padding:8px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; resize:vertical;">${defaultUnitContent}</textarea>
                 </div>
               </div>
               <div style="display:flex; gap:10px;">
                 <button class="secondary-btn inline-cancel-btn" style="height:32px; padding:0 12px; font-size:12px; font-weight:600;">Mégse</button>
                 <button class="primary-btn inline-save-label-u-btn" style="height:32px; padding:0 16px; font-size:12px; font-weight:600; background:#16a34a; border:none; color:#fff;">Mentés</button>
               </div>
             ` : `
               <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; margin-bottom:12px; color:#334155;">
                 <div style="display:grid; grid-template-columns:120px 1fr;"><strong style="color:#64748b;">Cím Pieza (Név):</strong><span style="font-weight:600; color:#0f172a;">${customTexts.title_pieza || '-'}</span></div>
                 <div style="display:grid; grid-template-columns:120px 1fr;"><strong style="color:#64748b;">Származás:</strong><span>${selectedProd.label_origin || '-'}</span></div>
               </div>
               <button class="secondary-btn inline-edit-unit-btn" style="height:32px; padding:0 12px; font-size:12px; font-weight:600;">Szerkesztés</button>
             `
      ) : '<div style="color:#94a3b8; font-size:13px;">Válassz ki egy terméket a részletekhez.</div>'}
        </div>
      </div>
      
      </div>
    `;
  }

function renderModule() {
  if (state.isLoadingProducts) {
    wrapper.innerHTML = `<div style="padding:20px; color:#334155;">⏳ Betöltés...</div>`;
    return;
  }
  wrapper.innerHTML = renderTermekekHtml();

  // Eseménykezelők
  wrapper.querySelector('#aldi-btn-add-product')?.addEventListener('click', openAddProductModal);
  wrapper.querySelector('#aldi-btn-save-products')?.addEventListener('click', saveProductsToDb);

  const productSearchInput = wrapper.querySelector('#aldi-product-search-input');
  if (productSearchInput) {
    productSearchInput.addEventListener('input', (e) => { state.productSearch = e.target.value; renderModule(); });
    // Focus after render if it was focused
    if (state.productSearch) productSearchInput.focus();
  }

  // Pagináció
  wrapper.querySelector('#aldi-prod-prev-page')?.addEventListener('click', () => {
    if (state.productsPage > 1) {
      state.productsPage--;
      renderModule();
    }
  });
  wrapper.querySelector('#aldi-prod-next-page')?.addEventListener('click', () => {
    const q = (state.productSearch || '').toLowerCase().trim();
    const filteredProducts = state.products.filter(p => !q || (p.name && p.name.toLowerCase().includes(q)) || (p.articleNo && p.articleNo.toLowerCase().includes(q)));
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if ((state.productsPage || 1) < totalPages) {
      state.productsPage = (state.productsPage || 1) + 1;
      renderModule();
    }
  });

  // Row selection
  wrapper.querySelectorAll('.aldi-prod-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.aldi-prod-delete-btn')) return;
      state.selectedProductId = row.getAttribute('data-pid');
      state.editingBlock = null;
      renderModule();
    });
  });

  // Delete product row
  wrapper.querySelectorAll('.aldi-prod-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const idx = state.products.findIndex(p => p.id == id || p.tempId == id);
      if (idx !== -1) {
        const pName = state.products[idx].name || 'terméket';
        if (confirm(`Biztosan törölni szeretnéd a(z) "${pName}" sort? (A végleges törléshez kattints a Mentés gombra)`)) {
          state.products.splice(idx, 1);
          if (String(state.selectedProductId) === String(id)) state.selectedProductId = null;
          state.hasUnsavedChanges = true;
          renderModule();
        }
      }
    });
  });

  // Inline edit triggers
  wrapper.querySelector('.inline-edit-base-btn')?.addEventListener('click', () => { state.editingBlock = 'base'; renderModule(); });
  wrapper.querySelector('.inline-edit-carton-btn')?.addEventListener('click', () => { state.editingBlock = 'carton'; renderModule(); });
  wrapper.querySelector('.inline-edit-unit-btn')?.addEventListener('click', () => { state.editingBlock = 'unit'; renderModule(); });

  wrapper.querySelectorAll('.inline-cancel-btn').forEach(b => b.addEventListener('click', () => { state.editingBlock = null; renderModule(); }));

  // Download triggers
  wrapper.querySelector('.inline-dl-btn')?.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    window.open(`/api/v1/chain-products/${id}/label`, '_blank');
  });
  wrapper.querySelector('.inline-dl-unit-btn')?.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    window.open(`/api/v1/chain-products/${id}/label?type=unit`, '_blank');
  });

  // Populate country dropdowns if they exist
  const originSelect = wrapper.querySelector('#aldi-inline-origin') || wrapper.querySelector('#aldi-inline-origin-u');
  if (originSelect && !originSelect.dataset.loaded) {
    fetch('/api/v1/admin/ref_origin_countries')
      .then(r => r.json())
      .then(countries => {
        const currentVal = originSelect.value;
        originSelect.innerHTML = '<option value="">Válassz...</option>';
        countries.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          if (c.name === currentVal) opt.selected = true;
          originSelect.appendChild(opt);
        });
        originSelect.dataset.loaded = 'true';
      }).catch(e => console.error(e));
  }

  // Save Base
  wrapper.querySelector('.inline-save-base-btn')?.addEventListener('click', async () => {
    const prod = state.products.find(p => String(p.id) === String(state.selectedProductId) || String(p.tempId) === String(state.selectedProductId));
    if (!prod) return;
    prod.name = wrapper.querySelector('#aldi-inline-name').value.trim();
    prod.articleNo = wrapper.querySelector('#aldi-inline-articleno').value.trim();
    prod.gtin = wrapper.querySelector('#aldi-inline-gtin').value.trim();
    prod.ean = wrapper.querySelector('#aldi-inline-ean').value.trim();

    if (!prod.name || !prod.articleNo) { alert('A név és cikkszám kötelező!'); return; }

    if (String(prod.id).startsWith('tmp-')) {
      state.hasUnsavedChanges = true;
    } else {
      try {
        await fetch('/api/v1/chain-products/' + prod.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_name: prod.name, article_number: prod.articleNo, gtin: prod.gtin, ean: prod.ean })
        });
      } catch (e) { alert('Hiba mentéskor!'); return; }
    }
    state.editingBlock = null;
    renderModule();
  });

  // Save Label
  const saveLabelFn = async (isUnit) => {
    const prod = state.products.find(p => String(p.id) === String(state.selectedProductId) || String(p.tempId) === String(state.selectedProductId));
    if (!prod) return;
    
    const textareaId = isUnit ? '#aldi-inline-unit-content' : '#aldi-inline-carton-content';
    const tryGetVal = (id) => wrapper.querySelector(id) ? wrapper.querySelector(id).value : undefined;
    
    let customTexts = {};
    if (prod.label_custom_texts) {
        try { customTexts = typeof prod.label_custom_texts === 'string' ? JSON.parse(prod.label_custom_texts) : prod.label_custom_texts; } catch(e) {}
    }
    
    if (isUnit) {
        customTexts.title_pieza = tryGetVal('#aldi-inline-title-pieza-u');
        customTexts.unit_content = tryGetVal('#aldi-inline-unit-content');
    } else {
        customTexts.title_caja = tryGetVal('#aldi-inline-title-caja');
        customTexts.carton_content = tryGetVal('#aldi-inline-carton-content');
    }
    
    prod.label_custom_texts = JSON.stringify(customTexts);

    if (String(prod.id).startsWith('tmp-')) {
      state.hasUnsavedChanges = true;
    } else {
      try {
        const resp = await fetch('/api/v1/chain-products/' + prod.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label_custom_texts: prod.label_custom_texts
          })
        });
        const respJson = await resp.json();
        if (!resp.ok) { alert('Szerver hiba mentéskor: ' + (respJson.error || resp.status)); return; }
      } catch (e) { console.error(e); alert('Hiba mentéskor!'); return; }
    }
    state.editingBlock = null;
    renderModule();
  };

  wrapper.querySelector('.inline-save-label-btn')?.addEventListener('click', () => saveLabelFn(false));
  wrapper.querySelector('.inline-save-label-u-btn')?.addEventListener('click', () => saveLabelFn(true));
}
