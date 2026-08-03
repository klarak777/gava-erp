const fs = require('fs');

let c = fs.readFileSync('Access UI/src/modules/admin.js', 'utf8');

// 1. Fix header cell in openAdminTable
c = c.replace(
    "${extraPayload.isReadonly ? '' : '<th style=\"width:100px;\">Műveletek</th>'}",
    "${(extraPayload.isReadonly && !extraPayload.allowReassign) ? '' : '<th style=\"width:100px;\">Műveletek</th>'}"
);

// 2. Fix body row cell in openAdminTable
const oldRowTd = `                    \${extraPayload.isReadonly ? '' : \`
                    <td>
                        <button class="icon-btn edit-btn" data-id="\${item.id}">✏️</button>
                        <button class="icon-btn delete-btn" data-id="\${item.id}">🗑️</button>
                    </td>\``;

const newRowTd = `                    \${(extraPayload.isReadonly && !extraPayload.allowReassign) ? '' : \`
                    <td>
                        \${(extraPayload.allowReassign && item.identifier_id) ? \`
                            <div style="position:relative; display:inline-block;">
                                <button class="arch-btn btn-reassign" data-id="\${item.identifier_id}" data-inactive="false" title="Áthelyezés másik partnerhez">🔄 Áthelyezés</button>
                                <div class="arch-reassign-dropdown" id="dropdown-\${item.identifier_id}">
                                    <input type="text" class="arch-reassign-input" placeholder="Keresés 1 karaktertől...">
                                    <ul class="arch-reassign-list"></ul>
                                </div>
                            </div>
                        \` : ''}
                        \${!extraPayload.isReadonly ? \`
                        <button class="icon-btn edit-btn" data-id="\${item.id}">✏️</button>
                        \${extraPayload.disableDelete ? '' : \`<button class="icon-btn delete-btn" data-id="\${item.id}">🗑️</button>\`}
                        \` : ''}
                    td>\``;

c = c.replace(oldRowTd, newRowTd);

// 3. Add reassign event handlers in openAdminTable
const oldEvents = `            if (!extraPayload.isReadonly) {
                tbody.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => openDialog(items.find(i => i.id == btn.dataset.id)));
                });
                tbody.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteItem(btn.dataset.id));
                });
            }
        }`;

const newEvents = `            if (!extraPayload.isReadonly) {
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

c = c.replace(oldEvents, newEvents);

// 4. Fix openArchivedPartnersTable window creation!
const oldArchStart = `export function openArchivedPartnersTable(wm) {
    const winContainer = wm.createWindow({
        title: 'Archív partnerek',
        width: 800,
        height: 600,
        isModal: false,
        icon: '🗄️'
    });

    winContainer.innerHTML = \``;

const newArchStart = `export function openArchivedPartnersTable(wm) {
    wm.open('admin-archived-partners', 'Archív partnerek és azonosítók', (winContainer) => {
        winContainer.innerHTML = \``;

c = c.replace(oldArchStart, newArchStart);

// Close the callback at the bottom of openArchivedPartnersTable
const oldArchEnd = `winContainer.querySelector('#arch-refresh').addEventListener('click', loadData);
    loadData();
}`;

const newArchEnd = `winContainer.querySelector('#arch-refresh').addEventListener('click', loadData);
    loadData();
    });
}`;

c = c.replace(oldArchEnd, newArchEnd);

fs.writeFileSync('Access UI/src/modules/admin.js', c, 'utf8');
console.log('Done patching admin.js perfectly!');
