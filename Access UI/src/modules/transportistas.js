import { openKamionSzerkesztesWindow } from './kamion_szerkesztes.js';

export function renderTransportistas(container, windowManager) {
    // --- A szülő launcher-wrapper-t felülírjuk, hogy NE legyen overflow:hidden ---
    container.style.overflow = 'hidden';
    container.style.padding = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';



    // ============================================================
    // INVOICE MODAL INJECTION
    // ============================================================
    const invoiceModalHtml = `
    <div id="invoice-modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:24px; border-radius:8px; width:450px; box-shadow:0 10px 25px rgba(0,0,0,0.2); font-family:Inter, sans-serif;">
            <h3 style="margin-top:0; color:#1e293b;">Számla (Invoice) feltöltése</h3>
            
            <div style="margin-bottom:12px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px; color:#475569;">Invoice Number</label>
                <input type="text" id="invoice-modal-number" class="access-control-input" style="width:100%; height:32px; font-size:14px; padding:4px 8px; box-sizing:border-box;">
            </div>

            <div id="invoice-modal-dropzone" style="border:2px dashed #cbd5e1; border-radius:6px; padding:20px; text-align:center; background:#f8fafc; cursor:pointer; margin-bottom:12px; transition:all 0.2s;">
                <div style="font-size:24px; margin-bottom:8px;">📄</div>
                <div style="font-size:13px; color:#64748b;">Húzd ide a fájlokat, vagy kattints a tallózáshoz.</div>
                <div id="invoice-modal-filename" style="margin-top:8px; font-size:12px; font-weight:600; color:#0f172a; word-break:break-all;"></div>
            </div>
            <input type="file" id="invoice-modal-fileinput" multiple style="display:none;">
            
            <div id="invoice-modal-status" style="font-size:12px; font-weight:600; margin-bottom:12px; min-height:16px;"></div>

            <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button id="invoice-modal-cancel" class="secondary-btn" style="padding:6px 16px;">Mégsem</button>
                <button id="invoice-modal-save" class="primary-btn" style="padding:6px 16px; background:#2563eb;">Feltöltés</button>
            </div>
        </div>
    </div>
    
    <div id="invoice-view-modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:24px; border-radius:8px; width:450px; box-shadow:0 10px 25px rgba(0,0,0,0.2); font-family:Inter, sans-serif;">
            <h3 style="margin-top:0; color:#1e293b;">Feltöltött számlák</h3>
            <div id="invoice-view-list" style="max-height:300px; overflow-y:auto; margin-bottom:16px; display:flex; flex-direction:column; gap:8px;"></div>
            <div style="display:flex; justify-content:flex-end;">
                <button id="invoice-view-close" class="secondary-btn" style="padding:6px 16px;">Bezárás</button>
            </div>
        </div>
    </div>`;
    
    if (!document.getElementById('invoice-modal-overlay')) {
        document.body.insertAdjacentHTML('beforeend', invoiceModalHtml);
    }

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
                <div style="display:flex; gap:10px;">
                    <button class="primary-btn btn-dense" id="btn-save-transportistas" style="font-size:12px; padding:5px 12px;" disabled>💾 Mentés</button>
                    <button class="secondary-btn btn-dense" id="btn-clear-filters" style="font-size:12px; padding:5px 12px;">Szűrők törlése</button>
                </div>
            </div>

            <!-- Sor 1: Jelölőkapcsolók -->
            <div style="display:flex; gap:28px; margin-bottom:12px; align-items:center;">
                <label style="display:flex; align-items:center; gap:7px; cursor:pointer; font-size:13px; user-select:none;">
                    <input type="checkbox" id="chk-hianyzo-szla" style="width:15px;height:15px;accent-color:var(--primary);">
                    <span>Hiányzó fuvarszámla</span>
                </label>
            </div>

            <!-- Sor 2: Szövegdobozok + Legördülők -->
            <div style="display:flex; gap:14px; flex-wrap:wrap; align-items:end;">
                <div style="width:200px;">
                    <label class="access-control-label" for="filter-order-num" style="display:block;font-size:11px;margin-bottom:4px;text-align:left;">Order Number (Kamion szám)</label>
                    <input type="text" id="filter-order-num" class="access-control-input" placeholder="LOG356, GHU 382..." style="width:100%;box-sizing:border-box;height:30px;font-size:12px;">
                </div>
                <div style="width:160px;">
                    <label class="access-control-label" for="filter-kamion" style="display:block;font-size:11px;margin-bottom:4px;text-align:left;">Rendszám</label>
                    <input type="text" id="filter-kamion" class="access-control-input" placeholder="Rendszám..." style="width:100%;box-sizing:border-box;height:30px;font-size:12px;">
                </div>
                <div style="width:160px;">
                    <label class="access-control-label" for="filter-hely" style="display:block;font-size:11px;margin-bottom:4px;text-align:left;">Ország</label>
                    <input type="text" id="filter-hely" class="access-control-input" placeholder="Ország..." style="width:100%;box-sizing:border-box;height:30px;font-size:12px;">
                </div>
                <div style="width:160px;">
                    <label class="access-control-label" for="filter-szezon" style="display:block;font-size:11px;margin-bottom:4px;text-align:left;">Szezon</label>
                    <select id="filter-szezon" class="access-control-input" style="width:100%;box-sizing:border-box;height:30px;font-size:12px;">
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
                <div style="width:240px;">
                    <label class="access-control-label" for="filter-fuvarozo" style="display:block;font-size:11px;margin-bottom:4px;text-align:left;">Fuvarozó cég</label>
                    <select id="filter-fuvarozo" class="access-control-input" style="width:100%;box-sizing:border-box;height:30px;font-size:12px;">
                        <option value="">Mind</option>
                    </select>
                </div>
                <div style="width:150px;">
                    <label class="access-control-label" for="filter-ev" style="display:block;font-size:11px;margin-bottom:4px;text-align:left;">Rakodási év</label>
                    <select id="filter-ev" class="access-control-input" style="width:100%;box-sizing:border-box;height:30px;font-size:12px;">
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
    
    const scaleWrapper = document.createElement('div');
    scaleWrapper.style.cssText = 'width: 133.333%; height: 133.333%; transform: scale(0.75); transform-origin: top left; display: flex; flex-direction: column;';
    scaleWrapper.appendChild(filterPanel);

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
                <table class="access-subform-table" id="transport-table" style="min-width:1850px;">
                    <thead style="position:sticky; top:0; background:var(--bg-light); z-index:2;">
                        <tr>
                            <th style="min-width:110px;">Loading date</th>
                            <th style="min-width:120px;">Loading place</th>
                            <th style="min-width:110px;">Order number</th>
                            <th style="min-width:130px;">Transporter</th>
                            <th style="min-width:150px;">Plate number</th>
                            <th style="min-width:120px; text-align:right;">Transport price</th>
                            <th style="min-width:105px;">Arrival date</th>
                            <th style="min-width:100px; text-align:right;">K-B</th>
                            <th style="min-width:100px; text-align:right;">B</th>
                            <th style="min-width:100px; text-align:right;">T</th>
                            <th style="min-width:320px;">Comment</th>
                            <th style="min-width:125px; text-align:right;">Amount HUF</th>
                            <th style="min-width:220px;">Invoice number</th>
                            <th style="min-width:125px; text-align:right;">Amount EUR</th>
                            <th style="min-width:50px; text-align:center;">Művelet</th>
                        </tr>
                    </thead>
                    <tbody id="transport-tbody"></tbody>
                </table>
            </div>
        </div>
    `;
    scaleWrapper.appendChild(tableContainer);
    container.appendChild(scaleWrapper);

    // --- Élő Adatok helye ---
    let tableData = [];
    let dirtyRows = {};
    let isDirty = false;

    // --- Vezérlők lekérése ---
    const tbody = tableContainer.querySelector('#transport-tbody');
    const recordCount = tableContainer.querySelector('#record-count');
    const chkHiany = filterPanel.querySelector('#chk-hianyzo-szla');
    const inpOrderNum = filterPanel.querySelector('#filter-order-num');
    const inpKamion = filterPanel.querySelector('#filter-kamion');
    const inpHely = filterPanel.querySelector('#filter-hely');
    const selSzezon = filterPanel.querySelector('#filter-szezon');
    const selFuvarozo = filterPanel.querySelector('#filter-fuvarozo');
    const selEv = filterPanel.querySelector('#filter-ev');
    const btnClear = filterPanel.querySelector('#btn-clear-filters');
    const btnSave = filterPanel.querySelector('#btn-save-transportistas');

    function getYear(dateStr) {
        const m = (dateStr || '').match(/^\d{4}/);
        return m ? m[0] : '';
    }

    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderTable(data) {
        tbody.innerHTML = '';
        const inputStyle = 'width:100%; box-sizing:border-box; border:1px solid transparent; background:transparent; font-family:inherit; font-size:inherit; padding:2px; text-align:inherit;';
        const inputFocusStyle = 'outline:none; border-bottom:1px solid var(--primary); background:rgba(255,255,255,0.8);';

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space:nowrap;">${row.loadingDate}</td>
                <td style="white-space:nowrap;">${row.loadingPlace}</td>
                <td><span class="badge order-number-badge" data-id="${row.id}" style="background:var(--bg-main);color:var(--primary);border:1px solid var(--border);font-size:11px;cursor:pointer;text-decoration:underline;" title="Kattints a kamion szerkesztéséhez">${row.orderNumber}</span></td>
                <td style="white-space:nowrap;font-weight:600;">${row.transporter}</td>
                <td style="white-space:nowrap;font-family:monospace;font-size:14px;">${row.plateNumber}</td>
                <td style="text-align:right;white-space:nowrap;">${row.transportPrice}</td>
                <td style="white-space:nowrap;">${row.arrivalDate}</td>
                <td style="text-align:right;white-space:nowrap;"><input type="number" step="any" class="edit-input" data-field="kb" data-id="${row.id}" style="${inputStyle} text-align:right;" value="${escHtml(row.kb)}"></td>
                <td style="text-align:right;white-space:nowrap;"><input type="number" step="any" class="edit-input" data-field="b" data-id="${row.id}" style="${inputStyle} text-align:right;" value="${escHtml(row.b)}"></td>
                <td style="text-align:right;white-space:nowrap;"><input type="number" step="any" class="edit-input" data-field="t" data-id="${row.id}" style="${inputStyle} text-align:right;" value="${escHtml(row.t)}"></td>
                <td style="font-size:12px;color:var(--text-muted);"><input type="text" class="edit-input" data-field="comment" data-id="${row.id}" style="${inputStyle}" value="${escHtml(row.comment)}"></td>
                <td style="text-align:right;white-space:nowrap;"><input type="number" step="any" class="edit-input" data-field="invoice_amount_huf" data-id="${row.id}" style="${inputStyle} text-align:right;" value="${escHtml(row.amountHuf)}"></td>
                <td style="white-space:nowrap;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                        <input type="text" class="edit-input invoice-input" data-field="invoice_number" data-id="${row.id}" style="${inputStyle} flex:1; ${row.invoiceFiles && row.invoiceFiles.length > 0 ? 'color:#2563eb; font-weight:600; cursor:pointer; text-decoration:underline;' : ''}" value="${escHtml(row.invoiceNumber)}" ${row.invoiceFiles && row.invoiceFiles.length > 0 ? 'readonly' : ''} title="${row.invoiceFiles && row.invoiceFiles.length > 0 ? 'Kattints a fájlok megtekintéséhez' : ''}">
                        <span class="invoice-upload-btn" data-id="${row.id}" data-invoice="${escHtml(row.invoiceNumber)}" data-season="${escHtml(row.seasonCode)}" data-order="${escHtml(row.orderNumber)}" title="Számla feltöltése" style="cursor:pointer; font-size:14px; padding:0 2px;">📄</span>
                    </div>
                </td>
                <td style="text-align:right;white-space:nowrap;font-weight:600;"><input type="number" step="any" class="edit-input" data-field="invoice_amount_eur" data-id="${row.id}" style="${inputStyle} text-align:right;" value="${escHtml(row.amountEur)}"></td>
                <td style="text-align:center;">
                    <button class="delete-fuvar-btn" data-id="${row.id}" title="Törlés" style="background:transparent;border:none;cursor:pointer;font-size:14px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });


        
        // Add click listener for Order Number badge
        tbody.querySelectorAll('.order-number-badge').forEach(badge => {
            badge.addEventListener('click', function(e) {
                const id = this.getAttribute('data-id');
                if (id) {
                    openKamionSzerkesztesWindow(windowManager, id, { showDeliveryNoteBtn: true, fromTransportistas: true });
                }
            });
        });

        // Invoice View and Upload listeners
        tbody.querySelectorAll('.invoice-input').forEach(inp => {
            inp.addEventListener('click', function(e) {
                const id = this.getAttribute('data-id');
                const rowData = data.find(d => d.id == id);
                if (rowData && rowData.invoiceFiles && rowData.invoiceFiles.length > 0) {
                    openInvoiceViewModal(id, rowData.invoiceFiles);
                }
            });
        });

        tbody.querySelectorAll('.invoice-upload-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                // Ha nincs kitöltve a számlaszám, elkérjük az input mezőből az aktuálisat (ha épp írta be, de még nem mentette)
                let inv = this.getAttribute('data-invoice');
                if (!inv) {
                    const rowInput = this.closest('td').querySelector('.invoice-input');
                    if (rowInput && rowInput.value) {
                        inv = rowInput.value;
                    }
                }
                const season = this.getAttribute('data-season');
                const order = this.getAttribute('data-order');
                openInvoiceUploadModal(id, inv, season, order);
            });
        });

        // Input hover/focus stílus és változás figyelés
        tbody.querySelectorAll('.edit-input').forEach(input => {
            input.addEventListener('focus', () => {
                input.style.borderBottom = '1px solid var(--primary)';
                input.style.background = 'rgba(255,255,255,0.8)';
            });
            input.addEventListener('blur', () => {
                input.style.borderBottom = '1px solid transparent';
                input.style.background = 'transparent';
            });
            input.addEventListener('input', (e) => {
                const id = e.target.dataset.id;
                const field = e.target.dataset.field;
                if (!dirtyRows[id]) dirtyRows[id] = { id: id };
                dirtyRows[id][field] = e.target.value;
                isDirty = true;
                btnSave.disabled = false;
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
            const mHiany = !hiany || row.invoiceNumber === '';
            return mOrderNum && mKamion && mHely && mFuvarozo && mEv && mSzezon && mHiany;
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
    chkHiany.addEventListener('change', filterData);

    btnSave.addEventListener('click', async () => {
        if (!isDirty) return;
        const updates = Object.values(dirtyRows);
        
        // DEBUG log (ideiglenesen hozzáadva a hiba diagnosztikájához - eltávolítható)
        // console.log('[TRANSPORTISTAS MENTÉS] Elküldött dirtyRows:', JSON.stringify(updates));
        btnSave.disabled = true;
        btnSave.textContent = 'Mentés...';

        try {
            const res = await fetch('/api/v1/shipments/bulk-update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                alert('Sikeres mentés!');
                dirtyRows = {};
                isDirty = false;
                await loadRealData();
            } else {
                const err = await res.json();
                alert('Mentés hiba: ' + (err.error || 'Ismeretlen hiba'));
                btnSave.disabled = false;
            }
        } catch (error) {
            console.error(error);
            alert('Hálózati hiba mentéskor!');
            btnSave.disabled = false;
        } finally {
            btnSave.textContent = '💾 Mentés';
        }
    });

    btnClear.addEventListener('click', () => {
        inpOrderNum.value = '';
        inpKamion.value = '';
        inpHely.value = '';
        selFuvarozo.value = '';
        selSzezon.value = '';
        selEv.value = '';
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
                // FONTOS: Minden szerkeszthető mező értékét be kell tölteni az API válaszból.
                // Korábban kb, b, t, amountHuf, invoiceNumber, amountEur mindig üres string volt
                // ('jövőbeli fejlesztés' komment miatt), ami miatt mentés után eltűntek az adatok.
                // Az adatbázis sikeresen mentette az értékeket, de a loadRealData visszatöltéskor
                // mindig felülírta őket üres stringgel. Javítva: 2026-07-02
                tableData = apiData.map(d => ({
                    id: d.id,
                    loadingDate: d.loading_date ? d.loading_date.substring(0, 10) : '',
                    loadingPlace: d.loading_place || '',
                    orderNumber: d.order_number || '',
                    transporter: d.transporter_name || '',
                    plateNumber: d.plate_number || '',
                    transportPrice: d.transport_price ? d.transport_price + (d.transport_currency === 'HUF' ? ' Ft' : ' €') : '',
                    arrivalDate: d.arrival_date ? d.arrival_date.substring(0, 10) : '',
                    seasonCode: d.season_code || '',
                    kb: d.kb != null ? d.kb : '',
                    b: d.b != null ? d.b : '',
                    t: d.t != null ? d.t : '',
                    comment: d.comment || '',
                    amountHuf: d.invoice_amount_huf != null ? d.invoice_amount_huf : '',
                    invoiceNumber: d.invoice_number || '',
                    invoiceFiles: d.invoice_files ? (typeof d.invoice_files === 'string' ? JSON.parse(d.invoice_files) : d.invoice_files) : null,
                    amountEur: d.invoice_amount_eur != null ? d.invoice_amount_eur : ''
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

    // ============================================================
    // MODAL LOGIC FOR INVOICE UPLOAD & VIEW
    // ============================================================
    const invModalOverlay = document.getElementById('invoice-modal-overlay');
    const invModalNumber = document.getElementById('invoice-modal-number');
    const invModalDropzone = document.getElementById('invoice-modal-dropzone');
    const invModalFileinput = document.getElementById('invoice-modal-fileinput');
    const invModalFilename = document.getElementById('invoice-modal-filename');
    const invModalStatus = document.getElementById('invoice-modal-status');
    const invModalCancel = document.getElementById('invoice-modal-cancel');
    const invModalSave = document.getElementById('invoice-modal-save');
    
    let currentInvoiceUploadId = null;
    let currentInvoiceSeason = null;
    let currentInvoiceOrder = null;
    let invSelectedFiles = [];

    window.openInvoiceUploadModal = function(id, invoiceNumber, season, orderNumber) {
        currentInvoiceUploadId = id;
        currentInvoiceSeason = season;
        currentInvoiceOrder = orderNumber;
        invModalNumber.value = invoiceNumber || '';
        invSelectedFiles = [];
        invModalFilename.textContent = '';
        invModalStatus.textContent = '';
        invModalOverlay.style.display = 'flex';
    };

    invModalCancel.addEventListener('click', () => { invModalOverlay.style.display = 'none'; });
    invModalOverlay.addEventListener('click', (e) => { if (e.target === invModalOverlay) invModalOverlay.style.display = 'none'; });

    invModalDropzone.addEventListener('dragover', e => { e.preventDefault(); invModalDropzone.style.background = '#e2e8f0'; });
    invModalDropzone.addEventListener('dragleave', () => { invModalDropzone.style.background = '#f8fafc'; });
    invModalDropzone.addEventListener('drop', e => {
        e.preventDefault();
        invModalDropzone.style.background = '#f8fafc';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            invSelectedFiles = Array.from(e.dataTransfer.files).slice(0, 10);
            invModalFilename.textContent = '📎 ' + invSelectedFiles.map(f => f.name).join(', ');
        }
    });
    invModalDropzone.addEventListener('click', () => invModalFileinput.click());
    invModalFileinput.addEventListener('change', () => {
        if (invModalFileinput.files && invModalFileinput.files.length > 0) {
            invSelectedFiles = Array.from(invModalFileinput.files).slice(0, 10);
            invModalFilename.textContent = '📎 ' + invSelectedFiles.map(f => f.name).join(', ');
        }
    });

    invModalSave.addEventListener('click', async () => {
        const invNumber = invModalNumber.value.trim();
        if (!invNumber) {
            invModalStatus.style.color = '#dc2626';
            invModalStatus.textContent = '⚠ Kérlek add meg az Invoice Number-t!';
            return;
        }
        if (invSelectedFiles.length === 0) {
            invModalStatus.style.color = '#dc2626';
            invModalStatus.textContent = '⚠ Kérlek válassz ki legalább egy fájlt!';
            return;
        }

        invModalStatus.style.color = '#2563eb';
        invModalStatus.textContent = '⏳ Feltöltés folyamatban...';
        invModalSave.disabled = true;

        try {
            const formData = new FormData();
            invSelectedFiles.forEach(f => formData.append('files', f));
            formData.append('season', currentInvoiceSeason);
            formData.append('orderNumber', currentInvoiceOrder);
            formData.append('invoiceNumber', invNumber);
            formData.append('shipmentId', currentInvoiceUploadId);

            const uploadRes = await fetch('/api/v1/uploads/invoice', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadData.error || 'Hiba a feltöltés során');

            const rowData = tableData.find(d => d.id == currentInvoiceUploadId);
            if (rowData && rowData.invoiceNumber !== invNumber) {
                await fetch(`/api/v1/shipments/${currentInvoiceUploadId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoice_number: invNumber })
                });
            }

            invModalStatus.style.color = '#16a34a';
            invModalStatus.textContent = '✅ Sikeres feltöltés!';
            
            setTimeout(() => {
                invModalOverlay.style.display = 'none';
                invModalSave.disabled = false;
                loadRealData();
            }, 1000);
        } catch (err) {
            console.error(err);
            invModalStatus.style.color = '#dc2626';
            invModalStatus.textContent = '❌ Hiba: ' + err.message;
            invModalSave.disabled = false;
        }
    });

    const viewModalOverlay = document.getElementById('invoice-view-modal-overlay');
    const viewModalList = document.getElementById('invoice-view-list');
    const viewModalClose = document.getElementById('invoice-view-close');

    window.openInvoiceViewModal = function(id, files) {
        viewModalList.innerHTML = '';
        files.forEach(f => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid #e2e8f0; border-radius:4px; background:#f8fafc;';
            item.innerHTML = `
                <span style="font-size:13px; font-weight:500; color:#0f172a; word-break:break-all;">📄 ${f.fileName}</span>
                <button class="primary-btn btn-dense" style="padding:4px 10px; font-size:12px;">Megnyitás</button>
            `;
            item.querySelector('button').addEventListener('click', () => {
                const url = `/api/v1/uploads/invoice/file?shipmentId=${id}&fileName=${encodeURIComponent(f.fileName)}`;
                window.open(url, '_blank');
            });
            viewModalList.appendChild(item);
        });
        viewModalOverlay.style.display = 'flex';
    };

    viewModalClose.addEventListener('click', () => { viewModalOverlay.style.display = 'none'; });
    viewModalOverlay.addEventListener('click', (e) => { if (e.target === viewModalOverlay) viewModalOverlay.style.display = 'none'; });

    // --- Navigáció védelem ---
    function unsavedWarningHandler(e) {
        if (isDirty) {
            // Ellenőrizzük, hogy dock/menü ikonra kattintott-e
            const isNav = e.target.closest('.nav-item, .nav-group-button, .nav-category-header, .mdi-close-btn');
            if (isNav) {
                const conf = confirm('A változásokat szeretné menteni mielőtt kilép?');
                if (conf) {
                    e.preventDefault();
                    e.stopPropagation();
                    btnSave.click(); // Mentés indítása
                } else {
                    // Mégse mentünk, de elvetjük a módosításokat
                    isDirty = false;
                    dirtyRows = {};
                }
            }
        }
    }
    
    // Elkapjuk a kattintásokat a "capture" fázisban
    document.addEventListener('click', unsavedWarningHandler, true);

    // Külön cleanup funkció, ha a container megsemmisülne
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.removedNodes) {
                mutation.removedNodes.forEach((node) => {
                    if (node === container || node.contains(container)) {
                        document.removeEventListener('click', unsavedWarningHandler, true);
                        observer.disconnect();
                    }
                });
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
