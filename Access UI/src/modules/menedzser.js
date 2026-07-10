import { openMenedzserKamionWindow } from './menedzser_kamion_szerkesztes.js';

let cachedMenedzserData = null;

export function renderMenedzser(container, windowManager) {
    container.style.overflow = 'hidden';
    container.style.padding = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    const filterPanel = document.createElement('div');
    filterPanel.style.cssText = 'flex-shrink:0; padding:16px 32px 0px 32px; background:var(--bg-light);';
    filterPanel.innerHTML = `
        <div style="margin-bottom:6px;">
            <h2 class="view-title" style="margin:0 0 2px 0;">Menedzser</h2>
            <p class="view-subtitle" style="margin:0;">GHU szállítmányok és bevételezések (Partneri bontásban)</p>
        </div>

        <div class="access-form-view" style="padding:10px 18px; margin-bottom:10px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <strong style="font-size:13px;">Keresés és Szűrés</strong>
                <div style="display:flex; gap:10px;">
                    <button class="primary-btn btn-dense" id="btn-refresh" style="font-size:12px; padding:5px 12px; background:var(--info); color:#fff; border:none; border-radius:4px; cursor:pointer;" title="Adatok újratöltése a szerverről">Frissítés</button>
                    <button class="primary-btn btn-dense" id="btn-new-kamion" style="font-size:12px; padding:5px 12px;">+ Új kamion</button>
                    <button class="secondary-btn btn-dense" id="btn-clear-filters" style="font-size:12px; padding:5px 12px;">Szűrők törlése</button>
                </div>
            </div>

            <!-- Jelölőkapcsolók -->
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

            <!-- Szövegdobozok -->
            <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; align-items:end;">
                <div>
                    <label class="access-control-label" for="filter-order-num" style="display:block;font-size:11px;margin-bottom:4px;">Order Number (Kamion szám)</label>
                    <input type="text" id="filter-order-num" class="access-control-input" placeholder="H161, GHU 382..." style="width:100%;box-sizing:border-box;">
                </div>
                <div>
                    <label class="access-control-label" for="filter-ref" style="display:block;font-size:11px;margin-bottom:4px;">Reference</label>
                    <input type="text" id="filter-ref" class="access-control-input" placeholder="Partner név..." style="width:100%;box-sizing:border-box;">
                </div>
            </div>
        </div>
    `;

    const scaleWrapper = document.createElement('div');
    scaleWrapper.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column;';
    scaleWrapper.appendChild(filterPanel);

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
                <span>Menedzser listája</span>
                <span id="record-count" style="font-size:12px; font-weight:400; color:var(--text-muted);"></span>
            </div>
            <div id="table-scroll-area" style="overflow:auto; flex:1 1 auto; min-height:0;">
                <table class="access-subform-table" id="menedzser-table" style="min-width:800px;">
                    <thead style="position:sticky; top:0; background:var(--bg-light); z-index:2;">
                        <tr>
                            <th style="min-width:85px; text-align:center;">Bevételezve</th>
                            <th style="min-width:110px;">Loading date</th>
                            <th style="min-width:110px;">Order number</th>
                            <th style="min-width:150px;">Reference</th>
                            <th style="min-width:105px;">Arrival date</th>
                            <th style="min-width:150px;">Invoice number</th>
                        </tr>
                    </thead>
                    <tbody id="menedzser-tbody"></tbody>
                </table>
            </div>
        </div>
    `;
    scaleWrapper.appendChild(tableContainer);
    container.appendChild(scaleWrapper);

    let tableData = []; // Ezek lesznek a csoportosított sub-order sorok
    const tbody = tableContainer.querySelector('#menedzser-tbody');
    const recordCount = tableContainer.querySelector('#record-count');
    const chkBevVar = filterPanel.querySelector('#chk-bev-var');
    const chkHiany = filterPanel.querySelector('#chk-hianyzo-szla');
    const inpOrderNum = filterPanel.querySelector('#filter-order-num');
    const inpRef = filterPanel.querySelector('#filter-ref');
    const btnClear = filterPanel.querySelector('#btn-clear-filters');
    const btnNewKamion = filterPanel.querySelector('#btn-new-kamion');
    const btnRefresh = filterPanel.querySelector('#btn-refresh');

    function fmtDate(val) { return val ? val.substring(0, 10) : ''; }

    function renderTable(data, totalCount = data.length) {
        tbody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center;">
                    <input type="checkbox" class="bev-chk" data-shipment-id="${row.shipment_id}" data-ref="${row.reference || ''}" ${row.is_received ? 'checked' : ''}
                        style="width:15px;height:15px;cursor:pointer;accent-color:var(--primary);">
                </td>
                <td style="white-space:nowrap;">${fmtDate(row.loading_date)}</td>
                <td><span class="badge order-number-badge" data-id="${row.shipment_id}" data-ref="${row.reference || ''}" style="background:var(--bg-main);color:var(--primary);border:1px solid var(--border);font-size:11px;cursor:pointer;text-decoration:underline;" title="Kattints a kamion szerkesztéséhez">${row.display_order_number}</span></td>
                <td style="white-space:nowrap;">${row.reference || ''}</td>
                <td style="white-space:nowrap;">${fmtDate(row.arrival_date)}</td>
                <td style="white-space:nowrap;">${row.invoice_number || ''}</td>
            `;
            tbody.appendChild(tr);
        });

        // Event listener for Bevételezve checkbox
        tbody.querySelectorAll('.bev-chk').forEach(chk => {
            chk.addEventListener('change', async (e) => {
                const shipmentId = e.target.getAttribute('data-shipment-id');
                const refName = e.target.getAttribute('data-ref');
                const isReceived = e.target.checked;
                
                try {
                    const res = await fetch('/api/v1/shipment-lines/receive', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            shipment_id: shipmentId,
                            ref_name: refName,
                            is_received: isReceived
                        })
                    });
                    if (!res.ok) {
                        alert('Hiba a bevételezés mentésekor.');
                        e.target.checked = !isReceived; // rollback
                    } else {
                        // Update in-memory data
                        const row = tableData.find(r => r.shipment_id == shipmentId && r.ref_name === refName);
                        if (row) row.is_received = isReceived;
                    }
                } catch (err) {
                    console.error(err);
                    alert('Hálózati hiba a mentéskor.');
                    e.target.checked = !isReceived;
                }
            });
        });

        // Event listener for Order Number badge
        tbody.querySelectorAll('.order-number-badge').forEach(badge => {
            badge.addEventListener('click', function(e) {
                const id = this.getAttribute('data-id');
                const refName = this.getAttribute('data-ref');
                const displayNum = this.textContent.trim();
                if (id) {
                    openMenedzserKamionWindow(windowManager, id, refName, displayNum);
                }
            });
        });

        if (totalCount > 200) {
            recordCount.textContent = `(első 200 sor megjelenítve / ${totalCount} összesen)`;
        } else {
            recordCount.textContent = `(${totalCount} rekord)`;
        }
    }

    function filterData() {
        const valOrderNum = (inpOrderNum.value || '').toLowerCase().replace(/\s+/g, '');
        const valRef = (inpRef.value || '').toLowerCase();
        const bevVar = chkBevVar.checked;
        const hiany = chkHiany.checked;

        const filtered = tableData.filter(row => {
            const orderNorm = (row.display_order_number || '').toLowerCase().replace(/\s+/g, '');
            const mOrderNum = !valOrderNum || orderNorm.includes(valOrderNum);
            const mRef = !valRef || (row.reference || '').toLowerCase().includes(valRef);
            const mBevVar = !bevVar || !row.is_received;
            const mHiany = !hiany || (row.invoice_number === '' || row.invoice_number == null);
            return mOrderNum && mRef && mBevVar && mHiany;
        });

        // Teljesítmény optimalizálás: csak az első 200 sort rendereljük ki a DOM-ba
        const sliced = filtered.slice(0, 200);
        renderTable(sliced, filtered.length);
    }

    inpOrderNum.addEventListener('input', filterData);
    inpRef.addEventListener('input', filterData);
    chkBevVar.addEventListener('change', filterData);
    chkHiany.addEventListener('change', filterData);

    btnClear.addEventListener('click', () => {
        inpOrderNum.value = '';
        inpRef.value = '';
        chkBevVar.checked = false;
        chkHiany.checked = false;
        filterData();
    });

    btnNewKamion.addEventListener('click', () => {
        openMenedzserKamionWindow(windowManager, null, null);
    });

    btnRefresh.addEventListener('click', () => {
        loadRealData(true);
    });

    async function loadRealData(force = false) {
        if (!force && cachedMenedzserData) {
            tableData = cachedMenedzserData;
            filterData();
            return;
        }

        try {
            recordCount.textContent = 'Adatok betöltése...';
            const response = await fetch('/api/v1/shipment-lines');
            if (response.ok) {
                const lines = await response.json();

                // 1. lépés: fuvaronként csoportosítás (csak GHU és H prefixű fuvarok)
                const shipmentMap = new Map();

                lines.forEach(line => {
                    const orderNum = (line.order_number || '').trim().toUpperCase();
                    if (!orderNum.startsWith('GHU') && !orderNum.startsWith('H')) return;

                    if (!shipmentMap.has(line.shipment_id)) {
                        shipmentMap.set(line.shipment_id, {
                            shipment_id: line.shipment_id,
                            order_number: line.order_number,
                            loading_date: line.loading_date,
                            arrival_date: line.arrival_date,
                            invoice_number: line.invoice_number_finance || '',
                            allLines: []
                        });
                    }
                    shipmentMap.get(line.shipment_id).allLines.push(line);
                });

                // 2. lépés: fuvaronként a per értékek dinamikus számítása
                const rows = [];

                shipmentMap.forEach(shipment => {
                    const ghuLines = shipment.allLines.filter(l =>
                        (l.cust || '').toUpperCase().includes('GHU')
                    );

                    if (ghuLines.length === 0) {
                        return;
                    }

                    const referenceMap = new Map();
                    let refCounter = 0;

                    // Rendezés line_id szerint növekvő sorrendbe, hogy megegyezzen a Kamion Szerkesztő
                    // által használt ORDER BY shipment_lines.id ASC sorrenddel
                    const sortedGhuLines = [...ghuLines].sort((a, b) => (a.line_id || 0) - (b.line_id || 0));

                    sortedGhuLines.forEach(l => {
                        let refKey = (l.ref || '').trim().toUpperCase();
                        if (refKey.startsWith('AGROPONIENTE')) refKey = 'AGROPONIENTE';

                        if (!referenceMap.has(refKey)) {
                            referenceMap.set(refKey, {
                                per: refCounter,
                                originalRef: l.ref || refKey,
                                ref_name: refKey,
                                is_received: false
                            });
                            refCounter++;
                        }
                        if (l.is_received) {
                            referenceMap.get(refKey).is_received = true;
                        }
                    });

                    referenceMap.forEach((val) => {
                        const per = val.per;
                        const displayOrder = per === 0
                            ? shipment.order_number
                            : `${shipment.order_number}/${per}`;

                        rows.push({
                            shipment_id: shipment.shipment_id,
                            truck_number_per: per,
                            display_order_number: displayOrder,
                            reference: val.originalRef,
                            ref_name: val.ref_name,
                            loading_date: shipment.loading_date,
                            arrival_date: shipment.arrival_date,
                            is_received: val.is_received,
                            invoice_number: shipment.allLines.find(l => (l.ref || '').trim().toUpperCase() === val.originalRef.trim().toUpperCase() || (l.ref || '').trim().toUpperCase() === val.ref_name)?.invoice_number_finance || ''
                        });
                    });
                });

                cachedMenedzserData = rows;
                tableData = rows;
                tableData.sort((a, b) => {
                    const da = a.loading_date ? new Date(a.loading_date) : new Date(0);
                    const db2 = b.loading_date ? new Date(b.loading_date) : new Date(0);
                    if (db2 - da !== 0) return db2 - da;
                    if (b.shipment_id !== a.shipment_id) return b.shipment_id - a.shipment_id;
                    return a.truck_number_per - b.truck_number_per;
                });

                filterData();
            } else {
                recordCount.textContent = '(Hiba az adatok lekérésekor)';
            }
        } catch (err) {
            console.error('API hiba:', err);
            recordCount.textContent = '(Nem elérhető az API)';
        }
    }

    renderTable([]);
    loadRealData();
}
