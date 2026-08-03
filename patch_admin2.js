const fs = require('fs');

let adminContent = fs.readFileSync('Access UI/src/modules/admin.js', 'utf8');
const archiveContent = fs.readFileSync('archive_extracted.js', 'utf8');

// 1. Add admin-archived-partners to actionMap
adminContent = adminContent.replace(
    "'admin-references': () => openAdminTable(wm, 'Reference', 'partners', [",
    "'admin-archived-partners': () => openArchivedPartnersTable(wm),\n        'admin-references': () => openAdminTable(wm, 'Reference', 'partners', ["
);

// 2. Add allowReassign to admin roles
adminContent = adminContent.replace(
    /isReadonly: true, customUrl: '\/api\/v1\/partners-by-role\?role=reference'/g,
    "isReadonly: true, allowReassign: true, customUrl: '/api/v1/partners-by-role?role=reference'"
);
adminContent = adminContent.replace(
    /isReadonly: true, customUrl: '\/api\/v1\/partners-by-role\?role=customer'/g,
    "isReadonly: true, allowReassign: true, customUrl: '/api/v1/partners-by-role?role=customer'"
);
adminContent = adminContent.replace(
    /isReadonly: true, customUrl: '\/api\/v1\/partners-by-role\?role=transporter'/g,
    "isReadonly: true, allowReassign: true, customUrl: '/api/v1/partners-by-role?role=transporter'"
);

// 3. Update openAdminTable HTML for allowReassign
const oldTableBody = `                    \${extraPayload.isReadonly ? '' : \`
                    <td>
                        <button class="icon-btn edit-btn" data-id="\${item.id}">✏️</button>
                        <button class="icon-btn delete-btn" data-id="\${item.id}">🗑️</button>
                    </td>\`}
                </tr>`;

const newTableBody = `                    \${(extraPayload.isReadonly && !extraPayload.allowReassign) ? '' : \`
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
                    </td>\`}
                </tr>`;

adminContent = adminContent.replace(oldTableBody, newTableBody);
adminContent = adminContent.replace(
    "${extraPayload.isReadonly ? '' : '<th style=\"width:100px;\">Műveletek</th>'}",
    "${(extraPayload.isReadonly && !extraPayload.allowReassign) ? '' : '<th style=\"width:100px;\">Műveletek</th>'}"
);

// 4. Update openAdminTable JS for allowReassign
const eventHandlersAdmin = `
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
                        // Close others
                        tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
                        const drop = tbody.querySelector(\`#dropdown-\${btn.dataset.id}\`);
                        drop.style.display = 'flex';
                        const inp = drop.querySelector('input');
                        inp.focus();
                        
                        let searchTimeout;
                        inp.oninput = () => {
                            clearTimeout(searchTimeout);
                            searchTimeout = setTimeout(() => handleSearch(inp.value, drop.querySelector('ul'), btn.dataset.id, false), 300);
                        };
                    });
                });
            }
        }

        winContainer.addEventListener('click', () => {
            if (extraPayload.allowReassign) {
                tbody.querySelectorAll('.arch-reassign-dropdown').forEach(d => d.style.display = 'none');
            }
        });

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
`;
adminContent = adminContent.replace(
    `if (!extraPayload.isReadonly) {
                tbody.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => openDialog(items.find(i => i.id == btn.dataset.id)));
                });
                tbody.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteItem(btn.dataset.id));
                });
            }
        }`,
    eventHandlersAdmin
);

// 5. Append openArchivedPartnersTable and patch it!
let archiveMod = archiveContent;

// 5a. Rename button in archive
archiveMod = archiveMod.replace(
    "const isPActive = !p.is_inactive;",
    "const isPActive = !p.is_inactive;\n            const renameBtn = `<button class=\"arch-btn btn-edit-partner-name\" data-id=\"${p.id}\" data-name=\"${p.name || ''}\">✏️ Átnevezés</button>`;"
);
archiveMod = archiveMod.replace(
    "<td>${pBtn}</td>",
    "<td>${pBtn} ${renameBtn}</td>"
);
archiveMod = archiveMod.replace(
    "tbody.querySelectorAll('.btn-activate-partner').forEach(btn => {\n            btn.addEventListener('click', () => activatePartner(btn.dataset.id));\n        });",
    "tbody.querySelectorAll('.btn-activate-partner').forEach(btn => {\n            btn.addEventListener('click', () => activatePartner(btn.dataset.id));\n        });\n        tbody.querySelectorAll('.btn-edit-partner-name').forEach(btn => {\n            btn.addEventListener('click', () => renameArchivedPartner(btn.dataset.id, btn.dataset.name));\n        });"
);

archiveMod = archiveMod.replace(
    "async function activatePartner(id) {",
    `async function renameArchivedPartner(id, oldName) {
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

    async function activatePartner(id) {`
);

// Replace button to have data-inactive
archiveMod = archiveMod.replace(
    "<button class=\"arch-btn btn-reassign\" data-id=\"${iden.id}\"",
    "<button class=\"arch-btn btn-reassign\" data-id=\"${iden.id}\" data-inactive=\"${iden.is_inactive}\""
);
archiveMod = archiveMod.replace(
    "placeholder=\"Partner keresése...\"",
    "placeholder=\"Keresés 1 karaktertől...\""
);

// 5c. Update handleSearch and reassignIdentifier in archive
archiveMod = archiveMod.replace(
    "searchTimeout = setTimeout(() => handleSearch(inp.value, drop.querySelector('ul'), btn.dataset.id), 300);",
    "searchTimeout = setTimeout(() => handleSearch(inp.value, drop.querySelector('ul'), btn.dataset.id, btn.dataset.inactive === 'true'), 300);"
);

archiveMod = archiveMod.replace(
    /async function handleSearch[\s\S]*?async function reassignIdentifier[\s\S]*?catch \(e\) \{\n            alert\(e\.message\);\n        \}\n    \}/,
    `async function handleSearch(query, ul, idenId, isInactive) {
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
    }`
);

fs.writeFileSync('Access UI/src/modules/admin.js', adminContent + '\n\n' + archiveMod, 'utf8');
console.log('admin.js updated successfully!');
