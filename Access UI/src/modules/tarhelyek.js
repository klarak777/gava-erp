export function openTarhelyekWindow(wm) {
    wm.open('admin-locations', 'Tárhelyek (Karbantartás)', (winContainer) => {
        
        let locations = [];
        
        const buildContent = () => {
            winContainer.innerHTML = `
                <style>
                    .tarhely-container { padding: 16px; height: 100%; box-sizing: border-box; overflow-y: auto; background: var(--bg-light, #f8fafc); }
                    .building-group { margin-bottom: 24px; background: white; border-radius: 8px; border: 1px solid var(--border-color, #e2e8f0); box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; flex-shrink: 0; }
                    .building-header { padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: #334155; }
                    .building-header h3 { margin: 0; font-size: 14px; }
                    .add-btn { background: #3b82f6; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
                    .add-btn:hover { background: #2563eb; }
                    .loc-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    .loc-table th, .loc-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                    .loc-table th { background: #f1f5f9; font-weight: 600; color: #475569; }
                    .loc-table tr:hover { background: #f8fafc; }
                    .del-btn { color: #ef4444; background: none; border: none; cursor: pointer; font-size: 14px; }
                    .del-btn:hover { color: #dc2626; }
                </style>
                <div class="tarhely-container" id="tarhely-content">
                    <div style="text-align:center; padding:20px;">Betöltés...</div>
                </div>
                
                <!-- Add Dialog -->
                <dialog id="loc-add-dialog" style="padding:20px; border-radius:8px; border:1px solid #ccc; max-width:400px; width:100%;">
                    <h3 style="margin-top:0;">Új Tárhely Hozzáadása</h3>
                    <h4 id="loc-add-building-name" style="margin-top:0; color:#64748b; font-size:12px;"></h4>
                    <form id="loc-add-form">
                        <input type="hidden" id="add-type_code">
                        <input type="hidden" id="add-building_num">
                        <input type="hidden" id="add-cooling_type">
                        
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600;">Sor száma</label>
                            <input type="number" id="add-row_num" class="access-control-input" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;" required min="1">
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600;">Köz száma</label>
                            <input type="number" id="add-aisle_num" class="access-control-input" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;" required min="1">
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600;">Tárhely száma</label>
                            <input type="number" id="add-location_num" class="access-control-input" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;" required min="1">
                        </div>
                        
                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
                            <button type="button" class="secondary-btn" id="loc-btn-cancel">Mégse</button>
                            <button type="submit" class="primary-btn">Létrehozás</button>
                        </div>
                    </form>
                </dialog>
            `;
            
            loadData();
        };

        const loadData = async () => {
            try {
                const res = await fetch('/api/v1/locations');
                locations = await res.json();
                renderLocations();
            } catch (err) {
                console.error(err);
                winContainer.querySelector('#tarhely-content').innerHTML = '<div style="color:red; padding:20px;">Hiba történt az adatok betöltésekor.</div>';
            }
        };

        const renderLocations = () => {
            const content = winContainer.querySelector('#tarhely-content');
            const dialog = winContainer.querySelector('#loc-add-dialog');
            const form = winContainer.querySelector('#loc-add-form');
            
            // Group locations by building (type_code + building_num)
            const grouped = {};
            locations.forEach(loc => {
                const key = `${loc.type_code}_${loc.building_num}`;
                if (!grouped[key]) {
                    // Extract building name from the first location's name (everything before " - " if it exists)
                    let bName = loc.name.split(' - ')[0];
                    if (loc.type_code === 'R') bName = loc.name; // For ramps, name is just "X-es rámpa"
                    
                    grouped[key] = {
                        title: bName,
                        type_code: loc.type_code,
                        building_num: loc.building_num,
                        cooling_type: loc.cooling_type,
                        items: []
                    };
                }
                grouped[key].items.push(loc);
            });

            let html = '';
            
            Object.keys(grouped).forEach(key => {
                const group = grouped[key];
                
                // Determine if we show sor/köz based on type
                const showRow = group.type_code !== 'R';
                
                html += `
                    <div class="building-group">
                        <div class="building-header">
                            <h3>${group.title} <span style="font-weight:normal; font-size:12px; color:#64748b;">(Hűtés: ${group.cooling_type || 'N/A'})</span></h3>
                            ${group.type_code !== 'R' ? `<button class="add-btn" data-group="${key}">+ Új Hozzáadása</button>` : ''}
                        </div>
                        <table class="loc-table">
                            <thead>
                                <tr>
                                    <th>Vonalkód</th>
                                    <th>Megnevezés</th>
                                    ${showRow ? '<th>Sor</th><th>Köz</th><th>Tárhely</th>' : ''}
                                    <th style="width:40px;"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${group.items.map(item => `
                                    <tr>
                                        <td style="font-family:monospace; font-weight:bold;">${item.barcode}</td>
                                        <td>${item.name}</td>
                                        ${showRow ? `
                                            <td>${item.row_num || '-'}</td>
                                            <td>${item.aisle_num || '-'}</td>
                                            <td>${item.location_num || '-'}</td>
                                        ` : ''}
                                        <td><button class="del-btn" data-id="${item.id}" title="Törlés">×</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            });
            
            content.innerHTML = html;
            
            // Attach Events
            content.querySelectorAll('.del-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if (confirm('Biztosan törlöd ezt a tárhelyet? Ezt nem lehet visszavonni.')) {
                        try {
                            const res = await fetch(`/api/v1/locations/${id}`, { method: 'DELETE' });
                            if (res.ok) {
                                loadData();
                            } else {
                                alert('Hiba a törlés során!');
                            }
                        } catch(err) {
                            console.error(err);
                        }
                    }
                });
            });
            
            content.querySelectorAll('.add-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = e.target.dataset.group;
                    const group = grouped[key];
                    
                    winContainer.querySelector('#loc-add-building-name').textContent = group.title;
                    winContainer.querySelector('#add-type_code').value = group.type_code;
                    winContainer.querySelector('#add-building_num').value = group.building_num;
                    winContainer.querySelector('#add-cooling_type').value = group.cooling_type;
                    
                    // Reset inputs
                    winContainer.querySelector('#add-row_num').value = '';
                    winContainer.querySelector('#add-aisle_num').value = '';
                    winContainer.querySelector('#add-location_num').value = '';
                    
                    dialog.showModal();
                });
            });
            
            winContainer.querySelector('#loc-btn-cancel').onclick = () => dialog.close();
            
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                const type_code = winContainer.querySelector('#add-type_code').value;
                const building_num = parseInt(winContainer.querySelector('#add-building_num').value);
                const cooling_type = winContainer.querySelector('#add-cooling_type').value;
                const row_num = parseInt(winContainer.querySelector('#add-row_num').value);
                const aisle_num = parseInt(winContainer.querySelector('#add-aisle_num').value);
                const location_num = parseInt(winContainer.querySelector('#add-location_num').value);
                
                // Generate name and barcode
                const pad = n => n.toString().padStart(2, '0');
                const barcode = `${type_code}${pad(building_num)}${pad(row_num)}${pad(aisle_num)}${pad(location_num)}`;
                
                const bName = winContainer.querySelector('#loc-add-building-name').textContent;
                const name = `${bName} - ${row_num}. sor ${aisle_num}. köz ${location_num}. tárhely`;
                
                const payload = {
                    type_code, building_num, cooling_type, row_num, aisle_num, location_num, barcode, name
                };
                
                try {
                    const res = await fetch('/api/v1/locations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    const data = await res.json();
                    if (!res.ok) {
                        alert(data.error || 'Hiba mentéskor');
                        return;
                    }
                    
                    dialog.close();
                    loadData();
                } catch (err) {
                    console.error(err);
                    alert('Hálózati hiba');
                }
            };
        };

        buildContent();
    });
}
