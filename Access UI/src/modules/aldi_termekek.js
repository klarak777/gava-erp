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
          <label style="font-size:11px; font-weight:700; color:#334155;">GTIN kód: (Opcionális)</label>
          <input type="text" id="aldi-new-prod-gtin" class="access-control-input" placeholder="Pl. 4014500000000" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size:11px; font-weight:700; color:#334155;">EAN kód: (Opcionális)</label>
          <input type="text" id="aldi-new-prod-ean" class="access-control-input" placeholder="Pl. 4014500000000" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size:11px; font-weight:700; color:#334155;">Címke / Megjegyzés: (Opcionális)</label>
          <input type="text" id="aldi-new-prod-label" class="access-control-input" placeholder="Pl. ALDI Címke" style="width:100%; height:34px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
        </div>
      </div>
      <div style="padding:12px 20px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:8px;">
        <button id="aldi-prod-modal-cancel" class="secondary-btn" style="height:34px; padding:0 14px; font-size:12px; font-weight:600; border-radius:6px;">Mégse</button>
        <button id="aldi-prod-modal-add-row" class="primary-btn" style="height:34px; padding:0 18px; font-size:12px; font-weight:600; border-radius:6px; background:#0ea5e9; color:#fff; border:none;">Hozzáadás</button>
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

    if (!name || !articleNo) {
      alert('Kérlek add meg a termék megnevezését és cikkszámát!');
      return;
    }

    state.products.push({ id: `tmp-${Date.now()}`, name, articleNo, gtin, ean, label });
    state.hasUnsavedChanges = true;
    modalOverlay.remove();
    renderModule();
    saveProductsToDb();
  });
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
    } catch (e) {
      customTexts = {};
    }
  }

  let defaultCartonContent = '';
  let defaultUnitContent = '';
  if (selectedProd) {
    if (customTexts.carton_content !== undefined) {
      defaultCartonContent = customTexts.carton_content;
    } else {
      defaultCartonContent = `${customTexts.product_name || selectedProd.name || 'TERMÉKNÉV'}\n${selectedProd.label_class || 'I.'} ${customTexts.lbl_class || 'oszt.'} ${customTexts.lbl_size || 'Méret:'} ${selectedProd.label_size || '-'}\n${customTexts.lbl_origin || 'Származási hely:'} ${selectedProd.label_origin || '-'}\n${customTexts.lbl_company || 'GAVA-Hungria Kft.'}\n${customTexts.lbl_address || 'H-1239 Budapest, Nagykőrösi út 353.'}\n${customTexts.lbl_lot || 'LOT:'} ${selectedProd.label_lot || '-'}    ${customTexts.lbl_gln || 'GLN:'} ${selectedProd.label_gln || '-'}\n${customTexts.lbl_weight || 'Nettó tömeg:'} ${selectedProd.label_net_weight_carton || '-'}`;
    }

    if (customTexts.unit_content !== undefined) {
      defaultUnitContent = customTexts.unit_content;
    } else {
      defaultUnitContent = `${customTexts.product_name || selectedProd.name || 'TERMÉKNÉV'}\n${selectedProd.label_class || 'I.'} ${customTexts.lbl_class || 'oszt.'} ${customTexts.lbl_size || 'Méret:'} ${selectedProd.label_size || '-'}\n${customTexts.lbl_origin || 'Származási hely:'} ${selectedProd.label_origin || '-'}\n${customTexts.lbl_company || 'GAVA-Hungria Kft.'}\n${customTexts.lbl_address || 'H-1239 Budapest, Nagykőrösi út 353.'}\n${customTexts.lbl_lot || 'LOT:'} ${selectedProd.label_lot || '-'}    ${customTexts.lbl_gln || 'GLN:'} ${selectedProd.label_gln || '-'}\n${customTexts.lbl_weight || 'Nettó tömeg:'} ${selectedProd.label_net_weight_unit || '-'}\n${customTexts.lbl_ean || 'EAN kód:'} ${selectedProd.ean || '-'}`;
    }
  }

  return `
      <div style="padding:16px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f8fafc; min-height:100vh;">
        <h2 style="margin:0 0 16px 0; color:#1e293b; font-size:22px; font-weight:800; display:flex; align-items:center; gap:8px;">
          <img src="AldiNord-WorldwideLogo.svg" alt="ALDI" style="height:24px; border-radius:3px;"> Termék adattábla
        </h2>
        
        ${state.hasUnsavedChanges ? `<div style="background:#fffbeb; color:#b45309; padding:10px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; font-weight:600; border:1px solid #fde68a;">Módosítások vannak, amik még nincsenek elmentve. Kattints a Mentés gombra.</div>` : ''}

        <div style="display:flex; align-items:center; justify-content:space-between; margin:16px 0 12px 0; max-width:1200px; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <input type="text" id="aldi-product-search-input" class="access-control-input" value="${state.productSearch || ''}" placeholder="Keresés név, cikkszám, GTIN..." style="height:32px; width:220px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px;">
            <button id="aldi-btn-add-product" class="secondary-btn" style="height:34px; padding:0 16px; border-radius:8px; font-size:13px; font-weight:700; border:1px solid #cbd5e1; background:#ffffff; display:inline-flex; align-items:center; gap:6px; cursor:pointer; color:#0f172a;">
              ➕ Új termék
            </button>
          </div>
          <div>
            <button id="aldi-btn-save-products" class="primary-btn" style="height:34px; padding:0 16px; border-radius:8px; font-size:13px; font-weight:700; border:none; background:#0ea5e9; color:#fff; display:inline-flex; align-items:center; gap:6px; cursor:pointer;" ${!state.hasUnsavedChanges ? 'style="opacity:0.6;" disabled' : ''}>
              💾 Mentés
            </button>
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

        <!-- Három alsó blokk (Pontosan az eredeti struktúra) -->
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
                <div style="display:flex; flex-direction:column; gap:8px; font-size:13px; margin-bottom:16px;">
                  <div style="display:grid; grid-template-columns:120px 1fr;"><strong>Termék név</strong><span>${selectedProd.name || ''}</span></div>
                  <div style="display:grid; grid-template-columns:120px 1fr;"><strong>Cikkszám</strong><span>${selectedProd.articleNo || ''}</span></div>
                  <div style="display:grid; grid-template-columns:120px 1fr;"><strong>GTIN azonosító</strong><span>${selectedProd.gtin || ''}</span></div>
                  <div style="display:grid; grid-template-columns:120px 1fr;"><strong>EAN azonosító</strong><span>${selectedProd.ean || ''}</span></div>
                </div>
                <div style="display:flex; gap:10px;">
                  <button class="secondary-btn inline-edit-base-btn" style="height:32px; padding:0 16px; font-size:12px; font-weight:600;">Szerkesztés</button>
                  <button class="primary-btn inline-dl-btn" data-id="${selectedProd.id}" style="height:32px; padding:0 16px; font-size:12px; font-weight:600; background:#2563eb; color:#fff; border:none;">Letöltés (DOCX)</button>
                </div>
              `
            ) : `
              <div style="color:#94a3b8; font-size:13px; text-align:center; padding:20px 0;">Válassz ki egy terméket a táblázatból!</div>
            `}
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
  
          <!-- EGYSÉG CÍMKE -->
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
  
  let selectionStart = null;
  let selectionEnd = null;
  let isSearchFocused = false;
  const activeEl = document.activeElement;
  if (activeEl && activeEl.id === 'aldi-product-search-input') {
    isSearchFocused = true;
    try {
      selectionStart = activeEl.selectionStart;
      selectionEnd = activeEl.selectionEnd;
    } catch(e) {}
  }

  wrapper.innerHTML = renderTermekekHtml();

  // Eseménykezelők
  wrapper.querySelector('#aldi-btn-add-product')?.addEventListener('click', openAddProductModal);
  wrapper.querySelector('#aldi-btn-save-products')?.addEventListener('click', saveProductsToDb);

  const productSearchInput = wrapper.querySelector('#aldi-product-search-input');
  if (productSearchInput) {
    productSearchInput.addEventListener('input', (e) => { 
      state.productSearch = e.target.value; 
      state.productsPage = 1;
      renderModule(); 
    });
    if (isSearchFocused) {
      productSearchInput.focus();
      try {
        if (selectionStart !== null) {
          productSearchInput.setSelectionRange(selectionStart, selectionEnd);
        }
      } catch(e) {}
    }
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

  // Sor kijelölése
  wrapper.querySelectorAll('.aldi-prod-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.aldi-prod-delete-btn')) return;
      state.selectedProductId = row.getAttribute('data-pid');
      state.editingBlock = null;
      renderModule();
    });
  });

  // Termék törlése
  wrapper.querySelectorAll('.aldi-prod-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const idx = state.products.findIndex(p => String(p.id) === String(id) || String(p.tempId) === String(id));
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

  // Szerkesztési blokkok aktiválása
  wrapper.querySelector('.inline-edit-base-btn')?.addEventListener('click', () => { 
    state.editingBlock = 'base'; 
    renderModule(); 
  });
  wrapper.querySelector('.inline-edit-carton-btn')?.addEventListener('click', () => { 
    state.editingBlock = 'carton'; 
    renderModule(); 
  });
  wrapper.querySelector('.inline-edit-unit-btn')?.addEventListener('click', () => { 
    state.editingBlock = 'unit'; 
    renderModule(); 
  });

  wrapper.querySelectorAll('.inline-cancel-btn').forEach(b => b.addEventListener('click', () => { 
    state.editingBlock = null; 
    renderModule(); 
  }));

  // DOCX letöltés (Pontosan mint az eredetiben)
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

  // Alapadatok mentése
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

  // Címkék mentése (Karton és Egység címke mentése)
  const saveLabelFn = async (isUnit) => {
    const prod = state.products.find(p => String(p.id) === String(state.selectedProductId) || String(p.tempId) === String(state.selectedProductId));
    if (!prod) return;

    const tryGetVal = (id) => {
      const el = wrapper.querySelector(id);
      return el ? el.value : undefined;
    };

    let customTexts = {};
    if (prod.label_custom_texts) {
      try {
        customTexts = typeof prod.label_custom_texts === 'string' ? JSON.parse(prod.label_custom_texts) : prod.label_custom_texts;
      } catch (e) {
        customTexts = {};
      }
    }

    if (isUnit) {
      const titleVal = tryGetVal('#aldi-inline-title-pieza-u');
      if (titleVal !== undefined) customTexts.title_pieza = titleVal;
      const contentVal = tryGetVal('#aldi-inline-unit-content');
      if (contentVal !== undefined) customTexts.unit_content = contentVal;
    } else {
      const titleVal = tryGetVal('#aldi-inline-title-caja');
      if (titleVal !== undefined) customTexts.title_caja = titleVal;
      const contentVal = tryGetVal('#aldi-inline-carton-content');
      if (contentVal !== undefined) customTexts.carton_content = contentVal;
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
        if (!resp.ok) { 
          alert('Szerver hiba mentéskor: ' + (respJson.error || resp.status)); 
          return; 
        }
      } catch (e) { 
        console.error('[saveLabelFn] fetch error:', e); 
        alert('Hiba mentéskor!'); 
        return; 
      }
    }
    state.editingBlock = null;
    renderModule();
  };

  wrapper.querySelector('.inline-save-label-btn')?.addEventListener('click', () => saveLabelFn(false));
  wrapper.querySelector('.inline-save-label-u-btn')?.addEventListener('click', () => saveLabelFn(true));
}
