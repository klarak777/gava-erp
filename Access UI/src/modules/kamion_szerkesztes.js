// Kamion szerkesztés modul - Új kamion létrehozása és szerkesztése
const GRID_ROWS = 25; // mindig ennyi sor látszik a táblázatban

export function openKamionSzerkesztesWindow(windowManager, kamionId = null) {
    const isNew = !kamionId;
    // Az ablak fejléce / taskbar szöveg: csak "Új kamion rögzítése" lesz,
    // szerkesztésnél loadExistingShipment frissíti majd a valódi kamionszámra.
    const initialTitle = isNew ? 'Új kamion rögzítése' : 'Kamion szerkesztése…';

    windowManager.open('kamion_szerkesztes_' + (kamionId || 'new'), initialTitle, async (container) => {
        const winEl = container.closest('.mdi-window');

        if (winEl) {
            winEl.style.width = '1100px';
            winEl.style.height = '650px';
            winEl.style.maxHeight = '92vh';

            // Középre pozicionálás (setTimeout, hogy a WindowManager alapértelmezett pozícióját felülírjuk)
            setTimeout(() => {
                const containerWidth = window.innerWidth;
                const containerHeight = window.innerHeight;
                const winWidth = winEl.offsetWidth || 1100;
                const winHeight = winEl.offsetHeight || 650;

                const left = Math.max(20, (containerWidth - winWidth) / 2);
                const top = Math.max(0, ((containerHeight - winHeight) / 2) - 40);

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
        container.style.position = 'relative';

        // ===== HTML =====
        container.innerHTML = `
            <!-- SCROLLOZHATÓ tartalom -->
            <div id="ks-scroll-wrap" style="flex:1; overflow:hidden; padding:12px 14px; display:flex; flex-direction:column; gap:10px;">

                <!-- FEJLÉC ADATOK -->
                <div style="flex-shrink:0; display:flex; gap:8px; flex-wrap:wrap; padding:12px 14px; background:#fff; border-radius:8px; border:1px solid var(--border); box-shadow:0 1px 3px rgba(0,0,0,0.05); align-items:flex-start;">
                    
                    <!-- Kamionszám tip (kicsit keskenyebb, bal felső sarok) -->
                    <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:80px; max-width:100px;">
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

                    <!-- Kétszer hármas blokk (2 oszlop, 3 sor) a képi elrendezés mintájára, de eredeti vezérlőkkel -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px 16px; flex:2; min-width:340px; max-width:420px;">
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Order number:</label>
                            <input type="text" id="km-order" class="access-control-input" readonly
                                style="font-size:12px; padding:4px 8px; height:30px; width:100%; background:#f0fdf4; color:#166534; font-weight:600;" placeholder="Automatikus">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Loading date:</label>
                            <input type="date" id="km-load-date" class="access-control-input"
                                style="font-size:12px; padding:4px 8px; height:30px; width:100%;">
                        </div>
                        
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Transport company:</label>
                            <select id="km-transporter" class="access-control-input" style="font-size:12px; padding:4px 8px; height:30px; width:100%;">
                                <option value="">Betöltés...</option>
                            </select>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Loading Place:</label>
                            <input type="text" id="km-load-place" class="access-control-input"
                                style="font-size:12px; padding:4px 8px; height:30px; width:100%;" placeholder="Pl. Budapest">
                        </div>
                        
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Plate number:</label>
                            <input type="text" id="km-plate" class="access-control-input"
                                style="font-size:12px; padding:4px 8px; height:30px; width:100%;" placeholder="Pl. ABC-123">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Temperature:</label>
                            <input type="text" id="km-temperature" class="access-control-input"
                                style="font-size:12px; padding:4px 6px; height:30px; width:100%;" placeholder="2-8°C" maxlength="8">
                        </div>
                    </div>

                    <!-- Többi vezérlő (Lerakodás dátum, Fuvar költség) az eredeti flexbox elrendezéssel -->
                    <div style="display:flex; gap:8px; flex-wrap:wrap; flex:1; min-width:200px; align-items:flex-start;">
                        <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:120px; max-width:155px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Arrival date:</label>
                            <input type="date" id="km-arr-date" class="access-control-input"
                                style="font-size:12px; padding:4px 8px; height:30px; width:100%;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:110px; max-width:145px;">
                            <label style="font-size:11px; font-weight:600; color:var(--text-main);">Transport price:</label>
                            <input type="number" id="km-price" class="access-control-input"
                                style="font-size:12px; padding:4px 8px; height:30px; width:100%;" placeholder="0.00" step="0.01">
                        </div>
                    </div>
                </div>

                <!-- TÉTELEK TÁBLÁZATA -->
                <!-- ② overflow-x:scroll → a gördítősáv MINDIG látszik, nem csak az aljára görgetéskor -->
                <div class="access-subform" style="flex:1; display:flex; flex-direction:column; min-height:0;">
                    <div id="km-table-wrap" style="flex:1; overflow:auto; width:100%;">
                        <table class="access-subform-table" id="km-lines-table" style="font-size:11px; min-width:1400px; width:max-content; border-collapse:collapse;">
                            <thead style="position:sticky; top:0; background:var(--bg-light); z-index:2;">
                                <tr>
                                    <th style="width:36px; text-align:center;" title="Áthelyezés / Törlés"></th>
                                    <th style="min-width:58px; max-width:65px; text-align:center; line-height:1.2; padding:3px 2px;">Total<br><span style='font-weight:normal;'>Palets</span></th>
                                    <th style="min-width:58px; max-width:65px; text-align:center; line-height:1.2; padding:3px 2px;">N° Euro<br><span style='font-weight:normal;'>Palets</span></th>
                                    <th style="min-width:58px; max-width:65px; text-align:center; line-height:1.2; padding:3px 2px;">N° Normal<br><span style='font-weight:normal;'>Palets</span></th>
                                    <th style="min-width:180px; white-space:nowrap;">Products</th>
                                    <th style="min-width:110px; padding:2px 4px; vertical-align:top; text-align:center;">
                                        <div style="font-weight:600; line-height:1.2; margin-bottom:2px;">Reference</div>
                                        <div style="display:flex; align-items:center; justify-content:center; gap:2px;">
                                            <select id="km-ref-filter" style="font-size:10px; padding:1px 2px; height:20px; border:1px solid #cbd5e1; border-radius:3px; background:#fff; color:#334155; min-width:0; max-width:85px;">
                                                <option value="">– mind –</option>
                                            </select>
                                            <button id="km-ref-filter-clear" title="Szűrő törlése" style="background:none; border:1px solid #e2e8f0; border-radius:3px; cursor:pointer; font-size:11px; line-height:1; padding:1px 4px; color:#64748b; height:20px; display:none;">✕</button>
                                        </div>
                                    </th>
                                    <th style="min-width:100px;">Customer</th>
                                    <th style="min-width:100px;">Destination</th>
                                    <th style="min-width:110px;">Comment</th>
                                    <th style="text-align:right; min-width:80px;">Gross weight (kg)</th>
                                    <th style="text-align:right; min-width:80px;">Price (EUR)</th>
                                    <th style="text-align:right; min-width:80px;">Price BCN (EUR)</th>
                                    <th style="min-width:55px;">Unit</th>
                                    <th style="text-align:right; min-width:85px;">Reloading/plt</th>
                                    <th style="text-align:right; min-width:100px;">Transport BCN/plt</th>
                                    <th style="min-width:110px;">Customer order N°</th>
                                    <th style="text-align:center; min-width:70px;">Truck N°/plt</th>
                                </tr>
                            </thead>
                            <tbody id="km-lines-tbody"></tbody>
                            <tfoot style="position:sticky; bottom:0; background:var(--bg-light); z-index:2; border-top:2px solid var(--border); font-weight:bold; font-size:12px;">
                                <tr>
                                    <td style="text-align:center; padding:6px 4px; color:var(--text-main);">Össz:</td>
                                    <td id="km-sum-total" style="text-align:center; padding:6px 4px; color:#1e40af;">0</td>
                                    <td id="km-sum-euro" style="text-align:center; padding:6px 4px; color:var(--text-main);">0</td>
                                    <td id="km-sum-normal" style="text-align:center; padding:6px 4px; color:var(--text-main);">0</td>
                                    <td colspan="13">
                                        <div style="display:flex; justify-content:flex-end; gap:24px; padding-right:20px; color:#166534; font-size:11px;">
                                            <span>Szabad hely (Euro plt): <span id="km-free-euro" style="font-weight:bold; font-size:13px; color:#15803d;">33</span></span>
                                            <span>Szabad hely (Normal plt): <span id="km-free-normal" style="font-weight:bold; font-size:13px; color:#15803d;">26</span></span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

            </div>

            <!-- LÁBLÉC – fixált alul -->
            <div style="flex-shrink:0; display:flex; justify-content:flex-end; align-items:center; gap:10px; padding:10px 14px; background:#fff; border-top:1px solid var(--border);">
                <span id="km-order-conflict-msg" style="color:#dc2626; font-size:12px; font-weight:600; display:none;">⚠ Ez a kamionszám már foglalt ebben a szezonban!</span>
                <button class="primary-btn" id="btn-save-km" style="font-size:13px; padding:7px 20px;">Kamion létrehozása</button>
            </div>

            <!-- INLINE PRODUCT DROPDOWN -->
            <div id="inline-product-dropdown" style="display:none; position:fixed; background:#fff; border:1px solid #ccc; z-index:9999; max-height:150px; overflow-y:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1); border-radius:4px;"></div>

            <!-- INLINE REFERENCE DROPDOWN -->
            <div id="inline-reference-dropdown" style="display:none; position:fixed; background:#fff; border:1px solid #ccc; z-index:9999; max-height:150px; overflow-y:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1); border-radius:4px;"></div>

            <!-- INLINE CUSTOMER DROPDOWN -->
            <div id="inline-customer-dropdown" style="display:none; position:fixed; background:#fff; border:1px solid #ccc; z-index:9999; max-height:150px; overflow-y:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1); border-radius:4px;"></div>

            <!-- TÉTEL ÁTHELYEZÉSE POPUP (az overlay fölé) -->
            <div id="transfer-overlay" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.6); z-index:600; align-items:center; justify-content:center;">
                <div id="transfer-modal" style="background:#fff; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.3); padding:24px; width:460px; max-width:95%; position:relative; transform:translate(0px, 0px); transition:none;">
                    <div id="transfer-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; cursor:move; user-select:none;">
                        <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b;">🔀 Tétel áthelyezése másik fuvarra</h3>
                        <button id="btn-transfer-close" style="background:none; border:none; font-size:20px; cursor:pointer; color:#64748b; padding:2px 6px;">×</button>
                    </div>
                    <div id="transfer-source-info" style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:10px 12px; margin-bottom:14px; font-size:12px; color:#0369a1;"></div>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <label style="font-size:11px; font-weight:600; color:#334155;">Célkamion (csak nem-rakodott kamionok):</label>
                            <select id="transfer-target-shipment" class="access-control-input" style="font-size:12px; height:32px;">
                                <option value="">-- Betöltés... --</option>
                            </select>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <div style="display:flex; flex-direction:column; gap:3px; flex:1;">
                                <label style="font-size:11px; font-weight:600; color:#334155;">N° Euro Palets áthelyezve:</label>
                                <input type="number" id="transfer-euro" class="access-control-input" style="font-size:12px; height:32px;" value="0" min="0" step="any">
                                <small id="transfer-euro-max" style="color:#64748b; font-size:10px;">Max: 0</small>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:3px; flex:1;">
                                <label style="font-size:11px; font-weight:600; color:#334155;">N° Normal Palets áthelyezve:</label>
                                <input type="number" id="transfer-normal" class="access-control-input" style="font-size:12px; height:32px;" value="0" min="0" step="any">
                                <small id="transfer-normal-max" style="color:#64748b; font-size:10px;">Max: 0</small>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
                        <button class="secondary-btn" id="btn-transfer-cancel">Mégse</button>
                        <button class="primary-btn" id="btn-transfer-confirm" style="background:#f59e0b; border-color:#d97706;">🔀 Áthelyezés</button>
                    </div>
                </div>
            </div>
        `;

        // ===== ÁLLAPOT =====
        let lines = [];           // csak az adatsorokat tároljuk (max GRID_ROWS)
        let products = [];
        let references = [];
        let customers = [];
        let transporters = [];
        let currentShipmentId = null;
        let editingLineIndex = null; // null = new, szám = meglévő sor indexe
        let originalLinesSnapshot = {}; // { lineIndex: { euro_palets, normal_palets } } – a betöltéskori értékek
        let editingLineDbId = null;     // az éppen szerkesztett sor adatbázis-ID-ja (áthelyezéshez)
        let currentShipmentIsLoaded = false; // RAKODVA státusz

        // ===== ELEMEK =====
        const kmTip = container.querySelector('#km-tip');
        const kmOrder = container.querySelector('#km-order');
        const cmbTransporter = container.querySelector('#km-transporter');
        const tbody = container.querySelector('#km-lines-tbody');
        const conflictMsg = container.querySelector('#km-order-conflict-msg');
        // Edit overlay vars removed
        const inlineDropdown = container.querySelector('#inline-product-dropdown');
        const inlineRefDropdown = container.querySelector('#inline-reference-dropdown');
        const inlineCustDropdown = container.querySelector('#inline-customer-dropdown');


        const transferModal = container.querySelector('#transfer-modal');
        const transferHeader = container.querySelector('#transfer-header');


        const resetTransferDrag = initDraggable(transferModal, transferHeader);

        const API = '/api/v1';

        // ① Üres sor prototípus
        function emptyLine() {
            return {
                product_id: null, productName: '', albaran_number: '', customer: '',
                destination: '', customer_order_no: '', comment: '',
                euro_palets: 0, normal_palets: 0, gross_weight_kg: 0,
                price_eur: 0, price_bcn_eur: 0, unit: '',
                reloading_per_plt: 0, transport_bcn_per_plt: 0, truck_number_per: 0,
                _empty: true   // jelző: üres sor (mentéskor kihagyjuk)
            };
        }

        // ① Mindig GRID_ROWS sort biztosít (adat + üres feltöltés)
        function normalizeLines() {
            // A foghíjak elkerülése végett kiszűrjük a teljesen üres sorokat
            let filled = lines.filter(l => l.product_id || parseFloat(String(l.euro_palets).replace(',', '.')) > 0 || parseFloat(String(l.normal_palets).replace(',', '.')) > 0);

            // _empty flag törlése a kitöltött sorokon
            filled = filled.map(l => { const r = { ...l }; delete r._empty; return r; });

            lines = filled;
            while (lines.length < GRID_ROWS) lines.push(emptyLine());
            if (lines.length > GRID_ROWS) lines = lines.slice(0, GRID_ROWS);
        }

        // ===== API =====
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
            } catch (err) {
                console.error('Termékek betöltési hiba:', err);
            }
        }

        async function loadReferences() {
            try {
                const res = await fetch(`${API}/admin/partners?type=szállító`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                references = await res.json();
            } catch (err) {
                console.error('Referenciák betöltési hiba:', err);
                references = [];
            }
        }

        async function loadCustomers() {
            try {
                const res = await fetch(`${API}/admin/partners?type=vevő`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                customers = await res.json();
            } catch (err) {
                console.error('Vevők betöltési hiba:', err);
                customers = [];
            }
        }

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

        async function checkOrderNumberTaken(orderNumber) {
            try {
                const res = await fetch(`${API}/shipments/check-order-number/${encodeURIComponent(orderNumber)}`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                return data.taken === true;
            } catch (err) {
                return false;
            }
        }

        async function loadExistingShipment(kamionId) {
            try {
                let url;
                if (/^\d+$/.test(String(kamionId))) {
                    url = `${API}/shipments/${kamionId}`;
                } else {
                    url = `${API}/shipments/by-order/${encodeURIComponent(kamionId)}`;
                }
                const res = await fetch(url);
                if (!res.ok) throw new Error('Nem található a kamion');
                const data = await res.json();

                const s = data.shipment;
                currentShipmentId = s.id;
                currentShipmentIsLoaded = s.is_loaded === true || s.is_loaded === 1;

                // 🟢 Ablak fejléce és taskbar-t is frissítjük a VALÓDI kamionszámra
                const realTitle = s.order_number || 'Ismeretlen';
                const winEl2 = container.closest('.mdi-window');
                if (winEl2) {
                    const titleEl = winEl2.querySelector('.window-title');
                    if (titleEl) titleEl.textContent = realTitle;
                    // taskbar item szövegét is frissítjük
                    const winId = winEl2.id;
                    const taskItem = document.querySelector(`.taskbar-item[data-window-id="${winId}"]`);
                    if (taskItem) taskItem.textContent = realTitle;
                }

                kmTip.value = s.truck_type || '';
                kmOrder.value = s.order_number || '';
                cmbTransporter.value = s.transporter_id || '';
                try { container.querySelector('#km-plate').value = s.plate_number || ''; } catch (e) { }
                try { container.querySelector('#km-load-place').value = s.loading_place || ''; } catch (e) { }
                try { container.querySelector('#km-price').value = s.transport_price || ''; } catch (e) { }
                try { container.querySelector('#km-temperature').value = s.temperature || ''; } catch (e) { }

                function extractLocalDate(d) {
                    if (!d) return '';
                    const dt = new Date(d);
                    if (isNaN(dt)) return '';
                    return dt.getFullYear() + '-' +
                        String(dt.getMonth() + 1).padStart(2, '0') + '-' +
                        String(dt.getDate()).padStart(2, '0');
                }
                if (s.loading_date) try { container.querySelector('#km-load-date').value = extractLocalDate(s.loading_date); } catch (e) { }
                if (s.arrival_date) try { container.querySelector('#km-arr-date').value = extractLocalDate(s.arrival_date); } catch (e) { }

                if (data.lines && data.lines.length > 0) {
                    lines = data.lines.map((l, idx) => ({
                        _dbId: l.id,  // adatbázis ID az áthelyezéshez
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
                    // Snapshot az eredeti értékekről (raklap-csökkentés figyelőhöz)
                    originalLinesSnapshot = {};
                    lines.forEach((l, idx) => {
                        if (!l._empty) {
                            originalLinesSnapshot[idx] = {
                                euro_palets: l.euro_palets,
                                normal_palets: l.normal_palets,
                                dbId: l._dbId,
                                productName: l.productName || '',
                                product_id: l.product_id || null,
                                albaran_number: l.albaran_number || '',
                                customer: l.customer || ''
                            };
                        }
                    });
                }
                normalizeLines(); // ① feltölt 25 sorra
                try { renderTable(); } catch (e) { console.error('Táblázat renderelési hiba:', e); }
            } catch (err) {
                console.error('Kamion betöltési hiba:', err);
                alert('Nem sikerült betölteni a kamion adatait!\nRészletek: ' + err.message);
            }
        }

        // ===== KAMIONSZÁM GENERÁLÁS =====
        kmTip.addEventListener('change', async () => {
            if (!isNew) return;
            const val = kmTip.value;
            conflictMsg.style.display = 'none';
            if (!val) { kmOrder.value = ''; return; }
            kmOrder.value = 'Betöltés...';
            kmOrder.style.color = '#94a3b8';
            const next = await fetchNextOrderNumber(val);
            kmOrder.value = next || (val + '001');
            kmOrder.style.color = '#166534';
        });

        // ===== RAKLAP ÁTVÁLTÓ =====
        const conversionMap = {
            1: 1, 2: 3, 3: 4, 4: 5, 5: 6, 6: 8, 7: 9, 8: 10, 9: 11, 10: 13,
            11: 14, 12: 15, 13: 16, 14: 18, 15: 19, 16: 20, 17: 21, 18: 23, 19: 24, 20: 25,
            21: 26, 22: 28, 23: 29, 24: 30, 25: 31, 26: 33
        };

        function calculateLineTotals(items) {
            // Csak a tényleges adatsorokat vesszük figyelembe (nem üreseket)
            let sumNormal = 0;
            items.forEach(l => { if (!l._empty) sumNormal += parseFloat(String(l.normal_palets).replace(',', '.')) || 0; });
            let convertedNormal = 0;
            if (sumNormal > 0) {
                const rounded = Math.round(sumNormal);
                convertedNormal = conversionMap[rounded] !== undefined ? conversionMap[rounded] : sumNormal * (33.0 / 26.0);
            }
            return items.map(l => {
                if (l._empty) return { ...l, totalPalets: '' };
                const lineEuro = parseFloat(String(l.euro_palets).replace(',', '.')) || 0;
                const lineNorm = parseFloat(String(l.normal_palets).replace(',', '.')) || 0;
                let totalPalets = lineEuro;
                if (sumNormal > 0 && lineNorm > 0) totalPalets += convertedNormal * (lineNorm / sumNormal);
                return { ...l, totalPalets: Number(totalPalets.toFixed(2)) };
            });
        }

        // ===== TÁBLÁZAT RENDERELÉS =====
        const cellStyle = 'border:none; background:transparent; font-size:11px; width:100%; padding:1px 3px; font-family:inherit; outline:none;';
        const numCellStyle = cellStyle + ' text-align:right;';

        function escHtml(s) {
            return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function updateTableTotals(items) {
            let sumTotal = 0;
            let sumEuro = 0;
            let sumNormal = 0;
            items.forEach(l => {
                if (!l._empty) {
                    sumTotal += parseFloat(l.totalPalets) || 0;
                    sumEuro += parseFloat(String(l.euro_palets).replace(',', '.')) || 0;
                    sumNormal += parseFloat(String(l.normal_palets).replace(',', '.')) || 0;
                }
            });
            const tTotal = container.querySelector('#km-sum-total');
            const tEuro = container.querySelector('#km-sum-euro');
            const tNormal = container.querySelector('#km-sum-normal');
            if (tTotal) tTotal.textContent = sumTotal > 0 ? Number(sumTotal.toFixed(2)) : '0';
            if (tEuro) tEuro.textContent = sumEuro > 0 ? Number(sumEuro.toFixed(1)) : '0';
            if (tNormal) tNormal.textContent = sumNormal > 0 ? Number(sumNormal.toFixed(1)) : '0';

            // Szabad hely számítás
            const maxTotal = 33.0;
            let freeTotal = maxTotal - sumTotal;
            if (freeTotal < 0) freeTotal = 0;
            
            const freeEuro = freeTotal; // 1 Total = 1 Euro
            const freeNormal = freeTotal * (26.0 / 33.0); // 33 Total = 26 Normal

            const tFreeEuro = container.querySelector('#km-free-euro');
            const tFreeNormal = container.querySelector('#km-free-normal');
            if (tFreeEuro) {
                tFreeEuro.textContent = Number(freeEuro.toFixed(1));
                tFreeEuro.style.color = freeEuro <= 0 ? '#dc2626' : '#15803d';
            }
            if (tFreeNormal) {
                tFreeNormal.textContent = Number(freeNormal.toFixed(1));
                tFreeNormal.style.color = freeNormal <= 0 ? '#dc2626' : '#15803d';
            }
        }

        let refFilter = ''; // aktív Reference szűrő

        function renderTable() {
            const linesWithTotals = calculateLineTotals(lines);

            // --- Szűrő select feltöltése: a 'references' tömbből (autocomplete forrása),
            //     csak azokat mutatja amelyek ténylegesen szerepelnek a táblázat soraiban ---
            const refFilterEl = container.querySelector('#km-ref-filter');
            const refFilterClear = container.querySelector('#km-ref-filter-clear');
            if (refFilterEl) {
                // Kizárólag a táblázatban lévő sorok 'albaran_number' értékeit gyűjtjük ki
                const uniqueRefs = [...new Set(
                    linesWithTotals
                        .filter(l => !l._empty && l.albaran_number && l.albaran_number.trim() !== '')
                        .map(l => l.albaran_number.trim())
                )].sort();

                const refsToShow = uniqueRefs;
                const prevVal = refFilter;
                refFilterEl.innerHTML = '<option value="">– mind –</option>' +
                    refsToShow.map(r => `<option value="${escHtml(r)}" ${r === prevVal ? 'selected' : ''}>${escHtml(r)}</option>`).join('');
                if (refFilterClear) refFilterClear.style.display = prevVal ? 'inline-flex' : 'none';
            }

            // --- Szűrés ---
            const filteredLines = refFilter
                ? linesWithTotals.filter(l => !l._empty && (l.albaran_number || '').trim() === refFilter)
                : linesWithTotals;

            tbody.innerHTML = filteredLines.map((l, filteredIndex) => {
                const index = linesWithTotals.indexOf(l); // igazi index a lines tömbben
                const isEmpty = !!l._empty;
                // üres sorokban a Total Palets cella üres, input-ok üresek (0 helyett)
                const tv = l.totalPalets !== undefined && l.totalPalets !== '' ? l.totalPalets : '';
                return `
                <tr data-index="${index}" style="${isEmpty ? 'background:#fafafa;' : ''}">
                    <td style="text-align:center; white-space:nowrap; padding:1px 2px;">
                        <button class="transfer-line" data-index="${index}" title="Tétel áthelyezése másik fuvarra"
                            style="background:none; border:none; cursor:pointer; font-size:14px; padding:1px 3px; color:${(isEmpty || currentShipmentIsLoaded || !l._dbId) ? '#94a3b8' : '#f59e0b'};" ${(isEmpty || currentShipmentIsLoaded || !l._dbId) ? 'disabled' : ''}>🔀</button>
                        <button class="clear-line" data-index="${index}" title="Sor törlése (adatok törlése)"
                            style="background:none; border:none; cursor:pointer; font-size:13px; padding:1px 3px; color:${(isEmpty || currentShipmentIsLoaded) ? '#ccc' : '#dc2626'};" ${(isEmpty || currentShipmentIsLoaded) ? 'disabled' : ''}>✕</button>
                    </td>
                    <td style="text-align:center; font-weight:bold; padding:1px 4px; color:${tv ? '#1e40af' : '#ccc'};">${tv}</td>
                    <td><input type="number" class="cell-edit" data-field="euro_palets" data-index="${index}"
                        style="${numCellStyle} width:70px;" value="${isEmpty ? '' : escHtml(l.euro_palets)}" min="0" step="any" placeholder="0" ${currentShipmentIsLoaded ? 'disabled' : ''}></td>
                    <td><input type="number" class="cell-edit" data-field="normal_palets" data-index="${index}"
                        style="${numCellStyle} width:70px;" value="${isEmpty ? '' : escHtml(l.normal_palets)}" min="0" step="any" placeholder="0" ${currentShipmentIsLoaded ? 'disabled' : ''}></td>
                    <td><input type="text" class="cell-edit" data-field="productName" data-index="${index}"
                        style="${cellStyle} min-width:170px;" value="${isEmpty ? '' : escHtml(l.productName)}"></td>
                    <td><input type="text" class="cell-edit" data-field="albaran_number" data-index="${index}"
                        style="${cellStyle} min-width:90px;" value="${isEmpty ? '' : escHtml(l.albaran_number)}"></td>
                    <td><input type="text" class="cell-edit" data-field="customer" data-index="${index}"
                        style="${cellStyle} min-width:90px;" value="${isEmpty ? '' : escHtml(l.customer)}"></td>
                    <td><input type="text" class="cell-edit" data-field="destination" data-index="${index}"
                        style="${cellStyle} min-width:90px;" value="${isEmpty ? '' : escHtml(l.destination)}"></td>
                    <td><input type="text" class="cell-edit" data-field="comment" data-index="${index}"
                        style="${cellStyle} min-width:100px;" value="${isEmpty ? '' : escHtml(l.comment)}"></td>
                    <td><input type="number" class="cell-edit" data-field="gross_weight_kg" data-index="${index}"
                        style="${numCellStyle} width:72px;" value="${isEmpty ? '' : escHtml(l.gross_weight_kg)}" min="0" placeholder="0"></td>
                    <td><input type="number" class="cell-edit" data-field="price_eur" data-index="${index}"
                        style="${numCellStyle} width:72px;" value="${isEmpty ? '' : escHtml(l.price_eur)}" min="0" step="0.01" placeholder="0"></td>
                    <td><input type="number" class="cell-edit" data-field="price_bcn_eur" data-index="${index}"
                        style="${numCellStyle} width:72px;" value="${isEmpty ? '' : escHtml(l.price_bcn_eur)}" min="0" step="0.01" placeholder="0"></td>
                    <td><input type="text" class="cell-edit" data-field="unit" data-index="${index}"
                        style="${cellStyle} width:48px;" value="${isEmpty ? '' : escHtml(l.unit)}"></td>
                    <td><input type="number" class="cell-edit" data-field="reloading_per_plt" data-index="${index}"
                        style="${numCellStyle} width:72px;" value="${isEmpty ? '' : escHtml(l.reloading_per_plt)}" min="0" step="0.01" placeholder="0"></td>
                    <td><input type="number" class="cell-edit" data-field="transport_bcn_per_plt" data-index="${index}"
                        style="${numCellStyle} width:80px;" value="${isEmpty ? '' : escHtml(l.transport_bcn_per_plt)}" min="0" step="0.01" placeholder="0"></td>
                    <td><input type="text" class="cell-edit" data-field="customer_order_no" data-index="${index}"
                        style="${cellStyle} min-width:100px;" value="${isEmpty ? '' : escHtml(l.customer_order_no)}"></td>
                    <td><input type="number" class="cell-edit" data-field="truck_number_per" data-index="${index}"
                        style="${numCellStyle} width:60px;" value="${isEmpty ? '' : escHtml(parseInt(l.truck_number_per) || 0)}" min="0" step="1" placeholder="0"></td>
                </tr>`;
            }).join('');

            // Inline cell edit – szinkron az állapotba
            tbody.querySelectorAll('.cell-edit').forEach(inp => {
                inp.addEventListener('change', () => {
                    const idx = parseInt(inp.dataset.index);
                    const field = inp.dataset.field;
                    // Ha üres sor volt és most adatot kap, töröljük az _empty flag-et
                    if (lines[idx]._empty && inp.value.trim() !== '' && inp.value.trim() !== '0') {
                        delete lines[idx]._empty;
                    }
                    const numFields = ['euro_palets', 'normal_palets', 'gross_weight_kg', 'price_eur',
                        'price_bcn_eur', 'reloading_per_plt', 'transport_bcn_per_plt'];
                    const intFields = ['truck_number_per'];
                    if (intFields.includes(field)) {
                        lines[idx][field] = parseInt(inp.value) || 0;
                    } else if (numFields.includes(field)) {
                        lines[idx][field] = parseFloat(inp.value) || 0;
                    } else {
                        lines[idx][field] = inp.value;
                    }
                    // Total Palets újraszámítása
                    const updated = calculateLineTotals(lines);
                    const row = tbody.querySelector(`tr[data-index="${idx}"]`);
                    if (row) {
                        const totCell = row.cells[1];
                        if (totCell) {
                            const tv2 = updated[idx].totalPalets;
                            totCell.textContent = tv2 !== undefined && tv2 !== '' ? tv2 : '';
                            totCell.style.color = tv2 ? '#1e40af' : '#ccc';
                        }
                    }
                    updateTableTotals(updated);
                });
            });

            updateTableTotals(filteredLines);

            // Inline Product Autocomplete
            tbody.querySelectorAll('.cell-edit[data-field="productName"]').forEach(inp => {
                inp.addEventListener('input', () => {
                    const val = inp.value.toLowerCase();
                    const idx = parseInt(inp.dataset.index);
                    inlineDropdown.innerHTML = '';
                    if (!val) { inlineDropdown.style.display = 'none'; return; }

                    const filtered = products.filter(p => p.name.toLowerCase().startsWith(val)).slice(0, 10);
                    if (filtered.length > 0) {
                        filtered.forEach(p => {
                            const div = document.createElement('div');
                            div.style.cssText = 'padding:6px 8px; cursor:pointer; border-bottom:1px solid #eee; font-size:12px;';
                            div.textContent = p.name;
                            div.onmousedown = () => {
                                inp.value = p.name;
                                lines[idx].productName = p.name;
                                lines[idx].product_id = p.id;
                                if (lines[idx]._empty) delete lines[idx]._empty;
                                inlineDropdown.style.display = 'none';
                                // trigger change visually
                                const ev = new Event('change');
                                inp.dispatchEvent(ev);
                            };
                            div.onmouseover = () => div.style.backgroundColor = '#f1f5f9';
                            div.onmouseout = () => div.style.backgroundColor = 'transparent';
                            inlineDropdown.appendChild(div);
                        });
                        const rect = inp.getBoundingClientRect();
                        inlineDropdown.style.top = (rect.bottom) + 'px';
                        inlineDropdown.style.left = rect.left + 'px';
                        inlineDropdown.style.width = Math.max(rect.width, 200) + 'px';
                        inlineDropdown.style.display = 'block';
                    } else {
                        inlineDropdown.style.display = 'none';
                    }
                });
                inp.addEventListener('blur', () => {
                    setTimeout(() => { inlineDropdown.style.display = 'none'; }, 200);
                });
            });

            // Inline Reference Autocomplete
            tbody.querySelectorAll('.cell-edit[data-field="albaran_number"]').forEach(inp => {
                inp.addEventListener('input', () => {
                    const val = inp.value.toLowerCase();
                    const idx = parseInt(inp.dataset.index);
                    inlineRefDropdown.innerHTML = '';
                    if (!val) { inlineRefDropdown.style.display = 'none'; return; }

                    const filtered = references.filter(p => p.name.toLowerCase().startsWith(val)).slice(0, 10);
                    if (filtered.length > 0) {
                        filtered.forEach(p => {
                            const div = document.createElement('div');
                            div.style.cssText = 'padding:6px 8px; cursor:pointer; border-bottom:1px solid #eee; font-size:12px;';
                            div.textContent = p.name;
                            div.onmousedown = () => {
                                inp.value = p.name;
                                lines[idx].albaran_number = p.name;
                                if (lines[idx]._empty) delete lines[idx]._empty;
                                inlineRefDropdown.style.display = 'none';
                                // trigger change visually
                                const ev = new Event('change');
                                inp.dispatchEvent(ev);
                            };
                            div.onmouseover = () => div.style.backgroundColor = '#f1f5f9';
                            div.onmouseout = () => div.style.backgroundColor = 'transparent';
                            inlineRefDropdown.appendChild(div);
                        });
                        const rect = inp.getBoundingClientRect();
                        inlineRefDropdown.style.top = (rect.bottom) + 'px';
                        inlineRefDropdown.style.left = rect.left + 'px';
                        inlineRefDropdown.style.width = Math.max(rect.width, 200) + 'px';
                        inlineRefDropdown.style.display = 'block';
                    } else {
                        inlineRefDropdown.style.display = 'none';
                    }
                });
                inp.addEventListener('blur', () => {
                    setTimeout(() => { inlineRefDropdown.style.display = 'none'; }, 200);
                });
            });

            // Inline Customer Autocomplete
            tbody.querySelectorAll('.cell-edit[data-field="customer"]').forEach(inp => {
                inp.addEventListener('input', () => {
                    const val = inp.value.toLowerCase();
                    const idx = parseInt(inp.dataset.index);
                    inlineCustDropdown.innerHTML = '';
                    if (!val) { inlineCustDropdown.style.display = 'none'; return; }

                    const filtered = customers.filter(p => p.name.toLowerCase().startsWith(val)).slice(0, 10);
                    if (filtered.length > 0) {
                        filtered.forEach(p => {
                            const div = document.createElement('div');
                            div.style.cssText = 'padding:6px 8px; cursor:pointer; border-bottom:1px solid #eee; font-size:12px;';
                            div.textContent = p.name;
                            div.onmousedown = () => {
                                inp.value = p.name;
                                lines[idx].customer = p.name;
                                if (lines[idx]._empty) delete lines[idx]._empty;
                                inlineCustDropdown.style.display = 'none';
                                // trigger change visually
                                const ev = new Event('change');
                                inp.dispatchEvent(ev);
                            };
                            div.onmouseover = () => div.style.backgroundColor = '#f1f5f9';
                            div.onmouseout = () => div.style.backgroundColor = 'transparent';
                            inlineCustDropdown.appendChild(div);
                        });
                        const rect = inp.getBoundingClientRect();
                        inlineCustDropdown.style.top = (rect.bottom) + 'px';
                        inlineCustDropdown.style.left = rect.left + 'px';
                        inlineCustDropdown.style.width = Math.max(rect.width, 200) + 'px';
                        inlineCustDropdown.style.display = 'block';
                    } else {
                        inlineCustDropdown.style.display = 'none';
                    }
                });
                inp.addEventListener('blur', () => {
                    setTimeout(() => { inlineCustDropdown.style.display = 'none'; }, 200);
                });
            });

            // 🔀 Áthelyezés gombok
            tbody.querySelectorAll('.transfer-line').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index);
                    editingLineIndex = idx;
                    editingLineDbId = lines[idx]._dbId || null;
                    openTransferPopup();
                });
            });

            // ✕ Adatok törlése (nem a sort töröljük, hanem visszaállítjuk üres sorra)
            tbody.querySelectorAll('.clear-line').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index);
                    if (lines[idx]._empty) return;
                    if (!confirm('Biztosan törli a tételt? A tétel véglegesen törlésre kerül és NEM kerül át az Áru igények közé!')) return;

                    const dbId = lines[idx]._dbId;
                    if (dbId) {
                        for (let snapIdx in originalLinesSnapshot) {
                            if (originalLinesSnapshot[snapIdx].dbId === dbId) {
                                delete originalLinesSnapshot[snapIdx];
                            }
                        }
                    }

                    lines.splice(idx, 1);
                    normalizeLines();
                    renderTable();
                });
            });
        }

        // ===== REFERENCE SZŰRŐ ESEMÉNYKEZELŐK (egyszer regisztrálva) =====
        container.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'km-ref-filter') {
                refFilter = e.target.value;
                const clearBtn = container.querySelector('#km-ref-filter-clear');
                if (clearBtn) clearBtn.style.display = refFilter ? 'inline-flex' : 'none';
                renderTable();
            }
        });
        container.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'km-ref-filter-clear') {
                refFilter = '';
                const sel = container.querySelector('#km-ref-filter');
                if (sel) sel.value = '';
                e.target.style.display = 'none';
                renderTable();
            }
        });

        // ===== TÉTEL ÁTHELYEZÉSE GOMB =====
        const transferOverlay = container.querySelector('#transfer-overlay');
        const transferTargetSelect = container.querySelector('#transfer-target-shipment');
        const transferEuroInput = container.querySelector('#transfer-euro');
        const transferNormalInput = container.querySelector('#transfer-normal');
        const transferEuroMax = container.querySelector('#transfer-euro-max');
        const transferNormalMax = container.querySelector('#transfer-normal-max');
        const transferSourceInfo = container.querySelector('#transfer-source-info');

        async function openTransferPopup() {
            resetTransferDrag();
            if (currentShipmentIsLoaded) {
                alert('A tétel nem áthelyezhető, mert ez a kamion már RAKODVA státuszban van!');
                return;
            }
            if (!editingLineDbId) { alert('Ez a sor még nem lett elmentve az adatbázisba. Előbb mentse a fuvar adatait.'); return; }
            const l = editingLineIndex !== null ? lines[editingLineIndex] : null;
            if (!l) return;

            // Adatok megjelenítése
            transferSourceInfo.innerHTML = `<strong>Tétel:</strong> ${l.productName || '–'} | ` +
                `<strong>Euro raklap:</strong> ${l.euro_palets} | <strong>Normál raklap:</strong> ${l.normal_palets}`;
            transferEuroInput.value = 0;
            transferEuroInput.max = l.euro_palets;
            transferEuroMax.textContent = 'Max: ' + l.euro_palets;
            transferNormalInput.value = 0;
            transferNormalInput.max = l.normal_palets;
            transferNormalMax.textContent = 'Max: ' + l.normal_palets;

            // Nem-rakodott kamionok betöltése
            transferTargetSelect.innerHTML = '<option value="">-- Betöltés... --</option>';
            try {
                const res = await fetch('/api/v1/shipments/unloaded');
                const unloaded = await res.json();
                const filteredUnloaded = unloaded.filter(s => s.id !== currentShipmentId);
                if (filteredUnloaded.length === 0) {
                    transferTargetSelect.innerHTML = '<option value="">-- Válasszon célpontot --</option>' +
                        '<option value="DEMAND">📦 Áru igény</option>' +
                        '<option value="" disabled>– Nincs másik nem-rakodott kamion –</option>';
                } else {
                    transferTargetSelect.innerHTML = '<option value="">-- Válasszon célpontot --</option>' +
                        '<option value="DEMAND">📦 Áru igény</option>' +
                        filteredUnloaded.map(s => `<option value="${s.id}">${s.order_number}${s.transporter_name ? ' (' + s.transporter_name + ')' : ''}</option>`).join('');
                }
            } catch (err) {
                transferTargetSelect.innerHTML = '<option value="">[Betöltési hiba]</option>';
            }

            transferOverlay.style.display = 'flex';
        }

        function closeTransferPopup() { transferOverlay.style.display = 'none'; }

        container.querySelector('#btn-transfer-close').addEventListener('click', closeTransferPopup);
        container.querySelector('#btn-transfer-cancel').addEventListener('click', closeTransferPopup);
        transferOverlay.addEventListener('click', e => { if (e.target === transferOverlay) closeTransferPopup(); });

        container.querySelector('#btn-transfer-confirm').addEventListener('click', async () => {
            const targetId = transferTargetSelect.value;
            if (!targetId) { alert('Kérlek válassz célkamionszámot!'); return; }
            const moveEuro = parseInt(transferEuroInput.value) || 0;
            const moveNormal = parseInt(transferNormalInput.value) || 0;
            if (moveEuro === 0 && moveNormal === 0) { alert('Legalább 1 raklapot add meg az áthelyezéshez!'); return; }

            const targetLabel = transferTargetSelect.options[transferTargetSelect.selectedIndex]?.text || targetId;
            const targetPayload = targetId === 'DEMAND' ? 'DEMAND' : parseInt(targetId);
            const l = editingLineIndex !== null ? lines[editingLineIndex] : null;
            const confirmMsg = `Biztosan áthelyezi az alábbi tételt?\n\n` +
                `Termék: ${l?.productName || '–'}\n` +
                `Euro raklap: ${moveEuro} | Normál raklap: ${moveNormal}\n\n` +
                `Célkamion: ${targetLabel}`;
            if (!confirm(confirmMsg)) return;

            try {
                const res = await fetch(`/api/v1/shipment-lines/${editingLineDbId}/transfer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target_shipment_id: targetPayload, euro_palets: moveEuro, normal_palets: moveNormal })
                });
                const data = await res.json();
                if (!res.ok) { alert('Hiba: ' + (data.error || 'Ismeretlen hiba')); return; }

                // Helyi állapot frissítése
                if (editingLineIndex !== null) {
                    lines[editingLineIndex].euro_palets -= moveEuro;
                    lines[editingLineIndex].normal_palets -= moveNormal;

                    const snap = originalLinesSnapshot[editingLineIndex];
                    if (snap) {
                        snap.euro_palets = Math.max(0, snap.euro_palets - moveEuro);
                        snap.normal_palets = Math.max(0, snap.normal_palets - moveNormal);
                    }

                    if (lines[editingLineIndex].euro_palets === 0 && lines[editingLineIndex].normal_palets === 0) {
                        lines.splice(editingLineIndex, 1);
                        normalizeLines();
                    }
                }
                closeTransferPopup();
                closeLineOverlay();
                renderTable();
                document.dispatchEvent(new CustomEvent('cargoDemandsUpdated')); // Frissíti a Rakodás nézet Áru igény részét
                alert(`✅ ${data.message}`);
            } catch (err) {
                alert('Hálózati hiba: ' + err.message);
            }
        });

        // ===== MENTÉS GOMB =====
        container.querySelector('#btn-save-km').addEventListener('click', async () => {
            const orderNumber = kmOrder.value.trim();
            if (!orderNumber || orderNumber === 'Betöltés...') {
                alert('A Kamionszám megadása kötelező (válassz típust)!');
                return;
            }

            if (isNew) {
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

            // Mentésnél csak a nem-üres sorokat küldjük
            const realLines = lines.filter(l => !l._empty);

            const payload = {
                order_number: orderNumber,
                truck_type: kmTip.value,
                truck_seq_number: parseInt(orderNumber.replace(/[^0-9]/g, '')) || 0,
                transporter_id: parseInt(cmbTransporter.value) || null,
                plate_number: container.querySelector('#km-plate').value,
                loading_date: container.querySelector('#km-load-date').value || null,
                arrival_date: container.querySelector('#km-arr-date').value || null,
                loading_place: container.querySelector('#km-load-place').value,
                transport_price: parseFloat(container.querySelector('#km-price').value) || 0,
                temperature: container.querySelector('#km-temperature').value.trim() || null,
                lines: realLines.filter(l => (parseFloat(String(l.euro_palets).replace(',', '.')) || 0) > 0 || (parseFloat(String(l.normal_palets).replace(',', '.')) || 0) > 0)
            };

            try {
                let res;
                if (isNew) {
                    res = await fetch('/api/v1/shipments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await fetch(`/api/v1/shipments/${currentShipmentId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (res.ok) {
                    const data = await res.json();
                    // ===== RAKLAP-CSÖKKENTÉS FIGYELŐ (csak szerkesztésnél, PUT esetén) =====
                    if (!isNew && Object.keys(originalLinesSnapshot).length > 0) {
                        const decreasedItems = [];
                        Object.values(originalLinesSnapshot).forEach(snap => {
                            if (!snap.dbId) return;
                            // Keressük a hozzá tartozó jelenlegi sort dbId alapján a teljes lines tömbben
                            const currentLine = lines.find(l => l._dbId === snap.dbId);

                            // Ha a sor üres/törölt, akkor 0 raklappal számolunk
                            const currentEuro = (currentLine && !currentLine._empty) ? (parseFloat(String(currentLine.euro_palets).replace(',', '.')) || 0) : 0;
                            const currentNormal = (currentLine && !currentLine._empty) ? (parseFloat(String(currentLine.normal_palets).replace(',', '.')) || 0) : 0;

                            const diffEuro = (snap.euro_palets || 0) - currentEuro;
                            const diffNormal = (snap.normal_palets || 0) - currentNormal;

                            if (diffEuro > 0 || diffNormal > 0) {
                                const refLine = currentLine || lines.find(l => l._dbId === snap.dbId);
                                decreasedItems.push({
                                    productName: (refLine && refLine.productName) || snap.productName || '(ismeretlen termék)',
                                    customer: (refLine && refLine.customer) || snap.customer || '',
                                    albaran_number: (refLine && refLine.albaran_number) || snap.albaran_number || '',
                                    diffEuro: Math.max(0, diffEuro),
                                    diffNormal: Math.max(0, diffNormal),
                                    product_id: (refLine && refLine.product_id) || snap.product_id || null
                                });
                            }
                        });

                        if (decreasedItems.length > 0) {
                            // Automatikusan az Áru igénybe tesszük a különbséget
                            const demandPromises = decreasedItems.map(item =>
                                fetch('/api/v1/cargo-demands', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        product_id: item.product_id,
                                        product_name: item.productName,
                                        albaran_number: item.albaran_number || null,
                                        customer_name: item.customer || null,
                                        euro_palets: item.diffEuro,
                                        normal_palets: item.diffNormal,
                                        notes: `Automatikus: raklap csökkentés ${orderNumber} fuvarról`
                                    })
                                }).then(async res => {
                                    if (!res.ok) {
                                        const errText = await res.text();
                                        throw new Error(`Szerver hiba (${res.status}): ${errText}`);
                                    }
                                    return res.json();
                                }).catch(err => {
                                    console.error('Áru igény mentési hiba:', err);
                                    alert('Hiba történt az Áru igény automatikus mentésekor: ' + err.message);
                                })
                            );
                            await Promise.all(demandPromises);

                            // Értesítjük a többi modult (pl. rakodas.js), hogy frissítsék a listájukat
                            document.dispatchEvent(new CustomEvent('cargoDemandsUpdated'));

                            const itemList = decreasedItems.map(it =>
                                `• ${it.productName}: ${it.diffEuro > 0 ? it.diffEuro + ' Euró' : ''} ${it.diffNormal > 0 ? it.diffNormal + ' Normál' : ''} raklap`
                            ).join('\n');
                            alert(`✅ Kamion sikeresen frissítve: ${orderNumber}\n\n📦 Az alábbi tétel(ek) az Áru igény táblába kerültek (csökkentett mennyiség):\n${itemList}`);
                        } else {
                            alert('Kamion sikeresen frissítve: ' + orderNumber);
                        }
                    } else {
                        alert(isNew ? 'Kamion sikeresen létrehozva: ' + orderNumber : 'Kamion sikeresen frissítve: ' + orderNumber);
                    }

                    if (isNew) {
                        isNew = false;
                        currentShipmentId = data.id;
                    }

                    // Értesítjük a Rakodás modult (és másokat) a sikeres mentésről/létrehozásról
                    document.dispatchEvent(new CustomEvent('shipmentSaved'));

                    if (currentShipmentId) {
                        await loadExistingShipment(currentShipmentId);
                    }

                } else {
                    const err = await res.json();
                    if (err.error && err.error.toLowerCase().includes('foglalt')) conflictMsg.style.display = 'inline';
                    alert('Hiba a mentés során: ' + (err.error || 'Ismeretlen hiba'));
                }
            } catch (err) {
                console.error(err);
                alert('Nem sikerült csatlakozni a szerverhez.');
            }
        });

        // ===== INIT =====
        await loadTransporters();
        await loadProducts();
        await loadReferences();
        await loadCustomers();
        if (kamionId) {
            await loadExistingShipment(kamionId);
            container.querySelector('#btn-save-km').textContent = 'Kamion frissítése';
        } else {
            // Új kamion: 25 üres sort töltünk fel
            normalizeLines();
            renderTable();
        }
    });
}

// Kompatibilitás a régi API-val
export function renderKamionSzerkesztes(container, windowManager) {
    openKamionSzerkesztesWindow(windowManager);
}

function initDraggable(modalEl, headerEl) {
    let offsetX = 0;
    let offsetY = 0;
    let startX = 0;
    let startY = 0;

    headerEl.addEventListener('mousedown', dragStart);

    function dragStart(e) {
        if (e.button !== 0) return; // Only left click
        if (['INPUT', 'BUTTON', 'SELECT', 'OPTION', 'TEXTAREA', 'A'].includes(e.target.tagName)) return;

        startX = e.clientX;
        startY = e.clientY;

        document.addEventListener('mousemove', dragging);
        document.addEventListener('mouseup', dragEnd);

        e.preventDefault();
    }

    function dragging(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        startX = e.clientX;
        startY = e.clientY;

        offsetX += dx;
        offsetY += dy;

        modalEl.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    function dragEnd() {
        document.removeEventListener('mousemove', dragging);
        document.removeEventListener('mouseup', dragEnd);
    }

    return function resetPosition() {
        offsetX = 0;
        offsetY = 0;
        modalEl.style.transform = 'translate(0px, 0px)';
    };
}

