export function renderTransportistas(container) {
    // --- A szülő launcher-wrapper-t felülírjuk, hogy NE legyen overflow:hidden ---
    container.style.overflow = 'hidden';
    container.style.padding = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';



    // ============================================================
    // 1. KONTÉNER: Fejléc + Szűrők (FIX, nem gördül, flex-shrink:0)
    // ============================================================
    const filterPanel = document.createElement('div');
    filterPanel.style.cssText = 'flex-shrink:0; padding:16px 32px 0px 32px; background:var(--bg-light);';
    filterPanel.innerHTML = `
        <div style="margin-bottom:6px;">
            <h2 class="view-title" style="margin:0 0 2px 0;">Transportistas</h2>
            <p class="view-subtitle" style="margin:0;">Szállítmányozók és kamionok nyilvántartása</p>
        </div>

        <div class="access-form-view" style="padding:10px 18px; margin-bottom:10px;">
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
            <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:10px; align-items:end;">
                <div>
                    <label class="access-control-label" for="filter-order-num" style="display:block;font-size:11px;margin-bottom:4px;">Order Number (Kamion szám)</label>
                    <input type="text" id="filter-order-num" class="access-control-input" placeholder="LOG356, GHU 382..." style="width:100%;box-sizing:border-box;">
                </div>
                <div>
                    <label class="access-control-label" for="filter-kamion" style="display:block;font-size:11px;margin-bottom:4px;">Rendszám</label>
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
                        <option value="18-19">Season 18-19</option>
                        <option value="19-20">Season 19-20</option>
                        <option value="20-21">Season 20-21</option>
                        <option value="21-22">Season 21-22</option>
                        <option value="22-23">Season 22-23</option>
                        <option value="23-24">Season 23-24</option>
                        <option value="24-25">Season 24-25</option>
                        <option value="25-26" selected>Season 25-26</option>
                    </select>
                    </div>
                    <div style="flex:1; min-width:160px; max-width:240px;">
                        <label class="access-control-label" for="filter-fuvarozo" style="display:block;font-size:11px;margin-bottom:4px;">Fuvarozó cég</label>
                        <select id="filter-fuvarozo" class="access-control-input" style="width:100%;box-sizing:border-box;">
                            <option value="">Mind</option>
                    </select>
                </div>
                <div>
                    <label class="access-control-label" for="filter-ev" style="display:block;font-size:11px;margin-bottom:4px;">Rakodási év</label>
                    <select id="filter-ev" class="access-control-input" style="width:100%;box-sizing:border-box;">
                        <option value="">-- Összes --</option>
                        <option value="2018">2018</option>
                        <option value="2019">2019</option>
                        <option value="2020">2020</option>
                        <option value="2021">2021</option>
                        <option value="2022">2022</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026" selected>2026</option>
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
        <div class="access-subform" style="display:flex; flex-direction:column; flex:1; min-height:0; margin-top:0;">
            <div class="access-subform-header" style="flex-shrink:0; display:flex; align-items:center; justify-content:space-between;">
                <span>Szállítmányok listája</span>
                <span id="record-count" style="font-size:12px; font-weight:400; color:var(--text-muted);"></span>
            </div>
            <div id="table-scroll-area" style="overflow:auto; flex:1 1 auto; min-height:0;">
                <table class="access-subform-table" id="transport-table" style="min-width:1700px;">
                    <thead style="position:sticky; top:0; background:var(--bg-light); z-index:2;">
                        <tr>
                            <th style="min-width:110px;">Loading date</th>
                            <th style="min-width:120px;">Loading place</th>
                            <th style="min-width:110px;">Order number</th>
                            <th style="min-width:110px;">Transporter</th>
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
                            <th style="min-width:50px; text-align:center;">Művelet</th>
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
    const tbody = tableContainer.querySelector('#transport-tbody');
    const recordCount = tableContainer.querySelector('#record-count');
    const chkBevVar = filterPanel.querySelector('#chk-bev-var');
    const chkHiany = filterPanel.querySelector('#chk-hianyzo-szla');
    const inpOrderNum = filterPanel.querySelector('#filter-order-num');
    const inpKamion = filterPanel.querySelector('#filter-kamion');
    const inpHely = filterPanel.querySelector('#filter-hely');
    const selSzezon = filterPanel.querySelector('#filter-szezon');
    const selFuvarozo = filterPanel.querySelector('#filter-fuvarozo');
    const selEv = filterPanel.querySelector('#filter-ev');
    const btnClear = filterPanel.querySelector('#btn-clear-filters');

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
                <td style="text-align:center;">
                    <button class="delete-fuvar-btn" data-id="${row.id}" title="Törlés" style="background:transparent;border:none;cursor:pointer;font-size:14px;">🗑️</button>
                </td>
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

        // Törlés gombok eseménykezelője
        tbody.querySelectorAll('.delete-fuvar-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Biztosan törölni szeretnéd a fuvart és minden hozzá tartozó tételt?')) {
                    try {
                        const res = await fetch('/api/v1/shipments/' + id, { method: 'DELETE' });
                        if (res.ok) {
                            alert('Fuvar sikeresen törölve.');
                            loadRealData();
                        } else {
                            const err = await res.json();
                            alert('Hiba a törlés során: ' + (err.error || 'Ismeretlen hiba'));
                        }
                    } catch (error) {
                        alert('Hálózati hiba a törlés során.');
                        console.error(error);
                    }
                }
            });
        });

        recordCount.textContent = `(${data.length} rekord)`;
    }

    function filterData() {
        const valOrderNum = (inpOrderNum.value || '').toLowerCase().replace(/\s+/g, '');
        const valKamion = inpKamion.value.toLowerCase();
        const valHely = inpHely.value.toLowerCase();
        const valFuvarozo = selFuvarozo.value;
        const valEv = selEv.value;
        const valSzezon = selSzezon.value;
        const bevVar = chkBevVar.checked;
        const hiany = chkHiany.checked;

        const filtered = tableData.filter(row => {
            // Order number szűrő: szóköz nélkül hasonlít
            const orderNorm = (row.orderNumber || '').toLowerCase().replace(/\s+/g, '');
            const mOrderNum = !valOrderNum || orderNorm.includes(valOrderNum);
            const mKamion = !valKamion || (row.plateNumber || '').toLowerCase().includes(valKamion);
            const mHely = !valHely || (row.loadingPlace || '').toLowerCase().includes(valHely);
            const mFuvarozo = !valFuvarozo || row.transporter === valFuvarozo;
            const mEv = !valEv || getYear(row.loadingDate) === valEv;
            const mSzezon = !valSzezon || row.seasonCode === valSzezon;
            const mBevVar = !bevVar || !row.bevetelezve;
            const mHiany = !hiany || row.invoiceNumber === '';
            return mOrderNum && mKamion && mHely && mFuvarozo && mEv && mSzezon && mBevVar && mHiany;
        });

        renderTable(filtered);
    }

    // Eseményfigyelők
    inpOrderNum.addEventListener('input', filterData);
    inpKamion.addEventListener('input', filterData);
    inpHely.addEventListener('input', filterData);
    selFuvarozo.addEventListener('change', filterData);
    selSzezon.addEventListener('change', filterData);
    selEv.addEventListener('change', filterData);
    chkBevVar.addEventListener('change', filterData);
    chkHiany.addEventListener('change', filterData);

    btnClear.addEventListener('click', () => {
        inpOrderNum.value = '';
        inpKamion.value = '';
        inpHely.value = '';
        selFuvarozo.value = '';
        selSzezon.value = '';
        selEv.value = '';
        chkBevVar.checked = false;
        chkHiany.checked = false;
        filterData();
    });

    // Kezdeti megjelenítés (üres tábla)
    renderTable([]);

    // API Lekérés
    async function loadRealData() {
        try {
            const response = await fetch('/api/v1/shipments?limit=10000&is_loaded=true&exclude_aggregates=true');
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
                    seasonCode: d.season_code || '',
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

    async function loadTransporters() {
        try {
            const res = await fetch('/api/v1/transporters');
            if (res.ok) {
                const transporters = await res.json();
                selFuvarozo.innerHTML = '<option value="">-- Összes --</option>' +
                    transporters.map(function (t) {
                        return '<option value="' + t.name + '">' + t.name + '</option>';
                    }).join('');
            }
        } catch (err) {
            console.error('Hiba a fuvarozók betöltésekor:', err);
        }
    }

    loadTransporters();
    loadRealData();
}
