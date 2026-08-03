import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderAdmin(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.id === 'admin_module');
    const items = group ? group.items : [];

    const actionMap = {
        'admin-archived-partners': () => openArchivedPartnersTable(wm),
        'admin-references': () => openAdminTable(wm, 'Reference', 'partners', [
            { field: 'name', label: 'Name' },
            { field: 'full_name', label: 'Teljes név' }
        ], { isReadonly: true, allowReassign: true, customUrl: '/api/v1/partners-by-role?role=reference' }),
        'admin-customers': () => openAdminTable(wm, 'Customer', 'partners', [
            { field: 'name', label: 'Name' },
            { field: 'full_name', label: 'Teljes név' }
        ], { isReadonly: true, allowReassign: true, customUrl: '/api/v1/partners-by-role?role=customer' }),
        'admin-transporters': () => openAdminTable(wm, 'Fuvarozó cég', 'transporters', [
            { field: 'name', label: 'Name' },
            { field: 'full_name', label: 'Teljes név' }
        ], { isReadonly: true, allowReassign: true, customUrl: '/api/v1/partners-by-role?role=transporter' }),
        'admin-finance-trucks': () => openAdminTable(wm, 'Pénzügyi Kamion Típus', 'finance_truck_types', [
            { field: 'name', label: 'Name' }
        ]),
        'admin-finance-tax-rates': () => openAdminTable(wm, 'TpTAX (Adókulcsok)', 'finance_tax_rates', [
            { field: 'rate_value', label: 'Adókulcs (%)' }
        ]),
        'admin-currencies': () => openAdminTable(wm, 'Currencies (Devizák)', 'currencies', [
            { field: 'code', label: 'Kód (pl. EUR)' },
            { field: 'name', label: 'Megnevezés' }
        ])
    };

    const launcherContent = `
        <div class="launcher-grid">
            ${items.map(item => `
                <div class="launcher-card" data-sub-id="${item.id}">
                    <div class="l-icon">${item.icon || '📄'}</div>
                    <div class="l-title">${item.label}</div>
                    <div class="l-desc">${item.desc || ''}</div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = `
        <div class="view-header">
            <h1 class="view-title">Adminisztráció</h1>
            <p class="view-subtitle">Rendszerbeállítások és jogosultságok.</p>
        </div>
        ${createCollapsibleSection('admin-main', 'Adminisztráció modulok', launcherContent)}
        <style>${collapsibleSectionStyles}</style>
    `;

    const setupEvents = () => {
        container.querySelectorAll('.launcher-card[data-sub-id]').forEach(card => {
            card.addEventListener('click', () => {
                const subId = card.dataset.subId;
                if (actionMap[subId]) actionMap[subId]();
            });
        });
        setupCollapsibleSections(container, 'module-section');
    };
    requestAnimationFrame(setupEvents);
}

