const GRID_ROWS = 25;

export function openMenedzserKamionWindow(windowManager, kamionId, refName) {
    windowManager.open('menedzser_kamion_' + kamionId, 'Kamion pénzügyi szerkesztése...', async (container) => {
        const winEl = container.closest('.mdi-window');
        if (winEl) {
            winEl.style.width = '1200px';
            winEl.style.height = '750px';
            winEl.style.maxHeight = '92vh';
            setTimeout(() => {
                const left = Math.max(20, (window.innerWidth - winEl.offsetWidth) / 2);
                const top = Math.max(0, ((window.innerHeight - winEl.offsetHeight) / 2) - 40);
                winEl.style.left = `${left}px`;
                winEl.style.top = `${top}px`;
            }, 10);
        }
        
        container.style.padding = '0';
        container.style.backgroundColor = 'var(--bg-light)';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <style>
                .finance-panel {
                    padding: 8px 12px;
                    background: #fff;
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    margin-bottom: 8px;
                    font-size: 11px;
                }
                .finance-header-grid {
                    display: grid;
                    grid-template-columns: 200px 1fr 100px;
                    gap: 16px;
                }
                .finance-title {
                    font-size: 24px;
                    font-weight: 900;
                    margin-bottom: 8px;
                }
                .finance-table-summary {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: right;
                }
                .finance-table-summary th, .finance-table-summary td {
                    padding: 4px;
                    border: 1px solid #ccc;
                }
                .finance-table-summary th {
                    background: #f0f0f0;
                    text-align: center;
                }
                .input-group {
                    display: flex;
                    align-items: center;
                    margin-bottom: 4px;
                    justify-content: space-between;
                }
                .input-group label {
                    flex: 1;
                    font-weight: 600;
                }
                .input-group input, .input-group select {
                    flex: 1.5;
                    padding: 2px 4px;
                    border: 1px solid #aaa;
                    font-size: 11px;
                }
                .grid-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                }
                .grid-table th {
                    background: #d4d4d4;
                    border: 1px solid #888;
                    padding: 4px;
                }
                .grid-table td {
                    border: 1px solid #888;
                    padding: 2px;
                }
                .grid-table input, .grid-table select {
                    width: 100%;
                    border: none;
                    background: transparent;
                    font-size: 11px;
                    padding: 2px;
                }
                .grid-table input:focus {
                    outline: 1px solid var(--primary);
                    background: #fff;
                }
                .action-btn {
                    padding: 4px 8px;
                    border: 1px solid #888;
                    background: #e0e0e0;
                    cursor: pointer;
                    margin-right: 4px;
                }
                .action-btn:hover { background: #ccc; }
                .text-red { color: red; }
            </style>
            
            <div style="flex: 1; overflow-y: auto; padding: 8px;">
                <div class="finance-panel finance-header-grid">
                    <!-- Bal oldal: Fő adatok -->
                    <div>
                        <div class="finance-title" id="fm-title">GHU</div>
                        <div style="display:flex; justify-content: space-between;">
                            <span>Season: <b id="fm-season">25-26</b></span>
                            <span>Truck No: <b id="fm-truck-no">209</b></span>
                        </div>
                        <hr style="margin: 8px 0;">
                        <div class="input-group">
                            <label>Invoice No:</label>
                            <input type="text" id="fm-invoice">
                        </div>
                        <div class="input-group">
                            <label>Auto Number:</label>
                            <input type="text" id="fm-auto-num">
                        </div>
                        <div class="input-group">
                            <label>Departure date:</label>
                            <input type="date" id="fm-dep-date">
                        </div>
                        <div class="input-group">
                            <label>Arrival date:</label>
                            <input type="date" id="fm-arr-date">
                        </div>
                        <div class="input-group">
                            <label>Price Trans Toll:</label>
                            <input type="text" id="fm-price-toll">
                        </div>
                        <div class="input-group">
                            <label>OverHead %:</label>
                            <input type="number" step="0.01" id="fm-overhead">
                        </div>
                        <div class="input-group">
                            <label>Goods Currency:</label>
                            <select id="fm-currency">
                                <option value="EUR">EUR</option>
                                <option value="HUF">HUF</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Comments:</label>
                            <input type="text" id="fm-comments">
                        </div>
                    </div>

                    <!-- Közép: Pénzügyi táblák -->
                    <div>
                        <div style="display:flex; gap: 16px; margin-bottom: 8px;">
                            <div class="input-group" style="flex:1;">
                                <label>Type Truck:</label>
                                <select id="fm-type-truck"><option value="">--</option></select>
                            </div>
                            <div class="input-group" style="flex:2;">
                                <label>Supplier:</label>
                                <input type="text" id="fm-supplier" readonly style="background:#eee;">
                            </div>
                            <div class="input-group" style="flex:1;">
                                <label>Date:</label>
                                <input type="date" id="fm-date">
                            </div>
                            <div class="input-group" style="flex:1;">
                                <label>Status:</label>
                                <select id="fm-status">
                                    <option value="Open">Open</option>
                                    <option value="Close">Close</option>
                                </select>
                            </div>
                        </div>

                        <div style="display:flex; gap: 8px; align-items:center; margin-bottom: 8px;">
                            <label>ExchRt:</label>
                            <input type="number" step="0.01" id="fm-exch-rt" style="width: 100px;">
                        </div>

                        <table class="finance-table-summary">
                            <thead>
                                <tr>
                                    <th>(HUF*)</th>
                                    <th>Total Invoice</th>
                                    <th>Total Inv A</th>
                                    <th>Balance A</th>
                                    <th>Total Inv B</th>
                                    <th>Balance B</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="text-align:left; font-weight:bold;">Goods:</td>
                                    <td id="ts-goods-inv">0</td>
                                    <td id="ts-goods-inv-a">0</td>
                                    <td id="ts-goods-bal-a" class="text-red">0</td>
                                    <td id="ts-goods-inv-b">0</td>
                                    <td id="ts-goods-bal-b" class="text-red">0</td>
                                    <td><button class="action-btn">Paym. Goods</button></td>
                                </tr>
                                <tr>
                                    <td style="text-align:left; font-weight:bold;">Transport & Other:</td>
                                    <td id="ts-trans-inv">0</td>
                                    <td id="ts-trans-inv-a">0</td>
                                    <td id="ts-trans-bal-a" class="text-red">0</td>
                                    <td id="ts-trans-inv-b">0</td>
                                    <td id="ts-trans-bal-b" class="text-red">0</td>
                                    <td><button class="action-btn">Paym. Trans</button></td>
                                </tr>
                                <tr>
                                    <td style="text-align:left; font-weight:bold;">Totals:</td>
                                    <td id="ts-tot-inv">0</td>
                                    <td id="ts-tot-inv-a">0</td>
                                    <td id="ts-tot-bal-a" class="text-red">0</td>
                                    <td id="ts-tot-inv-b">0</td>
                                    <td id="ts-tot-bal-b" class="text-red">0</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                        <br>
                        <table class="finance-table-summary" style="width:70%;">
                            <tbody>
                                <tr>
                                    <td style="text-align:left; font-weight:bold; width:150px;">Transfers Totals:</td>
                                    <td id="ts-transf-inv">0</td>
                                    <td id="ts-transf-inv-a">0</td>
                                    <td><button class="action-btn">Transfer Trk</button></td>
                                    <td><input type="text" style="width:60px;text-align:right;" value="0.00"> <span id="ts-transf-curr">EUR</span></td>
                                    <td><button class="action-btn">Rejects/Ret</button></td>
                                </tr>
                            </tbody>
                        </table>
                        <div style="margin-top: 4px;">
                            <button class="action-btn">Recalc Prices Transfer Trk</button>
                        </div>
                    </div>

                    <!-- Jobb: Gombok -->
                    <div style="display:flex; flex-direction:column; gap: 8px; align-items: flex-end;">
                        <button class="action-btn" style="width:100%; padding: 8px;">Print</button>
                        <button class="action-btn" style="width:100%; padding: 8px;">Preview</button>
                        <div style="flex:1;"></div>
                        <button class="action-btn" id="fm-save" style="width:100%; padding: 8px; background:var(--primary); color:#fff; font-weight:bold;">Mentés</button>
                        <button class="action-btn" id="fm-close" style="width:100%; padding: 8px; background:#f44336; color:#fff;">Kilépés</button>
                    </div>
                </div>

                <!-- Tétel táblázat blokk -->
                <div class="finance-panel">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                        <div>
                            <button class="action-btn">Delete line</button>
                            <button class="action-btn">Update</button>
                            <button class="action-btn" id="fm-add-line" style="background:#4caf50; color:white;">Add line</button>
                        </div>
                        <div style="display:flex; gap: 16px; align-items:center;">
                            <b>Totals</b>
                            <div style="display:flex; gap: 8px;">
                                <input type="text" id="tot-palets" readonly style="width:60px; text-align:right; background:#eee;">
                                <input type="text" id="tot-boxes" readonly style="width:60px; text-align:right; background:#eee;">
                                <input type="text" id="tot-kgs" readonly style="width:60px; text-align:right; background:#eee;">
                                <input type="text" id="tot-net" readonly style="width:80px; text-align:right; background:#eee;">
                            </div>
                            <b style="margin-left: 20px;">Tot Invoice A</b>
                            <div style="display:flex; gap: 8px;">
                                <input type="text" id="tot-inv-abt" readonly style="width:80px; text-align:right; background:#eee;">
                                <input type="text" id="tot-inv-tax" readonly style="width:60px; text-align:right; background:#eee;">
                                <input type="text" id="tot-inv-amnta" readonly style="width:80px; text-align:right; background:#eee;">
                            </div>
                        </div>
                    </div>

                    <table class="grid-table" id="fm-lines-table">
                        <thead>
                            <tr>
                                <th>Lin</th>
                                <th>Code Prod</th>
                                <th>Product</th>
                                <th>C</th>
                                <th>Description</th>
                                <th>Palets</th>
                                <th>U</th>
                                <th>Boxes</th>
                                <th>Kgs</th>
                                <th>Unit Pr</th>
                                <th>Nettó Amnt</th>
                                <th>Un Pr A</th>
                                <th>TpTAX</th>
                                <th>AmountA BT</th>
                                <th>TAX</th>
                                <th>AmountA</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Generált sorok -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        let productsData = [];
        let financeTruckTypes = [];
        let shipmentData = null;
        let linesData = [];
        
        async function loadLookups() {
            try {
                const [prodRes, typeRes] = await Promise.all([
                    fetch('/api/v1/admin/products'),
                    fetch('/api/v1/admin/finance_truck_types')
                ]);
                productsData = prodRes.ok ? await prodRes.json() : [];
                financeTruckTypes = typeRes.ok ? await typeRes.json() : [];
                
                const typeSelect = container.querySelector('#fm-type-truck');
                financeTruckTypes.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.name;
                    typeSelect.appendChild(opt);
                });
            } catch (err) {
                console.error("Hiba a szótárak betöltésekor", err);
            }
        }

        async function loadShipment() {
            try {
                const res = await fetch(`/api/v1/shipments/${kamionId}?ref_name=${encodeURIComponent(refName)}`);
                if (!res.ok) throw new Error('Nem sikerült betölteni a kamiont');
                const data = await res.json();
                shipmentData = data.shipment;
                linesData = data.lines || [];
                renderData();
            } catch (err) {
                alert(err.message);
                container.closest('.mdi-window').querySelector('.mdi-window-close').click();
            }
        }

        function renderData() {
            if (!shipmentData) return;
            
            // Header logic
            const match = (shipmentData.order_number || '').match(/^([a-zA-Z]+)\s*(.*)$/);
            container.querySelector('#fm-title').textContent = match ? match[1].toUpperCase() : 'N/A';
            container.querySelector('#fm-truck-no').textContent = match ? match[2] : shipmentData.order_number;
            
            // Értékek betöltése
            container.querySelector('#fm-invoice').value = shipmentData.invoice_number || '';
            container.querySelector('#fm-auto-num').value = shipmentData.plate_number || '';
            container.querySelector('#fm-dep-date').value = shipmentData.loading_date ? shipmentData.loading_date.split('T')[0] : '';
            container.querySelector('#fm-arr-date').value = shipmentData.arrival_date ? shipmentData.arrival_date.split('T')[0] : '';
            container.querySelector('#fm-price-toll').value = shipmentData.price_trance_toll || '';
            container.querySelector('#fm-overhead').value = shipmentData.overhead_percent || '';
            container.querySelector('#fm-currency').value = shipmentData.goods_currency || 'EUR';
            container.querySelector('#fm-exch-rt').value = shipmentData.exchange_rate || '';
            container.querySelector('#fm-comments').value = shipmentData.finance_comments || '';
            container.querySelector('#fm-type-truck').value = shipmentData.finance_truck_type_id || '';
            container.querySelector('#fm-supplier').value = refName || shipmentData.supplier_name || '';
            container.querySelector('#fm-date').value = shipmentData.finance_date ? shipmentData.finance_date.split('T')[0] : '';
            container.querySelector('#fm-status').value = shipmentData.finance_status || 'Open';

            renderLines();
        }

        function renderLines() {
            const tbody = container.querySelector('#fm-lines-table tbody');
            tbody.innerHTML = '';
            
            const numRows = Math.max(1, linesData.length);
            
            for (let i = 0; i < numRows; i++) {
                const line = linesData[i] || {};
                appendRow(tbody, line, i);
            }
            calculateTotals();
        }

        function appendRow(tbody, line, i) {
            let prodCodeOpts = '<option value="">-</option>';
            productsData.forEach(p => {
                prodCodeOpts += `<option value="${p.id}" ${line.product_id === p.id ? 'selected' : ''}>${p.code || ''}</option>`;
            });
            
            let prodNameOpts = '<option value="">-</option>';
            productsData.forEach(p => {
                prodNameOpts += `<option value="${p.id}" ${line.product_id === p.id ? 'selected' : ''}>${p.name}</option>`;
            });

            const tr = document.createElement('tr');
            tr.setAttribute('data-index', i);
            tr.setAttribute('data-line-id', line.id || '');
            tr.innerHTML = `
                <td style="text-align:center;" class="row-num">${i+1}</td>
                <td><select class="inp-prod-code">${prodCodeOpts}</select></td>
                <td><select class="inp-prod-name">${prodNameOpts}</select></td>
                <td style="text-align:center;">c</td>
                <td><input type="text" class="inp-desc" value="${line.description_finance || line.comment || ''}"></td>
                <td><input type="number" step="0.01" class="inp-palets" value="${line.total_palets || ''}" readonly style="background:#eee;"></td>
                <td style="text-align:center;">u</td>
                <td><input type="number" step="0.01" class="inp-boxes num-calc" value="${line.boxes || ''}"></td>
                <td><input type="number" step="0.01" class="inp-kgs num-calc" value="${line.kgs_finance || ''}"></td>
                <td><input type="number" step="0.01" class="inp-unitpr num-calc" value="${line.unit_price || ''}"></td>
                <td><input type="number" step="0.01" class="inp-netamnt" value="${line.net_amount || ''}" readonly style="background:#f0f8ff;"></td>
                <td><input type="number" step="0.01" class="inp-unpra num-calc" value="${line.unit_price_a || ''}"></td>
                <td><input type="number" step="0.01" class="inp-tax num-calc" value="${line.tax_percent || ''}"></td>
                <td><input type="number" step="0.01" class="inp-amntabt num-calc" value="${line.amount_a_bt || ''}"></td>
                <td><input type="number" step="0.01" class="inp-taxamt" value="${line.tax_amount || ''}" readonly style="background:#f0f8ff;"></td>
                <td><input type="number" step="0.01" class="inp-amnta" value="${line.amount_a || ''}" readonly style="background:#f0f8ff;"></td>
            `;
            tbody.appendChild(tr);

            // Sync Product Code and Name selects
            const selCode = tr.querySelector('.inp-prod-code');
            const selName = tr.querySelector('.inp-prod-name');
            selCode.addEventListener('change', () => { selName.value = selCode.value; });
            selName.addEventListener('change', () => { selCode.value = selName.value; });
            
            // Kalkulációk
            tr.querySelectorAll('.num-calc').forEach(inp => {
                inp.addEventListener('input', () => {
                    calculateRow(tr);
                    calculateTotals();
                });
            });
        }

        function calculateRow(tr) {
            const boxes = parseFloat(tr.querySelector('.inp-boxes').value) || 0;
            const unitPr = parseFloat(tr.querySelector('.inp-unitpr').value) || 0;
            const netAmnt = boxes * unitPr;
            tr.querySelector('.inp-netamnt').value = netAmnt > 0 ? netAmnt.toFixed(2) : '';
            
            const amntABT = parseFloat(tr.querySelector('.inp-amntabt').value) || 0;
            const taxPct = parseFloat(tr.querySelector('.inp-tax').value) || 0;
            const taxAmt = amntABT * (taxPct / 100);
            tr.querySelector('.inp-taxamt').value = taxAmt > 0 ? taxAmt.toFixed(2) : '';
            
            const amntA = amntABT + taxAmt;
            tr.querySelector('.inp-amnta').value = amntA > 0 ? amntA.toFixed(2) : '';
        }

        function calculateTotals() {
            let tPal = 0, tBox = 0, tKg = 0, tNet = 0;
            let tAmntABT = 0, tTaxAmt = 0, tAmntA = 0;
            
            container.querySelectorAll('#fm-lines-table tbody tr').forEach(tr => {
                tPal += parseFloat(tr.querySelector('.inp-palets').value) || 0;
                tBox += parseFloat(tr.querySelector('.inp-boxes').value) || 0;
                tKg += parseFloat(tr.querySelector('.inp-kgs').value) || 0;
                tNet += parseFloat(tr.querySelector('.inp-netamnt').value) || 0;
                
                tAmntABT += parseFloat(tr.querySelector('.inp-amntabt').value) || 0;
                tTaxAmt += parseFloat(tr.querySelector('.inp-taxamt').value) || 0;
                tAmntA += parseFloat(tr.querySelector('.inp-amnta').value) || 0;
            });
            
            container.querySelector('#tot-palets').value = tPal > 0 ? tPal.toFixed(2) : '';
            container.querySelector('#tot-boxes').value = tBox > 0 ? tBox.toFixed(2) : '';
            container.querySelector('#tot-kgs').value = tKg > 0 ? tKg.toFixed(2) : '';
            container.querySelector('#tot-net').value = tNet > 0 ? tNet.toFixed(2) : '';
            
            container.querySelector('#tot-inv-abt').value = tAmntABT > 0 ? tAmntABT.toFixed(2) : '';
            container.querySelector('#tot-inv-tax').value = tTaxAmt > 0 ? tTaxAmt.toFixed(2) : '';
            container.querySelector('#tot-inv-amnta').value = tAmntA > 0 ? tAmntA.toFixed(2) : '';
            
            // Set Finance panel Totals
            container.querySelector('#ts-goods-inv').textContent = tNet > 0 ? tNet.toFixed(2) : '0';
            container.querySelector('#ts-goods-inv-a').textContent = tAmntA > 0 ? tAmntA.toFixed(2) : '0';
        }

        async function saveFinance() {
            const payload = {
                invoice_number: container.querySelector('#fm-invoice').value,
                plate_number: container.querySelector('#fm-auto-num').value,
                loading_date: container.querySelector('#fm-dep-date').value || null,
                arrival_date: container.querySelector('#fm-arr-date').value || null,
                price_trance_toll: container.querySelector('#fm-price-toll').value,
                overhead_percent: container.querySelector('#fm-overhead').value,
                goods_currency: container.querySelector('#fm-currency').value,
                exchange_rate: container.querySelector('#fm-exch-rt').value,
                finance_truck_type_id: container.querySelector('#fm-type-truck').value || null,
                supplier_name: container.querySelector('#fm-supplier').value,
                finance_date: container.querySelector('#fm-date').value || null,
                finance_status: container.querySelector('#fm-status').value,
                finance_comments: container.querySelector('#fm-comments').value,
                lines: []
            };

            container.querySelectorAll('#fm-lines-table tbody tr').forEach(tr => {
                const prodId = tr.querySelector('.inp-prod-code').value;
                if (!prodId) return; // Skip empty rows
                
                payload.lines.push({
                    id: tr.getAttribute('data-line-id') || null,
                    product_id: prodId,
                    partner_id: null, // Backend set based on refName
                    boxes: tr.querySelector('.inp-boxes').value,
                    kgs_finance: tr.querySelector('.inp-kgs').value,
                    unit_price: tr.querySelector('.inp-unitpr').value,
                    net_amount: tr.querySelector('.inp-netamnt').value,
                    unit_price_a: tr.querySelector('.inp-unpra').value,
                    tax_percent: tr.querySelector('.inp-tax').value,
                    amount_a_bt: tr.querySelector('.inp-amntabt').value,
                    tax_amount: tr.querySelector('.inp-taxamt').value,
                    amount_a: tr.querySelector('.inp-amnta').value,
                    description_finance: tr.querySelector('.inp-desc').value,
                    customer: refName // use refName as customer grouping context
                });
            });

            try {
                const res = await fetch(`/api/v1/shipments/${kamionId}/finance`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(await res.text());
                
                alert('Pénzügyi adatok sikeresen mentve!');
                // trigger refresh if needed
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('kamion-saved'));
                }
            } catch (err) {
                alert('Mentés hiba: ' + err.message);
            }
        }

        container.querySelector('#fm-save').addEventListener('click', saveFinance);
        container.querySelector('#fm-close').addEventListener('click', () => {
            if (confirm('Biztosan kilép? A nem mentett adatok elvesznek.')) {
                container.closest('.mdi-window').querySelector('.mdi-window-close').click();
            }
        });
        
        const btnAddLine = container.querySelector('#fm-add-line');
        if (btnAddLine) {
            btnAddLine.addEventListener('click', () => {
                const tbody = container.querySelector('#fm-lines-table tbody');
                const currentRows = tbody.querySelectorAll('tr').length;
                appendRow(tbody, {}, currentRows);
            });
        }

        // Initialize
        await loadLookups();
        await loadShipment();
    });
}
