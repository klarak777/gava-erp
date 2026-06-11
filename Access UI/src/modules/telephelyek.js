// Telephelyek modul - Access Form_Telephelyek alapján
export function renderTelephelyek(container) {
    const view = document.createElement('div');
    view.className = 'module-view fade-in';

    view.innerHTML = `
        <div class="view-header" style="margin-bottom: 24px;">
            <h2 class="view-title">Telephelyek</h2>
            <p class="view-subtitle">Felrakó és lerakó telephelyek kezelése (Form_Telephelyek alapján)</p>
        </div>

        <div class="access-form-view">
            <div class="access-form-header">
                <h3>Keresés</h3>
                <button class="primary-btn btn-dense" id="btn-new-telephely">+ Új telephely (Új felrakó)</button>
            </div>
            <div class="access-control-group">
                <label class="access-control-label" for="tel-name">Telephely neve:</label>
                <input type="text" id="tel-name" class="access-control-input" placeholder="Keresés...">
            </div>
            <div class="access-control-group">
                <label class="access-control-label" for="tel-type">Típus:</label>
                <select id="tel-type" class="access-control-input">
                    <option value="">-- Összes --</option>
                    <option value="Felrakó">Felrakó</option>
                    <option value="Lerakó">Lerakó</option>
                    <option value="Raktár">Raktár</option>
                </select>
            </div>
        </div>

        <div class="access-subform">
            <div class="access-subform-header">Telephelyek listája</div>
            <div style="overflow-x: auto;">
                <table class="access-subform-table">
                    <thead>
                        <tr>
                            <th>Telephely neve</th>
                            <th>Típus</th>
                            <th>Cím</th>
                            <th>Ország</th>
                            <th>Kapcsolattartó</th>
                            <th>Műveletek</th>
                        </tr>
                    </thead>
                    <tbody id="tel-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    container.appendChild(view);

    const mockData = [
        { name: 'Budapest Raktár', type: 'Felrakó', address: 'Budapest, Ipari út 12.', country: 'HU', contact: 'Nagy János' },
        { name: 'Szeged Telephely', type: 'Felrakó', address: 'Szeged, Port utca 3.', country: 'HU', contact: 'Kovács Éva' },
        { name: 'Miskolci Bázis', type: 'Raktár', address: 'Miskolc, Gyár u. 7.', country: 'HU', contact: 'Tóth Péter' },
        { name: 'Tesco Pilisvörösvár', type: 'Lerakó', address: 'Pilisvörösvár, Áruház u. 1.', country: 'HU', contact: 'Tesco DC' },
        { name: 'Spar Budapest DC', type: 'Lerakó', address: 'Budapest, Külső köút 88.', country: 'HU', contact: 'Spar DC' },
        { name: 'Győr Telephely', type: 'Felrakó', address: 'Győr, Ipar út 5.', country: 'HU', contact: 'Kiss Béla' },
    ];

    const tbody = view.querySelector('#tel-tbody');
    const inputName = view.querySelector('#tel-name');
    const inputType = view.querySelector('#tel-type');

    function renderTable(data) {
        tbody.innerHTML = data.map(r => `
            <tr>
                <td class="bold">${r.name}</td>
                <td><span class="tag">${r.type}</span></td>
                <td>${r.address}</td>
                <td>${r.country}</td>
                <td>${r.contact}</td>
                <td>
                    <button class="action-btn">Szerkesztés</button>
                </td>
            </tr>
        `).join('');
    }

    function filter() {
        const n = inputName.value.toLowerCase();
        const t = inputType.value;
        renderTable(mockData.filter(r =>
            r.name.toLowerCase().includes(n) &&
            (t === '' || r.type === t)
        ));
    }

    inputName.addEventListener('input', filter);
    inputType.addEventListener('change', filter);
    filter();
}
