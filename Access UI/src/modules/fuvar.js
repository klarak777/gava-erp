import { openKamionSzerkesztesWindow } from './kamion_szerkesztes.js';

// Fuvarok összesítő modul
export function renderFuvar(container, windowManager) {
    container.style.overflow = 'hidden';
    container.style.padding = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    const filterPanel = document.createElement('div');
    filterPanel.style.cssText = 'flex-shrink:0; padding:16px 32px 4px 32px; background:var(--bg-light);';
    filterPanel.innerHTML = `
        <style>
            .access-form-view .access-control-label {
                font-size: 11px !important;
            }
        </style>
        <div style="margin-bottom:12px;">
            <h2 class="view-title" style="margin:0 0 4px 0;">Fuvarok összesítő</h2>
            <p class="view-subtitle" style="margin:0;">Fuvarok adatainak áttekintése és szűrése</p>
        </div>

        <div class="access-form-view" style="padding:10px 18px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <strong style="font-size:13px;">Szűrési feltételek</strong>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button class="secondary-btn btn-dense" id="btn-col-settings" style="font-size:12px; padding:5px 12px; display:inline-flex; align-items:center; gap:5px;">
                        <span>⚙️</span> Beállítás
                    </button>
                    <button class="secondary-btn btn-dense" id="btn-clear-filters" style="font-size:12px; padding:5px 12px;">Szűrők törlése</button>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; align-items: end;">
                <div class="access-control-group" style="margin-bottom:0;">
                    <label class="access-control-label" for="filter-car-n">Kamion szám:</label>
                    <input type="text" id="filter-car-n" class="access-control-input" placeholder="Keresés...">
                </div>
                <div class="access-control-group" style="margin-bottom:0;">
                    <label class="access-control-label" for="filter-loading-place">Rakodási hely:</label>
                    <input type="text" id="filter-loading-place" class="access-control-input" placeholder="Keresés...">
                </div>
                <div class="access-control-group" style="margin-bottom:0;">
                    <label class="access-control-label" for="filter-products">Termék:</label>
                    <input type="text" id="filter-products" class="access-control-input" placeholder="Keresés...">
                </div>
                
                <div class="access-control-group" style="margin-bottom:0;">
                    <label class="access-control-label" for="filter-season">Szezon:</label>
                    <select id="filter-season" class="access-control-input">
                        <option value="">-- Összes --</option>
                        <option value="26-27">Season 26-27</option>
                        <option value="25-26">Season 25-26</option>
                        <option value="24-25">Season 24-25</option>
                        <option value="23-24">Season 23-24</option>
                        <option value="22-23">Season 22-23</option>
                        <option value="21-22">Season 21-22</option>
                        <option value="20-21">Season 20-21</option>
                        <option value="19-20">Season 19-20</option>
                        <option value="18-19">Season 18-19</option>
                    </select>
                </div>
                <div class="access-control-group" style="margin-bottom:0;">
                    <label class="access-control-label" for="filter-year">Év:</label>
                    <select id="filter-year" class="access-control-input">
                        <option value="">-- Összes --</option>
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2019">2019</option>
                        <option value="2018">2018</option>
                    </select>
                </div>
                <div class="access-control-group" style="margin-bottom:0;">
                    <label class="access-control-label" for="filter-transport-company">Fuvarozó cég:</label>
                    <select id="filter-transport-company" class="access-control-input">
                        <option value="">-- Összes --</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    function fmt(val) { return (val === null || val === undefined || val === '') ? '' : val; }
    function fmtNum(val) { return (val === null || val === undefined || val === '' || val === '0.00' || val === 0) ? '' : val; }
    function fmtDate(val) { return val ? val.substring(0, 10) : ''; }

    const ALL_COLUMNS = [
        { key: 'tot', label: 'Total Palets', align: 'center', format: r => fmtNum(r.tot) },
        { key: 'euro', label: 'N° Euro Palets', align: 'center', bg: '#bfdbfe', format: r => fmtNum(r.euro) },
        { key: 'norm', label: 'N° Normal Palets', align: 'center', format: r => fmtNum(r.norm) },
        { key: 'prod', label: 'Products', bg: '#bfdbfe', format: r => fmt(r.prod) },
        { key: 'ref', label: 'Reference', bg: '#bfdbfe', format: r => fmt(r.ref) },
        { key: 'cust', label: 'Customer', format: r => fmt(r.cust) },
        { key: 'dest', label: 'Destination', bg: '#bfdbfe', format: r => fmt(r.dest) },
        { key: 'comment', label: 'Comment', bg: '#bfdbfe', format: r => fmt(r.comment) },
        { key: 'gross_weight_kg', label: 'Gross weight (kg)', align: 'right', format: r => fmtNum(r.gross_weight_kg) },
        { key: 'price_eur', label: 'Price (EUR)', align: 'right', format: r => fmtNum(r.price_eur) },
        { key: 'price_bcn_eur', label: 'Price BCN (EUR)', align: 'right', format: r => fmtNum(r.price_bcn_eur) },
        { key: 'unit', label: 'Unit', format: r => fmt(r.unit) },
        { key: 'reloading_per_plt', label: 'Reloading/plt', align: 'right', format: r => fmtNum(r.reloading_per_plt) },
        { key: 'transport_bcn_per_plt', label: 'Transport BCN/plt', align: 'right', format: r => fmtNum(r.transport_bcn_per_plt) },
        { key: 'albaran_number', label: 'Albarán N°', format: r => fmt(r.albaran_number) },
        { key: 'car_n', label: 'Car n.', format: r => `<span class="fuv-open-link" data-id="${r.shipment_id}" data-tour="${fmt(r.order_number)}" style="cursor:pointer; color:#2563eb; text-decoration:underline; font-weight:600;">${fmt(r.order_number)}</span>` },
        { key: 'loading_date', label: 'Loading date', format: r => fmtDate(r.loading_date) },
        { key: 'loading_place', label: 'Loading place', format: r => fmt(r.loading_place) },
        { key: 'order_number', label: 'Order number', format: r => fmt(r.order_number) },
        { key: 'transport_company', label: 'Fuvarozó cég', format: r => fmt(r.transport_company) },
        { key: 'plate_number', label: 'Plate number', format: r => fmt(r.plate_number) },
        { key: 'transport_price', label: 'Transport price', align: 'right', format: r => fmtNum(r.transport_price) },
        { key: 'arrival_date', label: 'Arrival date', format: r => fmtDate(r.arrival_date) },
        { key: 'transport_cost', label: 'Transport cost', align: 'right', format: r => fmtNum(r.transport_cost) },
        { key: 'invoice_amount_eur', label: 'Invoice amount (EUR)', align: 'right', format: r => fmtNum(r.invoice_amount_eur) },
        { key: 'invoice_amount_huf', label: 'Invoice amount (HUF)', align: 'right', format: r => fmtNum(r.invoice_amount_huf) },
        { key: 'invoice_number', label: 'Invoice number', format: r => fmt(r.invoice_number) },
        { key: 'payment_date', label: 'Payment date', format: r => fmtDate(r.payment_date) },
        { key: 'kb', label: 'K-B', align: 'right', format: r => fmtNum(r.kb) },
        { key: 'b', label: 'B', align: 'right', format: r => fmtNum(r.b) },
        { key: 't', label: 'T', align: 'right', format: r => fmtNum(r.t) },
        { key: 'transport_cost_product', label: 'Transport Cost / product', align: 'right', format: r => fmtNum(r.transport_cost_product) }
    ];

    let visibleColumnKeys = null;
    try {
        const stored = localStorage.getItem('fuvarok_visible_columns');
        if (stored) {
            visibleColumnKeys = JSON.parse(stored);
        }
    } catch (e) {}
    if (!Array.isArray(visibleColumnKeys) || visibleColumnKeys.length === 0) {
        visibleColumnKeys = ALL_COLUMNS.map(c => c.key);
    }

    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = `
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 0 32px 16px 32px;
    `;

    let tableData = [];

    tableContainer.innerHTML = `
        <div class="access-subform" style="display:flex; flex-direction:column; flex:1; min-height:0; margin-top:8px;">
            <div class="access-subform-header" style="flex-shrink:0; display:flex; align-items:center; justify-content:space-between;">
                <span>Fuvarok listája</span>
                <span id="record-count" style="font-size:12px; font-weight:400; color:var(--text-muted);">(Betöltés folyamatban...)</span>
            </div>
            <div id="table-scroll-area" style="overflow:auto; flex:1 1 auto; min-height:0;">
                <table class="access-subform-table" id="fuvar-table" style="white-space:nowrap; min-width:2800px;">
                    <thead style="position:sticky; top:0; background:var(--bg-light); z-index:2;">
                        <tr id="fuvar-thead-tr"></tr>
                    </thead>
                    <tbody id="fuvar-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    // 1. Kamionszám kattintás menü
    const menuHtml = `
        <div id="modal-fuvar-menu" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:2000; align-items:center; justify-content:center;">
            <div style="background:#fff; padding:28px; border-radius:12px; width:340px; box-shadow:0 8px 32px rgba(0,0,0,0.2);">
                <h3 style="margin-bottom:6px; color:#1e293b;">Kamion: <span id="fuv-menu-tour"></span></h3>
                <p style="color:#64748b; font-size:13px; margin-bottom:20px;">Válasszon műveletet:</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="primary-btn" id="btn-fuv-szerkesztes">✏️ Szerkesztés</button>
                    <button class="primary-btn" id="btn-fuv-doc" style="background:#0ea5e9; border-color:#0284c7;">📄 Dokumentum megnyitás</button>
                    <button class="primary-btn" id="btn-fuv-rename" style="background:#f59e0b; border-color:#d97706;">Kamionszám változtatás</button>
                    <button class="secondary-btn btn-close-modal" data-modal="modal-fuvar-menu">Mégsem</button>
                </div>
            </div>
        </div>
    `;
    const menuContainer = document.createElement('div');
    menuContainer.innerHTML = menuHtml;

    container.appendChild(filterPanel);
    container.appendChild(tableContainer);
    container.appendChild(menuContainer);

    let currentKamionNumber = null;
    let currentKamionId = null;

    function parseKamionNumber(tour) {
        if (!tour) return { tip: '', num: 0 };
        tour = tour.trim();
        if (tour.startsWith('GHU')) {
            const parts = tour.split(/\s+/);
            return { tip: 'GHU', num: parseInt(parts[parts.length - 1]) || 0 };
        }
        if (tour.startsWith('H')) {
            const numPart = tour.substring(1);
            return { tip: 'H', num: parseInt(numPart) || 0 };
        }
        if (tour.startsWith('BEL')) {
            const parts = tour.split(/[-\s]+/);
            return { tip: 'BEL', num: parseInt(parts[parts.length - 1]) || 0 };
        }
        if (tour.startsWith('EX')) {
            const parts = tour.split(/[-\s]+/);
            return { tip: 'EX', num: parseInt(parts[parts.length - 1]) || 0 };
        }
        if (tour.startsWith('LOG')) {
            const parts = tour.split(/[-\s]+/);
            return { tip: 'LOG', num: parseInt(parts[parts.length - 1]) || 0 };
        }
        const match = tour.match(/^([A-Za-z]+)[-\s]*(\d+)/);
        if (match) {
            return { tip: match[1].toUpperCase(), num: parseInt(match[2]) || 0 };
        }
        return { tip: '', num: 0 };
    }

    function formatKamisz(tip, num) {
        if (tip === 'GHU') return 'GHU ' + num;
        if (tip === 'H') return 'H' + String(num).padStart(3, '0');
        return tip + '-' + String(num).padStart(3, '0');
    }

    function getNextAutoNumberForTip(tip, seasonCode) {
        if (!tip) return '';
        const numbers = [];
        tableData.forEach(row => {
            if (row.season_code === seasonCode) {
                const parsed = parseKamionNumber(row.order_number);
                if (parsed.tip === tip) {
                    numbers.push(parsed.num);
                }
            }
        });
        const max = numbers.length > 0 ? Math.max(...numbers) : 0;
        return formatKamisz(tip, max + 1);
    }

    function openRenameModal(tour) {
        const currentParsed = parseKamionNumber(tour);
        const currentTip = currentParsed.tip;
        
        const currentShipment = tableData.find(row => row.order_number === tour);
        const currentSeason = currentShipment ? currentShipment.season_code : '';

        const nextAuto = getNextAutoNumberForTip(currentTip, currentSeason);

        const modalContent = `
            <div style="padding: 20px;">
                <div class="access-control-group">
                    <label class="access-control-label">Jelenlegi kamionszám:</label>
                    <input type="text" id="ren-current" class="access-control-input" readonly style="background:#f1f5f9; color:#64748b;" value="${tour}">
                </div>
                <div class="access-control-group">
                    <label class="access-control-label">KamionszámTip.:</label>
                    <select id="ren-tip" class="access-control-input">
                        <option value="BEL" ${currentTip === 'BEL' ? 'selected' : ''}>BEL</option>
                        <option value="EX" ${currentTip === 'EX' ? 'selected' : ''}>EX</option>
                        <option value="GHU" ${currentTip === 'GHU' ? 'selected' : ''}>GHU</option>
                        <option value="H" ${currentTip === 'H' ? 'selected' : ''}>H</option>
                        <option value="LOG" ${currentTip === 'LOG' ? 'selected' : ''}>LOG</option>
                    </select>
                </div>
                <div class="access-control-group">
                    <label class="access-control-label">Soron következő szabad szám:</label>
                    <input type="text" id="ren-next" class="access-control-input" readonly style="background:#f0fdf4; color:#166534; font-weight:600;" value="${nextAuto}">
                </div>
                <div class="access-control-group">
                    <label class="access-control-label" for="ren-new">Új kamionszám manuálisan:</label>
                    <input type="text" id="ren-new" class="access-control-input" placeholder="Pl. GHU 270">
                    <small style="color:#64748b; display:block; margin-top:4px;">Ha üresen hagyja, a fenti soron következő szabad szám kerül mentésre.</small>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                    <button class="secondary-btn btn-close-ren-modal">Mégsem</button>
                    <button class="primary-btn btn-save-ren">Mentés</button>
                </div>
            </div>
        `;

        const modal = windowManager.createModal({
            title: 'Kamionszám változtatás',
            width: 400,
            height: 420,
            content: modalContent
        });

        const modalEl = modal.element;

        const selectTip = modalEl.querySelector('#ren-tip');
        const inputNext = modalEl.querySelector('#ren-next');

        selectTip.addEventListener('change', () => {
            const selectedTip = selectTip.value;
            const computedNext = getNextAutoNumberForTip(selectedTip, currentSeason);
            inputNext.value = computedNext;
        });

        modalEl.querySelector('.btn-close-ren-modal').addEventListener('click', () => {
            modal.close();
        });

        modalEl.querySelector('.btn-save-ren').addEventListener('click', async () => {
            const newVal = modalEl.querySelector('#ren-new').value.trim();
            const finalVal = newVal !== '' ? newVal : inputNext.value;
            if (!finalVal) {
                alert('Nem sikerült meghatározni az új kamionszámot.');
                return;
            }

            // Helyi egyediség ellenőrzése (szezonon belül)
            const duplicate = tableData.find(row => 
                row.season_code === currentSeason && 
                row.order_number.toLowerCase().replace(/\s+/g, '') === finalVal.toLowerCase().replace(/\s+/g, '') &&
                row.order_number !== tour
            );
            if (duplicate) {
                alert(`Hiba: A(z) ${finalVal} kamionszám már foglalt ebben a szezonban!`);
                return;
            }

            try {
                const res = await fetch('/api/v1/shipments/rename', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        oldOrderNumber: tour,
                        newOrderNumber: finalVal
                    })
                });

                if (res.ok) {
                    alert('Kamionszám sikeresen módosítva: ' + finalVal);
                    modal.close();
                    loadRealData();
                } else {
                    const data = await res.json();
                    alert('Hiba: ' + (data.error || 'Nem sikerült menteni a kamionszámot.'));
                }
            } catch (err) {
                console.error(err);
                alert('Hálózati hiba történt.');
            }
        });
    }

    container.querySelector('.btn-close-modal').addEventListener('click', () => {
        container.querySelector('#modal-fuvar-menu').style.display = 'none';
    });

    container.querySelector('#btn-fuv-szerkesztes').addEventListener('click', () => {
        container.querySelector('#modal-fuvar-menu').style.display = 'none';
        if (currentKamionId) {
            openKamionSzerkesztesWindow(windowManager, currentKamionId);
        }
    });

    container.querySelector('#btn-fuv-doc').addEventListener('click', () => {
        container.querySelector('#modal-fuvar-menu').style.display = 'none';
        if (currentKamionNumber) {
            alert('Dokumentum megnyitás (backend):\n\\\\192.168.1.5\\raktar\\Fuvarok\\' + currentKamionNumber + '.xlsm');
        }
    });

    container.querySelector('#btn-fuv-rename').addEventListener('click', () => {
        container.querySelector('#modal-fuvar-menu').style.display = 'none';
        if (currentKamionNumber) {
            openRenameModal(currentKamionNumber);
        }
    });

    const tbody = tableContainer.querySelector('#fuvar-tbody');
    const recordCount = tableContainer.querySelector('#record-count');
    
    // Filter elements
    const filterCarN = filterPanel.querySelector('#filter-car-n');
    const filterLoadingPlace = filterPanel.querySelector('#filter-loading-place');
    const filterProducts = filterPanel.querySelector('#filter-products');
    const filterSeason = filterPanel.querySelector('#filter-season');
    const filterYear = filterPanel.querySelector('#filter-year');
    const filterTransportCompany = filterPanel.querySelector('#filter-transport-company');
    const btnClear = filterPanel.querySelector('#btn-clear-filters');

    function updateTableStructure() {
        const activeCols = ALL_COLUMNS.filter(col => visibleColumnKeys.includes(col.key));
        const tableEl = tableContainer.querySelector('#fuvar-table');
        tableEl.style.minWidth = `${Math.max(800, activeCols.length * 115)}px`;
        const theadTr = tableEl.querySelector('#fuvar-thead-tr');
        theadTr.innerHTML = activeCols.map(c => `<th>${c.label}</th>`).join('');
    }

    function renderTable(data) {
        const MAX_RENDER = 200;
        const renderData = data.slice(0, MAX_RENDER);
        const activeCols = ALL_COLUMNS.filter(col => visibleColumnKeys.includes(col.key));
        
        tbody.innerHTML = renderData.map(r => `
            <tr>
                ${activeCols.map(c => {
                    const styleParts = [];
                    if (c.align) styleParts.push(`text-align:${c.align};`);
                    if (c.bg) styleParts.push(`background:${c.bg};`);
                    const styleAttr = styleParts.length > 0 ? ` style="${styleParts.join(' ')}"` : '';
                    return `<td${styleAttr}>${c.format(r)}</td>`;
                }).join('')}
            </tr>
        `).join('');
        
        let countText = `(${data.length} rekord)`;
        if (data.length > MAX_RENDER) {
            countText = `(Megjelenítve: ${MAX_RENDER} / Összesen: ${data.length} rekord)`;
        }
        recordCount.textContent = countText;

        tbody.querySelectorAll('.fuv-open-link').forEach(el => {
            el.addEventListener('click', e => {
                currentKamionId = e.currentTarget.getAttribute('data-id');
                currentKamionNumber = e.currentTarget.getAttribute('data-tour');
                container.querySelector('#fuv-menu-tour').textContent = currentKamionNumber;
                container.querySelector('#modal-fuvar-menu').style.display = 'flex';
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
                <div style="margin-bottom:12px; flex-shrink:0;">
                    <input type="text" id="col-search-input" class="access-control-input" placeholder="🔍 Oszlop keresése a listában..." style="width:100%; padding:6px 12px; font-size:12px; box-sizing:border-box;">
                </div>
                <div id="col-checkboxes-container" style="flex:1; overflow-y:auto; border:1px solid #cbd5e1; border-radius:8px; padding:12px 14px; background:#f8fafc; display:grid; grid-template-columns:repeat(2, 1fr); gap:6px 14px; align-content:start;">
                    ${ALL_COLUMNS.map(col => `
                        <label class="col-checkbox-label" style="display:flex; align-items:center; gap:8px; font-size:12px; color:#1e293b; cursor:pointer; padding:5px 8px; border-radius:6px; background:#fff; border:1px solid #e2e8f0; transition:all 0.15s;" data-col-name="${col.label.toLowerCase()}">
                            <input type="checkbox" class="col-toggle-chk" value="${col.key}" ${visibleColumnKeys.includes(col.key) ? 'checked' : ''} style="cursor:pointer; width:15px; height:15px;">
                            <span style="font-weight:500;">${col.label}</span>
                        </label>
                    `).join('')}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-shrink:0;">
                    <span id="col-count-selected" style="font-size:12px; color:#64748b; font-weight:600;">
                        ${visibleColumnKeys.length} / ${ALL_COLUMNS.length} oszlop kiválasztva
                    </span>
                    <div style="display:flex; gap:10px;">
                        <button type="button" class="secondary-btn btn-close-col-modal" style="padding:6px 14px;">Mégsem</button>
                        <button type="button" class="primary-btn btn-save-col-modal" style="padding:6px 18px; font-weight:600;">Alkalmazás</button>
                    </div>
                </div>
            </div>
        `;

        const modal = windowManager.createModal({
            title: '⚙️ Oszlopok testreszabása – Fuvarok összesítő',
            width: 640,
            height: 540,
            content: modalContent
        });

        const modalEl = modal.element;
        const chks = modalEl.querySelectorAll('.col-toggle-chk');
        const countEl = modalEl.querySelector('#col-count-selected');
        const searchInput = modalEl.querySelector('#col-search-input');

        function updateCount() {
            const checkedCount = modalEl.querySelectorAll('.col-toggle-chk:checked').length;
            countEl.textContent = `${checkedCount} / ${ALL_COLUMNS.length} oszlop kiválasztva`;
        }

        chks.forEach(chk => {
            chk.addEventListener('change', updateCount);
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            modalEl.querySelectorAll('.col-checkbox-label').forEach(lbl => {
                const name = lbl.dataset.colName;
                lbl.style.display = (!query || name.includes(query)) ? 'flex' : 'none';
            });
        });

        modalEl.querySelector('#btn-col-select-all').addEventListener('click', () => {
            chks.forEach(chk => chk.checked = true);
            updateCount();
        });

        modalEl.querySelector('#btn-col-deselect-all').addEventListener('click', () => {
            chks.forEach(chk => chk.checked = false);
            updateCount();
        });

        modalEl.querySelector('#btn-col-reset').addEventListener('click', () => {
            chks.forEach(chk => chk.checked = true);
            updateCount();
        });

        modalEl.querySelector('.btn-close-col-modal').addEventListener('click', () => {
            modal.close();
        });

        modalEl.querySelector('.btn-save-col-modal').addEventListener('click', () => {
            const selected = Array.from(modalEl.querySelectorAll('.col-toggle-chk:checked')).map(chk => chk.value);
            if (selected.length === 0) {
                alert('Legalább egy oszlopot ki kell választani!');
                return;
            }
            visibleColumnKeys = selected;
            try {
                localStorage.setItem('fuvarok_visible_columns', JSON.stringify(visibleColumnKeys));
            } catch (e) {}
            modal.close();
            updateTableStructure();
            filterData();
        });
    }

    const btnColSettings = filterPanel.querySelector('#btn-col-settings');
    if (btnColSettings) {
        btnColSettings.addEventListener('click', openColumnSettingsModal);
    }

    function filterData() {
        // A keresési értékekből eltávolítjuk a szóközöket, hogy pl. "GHU099" megtalálja a "GHU 099" rekordot
        const valCarN = filterCarN.value.toLowerCase().replace(/\s+/g, '');
        const valLoadingPlace = filterLoadingPlace.value.toLowerCase();
        const valProducts = filterProducts.value.toLowerCase();
        const valSeason = filterSeason.value;
        const valYear = filterYear.value;
        const valTransportCompany = filterTransportCompany.value;
        
        const filtered = tableData.filter(row => {
            // order_number-ből is eltávolítjuk a szóközöket az összehasonlításhoz
            const orderNormalized = (row.order_number || '').toLowerCase().replace(/\s+/g, '');
            const matchCarN = !valCarN || orderNormalized.includes(valCarN);
            const matchLoadingPlace = !valLoadingPlace || (row.loading_place || '').toLowerCase().includes(valLoadingPlace);
            const matchProd = !valProducts || (row.prod || '').toLowerCase().includes(valProducts);
            const matchSeason = !valSeason || (row.season_code || '') === valSeason;
            const matchYear = !valYear || (row.loading_date || '').startsWith(valYear);
            const matchTransport = !valTransportCompany || (row.transport_company || '') === valTransportCompany;
            return matchCarN && matchLoadingPlace && matchProd && matchSeason && matchYear && matchTransport;
        });
        renderTable(filtered);
    }

    filterCarN.addEventListener('input', filterData);
    filterLoadingPlace.addEventListener('input', filterData);
    filterProducts.addEventListener('input', filterData);
    filterSeason.addEventListener('change', filterData);
    filterYear.addEventListener('change', filterData);
    filterTransportCompany.addEventListener('change', filterData);

    btnClear.addEventListener('click', () => {
        filterCarN.value = '';
        filterLoadingPlace.value = '';
        filterProducts.value = '';
        filterSeason.value = '';
        filterYear.value = '';
        filterTransportCompany.value = '';
        filterData();
    });

    // Élő adat lekérése a Backend API-ról
    async function loadRealData() {
        try {
            const response = await fetch('/api/v1/shipment-lines');
            if (response.ok) {
                tableData = await response.json();
                filterData();
            } else {
                recordCount.textContent = '(Hiba az adatok lekérésekor)';
            }
        } catch (err) {
            console.error('API hiba:', err);
            recordCount.textContent = '(Nem elérhető az API)';
        }
    }

    async function loadTransporters() {
        try {
            const response = await fetch('/api/v1/transporters');
            if (response.ok) {
                const transporters = await response.json();
                filterTransportCompany.innerHTML = '<option value="">-- Összes --</option>' +
                    transporters.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
            }
        } catch (err) {
            console.error('Hiba a fuvarozók betöltésekor:', err);
        }
    }

    // Táblázat struktúra inicializálása és üres táblázat megjelenítése, amíg tölt
    updateTableStructure();
    renderTable([]);
    // Adatlekérés elindítása
    loadTransporters();
    loadRealData();
}