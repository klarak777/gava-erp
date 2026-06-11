import { openKamionSzerkesztesWindow } from './kamion_szerkesztes.js';

// Rakodás modul - Access frmRakodas alapján
// Bal tábla: Rakodások | Jobb tábla: Áru igény
export function renderRakodas(container, windowManager) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';

    // --- Mock adatbázis: foglalt kamionszámok szezon szerint ---
    var usedNumbers = {
        'BEL': { 'Season 25-26': [1, 2, 3] },
        'EX':  { 'Season 25-26': [1] },
        'GHU': { 'Season 25-26': [265, 266, 267, 268] },
        'H':   { 'Season 25-26': [121, 122, 123] },
        'LOG': { 'Season 25-26': [1, 2] }
    };

    function getNextNumber(tip, szezon) {
        var list = (usedNumbers[tip] && usedNumbers[tip][szezon]) ? usedNumbers[tip][szezon] : [];
        if (list.length === 0) return 1;
        var max = list.reduce(function(a, b) { return a > b ? a : b; });
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
                        '<option value="Waberers">Waberers</option>' +
                        '<option value="Gartner">Gartner</option>' +
                    '</select>' +
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
                '<div class="access-subform-header" style="background:linear-gradient(90deg,#0ea5e9,#2563eb); color:#fff;">Áru igény</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="access-subform-table" id="rak-right-table" style="background:transparent;">' +
                        '<thead><tr>' +
                            '<th style="min-width:60px; background:rgba(14,165,233,0.1); text-align:center;">Raklap</th>' +
                            '<th style="min-width:160px; background:rgba(14,165,233,0.1);">Termék</th>' +
                            '<th style="min-width:100px; background:rgba(14,165,233,0.1);">Partner</th>' +
                            '<th style="min-width:100px; background:rgba(14,165,233,0.1);">Vevő</th>' +
                            '<th style="min-width:90px; text-align:center; background:rgba(14,165,233,0.1);">Küldés kamionra</th>' +
                        '</tr></thead>' +
                        '<tbody id="aru-tbody"></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>' +

        '</div>' +

        // ========== MODÁLOK ==========

        // 1. Kamionszám kattintás menü (Szerkesztés / Dokumentum megnyitás / Mégsem)
        '<div id="modal-kamisz-menu" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:2000; align-items:center; justify-content:center;">' +
            '<div style="background:#fff; padding:28px; border-radius:12px; width:340px; box-shadow:0 8px 32px rgba(0,0,0,0.2);">' +
                '<h3 style="margin-bottom:6px; color:#1e293b;">Kamion: <span id="km-menu-tour"></span></h3>' +
                '<p style="color:#64748b; font-size:13px; margin-bottom:20px;">Válasszon műveletet:</p>' +
                '<div style="display:flex; flex-direction:column; gap:10px;">' +
                    '<button class="primary-btn" id="btn-km-szerkesztes">✏️ Szerkesztés</button>' +
                    '<button class="primary-btn" id="btn-km-doc" style="background:#0ea5e9; border-color:#0284c7;">📄 Dokumentum megnyitás</button>' +
                    '<button class="primary-btn" id="btn-km-rename" style="background:#f59e0b; border-color:#d97706;">Kamionszám változtatás</button>' +
                    '<button class="secondary-btn btn-close-modal" data-modal="modal-kamisz-menu">Mégsem</button>' +
                '</div>' +
            '</div>' +
        '</div>' +

        ''; // A régi modal-km-szerk és modal-uj-kamion kódok eltávolítva, mert a WindowManager kezeli őket

    container.appendChild(view);

    // ============= ÉLŐ ADATOK (Kamionok) ÉS MOCK ADATOK (Áru) =============
    var rakData = [];


    var aruData = [
        { id: 1, raklap: 2,  termek: 'NECTARIN YELLOW 10*500GR', partner: 'KOPSALAT',  vevo: 'ALDI',           sent: false },
        { id: 2, raklap: 10, termek: 'CELERY 6*500GR IFCO',      partner: 'HISPA',     vevo: 'ALDI',           sent: false },
        { id: 3, raklap: 4,  termek: 'APRICOT LOOSE 5KG',        partner: 'FRUBALMED', vevo: 'Zsolti / Barna', sent: false }
    ];

    // ============= ELEMEK =============
    var inputKamisz = view.querySelector('#rak-kamisz');
    var inputFuvarozo = view.querySelector('#rak-fuvarozo');
    var chkOpenOnly = view.querySelector('#rak-open-only');
    var btnClear = view.querySelector('#btn-clear-rak');
    var tbody = view.querySelector('#rak-tbody');
    var aruTbody = view.querySelector('#aru-tbody');

    var currentKamionForMenu = null; // a menüből nyitott kamion obj

    // ============= SZŰRŐ + BAL TÁBLA =============
    function filter() {
        var t = inputKamisz.value.toUpperCase();
        var f = inputFuvarozo.value;
        var open = chkOpenOnly.checked;
        var filtered = rakData.filter(function(r) {
            return r.tour.toUpperCase().indexOf(t) !== -1 &&
                (f === '' || r.transporter === f) &&
                (!open || !r.loaded);
        });
        renderLeft(filtered);
    }

    function renderLeft(data) {
        tbody.innerHTML = data.map(function(r) {
            return '<tr>' +
                '<td><span class="rak-open-link" data-id="' + r.id + '" style="cursor:pointer; color:#2563eb; text-decoration:underline; font-weight:600;" title="Kattints a műveletekhez">' + r.tour + '</span></td>' +
                '<td>' + r.date + '</td>' +
                '<td>' + r.transporter + '</td>' +
                '<td style="text-align:center;"><input type="checkbox" class="rak-loaded-chk" data-id="' + r.id + '"' + (r.loaded ? ' checked' : '') + '></td>' +
                '</tr>';
        }).join('');

        // Checkbox trigger
        tbody.querySelectorAll('.rak-loaded-chk').forEach(function(chk) {
            chk.addEventListener('change', async function(e) {
                var id = parseInt(e.target.getAttribute('data-id'));
                var isLoaded = e.target.checked;
                var row = rakData.find(function(x) { return x.id === id; });
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
                view.querySelector('#km-menu-tour').textContent = currentKamionForMenu.tour;
                showModal('modal-kamisz-menu');
            });
        });
    }

    // ============= JOBB TÁBLA: ÁRU IGÉNY =============
    function renderRight() {
        aruTbody.innerHTML = aruData.map(function(r) {
            var btnStyle = r.sent
                ? 'background:#22c55e; color:#fff; border:1px solid #16a34a;'
                : 'background:#ef4444; color:#fff; border:1px solid #dc2626;';
            return '<tr>' +
                '<td style="text-align:center;">' + r.raklap + '</td>' +
                '<td>' + r.termek + '</td>' +
                '<td>' + r.partner + '</td>' +
                '<td>' + r.vevo + '</td>' +
                '<td style="text-align:center;">' +
                    '<button class="btn-send-aru" data-id="' + r.id + '" title="Küldés kamionra" ' +
                        'style="' + btnStyle + ' border-radius:6px; padding:5px 12px; font-size:16px; cursor:pointer; transition:all 0.2s;">➡</button>' +
                '</td>' +
                '</tr>';
        }).join('');

        aruTbody.querySelectorAll('.btn-send-aru').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var id = parseInt(e.currentTarget.getAttribute('data-id'));
                var row = aruData.find(function(x) { return x.id === id; });
                if (!row) return;
                row.sent = !row.sent;
                var btn = e.currentTarget;
                if (row.sent) {
                    btn.style.cssText = 'background:#22c55e; color:#fff; border:1px solid #16a34a; border-radius:6px; padding:5px 12px; font-size:16px; cursor:pointer; transition:all 0.2s;';
                } else {
                    btn.style.cssText = 'background:#ef4444; color:#fff; border:1px solid #dc2626; border-radius:6px; padding:5px 12px; font-size:16px; cursor:pointer; transition:all 0.2s;';
                }
            });
        });
    }

    // ============= MODAL HELPERS =============
    function showModal(id) {
        var m = view.querySelector('#' + id);
        if (m) m.style.display = 'flex';
    }
    function hideModal(id) {
        var m = view.querySelector('#' + id);
        if (m) m.style.display = 'none';
    }

    view.querySelectorAll('.btn-close-modal').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            hideModal(e.currentTarget.getAttribute('data-modal'));
        });
    });

    // ============= KAMIONSZÁM MENÜ GOMBOK =============
    view.querySelector('#btn-km-szerkesztes').addEventListener('click', function() {
        hideModal('modal-kamisz-menu');
        if (!currentKamionForMenu) return;
        // Új ablak megnyitása a szerkesztésre
        openKamionSzerkesztesWindow(windowManager, currentKamionForMenu.tour);
    });

    view.querySelector('#btn-km-doc').addEventListener('click', function() {
        hideModal('modal-kamisz-menu');
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

    function formatKamisz(tip, num) {
        if (tip === 'GHU') return 'GHU ' + num;
        if (tip === 'H') return 'H' + String(num).padStart(3, '0');
        return tip + String(num).padStart(3, '0');
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

    view.querySelector('#btn-km-rename').addEventListener('click', function() {
        hideModal('modal-kamisz-menu');
        if (!currentKamionForMenu) return;
        openRenameModal(currentKamionForMenu.tour);
    });

    // ============= ÚJ KAMION GOMB =============
    view.querySelector('#btn-new-truck').addEventListener('click', function() {
        openKamionSzerkesztesWindow(windowManager, null);
    });

    // ============= SZŰRŐ EVENTS =============
    inputKamisz.addEventListener('input', function(e) {
        if (e.target.value !== e.target.value.toUpperCase()) {
            var pos = e.target.selectionStart;
            e.target.value = e.target.value.toUpperCase();
            try { e.target.setSelectionRange(pos, pos); } catch(err) {}
        }
        filter();
    });
    inputFuvarozo.addEventListener('change', filter);
    chkOpenOnly.addEventListener('change', filter);
    btnClear.addEventListener('click', function() {
        inputKamisz.value = '';
        inputFuvarozo.value = '';
        chkOpenOnly.checked = false;
        filter();
    });

    // ============= API BETÖLTÉS =============
    async function loadRakData() {
        try {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#666;">Betöltés...</td></tr>';
            const res = await fetch('/api/v1/shipments?limit=10');
            if (res.ok) {
                const data = await res.json();
                rakData = data.map(function(s) {
                    let d = s.loading_date;
                    if (d) {
                        // date format yyyy-mm-dd
                        d = new Date(d).toISOString().split('T')[0];
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
                        path: '' // Path can be constructed if needed
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

    // Inicializálás
    loadRakData();
    renderRight();
}
