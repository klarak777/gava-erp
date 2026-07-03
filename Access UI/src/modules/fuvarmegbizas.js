// Fuvarmegbízások modul
export function renderFuvarmegbizas(container, windowManager) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';

    // Belső adatok a backendből
    var appData = [];

    view.innerHTML =
        '<div class="view-header" style="margin-bottom:16px;">' +
            '<h2 class="view-title">Fuvarmegbízások</h2>' +
            '<p class="view-subtitle">Fuvarmegbízások és dokumentumok kezelése</p>' +
        '</div>' +

        // Filter strip
        '<div class="access-form-view" style="margin-bottom:16px; padding:12px 16px;">' +
            '<div style="display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap;">' +
                '<div class="access-control-group" style="margin-bottom:0;">' +
                    '<label class="access-control-label" for="fuvm-szezon">Szezon:</label>' +
                    '<select id="fuvm-szezon" class="access-control-input" style="width:120px;">' +
                        '<option value="19-20">19-20</option>' +
                        '<option value="20-21">20-21</option>' +
                        '<option value="21-22">21-22</option>' +
                        '<option value="22-23">22-23</option>' +
                        '<option value="23-24">23-24</option>' +
                        '<option value="24-25">24-25</option>' +
                        '<option value="25-26" selected>25-26</option>' +
                    '</select>' +
                '</div>' +
                '<div class="access-control-group" style="margin-bottom:0;">' +
                    '<label class="access-control-label" for="fuvm-kamisz">Kamion szám:</label>' +
                    '<input type="text" id="fuvm-kamisz" class="access-control-input" placeholder="Keresés..." style="width:150px;">' +
                '</div>' +
                '<div class="access-control-group" style="margin-bottom:0;">' +
                    '<label class="access-control-label" for="fuvm-fuvarozo">Fuvarozó cég:</label>' +
                    '<select id="fuvm-fuvarozo" class="access-control-input" style="width:170px;">' +
                        '<option value="">-- Összes --</option>' +
                    '</select>' +
                '</div>' +
                '<div style="display:flex; align-items:center; gap:16px; margin-left:10px;">' +
                    '<label style="display:flex; align-items:center; gap:6px; font-size:13px; color:var(--text-main); cursor:pointer;">' +
                        '<input type="checkbox" id="fuvm-show-sent" style="cursor:pointer; width:16px; height:16px; accent-color:var(--primary);">' +
                        'Mutassa a kiküldött fuvarokat' +
                    '</label>' +
                '</div>' +
                '<div style="display:flex; gap:8px; padding-bottom: 2px;">' +
                    '<button class="secondary-btn btn-dense" id="btn-clear-fuvm">Szűrő törlése</button>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // Action Buttons
        '<div style="display:flex; gap:12px; margin-bottom:16px;">' +
            '<button class="primary-btn btn-dense" id="btn-open-doc">📄 Dokumentum megnyitása</button>' +
            '<button class="secondary-btn btn-dense" id="btn-delete-doc" style="color:#ef4444; border-color:#fca5a5; background:#fff;">🗑️ Megbízás törlése</button>' +
        '</div>' +

        // Table
        '<div class="access-subform">' +
            '<div class="access-subform-header">Fuvarmegbízások listája</div>' +
            '<div style="overflow-x:auto;">' +
                '<table class="access-subform-table" id="fuvm-table">' +
                    '<thead><tr>' +
                        '<th style="width:40px;"></th>' +
                        '<th>Kamion szám</th>' +
                        '<th>Rakodás nap</th>' +
                        '<th>Fuvarozó cég</th>' +
                        '<th style="text-align:center; width:100px;">Kiküldve</th>' +
                    '</tr></thead>' +
                    '<tbody id="fuvm-tbody"></tbody>' +
                '</table>' +
            '</div>' +
        '</div>';

    container.appendChild(view);

    // Elements
    var selSzezon = view.querySelector('#fuvm-szezon');
    var inputKamisz = view.querySelector('#fuvm-kamisz');
    var selFuvarozo = view.querySelector('#fuvm-fuvarozo');
    var chkShowSent = view.querySelector('#fuvm-show-sent');
    var btnClear = view.querySelector('#btn-clear-fuvm');
    var tbody = view.querySelector('#fuvm-tbody');
    var btnOpenDoc = view.querySelector('#btn-open-doc');
    var btnDeleteDoc = view.querySelector('#btn-delete-doc');

    var selectedRowId = null;

    // --- LOGIC ---

    function populateFuvarozok() {
        var season = selSzezon.value;
        var fuvSet = new Set();
        appData.forEach(function(r) {
            if (r.season === season && r.transporter && r.transporter !== '-') {
                fuvSet.add(r.transporter);
            }
        });
        var fuvList = Array.from(fuvSet).sort();

        var html = '<option value="">-- Összes --</option>';
        fuvList.forEach(function(f) {
            html += '<option value="' + f + '">' + f + '</option>';
        });
        selFuvarozo.innerHTML = html;
        if (selFuvarozo.value === '') {
            filter();
        }
    }

    function filter() {
        var s = selSzezon.value;
        var k = inputKamisz.value.toUpperCase();
        var f = selFuvarozo.value;
        var showSent = chkShowSent.checked;

        var filtered = appData.filter(function(r) {
            var matchS = r.season === s;
            var matchK = r.tour.toUpperCase().indexOf(k) !== -1 || r.docName.toUpperCase().indexOf(k) !== -1;
            var matchF = f === '' || r.transporter === f;

            // Ha ki van küldve és a szűrő nincs bekapcsolva, elrejtjük
            var isHidden = r.sent && !showSent;

            return matchS && matchK && matchF && !isHidden;
        });

        if (selectedRowId && !filtered.find(function(x){return x.id === selectedRowId;})) {
            selectedRowId = null;
        }

        renderTable(filtered);
    }

    function renderTable(data) {
        tbody.innerHTML = data.map(function(r) {
            var isSelected = r.id === selectedRowId;
            var trStyle = isSelected ? 'background-color: #e0f2fe;' : '';

            var sentHtml = '<input type="checkbox" class="fuvm-sent-chk" data-id="' + r.id + '" ' +
                (r.sent ? 'checked' : '') +
                ' style="cursor:pointer; width:18px; height:18px;">';

            return '<tr class="fuvm-row" data-id="' + r.id + '" style="cursor:pointer; ' + trStyle + '">' +
                '<td style="text-align:center;"><input type="radio" name="fuvm_select" ' + (isSelected ? 'checked' : '') + ' style="cursor:pointer; pointer-events:none;"></td>' +
                '<td>' + r.tour + '</td>' +
                '<td>' + r.date + '</td>' +
                '<td>' + r.transporter + '</td>' +
                '<td style="text-align:center;" title="Kiküldve">' + sentHtml + '</td>' +
                '</tr>';
        }).join('');

        // Sor kijelölés
        tbody.querySelectorAll('.fuvm-row').forEach(function(row) {
            row.addEventListener('click', function(e) {
                if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox') return;
                selectedRowId = parseInt(this.getAttribute('data-id'));
                renderTable(data);
            });
        });

        // Kiküldve checkbox logika
        tbody.querySelectorAll('.fuvm-sent-chk').forEach(function(chk) {
            chk.addEventListener('change', function(e) {
                var id = parseInt(e.target.getAttribute('data-id'));
                var rowData = appData.find(function(x) { return x.id === id; });
                if (!rowData) return;

                var newVal = e.target.checked;

                if (newVal && !confirm('Biztosan kiküldve állapotúra állítod ezt a fuvarmegbízást?')) {
                    e.target.checked = false;
                    return;
                }

                // Itt mostantól az is_sent flaget állítjuk
                fetch('/api/v1/transport-orders/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_sent: newVal })
                })
                .then(function(res) { return res.json(); })
                .then(function(resData) {
                    if (resData.status !== 'success') {
                        e.target.checked = !newVal;
                        rowData.sent = !newVal;
                        alert('Hiba a státusz frissítésekor: ' + resData.message);
                    } else {
                        rowData.sent = newVal;
                        filter();
                    }
                })
                .catch(function() {
                    e.target.checked = !newVal;
                    rowData.sent = !newVal;
                    alert('Hálózati hiba a státusz frissítésekor!');
                });
            });
        });
    }

    // --- DOKUMENTUM ELŐNÉZET MODAL ---
    function openDocumentPreviewModal(rowData) {
        var isEditMode = false;
        var originalHtml = '';

        var modalContent =
            '<div style="display:flex; flex-direction:column; height:100%;">' +
                // Fejléc sáv
                '<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 20px; background:linear-gradient(135deg,#1e3a5f,#2563eb); border-radius:8px; margin-bottom:16px; flex-shrink:0;">' +
                    '<div>' +
                        '<div style="font-size:11px; color:rgba(255,255,255,0.7); font-weight:500; letter-spacing:0.5px; text-transform:uppercase;">Fuvarmegbízás dokumentum</div>' +
                        '<div style="font-size:14px; color:#fff; font-weight:700; margin-top:2px;">' + (rowData.docName || 'Dokumentum') + '</div>' +
                        '<div style="font-size:11px; color:rgba(255,255,255,0.6); margin-top:2px;">Kamion: ' + rowData.tour + ' &nbsp;|&nbsp; Fuvarozó cég: ' + rowData.transporter + ' &nbsp;|&nbsp; Dátum: ' + rowData.date + '</div>' +
                    '</div>' +
                    // Gombok csoport
                    '<div style="display:flex; gap:8px; align-items:center;">' +
                        '<div id="fuvm-status-msg" style="font-size:12px; font-weight:600; display:none; padding:4px 10px; border-radius:6px;"></div>' +
                        '<a id="fuvm-download-btn" href="/api/v1/transport-orders/' + rowData.id + '/download" download ' +
                           'style="display:flex; align-items:center; gap:6px; background:#22c55e; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; transition:all 0.2s; white-space:nowrap;">' +
                            '⬇️ Letöltés' +
                        '</a>' +
                        '<button id="fuvm-edit-btn" ' +
                           'style="display:flex; align-items:center; gap:6px; background:#f59e0b; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;">' +
                            '✏️ Szerkesztés' +
                        '</button>' +
                        '<button id="fuvm-save-btn" ' +
                           'style="display:none; align-items:center; gap:6px; background:#2563eb; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;">' +
                            '💾 Mentés' +
                        '</button>' +
                        '<button id="fuvm-cancel-btn" ' +
                           'style="display:none; align-items:center; gap:6px; background:#64748b; color:#fff; border:none; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;">' +
                            '✕ Mégse' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                // Előnézeti / szerkesztési terület
                '<div id="fuvm-preview-body" style="flex:1; overflow-y:auto; padding:24px 28px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; font-family:\'Segoe UI\', Arial, sans-serif; font-size:13px; line-height:1.6; color:#1e293b; min-height:300px; outline:none;">' +
                    '<div id="fuvm-preview-spinner" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; gap:12px; color:#64748b;">' +
                        '<div style="width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#2563eb; border-radius:50%; animation:fuvm-spin 0.8s linear infinite;"></div>' +
                        '<span style="font-size:13px;">Dokumentum betöltése...</span>' +
                    '</div>' +
                    '<div id="fuvm-preview-content" style="display:none;"></div>' +
                    '<div id="fuvm-preview-error" style="display:none; padding:20px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; color:#dc2626; font-size:13px;"></div>' +
                '</div>' +
                '<style>' +
                    '@keyframes fuvm-spin { to { transform: rotate(360deg); } }' +
                    '#fuvm-preview-body table { border-collapse: collapse; width:100%; margin:8px 0; }' +
                    '#fuvm-preview-body td, #fuvm-preview-body th { border:1px solid #cbd5e1; padding:5px 8px; font-size:12px; }' +
                    '#fuvm-preview-body th { background:#f1f5f9; font-weight:600; }' +
                    '#fuvm-preview-body p { margin:4px 0 8px; }' +
                    '#fuvm-preview-body strong, #fuvm-preview-body b { font-weight:700; }' +
                    '#fuvm-download-btn:hover { background:#16a34a !important; transform:translateY(-1px); box-shadow:0 4px 12px rgba(34,197,94,0.3); }' +
                    '#fuvm-edit-btn:hover { background:#d97706 !important; }' +
                    '#fuvm-save-btn:hover { background:#1d4ed8 !important; }' +
                    '#fuvm-preview-content[contenteditable="true"] { outline:2px dashed #2563eb; outline-offset:4px; background:#fffbeb; border-radius:4px; cursor:text; }' +
                '</style>' +
            '</div>';

        var modal = windowManager.createModal({
            title: '📄 ' + (rowData.docName || 'Dokumentum előnézet'),
            width: 820,
            height: 660,
            content: modalContent
        });

        var modalEl = modal.element;
        var spinner = modalEl.querySelector('#fuvm-preview-spinner');
        var contentDiv = modalEl.querySelector('#fuvm-preview-content');
        var errorDiv = modalEl.querySelector('#fuvm-preview-error');
        var editBtn = modalEl.querySelector('#fuvm-edit-btn');
        var saveBtn = modalEl.querySelector('#fuvm-save-btn');
        var cancelBtn = modalEl.querySelector('#fuvm-cancel-btn');
        var statusMsg = modalEl.querySelector('#fuvm-status-msg');

        // Szerkesztési mód be/ki
        function setEditMode(on) {
            isEditMode = on;
            contentDiv.contentEditable = on ? 'true' : 'false';
            editBtn.style.display = on ? 'none' : 'flex';
            saveBtn.style.display = on ? 'flex' : 'none';
            cancelBtn.style.display = on ? 'flex' : 'none';
            statusMsg.style.display = 'none';
            if (on) {
                originalHtml = contentDiv.innerHTML;
                contentDiv.focus();
            }
        }

        editBtn.addEventListener('click', function() {
            if (contentDiv.style.display !== 'none') setEditMode(true);
        });

        cancelBtn.addEventListener('click', function() {
            contentDiv.innerHTML = originalHtml;
            setEditMode(false);
        });

        saveBtn.addEventListener('click', function() {
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Mentés...';
            statusMsg.style.display = 'none';

            fetch('/api/v1/transport-orders/' + rowData.id + '/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: contentDiv.innerHTML })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Mentés';
                if (data.status === 'success') {
                    statusMsg.textContent = '✅ Sikeresen mentve!';
                    statusMsg.style.background = '#dcfce7';
                    statusMsg.style.color = '#15803d';
                    statusMsg.style.display = 'block';
                    originalHtml = contentDiv.innerHTML;
                    setEditMode(false);
                } else {
                    statusMsg.textContent = '⚠️ Hiba: ' + (data.message || 'Ismeretlen hiba');
                    statusMsg.style.background = '#fef2f2';
                    statusMsg.style.color = '#dc2626';
                    statusMsg.style.display = 'block';
                }
            })
            .catch(function(err) {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Mentés';
                statusMsg.textContent = '⚠️ Hálózati hiba: ' + err.message;
                statusMsg.style.background = '#fef2f2';
                statusMsg.style.color = '#dc2626';
                statusMsg.style.display = 'block';
            });
        });

        // Dokumentum betöltése Mammoth HTML előnézetként
        fetch('/api/v1/transport-orders/' + rowData.id + '/preview')
            .then(function(res) { return res.json(); })
            .then(function(data) {
                spinner.style.display = 'none';
                if (data.status === 'success') {
                    contentDiv.innerHTML = data.html || '<em style="color:#94a3b8;">A dokumentum nem tartalmaz szöveget.</em>';
                    contentDiv.style.display = 'block';
                    editBtn.style.display = 'flex'; // Szerkesztés gomb csak ha betöltött a tartalom
                } else {
                    editBtn.style.display = 'none';
                    errorDiv.innerHTML =
                        '<strong>⚠️ Nem sikerült betölteni a dokumentumot</strong><br><br>' +
                        (data.message || 'Ismeretlen hiba') + '<br><br>' +
                        '<span style="font-size:11px; color:#94a3b8;">A dokumentum letölthető a ⬇️ Letöltés gombbal.</span>';
                    errorDiv.style.display = 'block';
                }
            })
            .catch(function(err) {
                spinner.style.display = 'none';
                editBtn.style.display = 'none';
                errorDiv.innerHTML =
                    '<strong>⚠️ Hálózati hiba</strong><br><br>' + err.message + '<br><br>' +
                    '<span style="font-size:11px; color:#94a3b8;">Ellenőrizze a szerver kapcsolatot, és próbálja újra.</span>';
                errorDiv.style.display = 'block';
            });
    }


    // --- ESEMÉNYKEZELŐK ---

    selSzezon.addEventListener('change', function() {
        populateFuvarozok();
        filter();
    });
    selSzezon.addEventListener('change', populateFuvarozok);
    inputKamisz.addEventListener('input', function(e) {
        if (e.target.value !== e.target.value.toUpperCase()) {
            var pos = e.target.selectionStart;
            e.target.value = e.target.value.toUpperCase();
            try { e.target.setSelectionRange(pos, pos); } catch(err) {}
        }
        filter();
    });
    selFuvarozo.addEventListener('change', filter);
    chkShowSent.addEventListener('change', filter);

    btnClear.addEventListener('click', function() {
        selSzezon.value = '25-26';
        inputKamisz.value = '';
        selFuvarozo.value = '';
        chkShowSent.checked = false;
        filter();
    });

    // Dokumentum megnyitása – valódi modal előnézet
    btnOpenDoc.addEventListener('click', function() {
        if (!selectedRowId) {
            alert('Kérjük, jelöljön ki egy fuvarmegbízást a megnyitáshoz!');
            return;
        }
        var row = appData.find(function(x) { return x.id === selectedRowId; });
        if (!row) return;
        openDocumentPreviewModal(row);
    });

    btnDeleteDoc.addEventListener('click', function() {
        if (!selectedRowId) {
            alert('Kérjük, jelöljön ki egy fuvarmegbízást a törléshez!');
            return;
        }
        var row = appData.find(function(x) { return x.id === selectedRowId; });
        if (!row) return;

        if (!confirm('Biztosan törölni szeretné a kiválasztott fuvarmegbízást?\n\n' + row.docName)) {
            return;
        }

        fetch('/api/v1/transport-orders/' + selectedRowId, { method: 'DELETE' })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.status === 'success') {
                    appData = appData.filter(function(x) { return x.id !== selectedRowId; });
                    selectedRowId = null;
                    filter();
                    
                    if (data.file_error) {
                        alert('Fuvarmegbízás törölve az adatbázisból, DE a fizikai fájlt nem sikerült törölni:\n' + data.file_error);
                    } else {
                        alert('Fuvarmegbízás és a fizikai fájl is sikeresen törölve.');
                    }
                } else {
                    alert('Hiba a törlés során: ' + (data.message || 'Ismeretlen hiba'));
                }
            })
            .catch(function(err) {
                alert('Hálózati hiba a törlés során.');
            });
    });

    // --- INICIALIZÁLÁS ---
    function loadData() {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Adatok betöltése...</td></tr>';
        fetch('/api/v1/transport-orders')
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.status === 'success' && data.data.transport_orders) {
                    appData = data.data.transport_orders;
                    populateFuvarozok();
                    filter();
                } else {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Hiba az adatok betöltésekor.</td></tr>';
                }
            })
            .catch(function(err) {
                console.error('Fetch error:', err);
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Hálózati hiba az adatok betöltésekor.</td></tr>';
            });
    }

    loadData();
}
