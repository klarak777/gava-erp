// EKAEREK modul – Hasonló a Fuvarmegbízásokhoz
export function renderEkaerek(container, windowManager) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';

    // Belső adatok a backendből
    var appData = [];

    view.innerHTML =
        '<div class="view-header" style="margin-bottom:16px;">' +
            '<h2 class="view-title">EKAEREK</h2>' +
            '<p class="view-subtitle">EKAER dokumentumok és igénylések kezelése</p>' +
        '</div>' +

        // Filter strip
        '<div class="access-form-view" style="margin-bottom:16px; padding:12px 16px;">' +
            '<div style="display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap;">' +
                '<div class="access-control-group" style="margin-bottom:0;">' +
                    '<label class="access-control-label" for="ek-szezon">Szezon:</label>' +
                    '<select id="ek-szezon" class="access-control-input" style="width:120px;">' +
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
                    '<label class="access-control-label" for="ek-kamisz">Kamion szám:</label>' +
                    '<input type="text" id="ek-kamisz" class="access-control-input" placeholder="Keresés..." style="width:150px;">' +
                '</div>' +
                '<div class="access-control-group" style="margin-bottom:0;">' +
                    '<label class="access-control-label" for="ek-fuvarozo">Fuvarozó cég:</label>' +
                    '<select id="ek-fuvarozo" class="access-control-input" style="width:170px;">' +
                        '<option value="">-- Összes --</option>' +
                    '</select>' +
                '</div>' +
                '<div style="display:flex; align-items:center; gap:16px; margin-left:10px;">' +
                    '<label style="display:flex; align-items:center; gap:6px; font-size:13px; color:var(--text-main); cursor:pointer;">' +
                        '<input type="checkbox" id="ek-show-sent" style="cursor:pointer; width:16px; height:16px; accent-color:var(--primary);">' +
                        'Mutassa a kiküldött EKAER-eket' +
                    '</label>' +
                '</div>' +
                '<div style="display:flex; gap:8px; padding-bottom: 2px;">' +
                    '<button class="secondary-btn btn-dense" id="btn-clear-ek">Szűrő törlése</button>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // Action Buttons
        '<div style="display:flex; gap:12px; margin-bottom:16px;">' +
            '<button class="primary-btn btn-dense" id="btn-open-ek-doc">📄 Dokumentum megnyitása</button>' +
            '<button class="secondary-btn btn-dense" id="btn-delete-ek" style="color:#ef4444; border-color:#fca5a5; background:#fff;">🗑️ EKAER Törlése</button>' +
        '</div>' +

        // Table
        '<div class="access-subform">' +
            '<div class="access-subform-header">EKAEREK listája</div>' +
            '<div style="overflow-x:auto;">' +
                '<table class="access-subform-table" id="ek-table">' +
                    '<thead><tr>' +
                        '<th style="width:40px;"></th>' +
                        '<th>Kamion szám</th>' +
                        '<th>EKAER_FileName</th>' +
                        '<th>Load_Date</th>' +
                        '<th>Fuvarozó cég</th>' +
                        '<th style="text-align:center; width:100px;">Kiküldve</th>' +
                    '</tr></thead>' +
                    '<tbody id="ek-tbody"></tbody>' +
                '</table>' +
            '</div>' +
        '</div>' +

        // Delete Confirmation Modal
        '<div id="modal-delete-ek-confirm" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; align-items:center; justify-content:center;">' +
            '<div style="background:#fff; padding:28px; border-radius:12px; width:360px; box-shadow:0 8px 32px rgba(0,0,0,0.2);">' +
                '<h3 style="margin-bottom:16px; color:#ef4444;">⚠️ EKAER Törlése</h3>' +
                '<p style="margin-bottom:24px; color:#1e293b;">Biztosan törölni szeretné a kiválasztott EKAER dokumentumot?</p>' +
                '<p id="del-ek-name" style="font-weight:bold; margin-bottom:24px; color:#475569; word-break:break-all;"></p>' +
                '<div style="display:flex; justify-content:flex-end; gap:10px;">' +
                    '<button class="secondary-btn btn-close-modal" data-modal="modal-delete-ek-confirm">Mégsem</button>' +
                    '<button class="primary-btn" id="btn-confirm-ek-delete" style="background:#ef4444; border-color:#dc2626;">Törlés</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    container.appendChild(view);

    // Elements
    var selSzezon = view.querySelector('#ek-szezon');
    var inputKamisz = view.querySelector('#ek-kamisz');
    var selFuvarozo = view.querySelector('#ek-fuvarozo');
    var chkShowSent = view.querySelector('#ek-show-sent');
    var btnClear = view.querySelector('#btn-clear-ek');
    var tbody = view.querySelector('#ek-tbody');
    var btnOpenDoc = view.querySelector('#btn-open-ek-doc');
    var btnDeleteDoc = view.querySelector('#btn-delete-ek');
    var btnConfirmDelete = view.querySelector('#btn-confirm-ek-delete');

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

            var isHidden = r.sent_ghu && !showSent;

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

            var sentHtml = '<input type="checkbox" class="ek-sent-chk" data-id="' + r.id + '" ' +
                (r.sent_ghu ? 'checked' : '') +
                ' style="cursor:pointer; width:18px; height:18px;">';

            return '<tr class="ek-row" data-id="' + r.id + '" style="cursor:pointer; ' + trStyle + '">' +
                '<td style="text-align:center;"><input type="radio" name="ek_select" ' + (isSelected ? 'checked' : '') + ' style="cursor:pointer; pointer-events:none;"></td>' +
                '<td class="bold">' + r.tour + '</td>' +
                '<td>' + r.docName + '</td>' +
                '<td>' + r.date + '</td>' +
                '<td>' + r.transporter + '</td>' +
                '<td style="text-align:center;" title="Kiküldve">' + sentHtml + '</td>' +
                '</tr>';
        }).join('');

        tbody.querySelectorAll('.ek-row').forEach(function(row) {
            row.addEventListener('click', function(e) {
                if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox') return;
                selectedRowId = parseInt(this.getAttribute('data-id'));
                renderTable(data);
            });
        });

        tbody.querySelectorAll('.ek-sent-chk').forEach(function(chk) {
            chk.addEventListener('change', function(e) {
                var id = parseInt(e.target.getAttribute('data-id'));
                var rowData = appData.find(function(x) { return x.id === id; });
                if (!rowData) return;

                var newVal = e.target.checked;

                if (newVal && !confirm('Biztosan kiküldve állapotúra állítod ezt az EKAER dokumentumot?')) {
                    e.target.checked = false;
                    return;
                }

                fetch('/api/v1/ekaer-records/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_sent_ghu: newVal, is_sent_log: newVal })
                })
                .then(function(res) { return res.json(); })
                .then(function(resData) {
                    if (resData.status !== 'success') {
                        e.target.checked = !newVal;
                        rowData.sent_ghu = !newVal;
                        alert('Hiba a státusz frissítésekor: ' + resData.message);
                    } else {
                        rowData.sent_ghu = newVal;
                        rowData.sent_log = newVal;
                        filter();
                    }
                })
                .catch(function() {
                    e.target.checked = !newVal;
                    rowData.sent_ghu = !newVal;
                    alert('Hálózati hiba a státusz frissítésekor!');
                });
            });
        });
    }

    function openDocumentPreviewModal(rowData) {
        var isEditMode = false;
        var originalHtml = '';

        var modalContent =
            '<div style="display:flex; flex-direction:column; height:100%;">' +
                '<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 20px; background:linear-gradient(135deg,#064e3b,#059669); border-radius:8px; margin-bottom:16px; flex-shrink:0;">' +
                    '<div>' +
                        '<div style="font-size:11px; color:rgba(255,255,255,0.7); font-weight:500; letter-spacing:0.5px; text-transform:uppercase;">EKAER dokumentum</div>' +
                        '<div style="font-size:14px; color:#fff; font-weight:700; margin-top:2px;">' + (rowData.docName || 'Dokumentum') + '</div>' +
                        '<div style="font-size:11px; color:rgba(255,255,255,0.6); margin-top:2px;">Kamion: ' + rowData.tour + ' &nbsp;|&nbsp; Fuvarozó cég: ' + rowData.transporter + ' &nbsp;|&nbsp; Dátum: ' + rowData.date + '</div>' +
                    '</div>' +
                    '<div style="display:flex; gap:8px; align-items:center;">' +
                        '<div id="ek-status-msg" style="font-size:12px; font-weight:600; display:none; padding:4px 10px; border-radius:6px;"></div>' +
                        '<a id="ek-download-btn" href="/api/v1/ekaer-records/' + rowData.id + '/download" download ' +
                           'style="display:flex; align-items:center; gap:6px; background:#22c55e; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; transition:all 0.2s; white-space:nowrap;">' +
                            '⬇️ Letöltés' +
                        '</a>' +
                        '<button id="ek-edit-btn" ' +
                           'style="display:flex; align-items:center; gap:6px; background:#f59e0b; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;">' +
                            '✏️ Szerkesztés' +
                        '</button>' +
                        '<button id="ek-save-btn" ' +
                           'style="display:none; align-items:center; gap:6px; background:#059669; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;">' +
                            '💾 Mentés' +
                        '</button>' +
                        '<button id="ek-cancel-btn" ' +
                           'style="display:none; align-items:center; gap:6px; background:#64748b; color:#fff; border:none; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;">' +
                            '✕ Mégse' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div id="ek-preview-body" style="flex:1; overflow-y:auto; padding:24px 28px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; font-family:\'Segoe UI\', Arial, sans-serif; font-size:13px; line-height:1.6; color:#1e293b; min-height:300px; outline:none;">' +
                    '<div id="ek-preview-spinner" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; gap:12px; color:#64748b;">' +
                        '<div style="width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#059669; border-radius:50%; animation:ek-spin 0.8s linear infinite;"></div>' +
                        '<span style="font-size:13px;">Dokumentum betöltése...</span>' +
                    '</div>' +
                    '<div id="ek-preview-content" style="display:none;"></div>' +
                    '<div id="ek-preview-error" style="display:none; padding:20px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; color:#dc2626; font-size:13px;"></div>' +
                '</div>' +
                '<style>' +
                    '@keyframes ek-spin { to { transform: rotate(360deg); } }' +
                    '#ek-preview-body table { border-collapse: collapse; width:100%; margin:8px 0; }' +
                    '#ek-preview-body td, #ek-preview-body th { border:1px solid #cbd5e1; padding:5px 8px; font-size:12px; }' +
                    '#ek-preview-body th { background:#f1f5f9; font-weight:600; }' +
                    '#ek-preview-body p { margin:4px 0 8px; }' +
                    '#ek-preview-body strong, #ek-preview-body b { font-weight:700; }' +
                    '#ek-download-btn:hover { background:#16a34a !important; transform:translateY(-1px); box-shadow:0 4px 12px rgba(34,197,94,0.3); }' +
                    '#ek-edit-btn:hover { background:#d97706 !important; }' +
                    '#ek-save-btn:hover { background:#047857 !important; }' +
                    '#ek-preview-content[contenteditable="true"] { outline:2px dashed #059669; outline-offset:4px; background:#f0fdf4; border-radius:4px; cursor:text; }' +
                '</style>' +
            '</div>';

        var modal = windowManager.createModal({
            title: '📄 ' + (rowData.docName || 'EKAER Dokumentum előnézet'),
            width: 820,
            height: 660,
            content: modalContent
        });

        var modalEl = modal.element;
        var spinner = modalEl.querySelector('#ek-preview-spinner');
        var contentDiv = modalEl.querySelector('#ek-preview-content');
        var errorDiv = modalEl.querySelector('#ek-preview-error');
        var editBtn = modalEl.querySelector('#ek-edit-btn');
        var saveBtn = modalEl.querySelector('#ek-save-btn');
        var cancelBtn = modalEl.querySelector('#ek-cancel-btn');
        var statusMsg = modalEl.querySelector('#ek-status-msg');

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

            fetch('/api/v1/ekaer-records/' + rowData.id + '/edit', {
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

        fetch('/api/v1/ekaer-records/' + rowData.id + '/preview')
            .then(function(res) { return res.json(); })
            .then(function(data) {
                spinner.style.display = 'none';
                if (data.status === 'success') {
                    contentDiv.innerHTML = data.html || '<em style="color:#94a3b8;">A dokumentum nem tartalmaz szöveget.</em>';
                    contentDiv.style.display = 'block';
                    editBtn.style.display = 'flex';
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


    // --- EVENT LISTENERS ---

    selSzezon.addEventListener('change', function() {
        populateFuvarozok();
        filter();
    });

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
            alert('Kérjük, jelöljön ki egy EKAER dokumentumot a megnyitáshoz!');
            return;
        }
        var row = appData.find(function(x) { return x.id === selectedRowId; });
        if (!row) return;
        openDocumentPreviewModal(row);
    });

    btnDeleteDoc.addEventListener('click', function() {
        if (!selectedRowId) {
            alert('Kérjük, jelöljön ki egy EKAER dokumentumot a törléshez!');
            return;
        }
        var row = appData.find(function(x) { return x.id === selectedRowId; });
        if (!row) return;
        view.querySelector('#del-ek-name').textContent = row.docName;
        view.querySelector('#modal-delete-ek-confirm').style.display = 'flex';
    });

    btnConfirmDelete.addEventListener('click', function() {
        if (selectedRowId) {
            var row = appData.find(function(x) { return x.id === selectedRowId; });
            fetch('/api/v1/ekaer-records/' + selectedRowId, { method: 'DELETE' })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.status === 'success') {
                        appData = appData.filter(function(x) { return x.id !== selectedRowId; });
                        selectedRowId = null;
                        view.querySelector('#modal-delete-ek-confirm').style.display = 'none';
                        filter();
                    } else {
                        alert('Hiba a törlés során: ' + (data.message || 'Ismeretlen hiba'));
                    }
                })
                .catch(function(err) {
                    alert('Hálózati hiba a törlés során.');
                });
        }
    });

    view.querySelectorAll('.btn-close-modal').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var modalId = e.currentTarget.getAttribute('data-modal');
            var m = view.querySelector('#' + modalId);
            if (m) m.style.display = 'none';
        });
    });

    // --- INITIALIZATION ---
    function loadData() {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Adatok betöltése...</td></tr>';
        fetch('/api/v1/ekaer-records')
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.status === 'success' && data.data.ekaer_records) {
                    appData = data.data.ekaer_records;
                    populateFuvarozok();
                    filter();
                } else {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Hiba az adatok betöltésekor.</td></tr>';
                }
            })
            .catch(function(err) {
                console.error('Fetch error:', err);
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Hálózati hiba az adatok betöltésekor.</td></tr>';
            });
    }

    loadData();
}
