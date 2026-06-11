// Fuvarmegbízások modul
export function renderFuvarmegbizas(container) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';

    // Mock adatok: Szezonfüggő Fuvarozók
    var fuvarozokSzezonSzerint = {
        '19-20': ['KÓNYA', 'RONI'],
        '20-21': ['STI', 'RONI'],
        '21-22': ['KÓNYA', 'STI'],
        '22-23': ['KÓNYA', 'RONI', 'STI'],
        '23-24': ['STI', 'RONI'],
        '24-25': ['KÓNYA', 'STI', 'RONI'],
        '25-26': ['KÓNYA', 'STI', 'RONI', 'GARTNER']
    };

    var mockData = [
        { id: 1, docName: 'KONYA TRANS GHU 240.DOCX', date: '2025. 02. 25.', transporter: 'KÓNYA', tour: 'GHU 240', sent: true, season: '25-26' },
        { id: 2, docName: 'STI KFT LOG 146.DOCX', date: '2025. 02. 26.', transporter: 'STI', tour: 'LOG 146', sent: false, season: '25-26' },
        { id: 3, docName: 'KONYA TRANS H 269.DOCX', date: '2025. 02. 27.', transporter: 'KÓNYA', tour: 'H 269', sent: false, season: '24-25' },
        { id: 4, docName: 'KONYA TRANS GHU 239.DOCX', date: '2025. 02. 24.', transporter: 'KÓNYA', tour: 'GHU 239', sent: true, season: '25-26' }
    ];

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
                    '<label class="access-control-label" for="fuvm-fuvarozo">Fuvarozó:</label>' +
                    '<select id="fuvm-fuvarozo" class="access-control-input" style="width:170px;">' +
                        '<option value="">-- Összes --</option>' +
                    '</select>' +
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
                        '<th style="width:40px;"></th>' + // Radio button for selection
                        '<th>Dokumentum név</th>' +
                        '<th>Rakodás nap</th>' +
                        '<th>Fuvarozó</th>' +
                        '<th style="text-align:center;">Kiküldve</th>' +
                    '</tr></thead>' +
                    '<tbody id="fuvm-tbody"></tbody>' +
                '</table>' +
            '</div>' +
        '</div>' +

        // Delete Confirmation Modal
        '<div id="modal-delete-confirm" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; align-items:center; justify-content:center;">' +
            '<div style="background:#fff; padding:28px; border-radius:12px; width:360px; box-shadow:0 8px 32px rgba(0,0,0,0.2);">' +
                '<h3 style="margin-bottom:16px; color:#ef4444;">⚠️ Megbízás törlése</h3>' +
                '<p style="margin-bottom:24px; color:#1e293b;">Biztosan törölni szeretné a kiválasztott fuvarmegbízást?</p>' +
                '<p id="del-doc-name" style="font-weight:bold; margin-bottom:24px; color:#475569; word-break:break-all;"></p>' +
                '<div style="display:flex; justify-content:flex-end; gap:10px;">' +
                    '<button class="secondary-btn btn-close-modal" data-modal="modal-delete-confirm">Mégsem</button>' +
                    '<button class="primary-btn" id="btn-confirm-delete" style="background:#ef4444; border-color:#dc2626;">Törlés</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    container.appendChild(view);

    // Elements
    var selSzezon = view.querySelector('#fuvm-szezon');
    var inputKamisz = view.querySelector('#fuvm-kamisz');
    var selFuvarozo = view.querySelector('#fuvm-fuvarozo');
    var btnClear = view.querySelector('#btn-clear-fuvm');
    var tbody = view.querySelector('#fuvm-tbody');
    var btnOpenDoc = view.querySelector('#btn-open-doc');
    var btnDeleteDoc = view.querySelector('#btn-delete-doc');
    var btnConfirmDelete = view.querySelector('#btn-confirm-delete');

    var selectedRowId = null;

    // --- LOGIC ---

    function populateFuvarozok() {
        var season = selSzezon.value;
        var fuvList = fuvarozokSzezonSzerint[season] || [];
        var html = '<option value="">-- Összes --</option>';
        fuvList.forEach(function(f) {
            html += '<option value="' + f + '">' + f + '</option>';
        });
        selFuvarozo.innerHTML = html;
        // Ha az előzőleg kiválasztott fuvarozó nincs benne az új szezonban, töröljük a szűrést
        if (selFuvarozo.value === '') {
            filter();
        }
    }

    function filter() {
        var s = selSzezon.value;
        var k = inputKamisz.value.toUpperCase();
        var f = selFuvarozo.value;

        var filtered = mockData.filter(function(r) {
            var matchS = r.season === s;
            var matchK = r.tour.toUpperCase().indexOf(k) !== -1 || r.docName.toUpperCase().indexOf(k) !== -1;
            var matchF = f === '' || r.transporter === f;
            return matchS && matchK && matchF;
        });

        // Ha a kiválasztott sor kikerült a szűrésből, töröljük a kijelölést
        if (selectedRowId && !filtered.find(function(x){return x.id === selectedRowId})) {
            selectedRowId = null;
        }

        renderTable(filtered);
    }

    function renderTable(data) {
        tbody.innerHTML = data.map(function(r) {
            var isSelected = r.id === selectedRowId;
            var trStyle = isSelected ? 'background-color: #e0f2fe;' : '';
            return '<tr class="fuvm-row" data-id="' + r.id + '" style="cursor:pointer; ' + trStyle + '">' +
                '<td style="text-align:center;"><input type="radio" name="fuvm_select" ' + (isSelected ? 'checked' : '') + ' style="cursor:pointer; pointer-events:none;"></td>' +
                '<td class="bold">' + r.docName + '</td>' +
                '<td>' + r.date + '</td>' +
                '<td>' + r.transporter + '</td>' +
                '<td style="text-align:center;"><input type="checkbox" class="fuvm-sent-chk" data-id="' + r.id + '" ' + (r.sent ? 'checked' : '') + '></td>' +
                '</tr>';
        }).join('');

        // Sor kijelölés
        tbody.querySelectorAll('.fuvm-row').forEach(function(row) {
            row.addEventListener('click', function(e) {
                // Ha direkt a checkboxra vagy a radio gombra kattint, ne zavarjuk be
                if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox') return;
                
                selectedRowId = parseInt(this.getAttribute('data-id'));
                renderTable(data); // Újra renderelés a highlight miatt
            });
        });

        // Kiküldve checkbox logika
        tbody.querySelectorAll('.fuvm-sent-chk').forEach(function(chk) {
            chk.addEventListener('change', function(e) {
                var id = parseInt(e.target.getAttribute('data-id'));
                var rowData = mockData.find(function(x) { return x.id === id; });
                if (rowData) {
                    rowData.sent = e.target.checked;
                    console.log('Kiküldve állapot frissítve:', rowData.docName, '=>', rowData.sent);
                }
            });
        });
    }

    // --- ESEMÉNYKEZELŐK ---

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

    btnClear.addEventListener('click', function() {
        inputKamisz.value = '';
        selFuvarozo.value = '';
        selectedRowId = null;
        filter();
    });

    // Gombok
    btnOpenDoc.addEventListener('click', function() {
        if (!selectedRowId) {
            alert('Kérjük, jelöljön ki egy fuvarmegbízást a megnyitáshoz!');
            return;
        }
        var row = mockData.find(function(x) { return x.id === selectedRowId; });
        alert('Dokumentum megnyitása (Backend folyamat):\n\nFájl: ' + row.docName);
    });

    btnDeleteDoc.addEventListener('click', function() {
        if (!selectedRowId) {
            alert('Kérjük, jelöljön ki egy fuvarmegbízást a törléshez!');
            return;
        }
        var row = mockData.find(function(x) { return x.id === selectedRowId; });
        view.querySelector('#del-doc-name').textContent = row.docName;
        view.querySelector('#modal-delete-confirm').style.display = 'flex';
    });

    btnConfirmDelete.addEventListener('click', function() {
        if (selectedRowId) {
            var row = mockData.find(function(x) { return x.id === selectedRowId; });
            alert('Fuvarmegbízás törölve (Backend folyamat):\n' + row.docName);
            // Eltávolítás a mock listából
            mockData = mockData.filter(function(x) { return x.id !== selectedRowId; });
            selectedRowId = null;
            view.querySelector('#modal-delete-confirm').style.display = 'none';
            filter();
        }
    });

    view.querySelectorAll('.btn-close-modal').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var modalId = e.currentTarget.getAttribute('data-modal');
            var m = view.querySelector('#' + modalId);
            if (m) m.style.display = 'none';
        });
    });

    // --- INICIALIZÁLÁS ---
    populateFuvarozok();
    filter();
}
