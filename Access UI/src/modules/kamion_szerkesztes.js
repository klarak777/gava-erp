// Kamion szerkesztés modul - Új kamion létrehozása és szerkesztése
export function openKamionSzerkesztesWindow(windowManager, kamionId = null) {
    const isNew = !kamionId;
    const title = isNew ? 'Új kamion rögzítése' : `Kamion szerkesztése: ${kamionId}`;

    windowManager.open('kamion_szerkesztes_' + (kamionId || 'new'), title, async (container) => {
        if (container.parentElement) {
            container.parentElement.style.width = '1200px';
            container.parentElement.style.height = '700px';
            container.parentElement.style.maxHeight = '90vh';
        }
        container.style.padding = '0';
        container.style.backgroundColor = 'var(--bg-light)';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';
        container.style.overflow = 'hidden';

        // Alap űrlap HTML
        container.innerHTML = `
            <!-- SCROLLOZHATÓ tartalom -->
            <div id="ks-scroll-wrap" style="flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:10px;">

                <!-- FEJLÉC ADATOK -->
                <div style="flex-shrink:0; display:flex; gap:10px; flex-wrap:wrap; padding:12px 14px; background:#fff; border-radius:8px; border:1px solid var(--border); box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:120px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">KamionszámTip.:</label>
                        <select id="km-tip" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;">
                            <option value="">-- Válasszon --</option>
                            <option value="BEL">BEL</option>
                            <option value="EX">EX</option>
                            <option value="GHU">GHU</option>
                            <option value="H">H</option>
                            <option value="LOG">LOG</option>
                        </select>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:160px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">Kamionszám (Order number):</label>
                        <input type="text" id="km-order" class="access-control-input" readonly style="font-size:12px; padding:4px 8px; height:30px; width:100%; background:#f0fdf4; color:#166534; font-weight:600;" placeholder="Automatikus">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px; flex:2; min-width:160px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">Fuvar vállalat:</label>
                        <select id="km-transporter" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;">
                            <option value="">Betöltés...</option>
                        </select>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:120px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">Rendszám:</label>
                        <input type="text" id="km-plate" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;" placeholder="Pl. ABC-123">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:120px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">Rakodási dátum:</label>
                        <input type="date" id="km-load-date" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:120px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">Lerakodás dátum:</label>
                        <input type="date" id="km-arr-date" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px; flex:2; min-width:160px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">Felrakodási hely:</label>
                        <input type="text" id="km-load-place" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;" placeholder="Pl. Budapest">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:120px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">Fuvar költség (EUR):</label>
                        <input type="number" id="km-price" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;" placeholder="0.00" step="0.01">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:120px;">
                        <label style="font-size:11px; font-weight:600; color:var(--text-main);">Hőmérséklet (Temperature):</label>
                        <input type="text" id="km-temperature" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;" placeholder="pl. 2-8°C">
                    </div>
                </div>

                <!-- TERMÉK HOZZÁADÁSA PANEL -->
                <div style="flex-shrink:0; background:#fff; padding:12px 14px; border-radius:8px; border:1px solid var(--border); box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="margin:0; font-size:13px; font-weight:700; color:var(--text);">+ Termék hozzáadása</h3>
                    </div>

                    <!-- Sor 1: Termék, Reference, Customer, Destination, Comment -->
                    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                        <div style="display:flex; flex-direction:column; gap:3px; flex:3; min-width:180px; position:relative;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Products (Keresés):</label>
                            <input type="text" id="line-product" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;" placeholder="Gépeljen...">
                            <input type="hidden" id="line-product-id">
                            <div id="product-dropdown" style="display:none; position:absolute; background:#fff; border:1px solid #ccc; z-index:100; width:100%; max-height:150px; overflow-y:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1); top:52px; border-radius:4px;"></div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; flex:2; min-width:120px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Reference:</label>
                            <input type="text" id="line-reference" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;" placeholder="Albarán N°">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; flex:2; min-width:130px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Customer:</label>
                            <input type="text" id="line-customer" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;" placeholder="Vevő neve">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; flex:2; min-width:130px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Destination:</label>
                            <input type="text" id="line-destination" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;" placeholder="Célállomás">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; flex:2; min-width:130px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Customer order N°:</label>
                            <input type="text" id="line-custorder" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;" placeholder="Megrendelőszám">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; flex:3; min-width:140px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Comment:</label>
                            <input type="text" id="line-comment" class="access-control-input" style="font-size:12px; padding:4px 8px; height:28px; width:100%;" placeholder="Megjegyzés">
                        </div>
                    </div>

                    <!-- Sor 2: Numerikus mezők + Hozzáadás gomb -->
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end;">
                        <div style="display:flex; flex-direction:column; gap:3px; width:70px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Euro Plt:</label>
                            <input type="number" id="line-euro" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" value="0" min="0">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; width:70px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Norm Plt:</label>
                            <input type="number" id="line-norm" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" value="0" min="0">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; width:80px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Gross wt (kg):</label>
                            <input type="number" id="line-weight" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" value="0" min="0">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; width:90px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Price (EUR):</label>
                            <input type="number" id="line-price-eur" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" value="0" min="0" step="0.01">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; width:100px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Price BCN (EUR):</label>
                            <input type="number" id="line-price-bcn" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" value="0" min="0" step="0.01">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; width:70px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Unit:</label>
                            <input type="text" id="line-unit" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" placeholder="pl. KG">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; width:100px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Reloading/plt:</label>
                            <input type="number" id="line-reloading" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" value="0" min="0" step="0.01">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; width:110px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Transport BCN/plt:</label>
                            <input type="number" id="line-transport-bcn" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" value="0" min="0" step="0.01">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; width:110px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Kamionszám per:</label>
                            <input type="number" id="line-truck-number-per" class="access-control-input" style="font-size:12px; padding:4px 6px; height:28px; width:100%;" value="0" min="0" step="0.0001">
                        </div>
                        <button class="primary-btn btn-dense" id="btn-add-line" style="height:28px; font-size:12px; padding:0 14px; align-self:flex-end; white-space:nowrap;">+ Hozzáadás</button>
                    </div>
                </div>

                <!-- TÉTELEK TÁBLÁZATA -->
                <div class="access-subform" style="flex-shrink:0; min-height:150px;">
                    <div class="access-subform-header" style="padding:7px 14px; font-size:12px;">Hozzáadott termékek</div>
                    <div style="overflow-x:auto; width:100%;">
                        <table class="access-subform-table" id="km-lines-table" style="font-size:11px; min-width:1200px; width:max-content;">
                            <thead style="position:sticky; top:0; background:var(--bg-light);">
                                <tr>
                                    <th style="width:40px;">Törl.</th>
                                    <th style="min-width:200px; white-space:nowrap;">Termék</th>
                                    <th style="min-width:100px;">Reference</th>
                                    <th style="min-width:100px;">Customer</th>
                                    <th style="min-width:100px;">Destination</th>
                                    <th style="min-width:110px;">Cust. Order N°</th>
                                    <th style="min-width:110px;">Comment</th>
                                    <th style="text-align:center; min-width:65px;">Euro Plt</th>
                                    <th style="text-align:center; min-width:65px;">Norm Plt</th>
                                    <th style="text-align:right; min-width:80px;">Bruttó (kg)</th>
                                    <th style="text-align:right; min-width:80px;">Price EUR</th>
                                    <th style="text-align:right; min-width:80px;">Price BCN</th>
                                    <th style="min-width:55px;">Unit</th>
                                    <th style="text-align:right; min-width:85px;">Reload/plt</th>
                                    <th style="text-align:right; min-width:100px;">Transp BCN/plt</th>
                                    <th style="text-align:right; min-width:100px;">Kamionszám/per</th>
                                </tr>
                            </thead>
                            <tbody id="km-lines-tbody">
                                <tr><td colspan="16" style="text-align:center; color:#999; padding:12px;">Nincsenek hozzáadott termékek.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <!-- LÁBLÉC – fixált alul -->
            <div style="flex-shrink:0; display:flex; justify-content:flex-end; align-items:center; gap:10px; padding:10px 14px; background:#fff; border-top:1px solid var(--border);">
                <span id="km-order-conflict-msg" style="color:#dc2626; font-size:12px; font-weight:600; display:none;">⚠ Ez a kamionszám már foglalt ebben a szezonban!</span>
                <button class="primary-btn" id="btn-save-km" style="font-size:13px; padding:7px 20px;">Kamion létrehozása</button>
            </div>
        `;

        // ===== ÁLLAPOT =====
        let lines = [];
        let products = [];
        let transporters = [];
        let currentShipmentId = null;

        // ===== ELEMEK =====
        const kmTip    = container.querySelector('#km-tip');
        const kmOrder  = container.querySelector('#km-order');
        const cmbTransporter = container.querySelector('#km-transporter');
        const lineProduct = container.querySelector('#line-product');
        const lineProductId = container.querySelector('#line-product-id');
        const productDropdown = container.querySelector('#product-dropdown');
        const tbody = container.querySelector('#km-lines-tbody');
        const conflictMsg = container.querySelector('#km-order-conflict-msg');

        const API = 'http://localhost:3000/api/v1';

        // ===== API BETÖLTÉS =====
        async function loadTransporters() {
            try {
                const res = await fetch(`${API}/transporters`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                transporters = await res.json();
                cmbTransporter.innerHTML = '<option value="">-- Válasszon --</option>' +
                    transporters.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            } catch (err) {
                console.error('Fuvarozók betöltési hiba:', err);
                cmbTransporter.innerHTML = '<option value="">[Betöltési hiba]</option>';
            }
        }

        async function loadProducts() {
            try {
                const res = await fetch(`${API}/products`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                products = await res.json();
                console.log(`[KamionSzerk] ${products.length} termék betöltve.`);
            } catch (err) {
                console.error('Termékek betöltési hiba:', err);
                // Ha nem sikerül, üres tömb marad - az input mező még mindig használható
            }
        }

        // Következő szabad kamionszám lekérése a backendről (gyors endpoint)
        async function fetchNextOrderNumber(tip) {
            try {
                const res = await fetch(`${API}/shipments/order-numbers?tip=${encodeURIComponent(tip)}`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                return data.nextFormatted || '';
            } catch (err) {
                console.error('Kamionszám lekérési hiba:', err);
                return '';
            }
        }

        // Foglaltság ellenőrzése a backendnél (gyors endpoint)
        async function checkOrderNumberTaken(orderNumber) {
            try {
                const res = await fetch(`${API}/shipments/check-order-number/${encodeURIComponent(orderNumber)}`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                return data.taken === true;
            } catch (err) {
                console.error('Kamionszám ellenőrzési hiba:', err);
                return false; // hálózati hiba esetén ne blokkoljuk
            }
        }

        async function loadExistingShipment(orderNumber) {
            try {
                const res = await fetch(`${API}/shipments/by-order/${encodeURIComponent(orderNumber)}`);
                if (!res.ok) throw new Error('Nem található a kamion');
                const data = await res.json();
                
                const s = data.shipment;
                currentShipmentId = s.id;
                kmTip.value = s.truck_type || '';
                kmOrder.value = s.order_number || '';
                cmbTransporter.value = s.transporter_id || '';
                container.querySelector('#km-plate').value = s.plate_number || '';
                if (s.loading_date) container.querySelector('#km-load-date').value = new Date(s.loading_date).toISOString().split('T')[0];
                if (s.arrival_date) container.querySelector('#km-arr-date').value = new Date(s.arrival_date).toISOString().split('T')[0];
                container.querySelector('#km-load-place').value = s.loading_place || '';
                container.querySelector('#km-price').value = s.transport_price || '';
                container.querySelector('#km-temperature').value = s.temperature || '';

                if (data.lines && data.lines.length > 0) {
                    lines = data.lines.map(l => ({
                        product_id: l.product_id,
                        productName: l.productName || '',
                        albaran_number: l.albaran_number || '',
                        customer: l.customer || '',
                        destination: l.destination || '',
                        customer_order_no: l.customer_order_no || '',
                        comment: l.comment || '',
                        euro_palets: l.euro_palets || 0,
                        normal_palets: l.normal_palets || 0,
                        gross_weight_kg: l.gross_weight_kg || 0,
                        price_eur: l.price_eur || 0,
                        price_bcn_eur: l.price_bcn_eur || 0,
                        unit: l.unit || '',
                        reloading_per_plt: l.reloading_per_plt || 0,
                        transport_bcn_per_plt: l.transport_bcn_per_plt || 0,
                        truck_number_per: l.truck_number_per || 0
                    }));
                }
                renderTable();
            } catch (err) {
                console.error('Kamion betöltési hiba:', err);
                alert('Nem sikerült betölteni a kamion adatait!');
            }
        }

        // Init
        await loadTransporters();
        await loadProducts();
        if (kamionId) {
            await loadExistingShipment(kamionId);
            container.querySelector('#btn-save-km').textContent = 'Kamion frissítése';
        }

        // ===== KAMIONSZÁM GENERÁLÁS – API alapú =====
        kmTip.addEventListener('change', async () => {
            if (!isNew) return; // Szerkesztéskor ne generáljunk új számot típusváltáskor
            const val = kmTip.value;
            conflictMsg.style.display = 'none';
            if (!val) {
                kmOrder.value = '';
                return;
            }
            kmOrder.value = 'Betöltés...';
            kmOrder.style.color = '#94a3b8';
            const next = await fetchNextOrderNumber(val);
            kmOrder.value = next || (val + '001');
            kmOrder.style.color = '#166534';
        });

        // ===== AUTOCOMPLETE =====
        lineProduct.addEventListener('input', () => {
            const val = lineProduct.value.toLowerCase();
            productDropdown.innerHTML = '';
            lineProductId.value = '';
            if (!val) { productDropdown.style.display = 'none'; return; }

            const filtered = products.filter(p => p.name.toLowerCase().includes(val)).slice(0, 10);
            if (filtered.length > 0) {
                filtered.forEach(p => {
                    const div = document.createElement('div');
                    div.style.cssText = 'padding:6px 8px; cursor:pointer; border-bottom:1px solid #eee; font-size:12px;';
                    div.textContent = p.name;
                    div.onmousedown = () => {
                        lineProduct.value = p.name;
                        lineProductId.value = p.id;
                        productDropdown.style.display = 'none';
                    };
                    div.onmouseover = () => div.style.backgroundColor = '#f1f5f9';
                    div.onmouseout  = () => div.style.backgroundColor = 'transparent';
                    productDropdown.appendChild(div);
                });
                productDropdown.style.display = 'block';
                productDropdown.style.top  = (lineProduct.offsetTop + lineProduct.offsetHeight) + 'px';
                productDropdown.style.left = lineProduct.offsetLeft + 'px';
            } else {
                productDropdown.style.display = 'none';
            }
        });

        lineProduct.addEventListener('blur', () => {
            setTimeout(() => { productDropdown.style.display = 'none'; }, 200);
        });

        // ===== TÉTELEK TÁBLÁZAT =====
        function renderTable() {
            if (lines.length === 0) {
                tbody.innerHTML = '<tr><td colspan="16" style="text-align:center; color:#999; padding:12px;">Nincsenek hozzáadott termékek.</td></tr>';
                return;
            }
            tbody.innerHTML = lines.map((l, index) => `
                <tr>
                    <td style="text-align:center;">
                        <button class="secondary-btn btn-dense delete-line" data-index="${index}" style="color:red; border-color:red; padding:1px 5px; font-size:11px;">✕</button>
                    </td>
                    <td style="white-space:nowrap; min-width:200px;">${l.productName || ''}</td>
                    <td>${l.albaran_number || ''}</td>
                    <td>${l.customer || ''}</td>
                    <td>${l.destination || ''}</td>
                    <td>${l.customer_order_no || ''}</td>
                    <td>${l.comment || ''}</td>
                    <td style="text-align:center;">${l.euro_palets}</td>
                    <td style="text-align:center;">${l.normal_palets}</td>
                    <td style="text-align:right;">${l.gross_weight_kg}</td>
                    <td style="text-align:right;">${l.price_eur}</td>
                    <td style="text-align:right;">${l.price_bcn_eur}</td>
                    <td>${l.unit || ''}</td>
                    <td style="text-align:right;">${l.reloading_per_plt}</td>
                    <td style="text-align:right;">${l.transport_bcn_per_plt}</td>
                    <td style="text-align:right;">${l.truck_number_per}</td>
                </tr>
            `).join('');

            container.querySelectorAll('.delete-line').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.index);
                    lines.splice(idx, 1);
                    renderTable();
                });
            });
        }

        // ===== HOZZÁADÁS GOMB =====
        container.querySelector('#btn-add-line').addEventListener('click', () => {
            const pId   = lineProductId.value;
            const pName = lineProduct.value.trim();
            if (!pName) { alert('Termék megadása kötelező!'); return; }

            lines.push({
                product_id:           pId || null,
                productName:          pName,
                albaran_number:       container.querySelector('#line-reference').value.trim(),
                customer:             container.querySelector('#line-customer').value.trim(),
                destination:          container.querySelector('#line-destination').value.trim(),
                customer_order_no:    container.querySelector('#line-custorder').value.trim(),
                comment:              container.querySelector('#line-comment').value.trim(),
                euro_palets:          parseFloat(container.querySelector('#line-euro').value) || 0,
                normal_palets:        parseFloat(container.querySelector('#line-norm').value) || 0,
                gross_weight_kg:      parseFloat(container.querySelector('#line-weight').value) || 0,
                price_eur:            parseFloat(container.querySelector('#line-price-eur').value) || 0,
                price_bcn_eur:        parseFloat(container.querySelector('#line-price-bcn').value) || 0,
                unit:                 container.querySelector('#line-unit').value.trim(),
                reloading_per_plt:    parseFloat(container.querySelector('#line-reloading').value) || 0,
                transport_bcn_per_plt:parseFloat(container.querySelector('#line-transport-bcn').value) || 0,
                truck_number_per:     parseFloat(container.querySelector('#line-truck-number-per').value) || 0,
            });

            // Mezők nullázása
            lineProduct.value = ''; lineProductId.value = '';
            ['#line-reference','#line-customer','#line-destination','#line-custorder','#line-comment','#line-unit'].forEach(id => {
                container.querySelector(id).value = '';
            });
            ['#line-euro','#line-norm','#line-weight','#line-price-eur','#line-price-bcn','#line-reloading','#line-transport-bcn','#line-truck-number-per'].forEach(id => {
                container.querySelector(id).value = '0';
            });

            renderTable();
        });

        // ===== MENTÉS GOMB =====
        container.querySelector('#btn-save-km').addEventListener('click', async () => {
            const orderNumber = kmOrder.value.trim();

            if (!orderNumber || orderNumber === 'Betöltés...') {
                alert('A Kamionszám megadása kötelező (válassz típust)!');
                return;
            }

            if (isNew) {
                // Backend ellenőrzés: foglalt-e már ez a kamionszám?
                const saveBtn = container.querySelector('#btn-save-km');
                saveBtn.disabled = true;
                saveBtn.textContent = 'Ellenőrzés...';
                const taken = await checkOrderNumberTaken(orderNumber);
                saveBtn.disabled = false;
                saveBtn.textContent = 'Kamion létrehozása';

                if (taken) {
                    conflictMsg.style.display = 'inline';
                    alert(`Hiba: A(z) "${orderNumber}" kamionszám már foglalt az aktuális szezonban!\nKérlek válassz másik számot.`);
                    return;
                }
            }
            conflictMsg.style.display = 'none';

            const payload = {
                order_number:    orderNumber,
                truck_type:      kmTip.value,
                truck_seq_number: parseInt(orderNumber.replace(/[^0-9]/g, '')) || 0,
                transporter_id:  parseInt(cmbTransporter.value) || null,
                plate_number:    container.querySelector('#km-plate').value,
                loading_date:    container.querySelector('#km-load-date').value || null,
                arrival_date:    container.querySelector('#km-arr-date').value || null,
                loading_place:   container.querySelector('#km-load-place').value,
                transport_price: parseFloat(container.querySelector('#km-price').value) || 0,
                temperature:     container.querySelector('#km-temperature').value.trim() || null,
                lines: lines
            };

            try {
                let res;
                if (isNew) {
                    res = await fetch('http://localhost:3000/api/v1/shipments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await fetch(`http://localhost:3000/api/v1/shipments/${currentShipmentId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (res.ok) {
                    alert(isNew ? 'Kamion sikeresen létrehozva: ' + orderNumber : 'Kamion sikeresen frissítve: ' + orderNumber);
                    const windowId = container.closest('.mdi-window')?.id;
                    if (windowId) windowManager.close(windowId);
                    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { moduleId: 'fuvarok' } }));
                } else {
                    const err = await res.json();
                    // Ha a backend is foglalt számot jelez:
                    if (err.error && err.error.toLowerCase().includes('foglalt')) {
                        conflictMsg.style.display = 'inline';
                    }
                    alert('Hiba a mentés során: ' + (err.error || 'Ismeretlen hiba'));
                }
            } catch (err) {
                console.error(err);
                alert('Nem sikerült csatlakozni a szerverhez.');
            }
        });
    });
}

// Kompatibilitás a régi API-val
export function renderKamionSzerkesztes(container, windowManager) {
    openKamionSzerkesztesWindow(windowManager);
}