export function openAdminTable(wm, title, tableName, columns, extraPayload = {}, targetContainer = null) {
    const buildContent = (winContainer) => {
        let items = [];

        winContainer.innerHTML = `
            <style>
                .admin-compact-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px !important;
                }
                .admin-compact-table th {
                    padding: 4px 8px !important;
                    font-size: 11px !important;
                    background: var(--bg-light, #f8fafc) !important;
                    border: 1px solid var(--border-color, #cbd5e1) !important;
                    font-weight: 600 !important;
                    text-align: left !important;
                }
                .admin-compact-table td {
                    padding: 3px 8px !important;
                    font-size: 11px !important;
                    border: 1px solid var(--border-color, #e2e8f0) !important;
                    color: var(--text-main, #334155) !important;
                }
                .admin-compact-table tr:hover {
                    background-color: var(--hover-color, #f1f5f9) !important;
                }
                .admin-compact-table .icon-btn {
                    padding: 2px 4px !important;
                    font-size: 11px !important;
                    background: none !important;
                    border: none !important;
                    cursor: pointer !important;
                }
                .arch-btn { padding: 3px 8px; font-size: 11px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; background: white; }
                .arch-btn:hover { background: #f1f5f9; }
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
            <div style="padding:16px; display:flex; flex-direction:column; height:100%;">
                ${extraPayload.isReadonly ? 
                    '<div style="margin-bottom:12px; padding:8px; background-color:#eff6ff; color:#1e3a8a; border-radius:4px; font-size:12px;">ℹ️ Ezek a szerepkörök (Azonosítók) a "Partnerek" modulban kezelhetők.</div>' : ''}
                <div style="margin-bottom:12px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    ${extraPayload.isReadonly ? '' : `
                        <button class="primary-btn" id="btn-add">Új hozzáadása</button>
                        <button class="secondary-btn" id="btn-refresh">Frissítés</button>
                    `}
                    <div style="margin-left:auto; display:flex; align-items:center; gap:6px;">
                        <label style="font-size:12px; font-weight:600; color:var(--text-muted);">Keresés:</label>
                        <input type="text" id="admin-search" placeholder="Cikkszám, név..." class="access-control-input" style="width:220px; padding:4px 8px; font-size:12px; height:30px;">
                    </div>
                </div>
                <div style="flex:1; overflow:auto; border:1px solid var(--border-color);">
                    <table class="access-subform-table admin-compact-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                ${columns.map(c => `<th>${c.label}</th>`).join('')}
                                ${(extraPayload.isReadonly && !extraPayload.allowReassign) ? '' : '<th style="width:100px;">Műveletek</th>'}
                            </tr>
                        </thead>
                        <tbody id="admin-tbody">
                            <tr><td colspan="${columns.length + 2}" style="text-align:center;">Betöltés...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Dialog for Edit/Add -->
            <dialog id="admin-dialog" style="padding:20px; border-radius:8px; border:1px solid #ccc; max-width:400px; width:100%;">
                <h3 id="dialog-title" style="margin-top:0;">Hozzáadás</h3>
                <form id="admin-form">
                    <input type="hidden" id="edit-id" value="">
                    ${columns.map(c => `
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">${c.label}</label>
                            <input type="text" id="inp-${c.field}" class="access-control-input" style="width:100%;">
                        </div>
                    `).join('')}
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
                        <button type="button" class="secondary-btn" id="btn-cancel">Mégse</button>
                        <button type="submit" class="primary-btn">Mentés</button>
                    </div>
                </form>
            </dialog>
        `;

        const tbody = winContainer.querySelector('#admin-tbody');
        const dialog = winContainer.querySelector('#admin-dialog');
        const form = winContainer.querySelector('#admin-form');
        const searchInput = winContainer.querySelector('#admin-search');

        if (searchInput) {
            searchInput.addEventListener('input', () => renderTable());
        }

        async function loadData() {
            tbody.innerHTML = `<tr><td colspan="${columns.length + 2}" style="text-align:center;">Betöltés...</td></tr>`;
            try {
                let url = extraPayload.customUrl || `/api/v1/admin/${tableName}`;
                if (extraPayload.type && !extraPayload.customUrl) {
                    url += `?type=${extraPayload.type}`;
                }
                const res = await fetch(url);
                items = await res.json();
                
                // ABC sorrendbe rendezés: ha extraPayload.sortBy meg van adva, az alapján, egyébként az első oszlop mezője alapján
                if (items && items.length > 0) {
                    const sortField = extraPayload.sortBy || (columns[0] ? columns[0].field : 'id');
                    items.sort((a, b) => {
                        const valA = String(a[sortField] || '').trim();
                        const valB = String(b[sortField] || '').trim();
                        return valA.localeCompare(valB, 'hu', { sensitivity: 'base' });
                    });
                }

                renderTable();
            } catch (e) {
                console.error(e);
                tbody.innerHTML = `<tr><td colspan="${columns.length + 2}" style="color:red; text-align:center;">Hiba a betöltéskor</td></tr>`;
            }
        }

        function renderTable() {
            const query = (searchInput?.value || '').toLowerCase().trim();
            const filtered = query ? items.filter(item => {
                return columns.some(c => String(item[c.field] || '').toLowerCase().startsWith(query)) ||
                       String(item.id || '').toLowerCase().startsWith(query);
            }) : items;

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${columns.length + 2}" style="text-align:center;">Nincs megjeleníthető adat.</td></tr>`;
                return;
            }
            tbody.innerHTML = filtered.map(item => `
                <tr>
                    <td>${item.id}</td>
                    ${columns.map(c => `<td>${item[c.field] || ''}</td>`).join('')}
                    ${(extraPayload.isReadonly && !extraPayload.allowReassign) ? '' : `
                    <td>
                        ${(extraPayload.allowReassign && item.identifier_id) ? `
                            <div class="arch-reassign-container">
                                <button class="arch-btn btn-reassign" data-id="${item.identifier_id}" data-inactive="false" title="Áthelyezés másik partnerhez">🔄 Áthelyez</button>
                                <div class="arch-reassign-dropdown" id="dropdown-${item.identifier_id}">
                                    <input type="text" class="arch-reassign-input" placeholder="Keresés 1 karaktertől...">
                                    <ul class="arch-reassign-list"></ul>
                                </div>
                            </div>
                        ` : ''}
                        ${!extraPayload.isReadonly ? `
                        <button class="icon-btn edit-btn" data-id="${item.id}">✏️</button>
                        ${extraPayload.disableDelete ? '' : `<button class="icon-btn delete-btn" data-id="${item.id}">🗑️</button>`}
                        ` : ''}
                    </td>`}
                </tr>
            `).join('');

            if (!extraPayload.isReadonly) {
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
                        const drop = tbody.querySelector(`#dropdown-${btn.dataset.id}`);
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
                const res = await fetch(`/api/v1/partners/active/search?q=${encodeURIComponent(query)}&include_inactive=${isInactive}`);
                const items = await res.json();
                if (!items.length) {
                    ul.innerHTML = '<li>Nincs találat</li>';
                    return;
                }
                ul.innerHTML = items.map(i => `<li data-pid="${i.id}">${i.name} ${i.is_inactive ? '(Inaktív)' : ''}</li>`).join('');
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
                const checkRes = await fetch(`/api/v1/partners/identifiers/${idenId}/reassign?dry_run=true`, {
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
                
                const res = await fetch(`/api/v1/partners/identifiers/${idenId}/reassign`, {
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
        }

        function openDialog(item = null) {
            winContainer.querySelector('#dialog-title').textContent = item ? 'Szerkesztés' : 'Új hozzáadása';
            winContainer.querySelector('#edit-id').value = item ? item.id : '';
            columns.forEach(c => {
                winContainer.querySelector(`#inp-${c.field}`).value = item ? (item[c.field] || '') : '';
            });
            dialog.showModal();
        }

        async function deleteItem(id) {
            if (!confirm('Biztosan törlöd?')) return;
            try {
                await fetch(`/api/v1/admin/${tableName}/${id}`, { method: 'DELETE' });
                loadData();
            } catch (e) {
                alert('Hiba törléskor!');
            }
        }

        if (!extraPayload.isReadonly) {
            winContainer.querySelector('#btn-add').addEventListener('click', () => openDialog(null));
            winContainer.querySelector('#btn-refresh').addEventListener('click', loadData);
        }
        winContainer.querySelector('#btn-cancel').addEventListener('click', () => dialog.close());

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = winContainer.querySelector('#edit-id').value;
            const payload = { ...extraPayload };
            columns.forEach(c => {
                payload[c.field] = winContainer.querySelector(`#inp-${c.field}`).value;
            });
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/v1/admin/${tableName}/${id}` : `/api/v1/admin/${tableName}`;
                await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                dialog.close();
                loadData();
            } catch (err) {
                console.error(err);
                alert('Hiba mentéskor!');
            }
        });

        loadData();
    };

    if (targetContainer) {
        buildContent(targetContainer);
    } else if (wm) {
        wm.open(`admin-table-${title}`, `${title} karbantartása`, buildContent);
    }
}


export function openArchivedPartnersTable(wm) {
    wm.open('admin-archived-partners', 'Archív partnerek és azonosítók', (winContainer) => {
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
                const renameBtn = `<button class="arch-btn btn-edit-partner-name" data-id="${p.id}" data-name="${p.name || ''}">✏️ Átnevezés</button>`;
                const pBadge = isPActive ? '<span style="color:#2563eb; font-size:10px;">(Aktív partner, de van inaktív azonosítója)</span>' : '';
                const pBtn = isPActive ? '' : `<button class="arch-btn activate btn-activate-partner" data-id="${p.id}">Partner aktiválása</button>`;
                
                html += `
                    <tr class="arch-row-partner">
                        <td>🏢 Partner</td>
                        <td>${p.name || ''} ${pBadge}</td>
                        <td>-</td>
                        <td>${pBtn} ${renameBtn}</td>
                    </tr>
                `;

                if (p.identifiers && p.identifiers.length) {
                    p.identifiers.forEach(iden => {
                        html += `
                            <tr>
                                <td class="arch-row-iden">↳ Azonosító</td>
                                <td>${iden.value}</td>
                                <td>${iden.id_type}</td>
                                <td style="display: flex; gap: 8px;">
                                    <button class="arch-btn activate btn-activate-iden" data-id="${iden.id}">Aktiválás</button>
                                    <div class="arch-reassign-container">
                                        <button class="arch-btn btn-reassign" data-id="${iden.id}" data-inactive="${iden.is_inactive}" title="Áthelyezés másik partnerhez">🔄 Áthelyez</button>
                                        <div class="arch-reassign-dropdown" id="dropdown-${iden.id}">
                                            <input type="text" class="arch-reassign-input" placeholder="Keresés 1 karaktertől...">
                                            <ul class="arch-reassign-list"></ul>
                                        </div>
                                    </div>
                                    <button class="arch-btn btn-delete-iden" data-id="${iden.id}" style="background: #ef4444;" title="Végleges törlés">🗑️ Törlés</button>
                                </td>
                            </tr>
                        `;
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
            tbody.querySelectorAll('.btn-delete-iden').forEach(btn => {
                btn.addEventListener('click', () => deleteIdentifier(btn.dataset.id));
            });
            
            tbody.querySelectorAll('.btn-reassign').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
                    const drop = tbody.querySelector(`#dropdown-${btn.dataset.id}`);
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
                const res = await fetch(`/api/v1/partners/${id}`, {
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
                const res = await fetch(`/api/v1/partners/${id}/status`, {
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
                const res = await fetch(`/api/v1/partners/identifiers/${id}/activate`, { method: 'PUT' });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                alert('Azonosító sikeresen aktiválva!');
                loadData();
            } catch (e) {
                alert(e.message);
            }
        }

        async function deleteIdentifier(id) {
            if (!confirm('Biztosan véglegesen törlöd ezt az inaktív azonosítót? Ez a művelet nem vonható vissza!')) return;
            try {
                const res = await fetch(`/api/v1/partners/identifiers/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
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
                const res = await fetch(`/api/v1/partners/active/search?q=${encodeURIComponent(query)}&include_inactive=${isInactive}`);
                const items = await res.json();
                if (!items.length) {
                    ul.innerHTML = '<li>Nincs találat</li>';
                    return;
                }
                ul.innerHTML = items.map(i => `<li data-pid="${i.id}">${i.name} ${i.is_inactive ? '(Inaktív)' : ''}</li>`).join('');
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
                const checkRes = await fetch(`/api/v1/partners/identifiers/${idenId}/reassign?dry_run=true`, {
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
                
                const res = await fetch(`/api/v1/partners/identifiers/${idenId}/reassign`, {
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
