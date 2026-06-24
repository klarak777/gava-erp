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
                <button class="secondary-btn btn-dense" id="btn-clear-filters" style="font-size:12px; padding:5px 12px;">Szűrők törlése</button>
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

    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = `
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 0 32px 16px 32px;
    `;

    let tableData = [];

    const otherCols = [
        'Gross weight (kg)', 'Price (EUR)', 'Price BCN (EUR)', 'Unit', 'Reloading/plt', 'Transport BCN/plt',
        'Albarán N°', 'Car n.', 'Loading date', 'Loading place', 'Order number', 'Fuvarozó cég',
        'Plate number', 'Transport price', 'Arrival date', 'Transport cost', 'Invoice amount (EUR)',
        'Invoice amount (HUF)', 'Invoice number', 'Payment date', 'K-B', 'B', 'T', 'Transport Cost / product'
    ];

    let theadHtml = `
        <thead style="position:sticky; top:0; background:var(--bg-light); z-index:2;">
            <tr>
                <th>Total Palets</th>
                <th>N° Euro Palets</th>
                <th>N° Normal Palets</th>
                <th>Products</th>
                <th>Reference</th>
                <th>Customer</th>
                <th>Destination</th>
                <th>Comment</th>
                ${otherCols.map(c => `<th>${c}</th>`).join('')}
            </tr>
        </thead>
    `;

    tableContainer.innerHTML = `
        <div class="access-subform" style="display:flex; flex-direction:column; flex:1; min-height:0; margin-top:8px;">
            <div class="access-subform-header" style="flex-shrink:0; display:flex; align-items:center; justify-content:space-between;">
                <span>Fuvarok listája</span>
                <span id="record-count" style="font-size:12px; font-weight:400; color:var(--text-muted);">(Betöltés folyamatban...)</span>
            </div>
            <div id="table-scroll-area" style="overflow:auto; flex:1 1 auto; min-height:0;">
                <table class="access-subform-table" id="fuvar-table" style="white-space:nowrap; min-width:2800px;">
                    ${theadHtml}
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

    function fmt(val) { return (val === null || val === undefined || val === '') ? '' : val; }
    function fmtNum(val) { return (val === null || val === undefined || val === '' || val === '0.00' || val === 0) ? '' : val; }
    function fmtDate(val) { return val ? val.substring(0, 10) : ''; }

    function renderTable(data) {
        const MAX_RENDER = 200;
        const renderData = data.slice(0, MAX_RENDER);
        
        tbody.innerHTML = renderData.map(r => `
            <tr>
                <td style="text-align:center;">${fmtNum(r.tot)}</td>
                <td style="text-align:center; background:#bfdbfe;">${fmtNum(r.euro)}</td>
                <td style="text-align:center;">${fmtNum(r.norm)}</td>
                <td style="background:#bfdbfe;">${fmt(r.prod)}</td>
                <td style="background:#bfdbfe;">${fmt(r.ref)}</td>
                <td>${fmt(r.cust)}</td>
                <td style="background:#bfdbfe;">${fmt(r.dest)}</td>
                <td style="background:#bfdbfe;">${fmt(r.comment)}</td>
                <td style="text-align:right;">${fmtNum(r.gross_weight_kg)}</td>
                <td style="text-align:right;">${fmtNum(r.price_eur)}</td>
                <td style="text-align:right;">${fmtNum(r.price_bcn_eur)}</td>
                <td>${fmt(r.unit)}</td>
                <td style="text-align:right;">${fmtNum(r.reloading_per_plt)}</td>
                <td style="text-align:right;">${fmtNum(r.transport_bcn_per_plt)}</td>
                <td>${fmt(r.albaran_number)}</td>
                <td><span class="fuv-open-link" data-id="${r.shipment_id}" data-tour="${fmt(r.order_number)}" style="cursor:pointer; color:#2563eb; text-decoration:underline; font-weight:600;">${fmt(r.order_number)}</span></td>
                <td>${fmtDate(r.loading_date)}</td>
                <td>${fmt(r.loading_place)}</td>
                <td>${fmt(r.order_number)}</td>
                <td>${fmt(r.transport_company)}</td>
                <td>${fmt(r.plate_number)}</td>
                <td style="text-align:right;">${fmtNum(r.transport_price)}</td>
                <td>${fmtDate(r.arrival_date)}</td>
                <td style="text-align:right;">${fmtNum(r.transport_cost)}</td>
                <td style="text-align:right;">${fmtNum(r.invoice_amount_eur)}</td>
                <td style="text-align:right;">${fmtNum(r.invoice_amount_huf)}</td>
                <td>${fmt(r.invoice_number)}</td>
                <td>${fmtDate(r.payment_date)}</td>
                <td style="text-align:right;">${fmtNum(r.kb)}</td>
                <td style="text-align:right;">${fmtNum(r.b)}</td>
                <td style="text-align:right;">${fmtNum(r.t)}</td>
                <td style="text-align:right;">${fmtNum(r.transport_cost_product)}</td>
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

    // Üres táblázat megjelenítése, amíg tölt
    renderTable([]);
    // Adatlekérés elindítása
    loadTransporters();
    loadRealData();
}