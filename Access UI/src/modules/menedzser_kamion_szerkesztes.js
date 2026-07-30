const GRID_ROWS = 25;

export function openMenedzserKamionWindow(windowManager, kamionId, refName, displayOrderNumber) {
    windowManager.open('menedzser_kamion_' + kamionId, 'Kamion pénzügyi szerkesztése...', async (container) => {
        const winEl = container.closest('.mdi-window');
        if (winEl) {
            winEl.style.width = '1300px';
            winEl.style.height = '800px';
            winEl.style.maxHeight = '95vh';
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
                    white-space: nowrap;
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

                /* Tab styles */
                .tab-bar {
                    display: flex;
                    gap: 0;
                    border-bottom: 2px solid #aaa;
                    margin-bottom: 4px;
                }
                .tab-btn {
                    padding: 5px 14px;
                    border: 1px solid #bbb;
                    border-bottom: none;
                    background: #e8e8e8;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    margin-right: 2px;
                    border-radius: 3px 3px 0 0;
                    color: #555;
                }
                .tab-btn.tab-active {
                    background: #fff;
                    border-color: #aaa;
                    color: #000;
                    border-bottom: 2px solid #fff;
                    margin-bottom: -2px;
                    z-index: 1;
                }
                .tab-btn:hover:not(.tab-active) {
                    background: #d8d8d8;
                }
                .tab-panel { display: none; }
                .tab-panel.tab-panel-active { display: block; }
            </style>
            
            <div style="flex: 1; overflow-y: auto; padding: 8px;">
                <div class="finance-panel finance-header-grid">
                    <!-- Bal oldal: Fő adatok -->
                    <div>
                        <div style="display:flex; align-items: flex-start; gap: 24px; margin-bottom: 8px;">
                            <div class="finance-title" id="fm-title" style="display:none; margin-bottom:0;">GHU</div>
                            <div style="font-weight:bold; margin-left: 8px; display:flex; flex-direction:column; line-height:1.2;">
                                <span style="color:var(--text-light, #6c757d); font-size:14px;">Season:</span>
                                <span id="fm-season" style="font-size:18px; color:var(--text-dark, #2c3e50);">25-26</span>
                            </div>
                            <div style="font-weight:bold; margin-left: 8px; display:flex; flex-direction:column; line-height:1.2;">
                                <span style="color:var(--text-light, #6c757d); font-size:14px;">Truck No:</span>
                                <span id="fm-truck-no" style="font-size:18px; color:var(--text-dark, #2c3e50);">209</span>
                            </div>
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
                            <select id="fm-currency" style="width:70px;">
                                <option value="EUR">EUR</option>
                                <option value="HUF">HUF</option>
                                <option value="USD">USD</option>
                            </select>
                            <label style="margin-left:8px;">ExchRt:</label>
                            <input type="number" step="0.01" id="fm-exch-rt" style="width: 70px;">
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
                                    <td style="text-align:left; font-weight:bold;">Transport &amp; Other:</td>
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

                <!-- === FÜLES TÁBLA TERÜLET === -->
                <div class="finance-panel" style="padding: 4px 12px;">
                    <!-- Fül fejlécek -->
                    <div class="tab-bar">
                        <button class="tab-btn tab-active" data-tab="goods">Goods</button>
                        <button class="tab-btn" data-tab="transport">Transport &amp; Other</button>
                        <button class="tab-btn" data-tab="unitcosts">Unit Costs</button>
                    </div>

                    <!-- ===== GOODS FÜL ===== -->
                    <div class="tab-panel tab-panel-active" id="tab-goods">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 4px; align-items:center;">
                            <div style="display:flex; align-items:center; gap: 4px;">
                                <button class="action-btn" id="fm-delete-line">Delete line</button>
                                <button class="action-btn">Update</button>
                                <button class="action-btn" id="fm-add-line" style="background:#4caf50; color:white;">Add line</button>
                                <span style="margin-left:16px; font-weight:bold;">Currency:</span>
                                <select id="fm-currency-2" style="padding: 2px;">
                                    <option value="EUR">EUR</option>
                                    <option value="HUF">HUF</option>
                                    <option value="USD">USD</option>
                                </select>
                                <span style="margin-left:12px; font-weight:bold;">ExchRt:</span>
                                <input type="number" step="0.01" id="fm-exch-rt-2" style="width: 80px; padding: 2px;">
                            </div>
                        </div>
                        <div style="overflow-x:auto;">
                        <table class="grid-table" id="fm-lines-table">
                            <thead>
                                <tr style="background:var(--bg-light); border-bottom: 2px solid var(--border);">
                                    <th colspan="4" style="text-align:right; font-weight:bold; padding-right:8px;">Totals:</th>
                                    <th><input type="text" id="tot-palets" readonly style="width:60px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th></th>
                                    <th><input type="text" id="tot-boxes" readonly style="width:60px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th><input type="text" id="tot-kgs" readonly style="width:60px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th></th>
                                    <th><input type="text" id="tot-net" readonly style="width:80px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th colspan="2" style="text-align:right; font-weight:bold; padding-right:8px;">Tot Invoice A</th>
                                    <th><input type="text" id="tot-inv-abt" readonly style="width:80px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th><input type="text" id="tot-inv-tax" readonly style="width:60px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th><input type="text" id="tot-inv-amnta" readonly style="width:80px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                </tr>
                                <tr>
                                    <th>Lin</th>
                                    <th style="display:none;">Code Prod</th>
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

                    <!-- ===== TRANSPORT & OTHER FÜL ===== -->
                    <div class="tab-panel" id="tab-transport">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 4px; align-items:center;">
                            <div style="display:flex; align-items:center; gap: 4px;">
                                <button class="action-btn" id="tr-delete-line">Delete line</button>
                                <button class="action-btn" id="tr-update">Update</button>
                                <button class="action-btn" id="tr-add-line" style="background:#4caf50; color:white;">Add line</button>
                            </div>
                        </div>
                        <div style="overflow-x:auto;">
                        <table class="grid-table" id="tr-lines-table">
                            <thead>
                                <tr>
                                    <th>Lin</th>
                                    <th>DATEc</th>
                                    <th>TypeSupp</th>
                                    <th>Supplier</th>
                                    <th>Invoice N</th>
                                    <th>TypeA</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>TpTax</th>
                                    <th>Tax</th>
                                    <th>Tot Invoice</th>
                                    <th>Cur</th>
                                    <th>ExchRt</th>
                                    <th>Total Inv Local</th>
                                    <th>IdEmpr</th>
                                    <th>Season</th>
                                    <th>TruckNr</th>
                                </tr>
                            </thead>
                            <tbody id="tr-lines-tbody">
                                <!-- Generált sorok -->
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <!-- ===== UNIT COSTS FÜL ===== -->
                    <div class="tab-panel" id="tab-unitcosts">
                        <div style="overflow-x:auto;">
                        <table class="grid-table" id="uc-lines-table">
                            <thead>
                                <tr style="background:var(--bg-light); border-bottom: 2px solid var(--border);">
                                    <th colspan="5" style="text-align:left; font-style:italic;">(Currency: <span id="uc-currency-label">HUF</span>)</th>
                                    <th><input type="text" id="uc-tot-pr" readonly style="width:80px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th><input type="text" id="uc-tot-trans" readonly style="width:80px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th><input type="text" id="uc-tot-vcost" readonly style="width:80px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th><input type="text" id="uc-tot-oh" readonly style="width:80px; text-align:right; background:#eee; font-weight:bold; border:none; padding:2px;"></th>
                                    <th colspan="2" style="text-align:center; background:#aaa; color:#000;">PER KG</th>
                                    <th colspan="2" style="text-align:center; background:#aaa; color:#000;">PER BOX</th>
                                    <th></th>
                                </tr>
                                <tr>
                                    <th>Lin</th>
                                    <th>Product</th>
                                    <th>Description</th>
                                    <th>Netto(kgs)</th>
                                    <th>Kgs/Box</th>
                                    <th>Pr/kg</th>
                                    <th>Trans/kg</th>
                                    <th>V.Cost/kg</th>
                                    <th>OH/kg</th>
                                    <th style="background:#cc99cc; color:#fff;">TotCost/kg</th>
                                    <th style="background:#cc99cc; color:#fff;">ÁFA %</th>
                                    <th style="background:#cc99cc; color:#fff;">+VAT /kg</th>
                                    <th style="background:#993366; color:#fff;">TotCost/Box</th>
                                    <th style="background:#993366; color:#fff;">+VAT /Box</th>
                                    <th>V.Cost/kg(EUR)</th>
                                </tr>
                            </thead>
                            <tbody id="uc-lines-tbody">
                                <!-- Generált sorok -->
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // === Adatok ===
        let productsData = [];
        let financeTruckTypes = [];
        let taxRatesData = [];
        let currenciesData = [];
        let partnersData = [];
        let shipmentData = null;
        let linesData = [];
        let transportLinesData = [];
        let unitCostLinesData = [];
        let deletedGoodsLineIds = [];
        let transportersData = [];

        // === Tab váltás ===
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-active'));
                container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('tab-panel-active'));
                btn.classList.add('tab-active');
                const tabId = 'tab-' + btn.dataset.tab;
                container.querySelector('#' + tabId).classList.add('tab-panel-active');
            });
        });

        // === Lookup adatok betöltése ===
        async function loadLookups() {
            try {
                const [prodRes, typeRes, taxRes, currRes, partnerRes, transpRes] = await Promise.all([
                    fetch('/api/v1/admin/products'),
                    fetch('/api/v1/admin/finance_truck_types'),
                    fetch('/api/v1/admin/finance_tax_rates'),
                    fetch('/api/v1/admin/currencies'),
                    fetch('/api/v1/partners'),
                    fetch('/api/v1/transporters')
                ]);
                productsData = prodRes.ok ? await prodRes.json() : [];
                financeTruckTypes = typeRes.ok ? await typeRes.json() : [];
                taxRatesData = taxRes.ok ? await taxRes.json() : [];
                currenciesData = currRes.ok ? await currRes.json() : [];
                partnersData = partnerRes.ok ? await partnerRes.json() : [];
                transportersData = transpRes.ok ? await transpRes.json() : [];

                const typeSelect = container.querySelector('#fm-type-truck');
                financeTruckTypes.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.name;
                    typeSelect.appendChild(opt);
                });

                // Currencies legördülők feltöltése az Admin táblából
                const currOpts = currenciesData.map(c => `<option value="${c.code}">${c.code}</option>`).join('');
                container.querySelector('#fm-currency').innerHTML = currOpts;
                container.querySelector('#fm-currency-2').innerHTML = currOpts;

            } catch (err) {
                console.error("Hiba a szótárak betöltésekor", err);
            }
        }

        // === Kamion adat betöltése ===
        async function loadShipment() {
            try {
                const [shipRes, transRes, ucRes] = await Promise.all([
                    fetch(`/api/v1/shipments/${kamionId}?ref_name=${encodeURIComponent(refName)}`),
                    fetch(`/api/v1/finance-transport-lines?shipment_id=${kamionId}&ref_name=${encodeURIComponent(refName)}`),
                    fetch(`/api/v1/finance-unit-cost-lines?shipment_id=${kamionId}&ref_name=${encodeURIComponent(refName)}`)
                ]);
                if (!shipRes.ok) throw new Error('Nem sikerült betölteni a kamiont');
                const data = await shipRes.json();
                shipmentData = data.shipment;
                container.dataset.transporter = shipmentData.transporter_name || '';
                const rawLines = data.lines || [];
                linesData = rawLines.filter(l => (l.customer || l.cust || '').toUpperCase().includes('GHU'));
                transportLinesData = transRes.ok ? await transRes.json() : [];
                unitCostLinesData = ucRes.ok ? await ucRes.json() : [];
                renderData();
            } catch (err) {
                alert(err.message);
                container.closest('.mdi-window').querySelector('.mdi-window-close').click();
            }
        }

        // === Header renderelés ===
        function renderData() {
            if (!shipmentData) return;

            const orderToParse = displayOrderNumber || shipmentData.order_number || '';
            const match = orderToParse.match(/^([a-zA-Z]+)\s*(.*)$/);
            const idEmpr = match ? match[1].toUpperCase() : 'N/A';
            const truckNr = match ? match[2] : orderToParse;
            
            container.querySelector('#fm-title').style.display = 'none';
            container.querySelector('#fm-title').textContent = idEmpr;
            
            const fmTruckNo = container.querySelector('#fm-truck-no');
            fmTruckNo.textContent = orderToParse; // Display "GHU 199"
            fmTruckNo.dataset.trucknr = truckNr; // Keep "199" for underlying logic

            container.querySelector('#fm-invoice').value = (linesData.length > 0 && linesData[0].invoice_number_finance) ? linesData[0].invoice_number_finance : (shipmentData.invoice_number || '');
            container.querySelector('#fm-auto-num').value = shipmentData.plate_number || '';
            container.querySelector('#fm-dep-date').value = shipmentData.loading_date ? shipmentData.loading_date.split('T')[0] : '';
            container.querySelector('#fm-arr-date').value = shipmentData.arrival_date ? shipmentData.arrival_date.split('T')[0] : '';
            container.querySelector('#fm-price-toll').value = shipmentData.price_trance_toll || '';
            container.querySelector('#fm-overhead').value = shipmentData.overhead_percent || '';
            container.querySelector('#fm-currency').value = shipmentData.goods_currency || 'EUR';
            container.querySelector('#fm-currency-2').value = shipmentData.goods_currency || 'EUR';
            container.querySelector('#fm-exch-rt').value = shipmentData.exchange_rate || '';
            container.querySelector('#fm-exch-rt-2').value = shipmentData.exchange_rate || '';
            container.querySelector('#fm-comments').value = shipmentData.finance_comments || '';
            container.querySelector('#fm-type-truck').value = shipmentData.finance_truck_type_id || '';
            container.querySelector('#fm-supplier').value = refName || shipmentData.supplier_name || '';
            container.querySelector('#fm-date').value = shipmentData.finance_date ? shipmentData.finance_date.split('T')[0] : '';
            container.querySelector('#fm-status').value = shipmentData.finance_status || 'Open';

            // Season és Truck info kinyerése
            const seasonVal = shipmentData.season || '25-26';
            const truckNoVal = truckNr;
            container.querySelector('#fm-season').textContent = seasonVal;

            container.querySelector('#uc-currency-label').textContent = shipmentData.goods_currency || 'HUF';

            renderLines();
            renderTransportLines(seasonVal, truckNoVal);
            renderUnitCostLines();
            updateSummaryTable();
        }

        // ============================
        // GOODS tábla
        // ============================
        function renderLines() {
            const tbody = container.querySelector('#fm-lines-table tbody');
            tbody.innerHTML = '';
            const numRows = Math.max(1, linesData.length);
            for (let i = 0; i < numRows; i++) {
                const line = linesData[i] || {};
                appendGoodsRow(tbody, line, i);
            }
            calculateTotals();
        }

        function appendGoodsRow(tbody, line, i) {
            const dlCodeId = `dl-prod-code-${i}`;
            const dlNameId = `dl-prod-name-${i}`;
            let dlCodeItems = '';
            let dlNameItems = '';
            productsData.forEach(p => {
                dlCodeItems += `<option value="${p.code || ''}" data-id="${p.id}"></option>`;
                dlNameItems += `<option value="${p.name}" data-id="${p.id}"></option>`;
            });
            const matchedProduct = productsData.find(p => p.id === line.product_id);
            const displayCode = matchedProduct ? (matchedProduct.code || '') : (line.prod_code || '');
            const displayName = matchedProduct ? matchedProduct.name : (line.prod || line.productName || '');
            let taxOptions = '<option value="0">0.00</option>';
            taxRatesData.forEach(t => {
                const selected = (parseFloat(line.tax_percent) === parseFloat(t.rate_value)) ? 'selected' : '';
                taxOptions += `<option value="${t.rate_value}" ${selected}>${t.rate_value}</option>`;
            });
            const tr = document.createElement('tr');
            tr.setAttribute('data-index', i);
            tr.setAttribute('data-line-id', line.id || '');
            tr.setAttribute('data-product-id', line.product_id || '');
            tr.innerHTML = `
                    <td style="text-align:center;" class="row-num"><input type="checkbox" class="row-chk"> ${i + 1}</td>
                    <td style="display:none;"><input type="text" class="inp-prod-code" list="${dlCodeId}" value="${displayCode}" style="width:80px;"><datalist id="${dlCodeId}">${dlCodeItems}</datalist></td>
                    <td><input type="text" class="inp-prod-name" list="${dlNameId}" value="${displayName}" style="width:160px;"><datalist id="${dlNameId}">${dlNameItems}</datalist></td>
                    <td style="text-align:center;">c</td>
                    <td><input type="text" class="inp-desc" value="${line.description_finance || line.comment || ''}"></td>
                    <td><input type="number" step="0.01" class="inp-palets" value="${((parseFloat(line.euro_palets) || 0) + (parseFloat(line.normal_palets) || 0)) || ''}" readonly style="background:#eee;"></td>
                    <td style="text-align:center;">u</td>
                    <td><input type="number" step="0.01" class="inp-boxes num-calc" value="${line.boxes || ''}"></td>
                    <td><input type="number" step="0.01" class="inp-kgs num-calc" value="${line.kgs_finance || ''}"></td>
                    <td><input type="number" step="0.01" class="inp-unitpr num-calc" value="${line.unit_price || ''}"></td>
                    <td><input type="number" step="0.01" class="inp-netamnt num-calc" value="${line.net_amount || ''}" readonly style="background:#f0f8ff;"></td>
                    <td><input type="number" step="0.01" class="inp-unpra num-calc" value="${line.unit_price_a || ''}" readonly style="background:#f0f8ff;"></td>
                    <td><select class="inp-tax num-calc">${taxOptions}</select></td>
                    <td><input type="number" step="0.01" class="inp-amntabt num-calc" value="${line.amount_a_bt || ''}" readonly style="background:#f0f8ff;"></td>
                    <td><input type="number" step="0.01" class="inp-taxamt" value="${line.tax_amount || ''}" readonly style="background:#f0f8ff;"></td>
                    <td><input type="number" step="0.01" class="inp-amnta" value="${line.amount_a || ''}" readonly style="background:#f0f8ff;"></td>
                `;
            tbody.appendChild(tr);

            const inpCode = tr.querySelector('.inp-prod-code');
            const inpName = tr.querySelector('.inp-prod-name');
            inpCode.addEventListener('change', () => {
                const match = productsData.find(p => (p.code || '').toLowerCase() === inpCode.value.toLowerCase());
                if (match) { inpName.value = match.name; tr.setAttribute('data-product-id', match.id); }
                else { tr.setAttribute('data-product-id', ''); }
            });
            inpName.addEventListener('change', () => {
                const match = productsData.find(p => p.name.toLowerCase() === inpName.value.toLowerCase());
                if (match) { inpCode.value = match.code || ''; tr.setAttribute('data-product-id', match.id); }
                else { tr.setAttribute('data-product-id', ''); }
            });
            tr.querySelectorAll('.num-calc').forEach(inp => {
                inp.addEventListener('input', () => { calculateGoodsRow(tr); calculateTotals(); });
            });
        }

        function calculateGoodsRow(tr) {
            const kgs = parseFloat(tr.querySelector('.inp-kgs').value) || 0;
            const unitPr = parseFloat(tr.querySelector('.inp-unitpr').value) || 0;
            const netAmnt = kgs * unitPr;
            tr.querySelector('.inp-netamnt').value = netAmnt > 0 ? netAmnt.toFixed(2) : '';
            tr.querySelector('.inp-unpra').value = unitPr > 0 ? unitPr.toFixed(2) : '';
            tr.querySelector('.inp-amntabt').value = netAmnt > 0 ? netAmnt.toFixed(2) : '';
            const taxPct = parseFloat(tr.querySelector('.inp-tax').value) || 0;
            const taxAmt = netAmnt * (taxPct / 100);
            const totalInvoice = netAmnt + taxAmt;
            tr.querySelector('.inp-taxamt').value = taxAmt > 0 ? taxAmt.toFixed(2) : '';
            tr.querySelector('.inp-amnta').value = totalInvoice > 0 ? totalInvoice.toFixed(2) : '';

            const index = Array.from(tr.parentNode.children).indexOf(tr);
            const ucRow = container.querySelector(`#uc-lines-tbody tr:nth-child(${index + 1})`);
            if (ucRow) {
                calculateUnitCostRow(ucRow);
                calculateUnitCostTotals();
            }
        }

        function calculateTotals() {
            updateSummaryTable();
        }

        // ============================
        // TRANSPORT & OTHER tábla
        // ============================
        function getOrderPrefix() {
            const orderToParse = displayOrderNumber || (shipmentData ? shipmentData.order_number : '') || '';
            const match = orderToParse.match(/^([a-zA-Z]+)/);
            return match ? match[1].toUpperCase() : 'GHU';
        }

        function renderTransportLines(seasonVal, truckNoVal) {
            const tbody = container.querySelector('#tr-lines-tbody');
            tbody.innerHTML = '';
            const idEmprVal = getOrderPrefix();
            const numRows = Math.max(1, transportLinesData.length);
            for (let i = 0; i < numRows; i++) {
                const line = transportLinesData[i] || {};
                appendTransportRow(tbody, line, i, idEmprVal, seasonVal, truckNoVal);
            }
        }

        function buildCurrencyOptions(selectedCode) {
            return currenciesData.map(c =>
                `<option value="${c.code}" ${c.code === selectedCode ? 'selected' : ''}>${c.code}</option>`
            ).join('');
        }

        function buildPartnerDatalist(dlId) {
            const items = partnersData.map(p => `<option value="${p.name}" data-id="${p.id}"></option>`).join('');
            return `<datalist id="${dlId}">${items}</datalist>`;
        }

        function buildTransporterSelect(selectedVal) {
            let opts = `<option value="">-- Válasszon --</option>`;
            transportersData.forEach(t => {
                const sel = (selectedVal === t.name) ? 'selected' : '';
                opts += `<option value="${t.name}" ${sel}>${t.name}</option>`;
            });
            return `<select class="tr-supplier" style="width:130px;">${opts}</select>`;
        }

        function buildTaxOptions(selectedVal) {
            let opts = `<option value="0">0.000</option>`;
            taxRatesData.forEach(t => {
                const sel = (parseFloat(selectedVal) === parseFloat(t.rate_value)) ? 'selected' : '';
                opts += `<option value="${t.rate_value}" ${sel}>${t.rate_value}</option>`;
            });
            return opts;
        }

        function appendTransportRow(tbody, line, i, idEmprVal, seasonVal, truckNoVal) {
            const dlId = `dl-tr-supp-${i}`;
            const isNew = line._isNew;
            const tr = document.createElement('tr');
            tr.setAttribute('data-tr-index', i);
            const currCode = line.currency_code || (currenciesData.length > 0 ? currenciesData[0].code : 'EUR');

            const headerSupplier = container.querySelector('#fm-supplier') ? container.querySelector('#fm-supplier').value : '';
            const transporterCompany = container.dataset.transporter || '';
            let initialSupplier = line.partner_name || '';
            if (isNew) {
                initialSupplier = headerSupplier;
            } else {
                if (!line.partner_name) {
                    initialSupplier = (line.type_supp === 'Trasport') ? transporterCompany : headerSupplier;
                }
            }

            const supplierCell = `<input type="text" class="tr-supplier" value="${initialSupplier}" style="width:130px;" readonly>`;

            tr.innerHTML = `
                <td style="text-align:center; width:30px;"><input type="checkbox" class="tr-row-chk"> ${i + 1}</td>
                <td><input type="date" class="tr-date" value="${isNew ? '' : (line.date_entry ? line.date_entry.split('T')[0] : (container.querySelector('#fm-dep-date').value || ''))}" style="width:95px;"></td>
                <td>
                    <select class="tr-type-supp" style="width:80px;">
                        <option value="Supplier" ${line.type_supp === 'Supplier' ? 'selected' : ''}>Supplier</option>
                        <option value="Trasport" ${line.type_supp === 'Trasport' ? 'selected' : ''}>Trasport</option>
                    </select>
                </td>
                <td>${supplierCell}</td>
                <td><input type="text" class="tr-invoice" value="${line.invoice_number || ''}" style="width:80px;"></td>
                <td><input type="text" class="tr-type-a" value="${line.type_a || 'A'}" style="width:40px;"></td>
                <td><input type="text" class="tr-desc" value="${line.description || ''}" style="width:100px;"></td>
                <td><input type="number" step="0.01" class="tr-amount tr-calc" value="${line.amount || ''}" style="width:80px;"></td>
                <td><select class="tr-tax-pct tr-calc" style="width:60px;">${buildTaxOptions(line.tax_percent)}</select></td>
                <td><input type="number" step="0.01" class="tr-tax-amt" value="${line.tax_amount || ''}" readonly style="background:#f0f8ff; width:70px;"></td>
                <td><input type="number" step="0.01" class="tr-tot-inv" value="${line.tot_invoice || ''}" readonly style="background:#f0f8ff; width:80px;"></td>
                <td><select class="tr-cur tr-calc" style="width:55px;">${buildCurrencyOptions(currCode)}</select></td>
                <td><input type="number" step="0.001" class="tr-exch-rt tr-calc" value="${line.exchange_rate || container.querySelector('#fm-exch-rt').value || ''}" style="width:70px;"></td>
                <td><input type="number" step="0.01" class="tr-tot-local" value="${line.total_inv_local || ''}" readonly style="background:#f0f8ff; width:90px;"></td>
                <td><input type="text" class="tr-id-empr" value="${line.id_empr ? (String(line.id_empr).match(/^([a-zA-Z]+)/) ? String(line.id_empr).match(/^([a-zA-Z]+)/)[1].toUpperCase() : idEmprVal) : idEmprVal}" readonly style="background:#eee; width:45px;"></td>
                <td><input type="text" class="tr-season" value="${line.season || seasonVal}" readonly style="background:#eee; width:45px;"></td>
                <td><input type="text" class="tr-truck-nr" value="${line.truck_nr || truckNoVal}" readonly style="background:#eee; width:55px;"></td>
            `;
            tbody.appendChild(tr);

            // Kalkulációk
            tr.querySelectorAll('.tr-calc').forEach(inp => {
                inp.addEventListener('input', () => calculateTransportRow(tr));
            });

            // TypeSupp legördülő változása
            tr.querySelector('.tr-type-supp').addEventListener('change', (e) => {
                const supplierInput = tr.querySelector('.tr-supplier');
                if (e.target.value === 'Supplier') {
                    supplierInput.value = container.querySelector('#fm-supplier').value;
                } else if (e.target.value === 'Trasport') {
                    supplierInput.value = container.dataset.transporter || '';
                }
            });
        }

        function calculateTransportRow(tr) {
            const amount = parseFloat(tr.querySelector('.tr-amount').value) || 0;
            const taxPct = parseFloat(tr.querySelector('.tr-tax-pct').value) || 0;
            const taxAmt = amount * (taxPct / 100);
            const totInv = amount + taxAmt;
            const exchRt = parseFloat(tr.querySelector('.tr-exch-rt').value) || 0;
            const totLocal = totInv * exchRt;
            tr.querySelector('.tr-tax-amt').value = taxAmt > 0 ? taxAmt.toFixed(2) : '';
            tr.querySelector('.tr-tot-inv').value = totInv > 0 ? totInv.toFixed(2) : '';
            tr.querySelector('.tr-tot-local').value = totLocal > 0 ? totLocal.toFixed(2) : '';
            updateTransportSummary();

            container.querySelectorAll('#uc-lines-tbody tr').forEach(ucRow => calculateUnitCostRow(ucRow));
            calculateUnitCostTotals();
        }

        function updateTransportSummary() {
            updateSummaryTable();
        }

        function updateSummaryTable() {
            // Goods calculations
            let tPal = 0, tBox = 0, tKg = 0, tNet = 0, tAmntABT = 0, tTaxAmt = 0, tAmntA = 0;
            container.querySelectorAll('#fm-lines-table tbody tr').forEach(tr => {
                tPal += parseFloat(tr.querySelector('.inp-palets')?.value) || 0;
                tBox += parseFloat(tr.querySelector('.inp-boxes')?.value) || 0;
                tKg += parseFloat(tr.querySelector('.inp-kgs')?.value) || 0;
                tNet += parseFloat(tr.querySelector('.inp-netamnt')?.value) || 0;
                tAmntABT += parseFloat(tr.querySelector('.inp-amntabt')?.value) || 0;
                tTaxAmt += parseFloat(tr.querySelector('.inp-taxamt')?.value) || 0;
                tAmntA += parseFloat(tr.querySelector('.inp-amnta')?.value) || 0;
            });
            container.querySelector('#tot-palets').value = tPal > 0 ? tPal.toFixed(2) : '';
            container.querySelector('#tot-boxes').value = tBox > 0 ? tBox.toFixed(2) : '';
            container.querySelector('#tot-kgs').value = tKg > 0 ? tKg.toFixed(2) : '';
            container.querySelector('#tot-net').value = tNet > 0 ? tNet.toFixed(2) : '';
            container.querySelector('#tot-inv-abt').value = tAmntABT > 0 ? tAmntABT.toFixed(2) : '';
            container.querySelector('#tot-inv-tax').value = tTaxAmt > 0 ? tTaxAmt.toFixed(2) : '';
            container.querySelector('#tot-inv-amnta').value = tAmntA > 0 ? tAmntA.toFixed(2) : '';

            const exchRt = parseFloat(container.querySelector('#fm-exch-rt')?.value) || 1;
            const goodsInvHuf = tAmntA * exchRt;
            
            container.querySelector('#ts-goods-inv').textContent = goodsInvHuf > 0 ? Math.round(goodsInvHuf) : '0';
            container.querySelector('#ts-goods-inv-a').textContent = tAmntA > 0 ? tAmntA.toFixed(2) : '0';
            container.querySelector('#ts-goods-bal-a').textContent = tAmntA > 0 ? tAmntA.toFixed(2) : '0';

            // Transport & Other calculations
            let totTransA = 0;
            container.querySelectorAll('#tr-lines-tbody tr').forEach(tr => {
                totTransA += parseFloat(tr.querySelector('.tr-tot-inv')?.value) || 0;
            });
            const transInvHuf = totTransA * exchRt;

            container.querySelector('#ts-trans-inv').textContent = transInvHuf > 0 ? Math.round(transInvHuf) : '0';
            container.querySelector('#ts-trans-inv-a').textContent = totTransA > 0 ? totTransA.toFixed(2) : '0';
            container.querySelector('#ts-trans-bal-a').textContent = totTransA > 0 ? totTransA.toFixed(2) : '0';

            // Totals row calculations
            const totInvHuf = goodsInvHuf + transInvHuf;
            const totInvA = tAmntA + totTransA;
            const totBalA = tAmntA + totTransA;

            container.querySelector('#ts-tot-inv').textContent = totInvHuf > 0 ? Math.round(totInvHuf) : '0';
            container.querySelector('#ts-tot-inv-a').textContent = totInvA > 0 ? totInvA.toFixed(2) : '0';
            container.querySelector('#ts-tot-bal-a').textContent = totBalA > 0 ? totBalA.toFixed(2) : '0';

            // Transfers Totals (EUR)
            const totalTransfersEur = tAmntA + totTransA;
            if (container.querySelector('#ts-transf-inv')) {
                container.querySelector('#ts-transf-inv').textContent = totalTransfersEur > 0 ? totalTransfersEur.toFixed(2) : '0';
            }
            if (container.querySelector('#ts-transf-inv-a')) {
                container.querySelector('#ts-transf-inv-a').textContent = totalTransfersEur > 0 ? totalTransfersEur.toFixed(2) : '0';
            }
        }

        // ============================
        // UNIT COSTS tábla
        // ============================
        function renderUnitCostLines() {
            const tbody = container.querySelector('#uc-lines-tbody');
            tbody.innerHTML = '';

            let dataSource = unitCostLinesData;
            if (unitCostLinesData.length === 0 && linesData.length > 0) {
                dataSource = linesData.map(l => {
                    const matchedProduct = productsData.find(p => p.id === l.product_id);
                    const prodName = matchedProduct ? matchedProduct.name : (l.prod || l.productName || '');

                    const kgs = parseFloat(l.kgs_finance) || 0;
                    const boxes = parseFloat(l.boxes) || 0;
                    const kgsPerBox = boxes > 0 ? (kgs / boxes) : 0;

                    return {
                        product_name: prodName,
                        description: l.description_finance || l.comment || '',
                        netto_kgs: kgs,
                        kgs_per_box: kgsPerBox.toFixed(2)
                    };
                });
            }

            const numRows = Math.max(1, dataSource.length);
            for (let i = 0; i < numRows; i++) {
                const line = dataSource[i] || {};
                appendUnitCostRow(tbody, line, i);
            }
            calculateUnitCostTotals();
        }

        function appendUnitCostRow(tbody, line, i) {
            const dlNameId = `dl-uc-prod-name-${i}`;
            let dlNameItems = '';
            productsData.forEach(p => {
                dlNameItems += `<option value="${p.name}" data-id="${p.id}"></option>`;
            });

            const tr = document.createElement('tr');
            tr.setAttribute('data-uc-index', i);
            tr.innerHTML = `
                <td style="text-align:center; width:30px;"><input type="checkbox" class="uc-row-chk"> ${i + 1}</td>
                <td><input type="text" class="uc-product" list="${dlNameId}" value="${line.product_name || ''}" style="width:160px;"><datalist id="${dlNameId}">${dlNameItems}</datalist></td>
                <td><input type="text" class="uc-desc" value="${line.description || ''}" style="width:120px;"></td>
                <td><input type="number" step="0.01" class="uc-netto" value="${line.netto_kgs || ''}" readonly style="background:#eee; width:70px;"></td>
                <td><input type="number" step="0.01" class="uc-kgs-box" value="${line.kgs_per_box || ''}" readonly style="background:#eee; width:60px;"></td>
                <td><input type="number" step="0.001" class="uc-pr-kg" value="${line.price_per_kg || ''}" readonly style="background:#eee; width:60px;"></td>
                <td><input type="number" step="0.001" class="uc-trans-kg" value="${line.trans_per_kg || ''}" readonly style="background:#eee; width:60px;"></td>
                <td><input type="number" step="0.001" class="uc-vcost-kg" value="${line.v_cost_per_kg || ''}" readonly style="background:#eee; width:65px;"></td>
                <td><input type="number" step="0.001" class="uc-oh-kg" value="${line.oh_per_kg || ''}" readonly style="background:#eee; width:60px;"></td>
                <td><input type="number" step="0.01" class="uc-totcost-kg" value="${line.tot_cost_per_kg || ''}" readonly style="background:#f0f8ff; width:70px;"></td>
                <td><select class="uc-tax-pct uc-calc" style="width:60px;">${buildTaxOptions(line.tax_percent || 0)}</select></td>
                <td><input type="number" step="0.01" class="uc-vat-kg" value="${line.vat_per_kg || ''}" readonly style="background:#f0f8ff; font-weight:bold; width:70px;"></td>
                <td><input type="number" step="0.01" class="uc-totcost-box" value="${line.tot_cost_per_box || ''}" readonly style="background:#f0f8ff; width:80px;"></td>
                <td><input type="number" step="0.01" class="uc-vat-box" value="${line.vat_per_box || ''}" readonly style="background:#f0f8ff; font-weight:bold; width:80px;"></td>
                <td><input type="number" step="0.01" class="uc-vcost-kg-eur" value="${line.v_cost_per_kg_eur || ''}" readonly style="background:#eee; width:60px;"></td>
            `;
            tbody.appendChild(tr);

            tr.querySelectorAll('.uc-calc').forEach(inp => {
                inp.addEventListener('input', () => { calculateUnitCostRow(tr); calculateUnitCostTotals(); });
            });
        }

        function calculateUnitCostRow(tr) {
            const index = Array.from(tr.parentNode.children).indexOf(tr);
            const goodsRow = container.querySelector(`#fm-lines-table tbody tr:nth-child(${index + 1})`);

            let itemKg = 0;
            let itemPallets = 0;
            let itemBoxes = 0;
            let itemUnitPr = 0;
            let goodsTaxPct = 0;

            if (goodsRow) {
                itemKg = parseFloat(goodsRow.querySelector('.inp-kgs').value) || 0;
                itemPallets = parseFloat(goodsRow.querySelector('.inp-palets').value) || 0;
                itemBoxes = parseFloat(goodsRow.querySelector('.inp-boxes').value) || 0;
                itemUnitPr = parseFloat(goodsRow.querySelector('.inp-unitpr').value) || 0;
                goodsTaxPct = parseFloat(goodsRow.querySelector('.inp-tax').value) || 0;
            }

            const exchRt = parseFloat(container.querySelector('#fm-exch-rt').value) || 0;

            const netto = itemKg;
            const kgsBox = itemBoxes > 0 ? (netto / itemBoxes) : 0;
            const prKg = exchRt * itemUnitPr;

            let totalTransport = 0;
            container.querySelectorAll('#tr-lines-tbody tr').forEach(tRow => {
                totalTransport += parseFloat(tRow.querySelector('.tr-amount').value) || 0;
            });

            let totalPallets = 0;
            container.querySelectorAll('#fm-lines-table tbody tr').forEach(gRow => {
                totalPallets += parseFloat(gRow.querySelector('.inp-palets').value) || 0;
            });

            let transKg = 0;
            if (totalPallets > 0 && itemKg > 0 && itemPallets > 0) {
                transKg = ((totalTransport / totalPallets) * exchRt) / (itemKg / itemPallets);
            }

            tr.querySelector('.uc-netto').value = netto > 0 ? netto.toFixed(2) : '';
            tr.querySelector('.uc-kgs-box').value = kgsBox > 0 ? kgsBox.toFixed(2) : '';
            tr.querySelector('.uc-pr-kg').value = prKg > 0 ? prKg.toFixed(2) : '';
            tr.querySelector('.uc-trans-kg').value = transKg > 0 ? transKg.toFixed(2) : '';

            const pr = prKg;
            const trans = transKg;
            const kgsBoxCalc = kgsBox;
            const overheadPct = parseFloat(container.querySelector('#fm-overhead').value) || 0;
            // exchRt is already defined above

            const vCost = pr + trans;
            const oh = vCost * (overheadPct / 100);
            const totCost = vCost + oh;

            // Sync tax dropdown with Goods tab if available, else read from UI
            const taxDropdown = tr.querySelector('.uc-tax-pct');
            if (goodsRow && taxDropdown.value === "0" && goodsTaxPct > 0) {
                taxDropdown.value = goodsTaxPct;
            }
            const taxPct = parseFloat(taxDropdown.value) || 0;

            const vatKg = totCost * (1 + taxPct / 100);

            const totCostBox = totCost * kgsBoxCalc;
            const vatBox = totCostBox * (1 + taxPct / 100);
            const vCostEur = exchRt > 0 ? (vCost / exchRt) : 0;

            tr.querySelector('.uc-vcost-kg').value = vCost > 0 ? vCost.toFixed(2) : '';
            tr.querySelector('.uc-oh-kg').value = oh > 0 ? oh.toFixed(2) : '';
            tr.querySelector('.uc-totcost-kg').value = totCost > 0 ? totCost.toFixed(2) : '';
            tr.querySelector('.uc-vat-kg').value = vatKg > 0 ? vatKg.toFixed(2) : '';
            tr.querySelector('.uc-totcost-box').value = totCostBox > 0 ? totCostBox.toFixed(2) : '';
            tr.querySelector('.uc-vat-box').value = vatBox > 0 ? vatBox.toFixed(2) : '';
            tr.querySelector('.uc-vcost-kg-eur').value = vCostEur > 0 ? vCostEur.toFixed(2) : '';
        }

        function calculateUnitCostTotals() {
            let tPr = 0, tTrans = 0, tVCost = 0, tOh = 0;
            container.querySelectorAll('#uc-lines-tbody tr').forEach(tr => {
                const netto = parseFloat(tr.querySelector('.uc-netto').value) || 0;
                const pr = parseFloat(tr.querySelector('.uc-pr-kg').value) || 0;
                const trans = parseFloat(tr.querySelector('.uc-trans-kg').value) || 0;
                const vcost = parseFloat(tr.querySelector('.uc-vcost-kg').value) || 0;
                const oh = parseFloat(tr.querySelector('.uc-oh-kg').value) || 0;

                tPr += pr;
                tTrans += trans;
                tVCost += vcost;
                tOh += oh;
            });

            container.querySelector('#uc-tot-pr').value = tPr > 0 ? tPr.toFixed(2) : '';
            container.querySelector('#uc-tot-trans').value = tTrans > 0 ? tTrans.toFixed(2) : '';
            container.querySelector('#uc-tot-vcost').value = tVCost > 0 ? tVCost.toFixed(2) : '';
            container.querySelector('#uc-tot-oh').value = tOh > 0 ? tOh.toFixed(2) : '';
        }

        // Add line – Transport
        container.querySelector('#tr-add-line').addEventListener('click', () => {
            const tbody = container.querySelector('#tr-lines-tbody');
            const num = tbody.querySelectorAll('tr').length;
            const seasonVal = container.querySelector('#fm-season').textContent || '';
            const fmTruckNo = container.querySelector('#fm-truck-no');
            const truckNoVal = fmTruckNo.dataset.trucknr || '';
            const idEmprVal = getOrderPrefix();
            appendTransportRow(tbody, { _isNew: true, exchange_rate: container.querySelector('#fm-exch-rt').value }, num, idEmprVal, seasonVal, truckNoVal);
        });

        // ============================
        // TRANSPORT Delete line
        // ============================
        container.querySelector('#tr-delete-line').addEventListener('click', () => {
            const tbody = container.querySelector('#tr-lines-tbody');
            const checked = tbody.querySelectorAll('.tr-row-chk:checked');
            if (checked.length === 0) {
                alert('Jelöljön ki legalább egy sort a törléshez!');
                return;
            }
            if (confirm('Biztosan törli a kijelölt sor(oka)t?')) {
                checked.forEach(chk => {
                    chk.closest('tr').remove();
                });
                updateTransportSummary();
            }
        });

        // ============================
        // GOODS Add line
        // ============================
        container.querySelector('#fm-add-line').addEventListener('click', () => {
            const tbody = container.querySelector('#fm-lines-table tbody');
            appendGoodsRow(tbody, {}, tbody.querySelectorAll('tr').length);
        });

        // ============================
        // GOODS Delete line
        // ============================
        container.querySelector('#fm-delete-line').addEventListener('click', () => {
            const tbody = container.querySelector('#fm-lines-table tbody');
            const checked = tbody.querySelectorAll('.row-chk:checked');
            if (checked.length === 0) {
                alert('Jelöljön ki legalább egy sort a törléshez!');
                return;
            }
            if (confirm('Biztosan törli a kijelölt sor(oka)t?')) {
                checked.forEach(chk => {
                    const tr = chk.closest('tr');
                    const lineId = tr.getAttribute('data-line-id');
                    if (lineId) {
                        deletedGoodsLineIds.push(lineId);
                    }
                    tr.remove();
                });
                calculateTotals();
            }
        });

        // ============================
        // MENTÉS
        // ============================
        async function saveFinance() {
            // Goods mentés
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
                deletedLineIds: deletedGoodsLineIds,
                lines: []
            };
            container.querySelectorAll('#fm-lines-table tbody tr').forEach(tr => {
                const prodId = tr.getAttribute('data-product-id') || null;
                const prodNameVal = tr.querySelector('.inp-prod-name').value;
                if (!prodId && !prodNameVal) return;
                payload.lines.push({
                    id: tr.getAttribute('data-line-id') || null,
                    product_id: prodId,
                    partner_id: null,
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
                    customer: refName
                });
            });

            // Transport & Other mentés
            const transportRows = [];
            container.querySelectorAll('#tr-lines-tbody tr').forEach(tr => {
                const amount = tr.querySelector('.tr-amount').value;
                const desc = tr.querySelector('.tr-desc').value;
                const supplier = tr.querySelector('.tr-supplier').value;
                if (!amount && !desc && !supplier) return; // üres sort kihagyunk
                transportRows.push({
                    date_entry: tr.querySelector('.tr-date').value || null,
                    type_supp: tr.querySelector('.tr-type-supp').value,
                    partner_name: supplier,
                    invoice_number: tr.querySelector('.tr-invoice').value,
                    type_a: tr.querySelector('.tr-type-a').value,
                    description: desc,
                    amount,
                    tax_percent: tr.querySelector('.tr-tax-pct').value,
                    currency_code: tr.querySelector('.tr-cur').value,
                    exchange_rate: tr.querySelector('.tr-exch-rt').value,
                    id_empr: tr.querySelector('.tr-id-empr').value,
                    season: tr.querySelector('.tr-season').value,
                    truck_nr: tr.querySelector('.tr-truck-nr').value
                });
            });

            // Unit Costs mentés
            const unitCostRows = [];
            container.querySelectorAll('#uc-lines-tbody tr').forEach(tr => {
                const prod = tr.querySelector('.uc-product').value;
                const netto = tr.querySelector('.uc-netto').value;
                if (!prod && !netto) return;
                unitCostRows.push({
                    product_name: prod,
                    description: tr.querySelector('.uc-desc').value,
                    netto_kgs: netto,
                    kgs_per_box: tr.querySelector('.uc-kgs-box').value,
                    price_per_kg: tr.querySelector('.uc-pr-kg').value,
                    trans_per_kg: tr.querySelector('.uc-trans-kg').value,
                    v_cost_per_kg: tr.querySelector('.uc-vcost-kg').value,
                    oh_per_kg: tr.querySelector('.uc-oh-kg').value,
                    tot_cost_per_kg: tr.querySelector('.uc-totcost-kg').value,
                    vat_per_kg: tr.querySelector('.uc-vat-kg').value,
                    tot_cost_per_box: tr.querySelector('.uc-totcost-box').value,
                    vat_per_box: tr.querySelector('.uc-vat-box').value,
                    v_cost_per_kg_eur: tr.querySelector('.uc-vcost-kg-eur').value
                });
            });

            try {
                const [res1, res2, res3] = await Promise.all([
                    fetch(`/api/v1/shipments/${kamionId}/finance`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }),
                    fetch('/api/v1/finance-transport-lines', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shipment_id: kamionId, ref_name: refName, lines: transportRows })
                    }),
                    fetch('/api/v1/finance-unit-cost-lines', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shipment_id: kamionId, ref_name: refName, lines: unitCostRows })
                    })
                ]);
                if (!res1.ok) throw new Error(await res1.text());
                if (!res2.ok) throw new Error(await res2.text());
                if (!res3.ok) throw new Error(await res3.text());
                alert('Pénzügyi adatok sikeresen mentve!');
                if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('kamion-saved'));
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

        // Re-calculate unit costs if overhead or exch-rt changes
        container.querySelector('#fm-overhead').addEventListener('input', () => {
            container.querySelectorAll('#uc-lines-tbody tr').forEach(tr => calculateUnitCostRow(tr));
            calculateUnitCostTotals();
        });
        container.querySelector('#fm-exch-rt').addEventListener('input', (e) => {
            container.querySelector('#fm-exch-rt-2').value = e.target.value;
            container.querySelectorAll('#fm-lines-table tbody tr').forEach(tr => calculateGoodsRow(tr));
            calculateTotals();
            container.querySelectorAll('#uc-lines-tbody tr').forEach(tr => calculateUnitCostRow(tr));
            calculateUnitCostTotals();

            container.querySelectorAll('#tr-lines-tbody tr').forEach(tr => {
                const trExchRtInput = tr.querySelector('.tr-exch-rt');
                if (trExchRtInput) {
                    trExchRtInput.value = e.target.value;
                    calculateTransportRow(tr);
                }
            });
        });

        container.querySelector('#fm-exch-rt-2').addEventListener('input', (e) => {
            container.querySelector('#fm-exch-rt').value = e.target.value;
            container.querySelector('#fm-exch-rt').dispatchEvent(new Event('input'));
        });

        container.querySelector('#fm-currency').addEventListener('change', (e) => {
            container.querySelector('#fm-currency-2').value = e.target.value;
        });

        container.querySelector('#fm-currency-2').addEventListener('change', (e) => {
            container.querySelector('#fm-currency').value = e.target.value;
        });

        // Initialize
        await loadLookups();
        await loadShipment();
    });
}
