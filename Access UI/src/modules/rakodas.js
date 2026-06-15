import { openKamionSzerkesztesWindow } from './kamion_szerkesztes.js';

// Rakodás modul - Access frmRakodas alapján
// Bal tábla: Rakodások | Jobb tábla: Áru igény (valós adatbázis)
export function renderRakodas(container, windowManager) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';

    // --- Mock adatbázis: foglalt kamionszámok szezon szerint ---
    var usedNumbers = {
        'BEL': { 'Season 25-26': [1, 2, 3] },
        'EX': { 'Season 25-26': [1] },
        'GHU': { 'Season 25-26': [265, 266, 267, 268] },
        'H': { 'Season 25-26': [121, 122, 123] },
        'LOG': { 'Season 25-26': [1, 2] }
    };

    function getNextNumber(tip, szezon) {
        var list = (usedNumbers[tip] && usedNumbers[tip][szezon]) ? usedNumbers[tip][szezon] : [];
        if (list.length === 0) return 1;
        var max = list.reduce(function (a, b) { return a > b ? a : b; });
        return max + 1;
    }

    function formatKamisz(tip, num) {
        if (tip === 'GHU') return 'GHU ' + num;
        if (tip === 'H') return 'H' + String(num).padStart(3, '0');
        return tip + String(num).padStart(3, '0');
    }

    // HTML
    view.innerHTML =
        '<div class="view-header" style="margin-bottom:16px;">' +
        '<h2 class="view-title">Rakodás</h2>' +
        '<p class="view-subtitle">Rakodások és áru igények kezelése</p>' +
        '</div>' +

        // Filter strip
        '<div class="access-form-view" style="margin-bottom:16px; padding:12px 16px;">' +
        '<div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">' +
        '<div style="display:flex; align-items:center; gap:8px;">' +
        '<label class="access-control-label" for="rak-kamisz" style="white-space:nowrap;">Kamionszám:</label>' +
        '<input type="text" id="rak-kamisz" class="access-control-input" placeholder="Keresés..." style="width:150px;">' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:8px;">' +
        '<label class="access-control-label" for="rak-fuvarozo" style="white-space:nowrap;">Fuvarozó:</label>' +
        '<select id="rak-fuvarozo" class="access-control-input" style="width:170px;">' +
        '<option value="">-- Összes --</option>' +
        '</select>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:8px;">' +
        '<label class="access-control-label" style="white-space:nowrap;">Rakodás (tól-ig):</label>' +
        '<input type="date" id="rak-date-from" class="access-control-input" style="width:160px;">' +
        '<span>-</span>' +
        '<input type="date" id="rak-date-to" class="access-control-input" style="width:160px;">' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:6px;">' +
        '<input type="checkbox" id="rak-open-only">' +
        '<label for="rak-open-only" style="white-space:nowrap; font-size:13px;">Csak nyitott rakodások</label>' +
        '</div>' +
        '<button class="secondary-btn btn-dense" id="btn-clear-rak">Szűrők törlése</button>' +
        '<button class="primary-btn btn-dense" id="btn-new-truck">+ Új kamion</button>' +
        '</div>' +
        '</div>' +

        // Két tábla egymás mellett
        '<div style="display:flex; gap:12px; align-items:flex-start; overflow-x:auto;">' +

        // BAL TÁBLA: Rakodások
        '<div class="access-subform" style="flex:3; min-width:0;">' +
        '<div class="access-subform-header">Rakodások</div>' +
        '<div style="overflow-x:auto;">' +
        '<table class="access-subform-table" id="rak-left-table">' +
        '<thead><tr>' +
        '<th style="min-width:120px;">Kamionszám</th>' +
        '<th style="min-width:110px;">Rakodás nap</th>' +
        '<th style="min-width:120px;">Fuvarozó</th>' +
        '<th style="min-width:80px; text-align:center;">Rakodva</th>' +
        '</tr></thead>' +
        '<tbody id="rak-tbody"></tbody>' +
        '</table>' +
        '</div>' +
        '</div>' +

        // JOBB TÁBLA: Áru igény
        '<div class="access-subform" style="flex:2; min-width:0; background:linear-gradient(135deg, #f0f7ff, #e8f4fd); border:1px solid #bde0fa;">' +
        '<div class="access-subform-header" style="background:linear-gradient(90deg,#0ea5e9,#2563eb); color:#fff; display:flex; align-items:center; justify-content:space-between; padding:7px 14px;">' +
        '<span style="font-size:11px; font-weight:600;">Áru igény</span>' +
        '<button id="btn-add-aru" title="Új áru igény hozzáadása" style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4); color:#fff; border-radius:4px; padding:2px 8px; cursor:pointer; font-size:13px; font-weight:700; line-height:1.4;">+ Hozzáadás</button>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
        '<table class="access-subform-table" id="rak-right-table" style="background:transparent; font-size:10px;">' +
        '<thead><tr>' +
        '<th style="min-width:40px; background:rgba(14,165,233,0.1); text-align:center; font-size:10px; padding:4px 3px;">Euro plt</th>' +
        '<th style="min-width:40px; background:rgba(14,165,233,0.1); text-align:center; font-size:10px; padding:4px 3px;">Norm plt</th>' +
        '<th style="min-width:140px; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 3px;">Termék</th>' +
        '<th style="min-width:80px; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 3px;">Partner</th>' +
        '<th style="min-width:80px; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 3px;">Vevő</th>' +
        '<th style="min-width:70px; text-align:center; background:rgba(14,165,233,0.1); font-size:10px; padding:4px 3px;">Kamionra</th>' +
        '</tr></thead>' +
        '<tbody id="aru-tbody"></tbody>' +
        '</table>' +
        '</div>' +
        '</div>' +

        '</div>' +

        ''; // A régi modal-km-szerk és modal-uj-kamion kódok eltávolítva, mert a WindowManager kezeli őket

    container.appendChild(view);

    // A modalt a body-ba szervezzük ki, hogy a CSS transform ne rontsa el a position:fixed pozícionálást
    // Ha már létezik egy korábbi verzió (mert a user többször nyitotta meg a modult), töröljük
    var oldModal = document.getElementById('modal-kamisz-menu');
    if (oldModal) {
        oldModal.remove();
    }
    var modalEl = document.createElement('div');
    modalEl.id = 'modal-kamisz-menu';
    modalEl.innerHTML =
        '<div style="background:#fff; padding:28px; border-radius:12px; width:340px; box-shadow:0 8px 32px rgba(0,0,0,0.2);">' +
        '<h3 style="margin-bottom:6px; color:#1e293b;">Kamion: <span id="km-menu-tour"></span></h3>' +
        '<p style="color:#64748b; font-size:13px; margin-bottom:20px;">Válasszon műveletet:</p>' +
        '<div style="display:flex; flex-direction:column; gap:10px;">' +
        '<button class="primary-btn" id="btn-km-szerkesztes">✏️ Szerkesztés</button>' +
        '<button class="primary-btn" id="btn-km-doc" style="background:#0ea5e9; border-color:#0284c7;">📄 Dokumentum megnyitás</button>' +
        '<button class="primary-btn" id="btn-km-rename" style="background:#f59e0b; border-color:#d97706;">Kamionszám változtatás</button>' +
        '<button class="secondary-btn" id="btn-km-cancel">Mégsem</button>' +
        '</div>' +
        '</div>';
    document.body.appendChild(modalEl);
    
    modalEl.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:9999; align-items:center; justify-content:center;';

    // ============= ÁLLLAPOT =============
    var rakData = [];
    var aruData = []; // Valós adatbázis – cargo_demands
    var productsList = []; // Termékek az autocomplete-hez
    var unloadedShipments = []; // Nem-rakodott kamionok listája

    // ============= ELEMEK =============
    var inputKamisz = view.querySelector('#rak-kamisz');
    var inputFuvarozo = view.querySelector('#rak-fuvarozo');
    var inputDateFrom = view.querySelector('#rak-date-from');
    var inputDateTo = view.querySelector('#rak-date-to');
    var chkOpenOnly = view.querySelector('#rak-open-only');
    var btnClear = view.querySelector('#btn-clear-rak');
    var tbody = view.querySelector('#rak-tbody');
    var aruTbody = view.querySelector('#aru-tbody');

    var currentKamionForMenu = null; // a menüből nyitott kamion obj

    // ============= SZŰRŐ + BAL TÁBLA =============
    function filter() {
        var t = inputKamisz.value.toUpperCase().replace(/\s+/g, '');
        var f = inputFuvarozo.value;
        var dFrom = inputDateFrom.value;
        var dTo = inputDateTo.value;
        var open = chkOpenOnly.checked;
        var filtered = rakData.filter(function (r) {
            return (r.tour || '').toUpperCase().replace(/\s+/g, '').indexOf(t) !== -1 &&
                (f === '' || r.transporter === f) &&
                (dFrom === '' || r.date >= dFrom) &&
                (dTo === '' || r.date <= dTo) &&
                (!open || !r.loaded);
        });
        renderLeft(filtered);
    }

    function renderLeft(data) {
        tbody.innerHTML = data.map(function (r) {
            return '<tr>' +
                '<td><span class="rak-open-link" data-id="' + r.id + '" style="cursor:pointer; color:#2563eb; text-decoration:underline; font-weight:600;" title="Kattints a műveletekhez">' + r.tour + '</span></td>' +
                '<td>' + r.date + '</td>' +
                '<td>' + r.transporter + '</td>' +
                '<td style="text-align:center;"><input type="checkbox" class="rak-loaded-chk" data-id="' + r.id + '"' + (r.loaded ? ' checked' : '') + '></td>' +
                '</tr>';
        }).join('');

        // Checkbox trigger
        tbody.querySelectorAll('.rak-loaded-chk').forEach(function (chk) {
            chk.addEventListener('change', async function (e) {
                var id = parseInt(e.target.getAttribute('data-id'));
                var isLoaded = e.target.checked;
                var row = rakData.find(function (x) { return x.id === id; });
                if (row) {
                    row.loaded = isLoaded;
                    try {
                        const res = await fetch('/api/v1/shipments/' + id + '/loaded', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ is_loaded: isLoaded })
                        });
                        if (!res.ok) throw new Error('Hiba a mentésnél');
                        console.log('Rakodva trigger:', row.tour, '=>', row.loaded);
                    } catch (err) {
                        console.error('Hiba:', err);
                        e.target.checked = !isLoaded; // revert if fails
                        row.loaded = !isLoaded;
                        alert('Nem sikerült elmenteni a rakodási státuszt!');
                    }
                }
            });
        });

        // Kamionszám kattintás -> menü modal
        tbody.querySelectorAll('.rak-open-link').forEach(function(el) {
            el.addEventListener('click', function(e) {
                var id = parseInt(e.currentTarget.getAttribute('data-id'));
                currentKamionForMenu = rakData.find(function(x) { return x.id === id; });
                document.getElementById('km-menu-tour').textContent = currentKamionForMenu ? currentKamionForMenu.tour : '';
                showModal();
            });
        });
    }

    // ============= JOBB TÁBLA: ÁRU IGÉNY (valós adatok) =============
    function renderRight() {
        const notFulfilled = aruData.filter(r => !r.is_fulfilled);
        if (notFulfilled.length === 0) {
            aruTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:12px; color:#94a3b8; font-size:10px;">Nincs áru igény</td></tr>';
            return;
        }
        aruTbody.innerHTML = notFulfilled.map(function (r) {
            return '<tr>' +
                '<td style="text-align:center; padding:3px 4px; font-size:10px; font-weight:600; color:#0369a1;">' + (r.euro_palets || 0) + '</td>' +
                '<td style="text-align:center; padding:3px 4px; font-size:10px; font-weight:600; color:#7c3aed;">' + (r.normal_palets || 0) + '</td>' +
                '<td style="padding:3px 4px; font-size:10px;">' + escHtml(r.product_name || '') + '</td>' +
                '<td style="padding:3px 4px; font-size:10px; color:#64748b;">' + escHtml(r.partner_name || '') + '</td>' +
                '<td style="padding:3px 4px; font-size:10px; color:#64748b;">' + escHtml(r.customer_name || '') + '</td>' +
                '<td style="text-align:center; padding:3px 4px;">' +
                '<button class="btn-send-aru" data-id="' + r.id + '" title="Küldés kamionra" ' +
                'style="background:#ef4444; color:#fff; border:1px solid #dc2626; border-radius:4px; padding:2px 7px; font-size:11px; cursor:pointer; transition:all 0.2s;">➡</button>' +
                '</td>' +
                '</tr>';
        }).join('');

        aruTbody.querySelectorAll('.btn-send-aru').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var id = parseInt(e.currentTarget.getAttribute('data-id'));
                var row = aruData.find(function (x) { return x.id === id; });
                if (!row) return;
                openSendToTruckModal(row);
            });
        });
    }

    function escHtml(s) {
        return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ============= KÜLDÉS KAMIONRA MODAL =============
    function openSendToTruckModal(demandRow) {
        const modalContent = `
            <div style="padding:20px;">
                <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:10px 12px; margin-bottom:14px; font-size:12px; color:#0369a1;">
                    <strong>Termék:</strong> ${escHtml(demandRow.product_name || '–')}<br>
                    <strong>Elérhető:</strong> ${demandRow.euro_palets || 0} Euro + ${demandRow.normal_palets || 0} Normál raklap
                </div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div style="display:flex; flex-direction:column; gap:3px;">
                        <label style="font-size:11px; font-weight:600; color:#334155;">Célkamion (csak nem-rakodott):</label>
                        <select id="send-target-select" class="access-control-input" style="font-size:12px; height:32px;">
                            <option value="">-- Betöltés... --</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <div style="display:flex; flex-direction:column; gap:3px; flex:1;">
                            <label style="font-size:11px; font-weight:600; color:#334155;">N° Euro Palets küldve:</label>
                            <input type="number" id="send-euro" class="access-control-input" style="font-size:12px; height:32px;" value="0" min="0" max="${demandRow.euro_palets || 0}">
                            <small style="color:#64748b; font-size:10px;">Max: ${demandRow.euro_palets || 0}</small>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:3px; flex:1;">
                            <label style="font-size:11px; font-weight:600; color:#334155;">N° Normal Palets küldve:</label>
                            <input type="number" id="send-normal" class="access-control-input" style="font-size:12px; height:32px;" value="0" min="0" max="${demandRow.normal_palets || 0}">
                            <small style="color:#64748b; font-size:10px;">Max: ${demandRow.normal_palets || 0}</small>
                        </div>
                    </div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
                    <button class="secondary-btn btn-send-cancel">Mégsem</button>
                    <button class="primary-btn btn-send-confirm" style="background:#22c55e; border-color:#16a34a;">➡ Küldés</button>
                </div>
            </div>
        `;

        const modal = windowManager.createModal({
            title: '➡ Küldés kamionra',
            width: 480,
            height: 420,
            content: modalContent
        });

        const modalEl = modal.element;
        const selectTarget = modalEl.querySelector('#send-target-select');

        // Nem-rakodott kamionok betöltése
        fetch('/api/v1/shipments/unloaded')
            .then(r => r.json())
            .then(unloaded => {
                if (unloaded.length === 0) {
                    selectTarget.innerHTML = '<option value="">– Nincs nem-rakodott kamion –</option>';
                } else {
                    selectTarget.innerHTML = '<option value="">-- Válasszon kamionszámot --</option>' +
                        unloaded.map(s => `<option value="${s.id}">${s.order_number}${s.transporter_name ? ' (' + s.transporter_name + ')' : ''}</option>`).join('');
                }
            })
            .catch(() => {
                selectTarget.innerHTML = '<option value="">[Betöltési hiba]</option>';
            });

        modalEl.querySelector('.btn-send-cancel').addEventListener('click', () => modal.close());

        modalEl.querySelector('.btn-send-confirm').addEventListener('click', async () => {
            const targetId = selectTarget.value;
            if (!targetId) { alert('Kérlek válassz célkamionszámot!'); return; }
            const sendEuro = parseInt(modalEl.querySelector('#send-euro').value) || 0;
            const sendNormal = parseInt(modalEl.querySelector('#send-normal').value) || 0;
            if (sendEuro === 0 && sendNormal === 0) { alert('Legalább 1 raklapot adj meg!'); return; }

            const targetLabel = selectTarget.options[selectTarget.selectedIndex]?.text || targetId;

            // Megerősítés
            const confirmMsg = `Biztosan kamionra küldi az alábbi tételt?\n\n` +
                `Termék: ${demandRow.product_name || '–'}\n` +
                `Euro: ${sendEuro} plt | Normál: ${sendNormal} plt\n\n` +
                `Célkamion: ${targetLabel}\n\n` +
                `${(sendEuro < (demandRow.euro_palets||0) || sendNormal < (demandRow.normal_palets||0)) ? '⚠️ Részleges küldés – a maradék az Áru igény táblában marad.' : '✅ Teljes mennyiség'}`;
            if (!confirm(confirmMsg)) return;

            try {
                const res = await fetch(`/api/v1/cargo-demands/${demandRow.id}/fulfill`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shipment_id: parseInt(targetId), euro_palets: sendEuro, normal_palets: sendNormal })
                });
                const data = await res.json();
                if (!res.ok) { alert('Hiba: ' + (data.error || 'Ismeretlen hiba')); return; }

                modal.close();
                alert(`✅ ${data.message}`);
                await loadCargoDemandsData();
            } catch (err) {
                alert('Hálózati hiba: ' + err.message);
            }
        });
    }

    // ============= ÁRU IGÉNY HOZZÁADÁS MODAL =============
    view.querySelector('#btn-add-aru').addEventListener('click', async function() {
        // Termékek betöltése ha még nincs
        if (productsList.length === 0) {
            try {
                const r = await fetch('/api/v1/products');
                productsList = await r.json();
            } catch(e) { productsList = []; }
        }

        const modalContent = `
            <div style="padding:20px; display:flex; flex-direction:column; gap:12px;">
                <div style="display:flex; flex-direction:column; gap:4px; position:relative;">
                    <label style="font-size:11px; font-weight:600; color:#334155;">Termék neve: <span style="color:red;">*</span></label>
                    <input type="text" id="aru-add-product" class="access-control-input" style="font-size:12px; height:32px;" placeholder="Gépeljen a kereséshez...">
                    <input type="hidden" id="aru-add-product-id">
                    <div id="aru-add-product-dropdown" style="display:none; position:absolute; top:56px; left:0; right:0; background:#fff; border:1px solid #ccc; border-radius:4px; max-height:130px; overflow-y:auto; z-index:10; box-shadow:0 4px 6px rgba(0,0,0,0.1);"></div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <label style="font-size:11px; font-weight:600; color:#334155;">Partner neve:</label>
                    <input type="text" id="aru-add-partner" class="access-control-input" style="font-size:12px; height:32px;" placeholder="Opcionális">
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <label style="font-size:11px; font-weight:600; color:#334155;">Vevő neve:</label>
                    <input type="text" id="aru-add-customer" class="access-control-input" style="font-size:12px; height:32px;" placeholder="Opcionális">
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                        <label style="font-size:11px; font-weight:600; color:#334155;">N° Euro Palets: <span style="color:red;">*</span></label>
                        <input type="number" id="aru-add-euro" class="access-control-input" style="font-size:12px; height:32px;" value="0" min="0">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                        <label style="font-size:11px; font-weight:600; color:#334155;">N° Normal Palets: <span style="color:red;">*</span></label>
                        <input type="number" id="aru-add-normal" class="access-control-input" style="font-size:12px; height:32px;" value="0" min="0">
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <label style="font-size:11px; font-weight:600; color:#334155;">Megjegyzés:</label>
                    <input type="text" id="aru-add-notes" class="access-control-input" style="font-size:12px; height:32px;" placeholder="Opcionális">
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
                    <button class="secondary-btn btn-aru-cancel">Mégsem</button>
                    <button class="primary-btn btn-aru-save">+ Hozzáadás</button>
                </div>
            </div>
        `;

        const modal = windowManager.createModal({
            title: '+ Áru igény hozzáadása',
            width: 440,
            height: 520,
            content: modalContent
        });

        const modalEl = modal.element;
        const prodInput = modalEl.querySelector('#aru-add-product');
        const prodIdInput = modalEl.querySelector('#aru-add-product-id');
        const prodDropdown = modalEl.querySelector('#aru-add-product-dropdown');

        // Autocomplete
        prodInput.addEventListener('input', () => {
            const val = prodInput.value.toLowerCase();
            prodIdInput.value = '';
            prodDropdown.innerHTML = '';
            if (!val) { prodDropdown.style.display = 'none'; return; }
            const filtered = productsList.filter(p => p.name.toLowerCase().includes(val)).slice(0, 8);
            if (filtered.length > 0) {
                filtered.forEach(p => {
                    const div = document.createElement('div');
                    div.style.cssText = 'padding:6px 8px; cursor:pointer; border-bottom:1px solid #eee; font-size:12px;';
                    div.textContent = p.name;
                    div.onmousedown = () => {
                        prodInput.value = p.name;
                        prodIdInput.value = p.id;
                        prodDropdown.style.display = 'none';
                    };
                    div.onmouseover = () => div.style.backgroundColor = '#f1f5f9';
                    div.onmouseout  = () => div.style.backgroundColor = 'transparent';
                    prodDropdown.appendChild(div);
                });
                prodDropdown.style.display = 'block';
            } else {
                prodDropdown.style.display = 'none';
            }
        });
        prodInput.addEventListener('blur', () => { setTimeout(() => { prodDropdown.style.display = 'none'; }, 200); });

        modalEl.querySelector('.btn-aru-cancel').addEventListener('click', () => modal.close());

        modalEl.querySelector('.btn-aru-save').addEventListener('click', async () => {
            const pName = prodInput.value.trim();
            const euro = parseInt(modalEl.querySelector('#aru-add-euro').value) || 0;
            const normal = parseInt(modalEl.querySelector('#aru-add-normal').value) || 0;

            if (!pName) { alert('A termék neve kötelező!'); return; }
            if (euro === 0 && normal === 0) { alert('Legalább egy raklap típusnál adj meg 0-nál nagyobb értéket!'); return; }

            try {
                const res = await fetch('/api/v1/cargo-demands', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product_id: prodIdInput.value ? parseInt(prodIdInput.value) : null,
                        product_name: pName,
                        partner_name: modalEl.querySelector('#aru-add-partner').value.trim() || null,
                        customer_name: modalEl.querySelector('#aru-add-customer').value.trim() || null,
                        euro_palets: euro,
                        normal_palets: normal,
                        notes: modalEl.querySelector('#aru-add-notes').value.trim() || null
                    })
                });
                const data = await res.json();
                if (!res.ok) { alert('Hiba: ' + (data.error || 'Ismeretlen hiba')); return; }

                modal.close();
                await loadCargoDemandsData();
            } catch (err) {
                alert('Hálózati hiba: ' + err.message);
            }
        });
    });

    // ============= MODAL HELPERS =============
    function showModal() {
        modalEl.style.display = 'flex';
    }
    function hideModal() {
        modalEl.style.display = 'none';
    }

    document.getElementById('btn-km-cancel').addEventListener('click', function() { hideModal(); });
    modalEl.addEventListener('click', function(e) { if (e.target === modalEl) hideModal(); });

    document.getElementById('btn-km-szerkesztes').addEventListener('click', function() {
        hideModal();
        if (!currentKamionForMenu) return;
        openKamionSzerkesztesWindow(windowManager, currentKamionForMenu.id);
    });

    document.getElementById('btn-km-doc').addEventListener('click', function() {
        hideModal();
        if (!currentKamionForMenu) return;
        alert('Dokumentum megnyitás (backend):\n' + currentKamionForMenu.path);
    });

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

    function getNextAutoNumberForTip(tip) {
        if (!tip) return '';
        const numbers = [];
        rakData.forEach(row => {
            const parsed = parseKamionNumber(row.tour);
            if (parsed.tip === tip) {
                numbers.push(parsed.num);
            }
        });
        const max = numbers.length > 0 ? Math.max(...numbers) : 0;
        return formatKamisz(tip, max + 1);
    }

    function openRenameModal(tour) {
        const currentParsed = parseKamionNumber(tour);
        const currentTip = currentParsed.tip;

        const nextAuto = getNextAutoNumberForTip(currentTip);

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
            const computedNext = getNextAutoNumberForTip(selectedTip);
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

            // Helyi egyediség ellenőrzése
            const duplicate = rakData.find(row =>
                row.tour.toLowerCase().replace(/\s+/g, '') === finalVal.toLowerCase().replace(/\s+/g, '') &&
                row.tour !== tour
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

                if (currentKamionForMenu) {
                    currentKamionForMenu.tour = finalVal;
                    const item = rakData.find(x => x.tour === tour);
                    if (item) item.tour = finalVal;
                }

                if (res.ok) {
                    alert('Kamionszám sikeresen módosítva: ' + finalVal);
                } else {
                    const data = await res.json();
                    alert('Kamionszám frissítve (lokálisan): ' + finalVal + '\n(API válasz: ' + (data.error || 'Nincs ilyen rekord az adatbázisban') + ')');
                }

                modal.close();
                filter();
            } catch (err) {
                console.error(err);
                if (currentKamionForMenu) {
                    currentKamionForMenu.tour = finalVal;
                    const item = rakData.find(x => x.tour === tour);
                    if (item) item.tour = finalVal;
                }
                alert('Kamionszám frissítve lokálisan: ' + finalVal + '\n(Hálózati hiba a mentés során)');
                modal.close();
                filter();
            }
        });
    }

    document.getElementById('btn-km-rename').addEventListener('click', function() {
        hideModal();
        if (!currentKamionForMenu) return;
        openRenameModal(currentKamionForMenu.tour);
    });

    // ============= ÚJ KAMION GOMB =============
    view.querySelector('#btn-new-truck').addEventListener('click', function () {
        openKamionSzerkesztesWindow(windowManager, null);
    });

    // ============= SZŰRŐ EVENTS =============
    var searchTimer = null;
    inputKamisz.addEventListener('input', function (e) {
        if (e.target.value !== e.target.value.toUpperCase()) {
            var pos = e.target.selectionStart;
            e.target.value = e.target.value.toUpperCase();
            try { e.target.setSelectionRange(pos, pos); } catch (err) { }
        }
        var term = inputKamisz.value.trim();
        if (term.length >= 2) {
            // Kereséskor az API-tól kérjük a teljes egyező listát (minden szezon)
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { loadRakData(term); }, 350);
        } else if (term.length === 0) {
            loadRakData(null);
        } else {
            filter();
        }
    });
    inputFuvarozo.addEventListener('change', filter);
    inputDateFrom.addEventListener('change', filter);
    inputDateTo.addEventListener('change', filter);
    chkOpenOnly.addEventListener('change', filter);
    btnClear.addEventListener('click', function () {
        inputKamisz.value = '';
        inputFuvarozo.value = '';
        inputDateFrom.value = '';
        inputDateTo.value = '';
        chkOpenOnly.checked = false;
        loadRakData(null);
    });

    // ============= API BETÖLTÉS =============
    // searchTerm: null = 50 legfrissebb tételt tartalmazó fuvar
    //             string = összes egyező (minden szezon)
    async function loadRakData(searchTerm) {
        try {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#666;">Betöltés...</td></tr>';
            var url = searchTerm
                ? '/api/v1/shipments?search=' + encodeURIComponent(searchTerm)
                : '/api/v1/shipments?limit=150';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                rakData = data.map(function (s) {
                    let d = s.loading_date;
                    if (d) {
                        const dateObj = new Date(d);
                        if (!isNaN(dateObj)) {
                            const year = dateObj.getFullYear();
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            d = year + '-' + month + '-' + day;
                        } else {
                            d = '-';
                        }
                    } else {
                        d = '-';
                    }
                    return {
                        id: s.id,
                        tour: s.order_number || '',
                        tip: s.truck_type || '',
                        date: d,
                        transporter: s.transporter_name || '-',
                        loaded: s.is_loaded ? true : false,
                        path: ''
                    };
                });
                filter();
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:red;">Hiba a betöltéskor!</td></tr>';
            }
        } catch (err) {
            console.error('API hiba:', err);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:red;">Hálózati hiba!</td></tr>';
        }
    }

    async function loadTransporters() {
        try {
            const res = await fetch('/api/v1/transporters');
            if (res.ok) {
                const transporters = await res.json();
                inputFuvarozo.innerHTML = '<option value="">-- Összes --</option>' +
                    transporters.map(function(t) {
                        return '<option value="' + t.name + '">' + t.name + '</option>';
                    }).join('');
            }
        } catch (err) {
            console.error('Hiba a fuvarozók betöltésekor:', err);
        }
    }

    async function loadCargoDemandsData() {
        try {
            aruTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:10px; color:#666; font-size:10px;">Betöltés...</td></tr>';
            const res = await fetch('/api/v1/cargo-demands');
            if (res.ok) {
                aruData = await res.json();
                renderRight();
            } else {
                aruTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:10px; color:red; font-size:10px;">Hiba!</td></tr>';
            }
        } catch (err) {
            console.error('Áru igény betöltési hiba:', err);
            aruTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:10px; color:red; font-size:10px;">Hálózati hiba!</td></tr>';
        }
    }

    async function loadProducts() {
        try {
            const res = await fetch('/api/v1/products');
            if (res.ok) productsList = await res.json();
        } catch (err) {
            console.error('Hiba a termékek betöltésekor:', err);
        }
    }

    // Inicializálás
    loadTransporters();
    loadRakData(null);
    loadCargoDemandsData();
    loadProducts();
}
