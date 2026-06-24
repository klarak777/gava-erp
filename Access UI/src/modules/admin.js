import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderAdmin(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.id === 'admin_module');
    const items = group ? group.items : [];

    const actionMap = {
        'admin-products': () => openAdminTable(wm, 'Products', 'products', [
            { field: 'name', label: 'Products (English)' },
            { field: 'name_hu', label: 'Products:Magyar (Hungarian)' }
        ]),
        'admin-references': () => openAdminTable(wm, 'Reference', 'partners', [
            { field: 'name', label: 'Name' },
            { field: 'address', label: 'Address' },
            { field: 'contact', label: 'Contact' }
        ], { type: 'szállító' }),
        'admin-customers': () => openAdminTable(wm, 'Customer', 'partners', [
            { field: 'name', label: 'Name' },
            { field: 'address', label: 'Address' },
            { field: 'contact', label: 'Contact' }
        ], { type: 'vevő' }),
        'admin-transporters': () => openAdminTable(wm, 'Fuvarozó cég', 'transporters', [
            { field: 'name', label: 'Name' },
            { field: 'code', label: 'Code' }
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

function openAdminTable(wm, title, tableName, columns, extraPayload = {}) {
    wm.open(`admin-table-${title}`, `${title} karbantartása`, (winContainer) => {
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
            </style>
            <div style="padding:16px; display:flex; flex-direction:column; height:100%;">
                <div style="margin-bottom:12px; display:flex; gap:8px;">
                    <button class="primary-btn" id="btn-add">Új hozzáadása</button>
                    <button class="secondary-btn" id="btn-refresh">Frissítés</button>
                </div>
                <div style="flex:1; overflow:auto; border:1px solid var(--border-color);">
                    <table class="access-subform-table admin-compact-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                ${columns.map(c => `<th>${c.label}</th>`).join('')}
                                <th style="width:100px;">Műveletek</th>
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

        async function loadData() {
            tbody.innerHTML = `<tr><td colspan="${columns.length + 2}" style="text-align:center;">Betöltés...</td></tr>`;
            try {
                let url = `/api/v1/admin/${tableName}`;
                if (extraPayload.type) {
                    url += `?type=${extraPayload.type}`;
                }
                const res = await fetch(url);
                items = await res.json();
                
                // ABC sorrendbe rendezés az első oszlop mezője alapján
                if (items && items.length > 0 && columns[0]) {
                    const sortField = columns[0].field;
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
            if (items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${columns.length + 2}" style="text-align:center;">Nincs megjeleníthető adat.</td></tr>`;
                return;
            }
            tbody.innerHTML = items.map(item => `
                <tr>
                    <td>${item.id}</td>
                    ${columns.map(c => `<td>${item[c.field] || ''}</td>`).join('')}
                    <td>
                        <button class="icon-btn edit-btn" data-id="${item.id}">✏️</button>
                        <button class="icon-btn delete-btn" data-id="${item.id}">🗑️</button>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => openDialog(items.find(i => i.id == btn.dataset.id)));
            });
            tbody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteItem(btn.dataset.id));
            });
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

        winContainer.querySelector('#btn-add').addEventListener('click', () => openDialog(null));
        winContainer.querySelector('#btn-refresh').addEventListener('click', loadData);
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
    });
}
