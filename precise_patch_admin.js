const fs = require('fs');

let c = fs.readFileSync('Access UI/src/modules/admin.js', 'utf8');

// 0. Add admin-archived-partners to actionMap
const actionMapOld = "'admin-references': () => openAdminTable(wm, 'Reference', 'partners', [";
const actionMapNew = "'admin-archived-partners': () => openArchivedPartnersTable(wm),\n        'admin-references': () => openAdminTable(wm, 'Reference', 'partners', [";

if (!c.includes(actionMapOld)) throw new Error('actionMapOld not found');
c = c.replace(actionMapOld, actionMapNew);

// 1. Add allowReassign to reference, customer, transporter
c = c.replace(
    "customUrl: '/api/v1/partners-by-role?role=reference' }",
    "allowReassign: true, customUrl: '/api/v1/partners-by-role?role=reference' }"
);
c = c.replace(
    "customUrl: '/api/v1/partners-by-role?role=customer' }",
    "allowReassign: true, customUrl: '/api/v1/partners-by-role?role=customer' }"
);
c = c.replace(
    "customUrl: '/api/v1/partners-by-role?role=transporter' }",
    "allowReassign: true, customUrl: '/api/v1/partners-by-role?role=transporter' }"
);

// 2. Header replacement
const headerOld = "${extraPayload.isReadonly ? '' : '<th style=\"width:100px;\">Műveletek</th>'}";
const headerNew = "${(extraPayload.isReadonly && !extraPayload.allowReassign) ? '' : '<th style=\"width:100px;\">Műveletek</th>'}";
if (!c.includes(headerOld)) throw new Error('headerOld not found');
c = c.replace(headerOld, headerNew);

// 3. Row Td replacement
const rowOld = `                    \${extraPayload.isReadonly ? '' : \`
                    <td>
                        <button class="icon-btn edit-btn" data-id="\${item.id}">✏️</button>
                        <button class="icon-btn delete-btn" data-id="\${item.id}">🗑️</button>
                    </td>\`}`;

const rowNew = `                    \${(extraPayload.isReadonly && !extraPayload.allowReassign) ? '' : \`
                    <td>
                        \${(extraPayload.allowReassign && item.identifier_id) ? \`
                            <div style="position:relative; display:inline-block;">
                                <button class="arch-btn btn-reassign" data-id="\${item.identifier_id}" data-inactive="false" title="Áthelyezés másik partnerhez">🔄 Áthelyezés</button>
                                <div class="arch-reassign-dropdown" id="dropdown-\${item.identifier_id}" style="display:none; position:absolute; right:0; top:100%; background:white; border:1px solid #ccc; border-radius:4px; padding:8px; z-index:100; width:200px;">
                                    <input type="text" class="arch-reassign-input" placeholder="Keresés 1 karaktertől..." style="width:100%; box-sizing:border-box;">
                                    <ul class="arch-reassign-list" style="list-style:none; padding:0; margin:0; max-height:150px; overflow-y:auto;"></ul>
                                </div>
                            </div>
                        \` : ''}
                        \${!extraPayload.isReadonly ? \`
                        <button class="icon-btn edit-btn" data-id="\${item.id}">✏️</button>
                        \${extraPayload.disableDelete ? '' : \`<button class="icon-btn delete-btn" data-id="\${item.id}">🗑️</button>\`}
                        \` : ''}
                    </td>\`}`;

if (!c.includes(rowOld)) throw new Error('rowOld not found');
c = c.replace(rowOld, rowNew);

// 4. Event handler replacement
const eventsOld = `            if (!extraPayload.isReadonly) {
                tbody.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => openDialog(items.find(i => i.id == btn.dataset.id)));
                });
                tbody.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteItem(btn.dataset.id));
                });
            }`;

const eventsNew = `            if (!extraPayload.isReadonly) {
                tbody.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => openDialog(items.find(i => i.id == btn.dataset.id)));
                });
                tbody.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteItem(btn.dataset.id));
                });
            }
            if (extraPayload.allowReassign) {
                tbody.querySelectorAll('.btn-reassign').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
                        const drop = tbody.querySelector(\`#dropdown-\${btn.dataset.id}\`);
                        if (!drop) return;
                        drop.style.display = 'flex';
                        const inp = drop.querySelector('input');
                        if (inp) {
                            inp.focus();
                            let searchTimeout;
                            inp.oninput = () => {
                                clearTimeout(searchTimeout);
                                searchTimeout = setTimeout(() => handleSearchAdmin(inp.value, drop.querySelector('ul'), btn.dataset.id, false), 300);
                            };
                        }
                    });
                });
            }
        }

        winContainer.addEventListener('click', () => {
            if (extraPayload.allowReassign) {
                tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
            }
        });

        async function handleSearchAdmin(query, ul, idenId, isInactive) {
            if (query.length < 1) {
                ul.innerHTML = '<li>Gépelj legalább 1 karaktert...</li>';
                return;
            }
            try {
                const res = await fetch(\`/api/v1/partners/active/search?q=\${encodeURIComponent(query)}&include_inactive=\${isInactive}\`);
                const items = await res.json();
                if (!items.length) {
                    ul.innerHTML = '<li>Nincs találat</li>';
                    return;
                }
                ul.innerHTML = items.map(i => \`<li data-pid="\${i.id}">\${i.name} \${i.is_inactive ? '(Inaktív)' : ''}</li>\`).join('');
                ul.querySelectorAll('li').forEach(li => {
                    li.addEventListener('click', (e) => {
                        e.stopPropagation();
                        reassignIdentifierAdmin(idenId, li.dataset.pid);
                    });
                });
            } catch (e) {
                ul.innerHTML = '<li>Hiba a kereséskor</li>';
            }
        }

        async function reassignIdentifierAdmin(idenId, targetPartnerId) {
            try {
                const checkRes = await fetch(\`/api/v1/partners/identifiers/\${idenId}/reassign?dry_run=true\`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ target_partner_id: targetPartnerId })
                });
                const checkData = await checkRes.json();
                if (checkData.error) {
                    alert(checkData.error);
                    return;
                }

                if (!confirm('Adatbázis ellenőrzés sikeres! Biztosan áthelyezed az azonosítót a kiválasztott partnerhez?')) return;
                
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
        }`;

