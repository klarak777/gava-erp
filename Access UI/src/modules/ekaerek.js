// EKAEREK modul - Hasonló a Fuvarmegbízásokhoz
export function renderEkaerek(container) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';

    // Mock adatok: Szezonfüggő Fuvarozók
    var fuvarozokSzezonSzerint = {
        '19-20': ['KÓNYA', 'KERMOR'],
        '20-21': ['BILEK', 'KERMOR'],
        '21-22': ['KÓNYA', 'BILEK'],
        '22-23': ['KÓNYA', 'KERMOR', 'BILEK'],
        '23-24': ['BILEK', 'KERMOR'],
        '24-25': ['KÓNYA', 'BILEK', 'KERMOR'],
        '25-26': ['KÓNYA', 'BILEK', 'KERMOR', 'GARTNER']
    };

    var mockData = [
        { id: 1, tour: 'GHU 238', docName: 'AADD058-AAID877.docx', date: '2025. 05. 03.', transporter: 'KÓNYA', sent: true, season: '25-26' },
        { id: 2, tour: 'GHU 240', docName: 'AAMG698-AEIW361.docx', date: '2025. 05. 03.', transporter: 'KÓNYA', sent: true, season: '25-26' },
        { id: 3, tour: 'GHU 239', docName: 'AIHK729-WGB783.docx', date: '2025. 05. 02.', transporter: 'KÓNYA', sent: true, season: '25-26' },
        { id: 4, tour: 'GHU 237', docName: 'AIHK730-AAID874.docx', date: '2025. 05. 01.', transporter: 'KÓNYA', sent: true, season: '25-26' },
        { id: 5, tour: 'LOG149', docName: 'AALE051-WFC666.docx', date: '2025. 05. 03.', transporter: 'KERMOR', sent: true, season: '25-26' },
        { id: 6, tour: 'LOG148', docName: 'AIHK725-AIIE446.docx', date: '2025. 05. 02.', transporter: 'KÓNYA', sent: true, season: '25-26' },
        { id: 7, tour: 'H269', docName: 'AIHK737-AIIE445.docx', date: '2025. 04. 30.', transporter: 'KÓNYA', sent: true, season: '24-25' },
        { id: 8, tour: 'LOG147', docName: 'AAEE004-AACE154.docx', date: '2025. 05. 02.', transporter: 'BILEK', sent: true, season: '25-26' }
    ];

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
                    '<label class="access-control-label" for="ek-fuvarozo">Fuvarozó:</label>' +
                    '<select id="ek-fuvarozo" class="access-control-input" style="width:170px;">' +
                        '<option value="">-- Összes --</option>' +
                    '</select>' +
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
                        '<th style="width:40px;"></th>' + // Radio button for selection
                        '<th>Kamion szám</th>' +
                        '<th>EKAER_FileName</th>' +
                        '<th>Load_Date</th>' +
                        '<th>Fuvarozó</th>' +
                        '<th style="text-align:center;">Kiküldve</th>' +
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
    var btnClear = view.querySelector('#btn-clear-ek');
    var tbody = view.querySelector('#ek-tbody');
    var btnOpenDoc = view.querySelector('#btn-open-ek-doc');
    var btnDeleteDoc = view.querySelector('#btn-delete-ek');
    var btnConfirmDelete = view.querySelector('#btn-confirm-ek-delete');

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

        if (selectedRowId && !filtered.find(function(x){return x.id === selectedRowId})) {
            selectedRowId = null;
        }

        renderTable(filtered);
    }

    function renderTable(data) {
        tbody.innerHTML = data.map(function(r) {
            var isSelected = r.id === selectedRowId;
            var trStyle = isSelected ? 'background-color: #e0f2fe;' : '';
            return '<tr class="ek-row" data-id="' + r.id + '" style="cursor:pointer; ' + trStyle + '">' +
                '<td style="text-align:center;"><input type="radio" name="ek_select" ' + (isSelected ? 'checked' : '') + ' style="cursor:pointer; pointer-events:none;"></td>' +
                '<td class="bold">' + r.tour + '</td>' +
                '<td>' + r.docName + '</td>' +
                '<td>' + r.date + '</td>' +
                '<td>' + r.transporter + '</td>' +
                '<td style="text-align:center;"><input type="checkbox" class="ek-sent-chk" data-id="' + r.id + '" ' + (r.sent ? 'checked' : '') + '></td>' +
                '</tr>';
        }).join('');

        // Row selection logic
        tbody.querySelectorAll('.ek-row').forEach(function(row) {
            row.addEventListener('click', function(e) {
                if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox') return;
                selectedRowId = parseInt(this.getAttribute('data-id'));
                renderTable(data);
            });
        });

        // Checkbox trigger logic
        tbody.querySelectorAll('.ek-sent-chk').forEach(function(chk) {
            chk.addEventListener('change', function(e) {
                var id = parseInt(e.target.getAttribute('data-id'));
                var rowData = mockData.find(function(x) { return x.id === id; });
                if (rowData) {
                    rowData.sent = e.target.checked;
                    console.log('EKAER Kiküldve állapot frissítve:', rowData.docName, '=>', rowData.sent);
                }
            });
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

    btnClear.addEventListener('click', function() {
        inputKamisz.value = '';
        selFuvarozo.value = '';
        selectedRowId = null;
        filter();
    });

    btnOpenDoc.addEventListener('click', function() {
        if (!selectedRowId) {
            alert('Kérjük, jelöljön ki egy EKAER dokumentumot a megnyitáshoz!');
            return;
        }
        var row = mockData.find(function(x) { return x.id === selectedRowId; });
        alert('Dokumentum megnyitása (Backend folyamat):\n\nFájl: ' + row.docName);
    });

    btnDeleteDoc.addEventListener('click', function() {
        if (!selectedRowId) {
            alert('Kérjük, jelöljön ki egy EKAER dokumentumot a törléshez!');
            return;
        }
        var row = mockData.find(function(x) { return x.id === selectedRowId; });
        view.querySelector('#del-ek-name').textContent = row.docName;
        view.querySelector('#modal-delete-ek-confirm').style.display = 'flex';
    });

    btnConfirmDelete.addEventListener('click', function() {
        if (selectedRowId) {
            var row = mockData.find(function(x) { return x.id === selectedRowId; });
            alert('EKAER törölve (Backend folyamat):\n' + row.docName);
            mockData = mockData.filter(function(x) { return x.id !== selectedRowId; });
            selectedRowId = null;
            view.querySelector('#modal-delete-ek-confirm').style.display = 'none';
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

    // --- INITIALIZATION ---
    populateFuvarozok();
    filter();
}
