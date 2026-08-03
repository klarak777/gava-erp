    };
    requestAnimationFrame(setupEvents);
}

export function openArchivedPartnersTable(wm) {
    const winContainer = wm.createWindow({
        title: 'Archív partnerek',
        width: 800,
        height: 600,
        isModal: false,
        icon: '🗄️'
    });

    winContainer.innerHTML = `
        <style>
            .arch-container { padding: 16px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
            .arch-table-wrap { flex: 1; overflow: auto; border: 1px solid var(--border-color); margin-top: 10px; background: white; }
            .arch-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .arch-table th, .arch-table td { padding: 6px 10px; border-bottom: 1px solid #eee; text-align: left; }
            .arch-table th { background: #f8fafc; font-weight: 600; position: sticky; top: 0; }
            .arch-table tr:hover { background: #f1f5f9; }
            .arch-row-partner { background: #e2e8f0; font-weight: bold; }
            .arch-row-iden { padding-left: 30px !important; }
            .arch-btn { padding: 3px 8px; font-size: 11px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; background: white; }
            .arch-btn.activate { border-color: #4ade80; color: #166534; }
            .arch-btn.activate:hover { background: #dcfce7; }
            
            .arch-reassign-container { position: relative; display: inline-block; margin-left: 8px; }
            .arch-reassign-dropdown { 
                position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ccc; 
                border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 250px; z-index: 100;
                display: none; flex-direction: column; padding: 8px;
            }
            .arch-reassign-input { width: 100%; padding: 4px; font-size: 11px; box-sizing: border-box; margin-bottom: 4px; }
            .arch-reassign-list { max-height: 150px; overflow-y: auto; list-style: none; margin: 0; padding: 0; }
            .arch-reassign-list li { padding: 4px; font-size: 11px; cursor: pointer; border-bottom: 1px solid #f1f1f1; }
            .arch-reassign-list li:hover { background: #eff6ff; }
        </style>
        <div class="arch-container">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2 style="margin:0; font-size:16px;">Archív partnerek és azonosítók</h2>
                <button id="arch-refresh" class="secondary-btn">Frissítés</button>
            </div>
            <div class="arch-table-wrap">
                <table class="arch-table">
                    <thead>
                        <tr>
                            <th>Típus</th>
                            <th>Név / Érték</th>
                            <th>Szerepkör (Kategória)</th>
                            <th>Műveletek</th>
                        </tr>
                    </thead>
                    <tbody id="arch-tbody">
                        <tr><td colspan="4" style="text-align:center;">Betöltés...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = winContainer.querySelector('#arch-tbody');
    let archivedData = [];

    async function loadData() {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Betöltés...</td></tr>';
        try {
            const res = await fetch('/api/v1/partners/archived/list');
            if (!res.ok) throw new Error('Hiba a lekérdezéskor');
            archivedData = await res.json();
            renderData();
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Hiba történt a betöltéskor.</td></tr>';
        }
    }

    function renderData() {
        if (!archivedData.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nincsenek archivált adatok.</td></tr>';
            return;
        }

        let html = '';
        archivedData.forEach(p => {
            const isPActive = !p.is_inactive;
            const pBadge = isPActive ? '<span style="color:#2563eb; font-size:10px;">(Aktív partner, de van inaktív azonosítója)</span>' : '';
            const pBtn = isPActive ? '' : `<button class="arch-btn activate btn-activate-partner" data-id="${p.id}">Partner aktiválása</button>`;

            html += `
                <tr class="arch-row-partner">
                    <td>🏢 Partner</td>
                    <td>${p.name || ''} ${pBadge}</td>
                    <td>-</td>
                    <td>${pBtn}</td>
                </tr>
            `;

            if (p.identifiers && p.identifiers.length) {
                p.identifiers.forEach(iden => {
                    html += `
                        <tr>
                            <td class="arch-row-iden">↳ Azonosító</td>
                            <td>${iden.value}</td>
                            <td>${iden.id_type}</td>
                            <td>
                                <button class="arch-btn activate btn-activate-iden" data-id="${iden.id}">Aktiválás</button>
                                <div class="arch-reassign-container">
                                    <button class="arch-btn btn-reassign" data-id="${iden.id}" title="Áthelyezés másik partnerhez">🔄 Áthelyez</button>
                                    <div class="arch-reassign-dropdown" id="dropdown-${iden.id}">
                                        <input type="text" class="arch-reassign-input" placeholder="Partner keresése...">
                                        <ul class="arch-reassign-list"></ul>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
        });

        tbody.innerHTML = html;

        // Eseménykezelők
        tbody.querySelectorAll('.btn-activate-partner').forEach(btn => {
            btn.addEventListener('click', () => activatePartner(btn.dataset.id));
        });
        tbody.querySelectorAll('.btn-activate-iden').forEach(btn => {
            btn.addEventListener('click', () => activateIdentifier(btn.dataset.id));
        });

        tbody.querySelectorAll('.btn-reassign').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close others
                tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
                const drop = tbody.querySelector(\`#dropdown-\${btn.dataset.id}\`);
                drop.style.display = 'flex';
                const inp = drop.querySelector('input');
                inp.focus();
                
                let searchTimeout;
                inp.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => handleSearch(inp.value, drop.querySelector('ul'), btn.dataset.id), 300);
                });
            });
        });
    }

    // Close dropdowns on outside click
    winContainer.addEventListener('click', () => {
        tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
    });

    async function activatePartner(id) {
        if (!confirm('Biztosan aktiválod ezt a partnert?')) return;
        try {
            const res = await fetch(\`/api/v1/partners/\${id}/status\`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ is_inactive: false })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            loadData();
        } catch (e) {
            alert(e.message);
        }
    }

    async function activateIdentifier(id) {
        try {
            const res = await fetch(\`/api/v1/partners/identifiers/\${id}/activate\`, { method: 'PUT' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            alert('Azonosító sikeresen aktiválva!');
            loadData();
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleSearch(query, ul, idenId) {
        if (query.length < 2) {
            ul.innerHTML = '<li>Gépelj legalább 2 karaktert...</li>';
            return;
        }
        try {
            const res = await fetch(\`/api/v1/partners/active/search?q=\${encodeURIComponent(query)}\`);
            const items = await res.json();
            if (!items.length) {
                ul.innerHTML = '<li>Nincs találat</li>';
                return;
            }
            ul.innerHTML = items.map(i => \`<li data-pid="\${i.id}">\${i.name}</li>\`).join('');
            ul.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    reassignIdentifier(idenId, li.dataset.pid);
                });
            });
        } catch (e) {
            ul.innerHTML = '<li>Hiba a kereséskor</li>';
        }
    }

    async function reassignIdentifier(idenId, targetPartnerId) {
        if (!confirm('Biztosan áthelyezed az azonosítót a kiválasztott partnerhez?')) return;
        try {
            const res = await fetch(\`/api/v1/partners/identifiers/\${idenId}/reassign\`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ target_partner_id: targetPartnerId })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            alert('Sikeres áthelyezés!');
            loadData();
        } catch (e) {
            alert(e.message);
        }
    }

    winContainer.querySelector('#arch-refresh').addEventListener('click', loadData);
    loadData();
}