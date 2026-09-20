import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';
import { openLokaciokWindow } from './lokaciok.js';

export function renderAdmin(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.id === 'admin_module');
    const items = group ? group.items : [];

    const actionMap = {
        'admin-locations': () => openLokaciokWindow(wm),
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
        ]),
        'admin-ref-packaging': () => openAdminTable(wm, 'Göngyöleg Típusok', 'ref_packaging_types', [
            { field: 'category', label: 'Fajta' },
            { field: 'name', label: 'Név' },
            { field: 'tare_weight_kg', label: 'Tára súly (kg)', type: 'number' },
            { field: 'width_cm', label: 'Szélesség (cm)', type: 'number' },
            { field: 'length_cm', label: 'Hossz (cm)', type: 'number' },
            { field: 'height_cm', label: 'Magasság (cm)', type: 'number' },
            { field: 'is_deposit_required', label: 'Betét díjas', type: 'boolean' },
            { field: 'is_inventory_tracked', label: 'Göngyöleg leltárban szerepel', type: 'boolean' }
        ]),
        'admin-ref-origin': () => openAdminTable(wm, 'Származási Országok', 'ref_origin_countries', [
            { field: 'name', label: 'Név' }
        ]),
        'admin-ref-pallet': () => openAdminTable(wm, 'Raklap Típusok', 'ref_pallet_types', [
            { field: 'name', label: 'Név' }
        ]),
        'admin-printers': () => openAdminTable(wm, 'Nyomtatók', 'printers', [
            { field: 'name', label: 'Név' },
            { field: 'ip_address', label: 'IP cím' },
            { field: 'port', label: 'Port', type: 'number' },
            { field: 'barcode', label: 'Vonalkód (PDA beolvasáshoz)' },
            { field: 'is_active', label: 'Aktív', type: 'boolean' }
        ]),
        'admin-pallet-labels': () => openPalletLabelsTable(wm)
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
                    ${columns.map(c => {
                        if (c.type === 'boolean') {
                            return `
                                <div style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                    <input type="checkbox" id="inp-${c.field}" style="width:16px; height:16px; cursor:pointer;">
                                    <label for="inp-${c.field}" style="font-size:12px; font-weight:600; cursor:pointer; margin:0;">${c.label}</label>
                                </div>
                            `;
                        } else {
                            return `
                                <div style="margin-bottom:12px;">
                                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">${c.label}</label>
                                    <input type="${c.type === 'number' ? 'number' : 'text'}" ${c.type === 'number' ? 'step="any"' : ''} id="inp-${c.field}" class="access-control-input" style="width:100%;">
                                </div>
                            `;
                        }
                    }).join('')}
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
                const data = await res.json();
                items = Array.isArray(data) ? data : [];
                
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
                return columns.some(c => String(item[c.field] || '').toLowerCase().includes(query)) ||
                       String(item.id || '').toLowerCase().includes(query);
            }) : items;

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${columns.length + 2}" style="text-align:center;">Nincs megjeleníthető adat.</td></tr>`;
                return;
            }
            tbody.innerHTML = filtered.map(item => `
                <tr>
                    <td>${item.id}</td>
                    ${columns.map(c => {
                        if (c.type === 'boolean') {
                            return `<td style="text-align:center;">${item[c.field] ? '✅' : '❌'}</td>`;
                        }
                        return `<td>${item[c.field] !== null && item[c.field] !== undefined ? item[c.field] : ''}</td>`;
                    }).join('')}
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
                if (c.type === 'boolean') {
                    winContainer.querySelector(`#inp-${c.field}`).checked = item ? !!item[c.field] : false;
                } else {
                    winContainer.querySelector(`#inp-${c.field}`).value = item ? (item[c.field] || '') : '';
                }
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
        }
        winContainer.querySelector('#btn-cancel').addEventListener('click', () => dialog.close());

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = winContainer.querySelector('#edit-id').value;
            const payload = { ...extraPayload };
            columns.forEach(c => {
                if (c.type === 'boolean') {
                    payload[c.field] = winContainer.querySelector(`#inp-${c.field}`).checked;
                } else {
                    const val = winContainer.querySelector(`#inp-${c.field}`).value;
                    payload[c.field] = (c.type === 'number' && val !== '') ? parseFloat(val) : val;
                }
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
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <h2 style="margin:0; font-size:16px;">Archív partnerek és azonosítók</h2>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:600; color:var(--text-muted);">Keresés:</label>
                            <input type="text" id="arch-search" placeholder="Keresés névre, azonosítóra..." class="access-control-input" style="width:220px; padding:4px 8px; font-size:12px; height:30px;">
                        </div>
                        <button id="arch-refresh" class="secondary-btn">Frissítés</button>
                    </div>
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
        const searchInput = winContainer.querySelector('#arch-search');
        let archivedData = [];

        if (searchInput) {
            searchInput.addEventListener('input', () => renderData());
        }

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
            const query = (searchInput?.value || '').toLowerCase().trim();

            let displayList = archivedData;
            if (query) {
                displayList = archivedData.filter(p => {
                    const pName = (p.name || '').toLowerCase();
                    const pInvName = (p.invoice_name || '').toLowerCase();
                    const pMatches = pName.includes(query) || pInvName.includes(query);
                    const idenMatches = (p.identifiers || []).some(iden =>
                        (iden.value || '').toLowerCase().includes(query) ||
                        (iden.id_type || '').toLowerCase().includes(query)
                    );
                    return pMatches || idenMatches;
                });
            }

            if (!displayList.length) {
                tbody.innerHTML = query
                    ? '<tr><td colspan="4" style="text-align:center;">Nincs a keresésnek megfelelő adat.</td></tr>'
                    : '<tr><td colspan="4" style="text-align:center;">Nincsenek archivált adatok.</td></tr>';
                return;
            }

            let html = '';
            displayList.forEach(p => {
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
                                <td>
                                    <button class="arch-btn activate btn-activate-iden" data-id="${iden.id}">Aktiválás</button>
                                    <div class="arch-reassign-container">
                                        <button class="arch-btn btn-reassign" data-id="${iden.id}" data-inactive="${iden.is_inactive}" title="Áthelyezés másik partnerhez">🔄 Áthelyez</button>
                                        <div class="arch-reassign-dropdown" id="dropdown-${iden.id}">
                                            <input type="text" class="arch-reassign-input" placeholder="Keresés 1 karaktertől...">
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

export function openPalletLabelsTable(wm) {
    wm.open('admin-pallet-labels', 'Raklapcímkék (SSCC)', (winContainer) => {
        let labels = [];

        winContainer.innerHTML = `
            <style>
                .pl-container { padding: 16px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
                .pl-table-wrap { flex: 1; overflow: auto; border: 1px solid var(--border-color, #cbd5e1); margin-top: 10px; background: white; border-radius: 4px; }
                .pl-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
                .pl-table th, .pl-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                .pl-table th { background: #f8fafc; font-weight: 700; color: #475569; position: sticky; top: 0; z-index: 1; border-bottom: 2px solid #cbd5e1; }
                .pl-table tr:hover { background: #f1f5f9; }
                .pl-sscc-badge { font-family: monospace; font-weight: 800; font-size: 12px; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; display: inline-block; }
                .pl-btn { padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #cbd5e1; border-radius: 4px; background: white; display: inline-flex; align-items: center; gap: 4px; }
                .pl-btn:hover { background: #f8fafc; border-color: #94a3b8; }
                .pl-btn-print { border-color: #0284c7; color: #0284c7; background: #f0f9ff; }
                .pl-btn-print:hover { background: #e0f2fe; }

                /* Modal styling */
                .pl-modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(15, 23, 42, 0.6); z-index: 9999;
                    display: none; align-items: center; justify-content: center;
                }
                .pl-modal-box {
                    background: white; border-radius: 8px; max-width: 480px; width: 90%;
                    padding: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
                    display: flex; flex-direction: column; gap: 14px; max-height: 90vh; overflow-y: auto;
                }
            </style>
            <div class="pl-container">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <h2 style="margin:0; font-size:16px; font-weight:700; color:#0f172a;">🏷️ Raklapcímkék</h2>
                        <span id="pl-count" style="background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:12px; font-size:11.5px; font-weight:700;">0 db</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:600; color:var(--text-muted);">Keresés:</label>
                            <input type="text" id="pl-search" placeholder="SSCC, kamion, termék, partner..." class="access-control-input" style="width:240px; padding:4px 8px; font-size:12px; height:30px;">
                        </div>
                        <button id="pl-refresh" class="secondary-btn" style="height:30px; display:inline-flex; align-items:center; gap:4px;">🔄 Frissítés</button>
                    </div>
                </div>
                <div class="pl-table-wrap">
                    <table class="pl-table">
                        <thead>
                            <tr>
                                <th>Létrehozva</th>
                                <th>SSCC vonalkód</th>
                                <th>Kamionszám</th>
                                <th>Termék</th>
                                <th style="text-align:center;">Karton</th>
                                <th>Beszállitó</th>
                                <th>Ügyfél</th>
                                <th>Származás</th>
                                <th>Raklap típus</th>
                                <th>Lokáció</th>
                                <th style="text-align:center; width:130px;">Művelet</th>
                            </tr>
                        </thead>
                        <tbody id="pl-tbody">
                            <tr><td colspan="11" style="text-align:center; padding:20px; color:#64748b;">Betöltés...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Preview Modal -->
            <div id="pl-modal" class="pl-modal-overlay">
                <div class="pl-modal-box">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:16px;">Raklapcímke megtekintése</h3>
                        <button id="pl-modal-close" style="background:none; border:none; font-size:18px; cursor:pointer; color:#64748b;">✕</button>
                    </div>
                    <div id="pl-modal-label-content" style="border: 2px solid #000; padding: 14px; background: #fff; font-family: Arial, sans-serif;">
                        <!-- Dinamikus tartalom -->
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px;">
                        <button id="pl-modal-print-btn" class="primary-btn" style="display:flex; align-items:center; gap:6px;">
                            📄 Nyomtatás / PDF mentés
                        </button>
                    </div>
                </div>
            </div>
        `;

        const tbody = winContainer.querySelector('#pl-tbody');
        const countBadge = winContainer.querySelector('#pl-count');
        const searchInput = winContainer.querySelector('#pl-search');
        const refreshBtn = winContainer.querySelector('#pl-refresh');
        const modal = winContainer.querySelector('#pl-modal');
        const modalClose = winContainer.querySelector('#pl-modal-close');
        const modalContent = winContainer.querySelector('#pl-modal-label-content');
        const modalPrintBtn = winContainer.querySelector('#pl-modal-print-btn');

        let selectedLabel = null;

        async function loadData() {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:20px; color:#64748b;">Betöltés...</td></tr>`;
            try {
                const res = await fetch('/api/v1/admin/pallet-labels');
                const data = await res.json();
                labels = Array.isArray(data) ? data : [];
                countBadge.textContent = `${labels.length} db`;
                renderTable();
            } catch (err) {
                console.error(err);
                tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:20px; color:#ef4444;">Hiba a betöltéskor</td></tr>`;
            }
        }

        function formatDate(dStr) {
            if (!dStr) return '-';
            try {
                const d = new Date(dStr);
                if (isNaN(d.getTime())) return dStr;
                return d.toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            } catch {
                return dStr;
            }
        }

        function renderTable() {
            const query = (searchInput?.value || '').toLowerCase().trim();
            const filtered = query ? labels.filter(l => {
                return String(l.sscc || '').toLowerCase().includes(query) ||
                       String(l.truck_number || '').toLowerCase().includes(query) ||
                       String(l.product_name || '').toLowerCase().includes(query) ||
                       String(l.supplier || '').toLowerCase().includes(query) ||
                       String(l.destination || '').toLowerCase().includes(query) ||
                       String(l.origin_country || '').toLowerCase().includes(query) ||
                       String(l.id || '').includes(query);
            }) : labels;

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:24px; color:#94a3b8;">Nincs találat.</td></tr>`;
                return;
            }

            tbody.innerHTML = filtered.map(l => {
                // Raklap típus meghatározása: címke JSON > komissió JSON > régi mező.
                let palletCellHtml = '-';
                const palletsJson = l.pallets_json || l.commission_pallets_json;
                if (palletsJson) {
                    try {
                        const pallets = JSON.parse(palletsJson);
                        if (Array.isArray(pallets) && pallets.length > 0) {
                            palletCellHtml = pallets.map(p => {
                                const name = String(p.name || '-');
                                const category = String(p.category || 'Raklap');
                                const displayName = /raklap/i.test(name) ? name : `${name} ${category}`;
                                const safeName = displayName.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
                                return `<div style="white-space:nowrap; font-size:11px; font-weight:600; color:#0f172a;">${safeName} <span style="color:#64748b; font-weight:400;">(${Number(p.tare_weight_kg).toFixed(3)} kg)</span></div>`;
                            }).join('');
                        }
                    } catch (e) {
                        palletCellHtml = l.pallet_type || '-';
                    }
                } else if (l.legacy_pallet_name) {
                    const name = String(l.legacy_pallet_name);
                    const category = String(l.legacy_pallet_category || 'Raklap');
                    const displayName = /raklap/i.test(name) ? name : `${name} ${category}`;
                    const safeName = displayName.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
                    const tare = Number(l.legacy_pallet_tare_weight_kg);
                    palletCellHtml = `<div style="font-size:11px; font-weight:600; color:#0f172a;">${safeName} <span style="color:#64748b; font-weight:400;">(${Number.isFinite(tare) ? tare.toFixed(3) : '-'} kg)</span></div>`;
                }

                return `
                <tr>
                    <td style="white-space:nowrap; color:#475569;">${formatDate(l.created_at)}</td>
                    <td><span class="pl-sscc-badge">${l.sscc || '-'}</span></td>
                    <td style="font-weight:700; color:#0f172a;">${l.truck_number || '-'}</td>
                    <td style="font-weight:600;">${l.product_name || '-'}</td>
                    <td style="text-align:center; font-weight:800; color:#0284c7;">${l.picked_cartons != null ? l.picked_cartons : '-'}</td>
                    <td>${l.supplier || '-'}</td>
                    <td><strong>${l.destination || '-'}</strong></td>
                    <td>${l.origin_country || '-'}</td>
                    <td>${palletCellHtml}</td>
                    <td style="font-weight:700; color:#10b981;">${l.location_name || '-'}</td>
                    <td style="text-align:center;">
                        <button class="pl-btn pl-btn-print btn-view-label" data-id="${l.id}" title="Címke megtekintése és nyomtatása">
                            👁️ Megtekintés
                        </button>
                    </td>
                </tr>
            `;
            }).join('');

            tbody.querySelectorAll('.btn-view-label').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = Number(btn.dataset.id);
                    const found = labels.find(item => item.id === id);
                    if (found) showLabelModal(found);
                });
            });
        }

        function showLabelModal(label) {
            selectedLabel = label;
            modalContent.innerHTML = `
                <div style="font-size: 26px; font-weight: 900; line-height: 1.1; color:#000; text-align: center;">${label.truck_number || '-'}</div>
                <div style="font-size: 11px; font-weight: bold; color: #555; text-transform: uppercase; text-align: center; margin-bottom: 6px;">Kamionszám</div>
                <div style="border-top: 2px solid #000; margin: 8px 0;"></div>
                
                <div style="font-size: 20px; font-weight: 800; line-height: 1.2; color:#000; text-align: center;">${label.product_name || '-'}</div>
                <div style="font-size: 11px; font-weight: bold; color: #555; text-transform: uppercase; text-align: center; margin-bottom: 6px;">Termék megnevezése</div>
                <div style="border-top: 2px solid #000; margin: 8px 0;"></div>
                
                <div style="display:flex; flex-direction:column; gap:4px; font-size:13.5px; color:#111; font-weight:600;">
                    <div>Érkezés dátuma: <strong style="font-weight:800;">${label.delivery_date || '-'}</strong></div>
                    <div>Karton szám: <strong style="font-weight:800;">${label.picked_cartons != null ? label.picked_cartons : '-'}</strong></div>
                    <div>Beszállító: <strong style="font-weight:800;">${label.supplier || '-'}</strong></div>
                    <div>Ügyfél: <strong style="font-weight:800;">${label.destination || '-'}</strong></div>
                    <div>Származási ország: <strong style="font-weight:800;">${label.origin_country || '-'}</strong></div>
                </div>
                <div style="margin-top: 24px; border-top: 2px solid #000; margin-bottom: 8px;"></div>

                <div style="text-align: center; margin-top: 6px;">
                    <svg id="pl-modal-barcode-svg" style="max-width: 100%; height: auto; display:block; margin:0 auto;"></svg>
                    <div style="font-size: 12px; font-weight: 900; margin-top: 2px;">SSCC</div>
                </div>
            `;

            if (window.JsBarcode && label.sscc) {
                try {
                    window.JsBarcode(modalContent.querySelector('#pl-modal-barcode-svg'), label.sscc, {
                        format: "CODE128",
                        displayValue: true,
                        fontSize: 14,
                        height: 55,
                        margin: 2
                    });
                } catch (e) {
                    console.warn(e);
                }
            }

            modal.style.display = 'flex';
        }

        modalClose.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        modalPrintBtn.addEventListener('click', () => {
            if (!selectedLabel) return;
            printLabelDirect(selectedLabel);
        });

        function printLabelDirect(label) {
            const printWindow = window.open('', '_blank', 'width=650,height=800');
            if (!printWindow) {
                alert('A felugró ablak letiltásra került. Engedélyezd a felugró ablakokat a nyomtatáshoz!');
                return;
            }
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Raklap címke - ${label.sscc || ''}</title>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                    <style>
                        @page { size: 100mm 210mm; margin: 0; }
                        * { box-sizing: border-box; }
                        body { margin: 0; padding: 14px; font-family: Arial, sans-serif; background: #fff; color: #000; display: flex; justify-content: center; }
                        .pallet-label { width: 100%; max-width: 380px; border: 3px solid #000; padding: 16px 12px; background: #fff; display: flex; flex-direction: column; min-height: 720px; }
                        .label-truck { font-size: 34px; font-weight: 900; line-height: 1.1; text-align: center; }
                        .label-sub { font-size: 13px; font-weight: bold; color: #333; margin-bottom: 6px; text-transform: uppercase; text-align: center; }
                        .label-divider { border-top: 3px solid #000; margin: 10px 0; }
                        .label-product { font-size: 26px; font-weight: 800; line-height: 1.15; text-align: center; }
                        .label-data-row { font-size: 16px; font-weight: 600; line-height: 1.5; display: flex; gap: 6px; }
                        .label-data-row span.val { font-weight: 800; }
                        .label-spacer { flex: 1; min-height: 60px; }
                        .barcode-container { text-align: center; margin-top: 10px; }
                        .barcode-type { font-size: 14px; font-weight: 900; text-align: center; margin-top: 2px; }
                        @media print { body { padding: 0; } .pallet-label { border: none; width: 100%; max-width: none; min-height: 100vh; } }
                    </style>
                </head>
                <body>
                    <div class="pallet-label">
                        <div class="label-truck">${label.truck_number || '-'}</div>
                        <div class="label-sub">Kamionszám</div>
                        <div class="label-divider"></div>
                        <div class="label-product">${label.product_name || '-'}</div>
                        <div class="label-sub">Termék megnevezése</div>
                        <div class="label-divider"></div>
                        <div class="label-data-row">Érkezés dátuma: <span class="val">${label.delivery_date || '-'}</span></div>
                        <div class="label-data-row">Karton szám: <span class="val">${label.picked_cartons != null ? label.picked_cartons : ''}</span></div>
                        <div class="label-data-row">Beszállító: <span class="val">${label.supplier || '-'}</span></div>
                        <div class="label-data-row">Ügyfél: <span class="val">${label.destination || '-'}</span></div>
                        <div class="label-data-row">Származási ország: <span class="val">${label.origin_country || '-'}</span></div>
                        <div class="label-spacer"></div>
                        <div class="label-divider"></div>
                        <div class="barcode-container">
                            <svg id="print-barcode"></svg>
                            <div class="barcode-type">SSCC</div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            if (typeof JsBarcode !== 'undefined') {
                                JsBarcode("#print-barcode", "${label.sscc || ''}", {
                                    format: "CODE128",
                                    displayValue: true,
                                    fontSize: 16,
                                    height: 70,
                                    margin: 4
                                });
                            }
                            setTimeout(() => { window.print(); }, 300);
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        searchInput.addEventListener('input', () => renderTable());
        refreshBtn.addEventListener('click', loadData);
        loadData();
    });
}