if (!c.includes(eventsOld)) throw new Error('eventsOld not found');
c = c.replace(eventsOld, eventsNew);

// 5. Append openArchivedPartnersTable using wm.open
const archiveCode = `

export function openArchivedPartnersTable(wm) {
    wm.open('admin-archived-partners', 'Archív partnerek és azonosítók', (winContainer) => {
        winContainer.innerHTML = \`
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
        \`;

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
                const renameBtn = \`<button class="arch-btn btn-edit-partner-name" data-id="\${p.id}" data-name="\${p.name || ''}">✏️ Átnevezés</button>\`;
                const pBadge = isPActive ? '<span style="color:#2563eb; font-size:10px;">(Aktív partner, de van inaktív azonosítója)</span>' : '';
                const pBtn = isPActive ? '' : \`<button class="arch-btn activate btn-activate-partner" data-id="\${p.id}">Partner aktiválása</button>\`;
                
                html += \`
                    <tr class="arch-row-partner">
                        <td>🏢 Partner</td>
                        <td>\${p.name || ''} \${pBadge}</td>
                        <td>-</td>
                        <td>\${pBtn} \${renameBtn}</td>
                    </tr>
                \`;

                if (p.identifiers && p.identifiers.length) {
                    p.identifiers.forEach(iden => {
                        html += \`
                            <tr>
                                <td class="arch-row-iden">↳ Azonosító</td>
                                <td>\${iden.value}</td>
                                <td>\${iden.id_type}</td>
                                <td>
                                    <button class="arch-btn activate btn-activate-iden" data-id="\${iden.id}">Aktiválás</button>
                                    <div class="arch-reassign-container">
                                        <button class="arch-btn btn-reassign" data-id="\${iden.id}" data-inactive="\${iden.is_inactive}" title="Áthelyezés másik partnerhez">🔄 Áthelyez</button>
                                        <div class="arch-reassign-dropdown" id="dropdown-\${iden.id}">
                                            <input type="text" class="arch-reassign-input" placeholder="Keresés 1 karaktertől...">
                                            <ul class="arch-reassign-list"></ul>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        \`;
                    });
                }
            });

            tbody.innerHTML = html;

            tbody.querySelectorAll('.btn-activate-partner').forEach(btn => {
                btn.addEventListener('click', () => activatePartner(btn.dataset.id));
            });
            tbody.querySelectorAll('.btn-edit-partner-name').forEach(btn => {
                btn.addEventListener('click', () => renameArchivedPartner(btn.dataset.id, btn.dataset.name));
            });
            tbody.querySelectorAll('.btn-activate-iden').forEach(btn => {
                btn.addEventListener('click', () => activateIdentifier(btn.dataset.id));
            });
            
            tbody.querySelectorAll('.btn-reassign').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
                    const drop = tbody.querySelector(\`#dropdown-\${btn.dataset.id}\`);
                    if (!drop) return;
                    drop.style.display = 'flex';
                    const inp = drop.querySelector('input');
                    if (inp) {
                        inp.focus();
                        let searchTimeout;
                        inp.oninput = () => {
                            clearTimeout(searchTimeout);
                            searchTimeout = setTimeout(() => handleSearch(inp.value, drop.querySelector('ul'), btn.dataset.id, btn.dataset.inactive === 'true'), 300);
                        };
                    }
                });
            });
        }

        winContainer.addEventListener('click', () => {
            tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
        });

        async function renameArchivedPartner(id, oldName) {
            const newName = prompt('Add meg a partner új nevét:', oldName);
            if (!newName || newName === oldName) return;
            try {
                const res = await fetch(\`/api/v1/partners/\${id}\`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name: newName })
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                loadData();
            } catch (err) {
                alert(err.message);
            }
        }

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

        async function handleSearch(query, ul, idenId, isInactive) {
            if (query.length < 1) {
                ul.innerHTML = '<li>Gépelj legalább 1 karaktert...</li>';
                return;
            }
            try {
                const res = await fetch(\`/api/v1/partners/active/search?q=\${encodeURIComponent(query)}&include_inactive=\${isInactive}\`);
                const items = await res.json();
                if (!items.length) {
                    ul.innerHTML = '<li>Nincs találat</li>';
                    return;
                }
                ul.innerHTML = items.map(i => \`<li data-pid="\${i.id}">\${i.name} \${i.is_inactive ? '(Inaktív)' : ''}</li>\`).join('');
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
            try {
                const checkRes = await fetch(\`/api/v1/partners/identifiers/\${idenId}/reassign?dry_run=true\`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ target_partner_id: targetPartnerId })
                });
                const checkData = await checkRes.json();
                if (checkData.error) {
                    alert(checkData.error);
                    return;
                }

                if (!confirm('Adatbázis ellenőrzés sikeres! Biztosan áthelyezed az azonosítót a kiválasztott partnerhez?')) return;
                
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
    });
}
`;

c += archiveCode;

fs.writeFileSync('Access UI/src/modules/admin.js', c, 'utf8');
console.log('ALL PRECISE REPLACEMENTS SUCCEEDED 100%!');
