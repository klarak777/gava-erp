export function renderTransportistas(container) {
    // --- A szülő launcher-wrapper-t felülírjuk, hogy NE legyen overflow:hidden ---
    container.style.overflow = 'hidden';
    container.style.padding = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    // Egyedi fuvarozók a legördülőhöz
    const transporterOptions = ['BILEK', 'BOGNÁR', 'HANKA', 'KÁDÁR', 'KERMOR', 'KÓNYA', 'KUSEK', 'MK FRESH', 'RONI', 'STI'];

    // ============================================================
    // 1. KONTÉNER: Fejléc + Szűrők (FIX, nem gördül, flex-shrink:0)
    // ============================================================
    const filterPanel = document.createElement('div');
    filterPanel.style.cssText = 'flex-shrink:0; padding:16px 32px 8px 32px; background:var(--bg-light);';
    filterPanel.innerHTML = `
        <div style="margin-bottom:6px;">
            <h2 class="view-title" style="margin:0 0 2px 0;">Transportistas</h2>
            <p class="view-subtitle" style="margin:0;">frmTransportistas – Szállítmányozók és kamionok nyilvántartása</p>
        </div>

        <div class="access-form-view" style="padding:10px 18px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <strong style="font-size:13px;">Keresés és Szűrés</strong>
                <button class="secondary-btn btn-dense" id="btn-clear-filters" style="font-size:12px; padding:5px 12px;">Szűrők törlése</button>
            </div>

            <!-- Sor 1: Jelölőkapcsolók -->
            <div style="display:flex; gap:28px; margin-bottom:12px; align-items:center;">
                <label style="display:flex; align-items:center; gap:7px; cursor:pointer; font-size:13px; user-select:none;">
                    <input type="checkbox" id="chk-bev-var" style="width:15px;height:15px;accent-color:var(--primary);">
                    <span>Bevételezésre vár</span>
                </label>
                <label style="display:flex; align-items:center; gap:7px; cursor:pointer; font-size:13px; user-select:none;">
                    <input type="checkbox" id="chk-hianyzo-szla" style="width:15px;height:15px;accent-color:var(--primary);">
                    <span>Hiányzó fuvarszámla</span>
                </label>
            </div>

            <!-- Sor 2: Szövegdobozok + Legördülők -->
            <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:10px; align-items:end;">
                <div>
                    <label class="access-control-label" for="filter-kamion" style="display:block;font-size:11px;margin-bottom:4px;">Kamion szám</label>
                    <input type="text" id="filter-kamion" class="access-control-input" placeholder="Rendszám..." style="width:100%;box-sizing:border-box;">
                </div>
                <div>
                    <label class="access-control-label" for="filter-hely" style="display:block;font-size:11px;margin-bottom:4px;">Rakodási hely</label>
                    <input type="text" id="filter-hely" class="access-control-input" placeholder="Telephely..." style="width:100%;box-sizing:border-box;">
                </div>
                <div>
                    <label class="access-control-label" for="filter-szezon" style="display:block;font-size:11px;margin-bottom:4px;">Szezon</label>
                    <select id="filter-szezon" class="access-control-input" style="width:100%;box-sizing:border-box;">
                        <option value="">-- Összes --</option>
                        <option value="23-24">Season 23-24</option>
                        <option value="24-25" selected>Season 24-25</option>
                        <option value="25-26">Season 25-26</option>
                    </select>
                </div>
                <div>
                    <label class="access-control-label" for="filter-fuvarozo" style="display:block;font-size:11px;margin-bottom:4px;">Fuvarozó</label>
                    <select id="filter-fuvarozo" class="access-control-input" style="width:100%;box-sizing:border-box;">
                        <option value="">-- Összes --</option>
                        ${transporterOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="access-control-label" for="filter-ev" style="display:block;font-size:11px;margin-bottom:4px;">Rakodási év</label>
                    <select id="filter-ev" class="access-control-input" style="width:100%;box-sizing:border-box;">
                        <option value="">-- Összes --</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025" selected>2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    container.appendChild(filterPanel);

    // ============================================================
    // 2. KONTÉNER: Táblázat (flex:1, SAJÁT vízszintes+függőleges gördítés)
    // ============================================================
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = `
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 0 32px 16px 32px;
    `;
    tableContainer.innerHTML = `
        <div class="access-subform" style="display:flex; flex-direction:column; flex:1; min-height:0;">
            <div class="access-subform-header" style="flex-shrink:0; display:flex; align-items:center; justify-content:space-between;">
                <span>frmTransportistas_Sub – Szállítmányok listája</span>
                <span id="record-count" style="font-size:12px; font-weight:400; color:var(--text-muted);"></span>
            </div>
            <div id="table-scroll-area" style="overflow:auto; flex:1 1 auto; min-height:0;">
                <table class="access-subform-table" id="transport-table" style="min-width:1700px;">
                    <thead style="position:sticky; top:0; background:var(--bg-light); z-index:2;">
                        <tr>
                            <th style="min-width:105px;">Loading date</th>
                            <th style="min-width:120px;">Loading place</th>
                            <th style="min-width:95px;">Order number</th>
                            <th style="min-width:90px;">Transporter</th>
                            <th style="min-width:160px;">Plate number</th>
                            <th style="min-width:120px; text-align:right;">Transport price</th>
                            <th style="min-width:105px;">Arrival date</th>
                            <th style="min-width:85px; text-align:center;">Bevételezve</th>
                            <th style="min-width:55px; text-align:right;">K-B</th>
                            <th style="min-width:55px; text-align:right;">B</th>
                            <th style="min-width:55px; text-align:right;">T</th>
                            <th style="min-width:190px;">Comment</th>
                            <th style="min-width:105px; text-align:right;">Amount HUF</th>
                            <th style="min-width:135px;">Invoice number</th>
                            <th style="min-width:105px; text-align:right;">Amount EUR</th>
                        </tr>
                    </thead>
                    <tbody id="transport-tbody"></tbody>
                </table>
            </div>
        </div>
    `;
    container.appendChild(tableContainer);

    // --- Élő Adatok helye ---
    let tableData = [];

    // --- Vezérlők lekérése ---
    const tbody        = tableContainer.querySelector('#transport-tbody');
    const recordCount  = tableContainer.querySelector('#record-count');
    const chkBevVar    = filterPanel.querySelector('#chk-bev-var');
    const chkHiany     = filterPanel.querySelector('#chk-hianyzo-szla');
    const inpKamion    = filterPanel.querySelector('#filter-kamion');
    const inpHely      = filterPanel.querySelector('#filter-hely');
    const selSzezon    = filterPanel.querySelector('#filter-szezon');
    const selFuvarozo  = filterPanel.querySelector('#filter-fuvarozo');
    const selEv        = filterPanel.querySelector('#filter-ev');
    const btnClear     = filterPanel.querySelector('#btn-clear-filters');

    function getYear(dateStr) {
        const m = (dateStr || '').match(/^\d{4}/);
        return m ? m[0] : '';
    }

    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space:nowrap;">${row.loadingDate}</td>
                <td style="white-space:nowrap;">${row.loadingPlace}</td>
                <td><span class="badge" style="background:var(--bg-main);color:var(--text-main);border:1px solid var(--border);font-size:11px;">${row.orderNumber}</span></td>
                <td style="white-space:nowrap;font-weight:600;">${row.transporter}</td>
                <td style="white-space:nowrap;font-family:monospace;font-size:12px;">${row.plateNumber}</td>
                <td style="text-align:right;white-space:nowrap;">${row.transportPrice}</td>
                <td style="white-space:nowrap;">${row.arrivalDate}</td>
                <td style="text-align:center;">
                    <input type="checkbox" class="bev-chk" data-id="${row.id}" ${row.bevetelezve ? 'checked' : ''}
                        style="width:15px;height:15px;cursor:pointer;accent-color:var(--primary);">
                </td>
                <td style="text-align:right;white-space:nowrap;">${row.kb}</td>
                <td style="text-align:right;white-space:nowrap;">${row.b}</td>
                <td style="text-align:right;white-space:nowrap;">${row.t}</td>
                <td style="font-size:12px;color:var(--text-muted);max-width:190px;overflow:hidden;text-overflow:ellipsis;">${row.comment}</td>
                <td style="text-align:right;white-space:nowrap;">${row.amountHuf}</td>
                <td style="white-space:nowrap;">${row.invoiceNumber}</td>
                <td style="text-align:right;white-space:nowrap;font-weight:600;">${row.amountEur}</td>
            `;
            tbody.appendChild(tr);
        });

        // Bevételezve checkbox – interaktív (egy jövőbeli backend végponttal)
        tbody.querySelectorAll('.bev-chk').forEach(chk => {
            chk.addEventListener('change', e => {
                const id = parseInt(e.target.dataset.id);
                // Később itt API hívással mentjük az állapotot
            });
        });

        recordCount.textContent = `(${data.length} rekord)`;
    }

    function filterData() {
        const valKamion   = inpKamion.value.toLowerCase();
        const valHely     = inpHely.value.toLowerCase();
        const valFuvarozo = selFuvarozo.value;
        const valEv       = selEv.value;
        const bevVar      = chkBevVar.checked;
        const hiany       = chkHiany.checked;

        const filtered = tableData.filter(row => {
            const mKamion    = (row.plateNumber || '').toLowerCase().includes(valKamion);
            const mHely      = (row.loadingPlace || '').toLowerCase().includes(valHely);
            const mFuvarozo  = !valFuvarozo || row.transporter === valFuvarozo;
            const mEv        = !valEv || getYear(row.loadingDate) === valEv;
            const mBevVar    = !bevVar || !row.bevetelezve;
            const mHiany     = !hiany || row.invoiceNumber === '';
            return mKamion && mHely && mFuvarozo && mEv && mBevVar && mHiany;
        });

        renderTable(filtered);
    }

    // Eseményfigyelők
    inpKamion.addEventListener('input', filterData);
    inpHely.addEventListener('input', filterData);
    selFuvarozo.addEventListener('change', filterData);
    selSzezon.addEventListener('change', filterData);
    selEv.addEventListener('change', filterData);
    chkBevVar.addEventListener('change', filterData);
    chkHiany.addEventListener('change', filterData);

    btnClear.addEventListener('click', () => {
        inpKamion.value   = '';
        inpHely.value     = '';
        selFuvarozo.value = '';
        selSzezon.value   = '24-25';
        selEv.value       = '2025';
        chkBevVar.checked = false;
        chkHiany.checked  = false;
        filterData();
    });

    // Kezdeti megjelenítés (üres tábla)
    renderTable([]);

    // API Lekérés
    async function loadRealData() {
        try {
            const response = await fetch('/api/v1/shipments');
            if (response.ok) {
                const apiData = await response.json();
                // Map the api properties to what the render function expects
                tableData = apiData.map(d => ({
                    id: d.id,
                    loadingDate: d.loading_date ? d.loading_date.substring(0, 10) : '',
                    loadingPlace: d.loading_place || '',
                    orderNumber: d.order_number || '',
                    transporter: d.transporter_name || '',
                    plateNumber: d.plate_number || '',
                    transportPrice: d.transport_price ? d.transport_price + ' €' : '',
                    arrivalDate: d.arrival_date ? d.arrival_date.substring(0, 10) : '',
                    bevetelezve: false, // Jövőbeli fejlesztés
                    kb: '', b: '', t: '', // Ezek is jövőbeli DB oszlopok/nézetek lesznek
                    comment: d.comment || '',
                    amountHuf: '', invoiceNumber: '', amountEur: ''
                }));
                filterData();
            } else {
                recordCount.textContent = '(Hiba az adatok lekérésekor)';
            }
        } catch (err) {
            console.error('API hiba:', err);
            recordCount.textContent = '(Nem elérhető az API)';
        }
    }

    loadRealData();
}
