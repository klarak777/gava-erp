export function openLokaciokWindow(wm) {
    wm.open('admin-locations', 'LOKÁCIÓK', (winContainer) => {
        // Ablak méretezése és képernyő közepére pozicionálása
        const winEl = winContainer.closest('.mdi-window');
        if (winEl) {
            winEl.style.width = '1200px';
            winEl.style.height = '800px';
            winEl.style.maxHeight = '92vh';

            setTimeout(() => {
                const left = Math.max(20, (window.innerWidth - winEl.offsetWidth) / 2);
                const top = Math.max(70, (window.innerHeight - winEl.offsetHeight) / 2);
                winEl.style.left = `${left}px`;
                winEl.style.top = `${top}px`;
            }, 10);
        }

        let locations = [];
        let filteredLocations = [];
        let selectedLocation = null;
        let expandedParents = new Set();
        let searchQuery = '';
        let statusFilter = 'all';
        let currentPage = 1;
        const itemsPerPage = 10;
        let currentStockItems = [];
        let currentIsParent = false;
        let currentLoc = null;

        winContainer.innerHTML = `
            <style>
                .loc-wrap {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #f8fafc;
                    padding: 16px;
                    box-sizing: border-box;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    overflow: auto;
                }
                .loc-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .loc-top-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 16px;
                }
                .loc-controls {
                    display: flex;
                    gap: 16px;
                    align-items: flex-end;
                }
                .loc-control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .loc-control-group label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #475569;
                }
                .loc-input {
                    padding: 8px 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    font-size: 13px;
                    outline: none;
                    width: 250px;
                }
                .loc-select {
                    padding: 8px 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    font-size: 13px;
                    outline: none;
                    background: white;
                    width: 150px;
                }
                .loc-btn-outline {
                    padding: 8px 16px;
                    border: 1px solid #3b82f6;
                    border-radius: 6px;
                    background: white;
                    color: #3b82f6;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .loc-btn-outline:hover { background: #eff6ff; }
                
                .loc-table-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e40af;
                    margin: 0 0 12px 0;
                    text-transform: uppercase;
                }
                
                .loc-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                .loc-table th {
                    text-align: left;
                    padding: 8px 12px;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                }
                .loc-table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #f1f5f9;
                    color: #334155;
                }
                .loc-table tr:hover { background: #f8fafc; cursor: pointer; }
                .loc-table tr.selected { background: #eff6ff; }
                
                .badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }
                .badge-active { background: #dcfce7; color: #166534; }
                .badge-locked { background: #fee2e2; color: #991b1b; }
                
                .icon-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px; color: #64748b; }
                .icon-btn:hover { color: #3b82f6; }
                
                .pagination { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 12px; }
                .page-numbers { display: flex; gap: 4px; }
                .page-num { padding: 4px 8px; border: 1px solid transparent; cursor: pointer; border-radius: 4px; }
                .page-num:hover { background: #f1f5f9; }
                .page-num.active { border-color: #3b82f6; color: #3b82f6; font-weight: 600; background: white; }
                
                .panels-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 16px;
                }
                
                .panel-title { font-size: 13px; font-weight: 700; color: #1e40af; margin: 0 0 16px 0; text-transform: uppercase; }
                
                /* Részletek panel */
                .details-grid {
                    display: grid;
                    grid-template-columns: 100px 1fr;
                    row-gap: 10px;
                    font-size: 12px;
                    align-items: center;
                }
                .details-grid strong { color: #475569; }
                .details-input { border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 100%; outline: none; }
                
                .action-buttons { display: flex; gap: 8px; margin-top: 24px; flex-wrap: wrap; }
                .btn-lock { padding: 6px 12px; border: 1px solid #cbd5e1; background: white; border-radius: 4px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; color: #475569;}
                .btn-lock:hover { background: #f8fafc; }
                .btn-print { padding: 6px 12px; border: 1px solid #cbd5e1; background: white; border-radius: 4px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; color: #475569;}
                .btn-print:hover { background: #f8fafc; }
                .btn-edit { padding: 6px 16px; border: none; background: #3b82f6; color: white; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
                .btn-edit:hover { background: #2563eb; }
                .btn-del { padding: 6px 16px; border: 1px solid #ef4444; background: white; color: #ef4444; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
                .btn-del:hover { background: #fef2f2; }
                
                /* Összesítés panel */
                .summary-list { display: flex; flex-direction: column; gap: 12px; font-size: 12px; }
                .summary-item { display: flex; justify-content: space-between; }
                .summary-item strong { color: #475569; font-weight: normal; }
                .summary-val { font-weight: 600; color: #0f172a; }
                .summary-val.green { color: #166534; }
                .summary-val.blue { color: #1d4ed8; }
                
                /* Dialog */
                dialog::backdrop { background: rgba(15, 23, 42, 0.5); }
            </style>
            
            <div class="loc-wrap">
                <div class="loc-top-bar">
                    <div class="loc-controls">
                        <div class="loc-control-group">
                            <label>Keresés</label>
                            <input type="text" id="loc-search" class="loc-input" placeholder="Lokáció kód, név vagy vonalkód...">
                        </div>
                        <div class="loc-control-group">
                            <label>Állapot</label>
                            <select id="loc-status-filter" class="loc-select">
                                <option value="all">Összes állapot</option>
                                <option value="Aktív">Aktív</option>
                                <option value="Zárolt">Zárolt</option>
                            </select>
                        </div>
                    </div>
                    <button class="loc-btn-outline" id="btn-new-loc"><span>+</span> ÚJ LOKÁCIÓ</button>
                </div>
                
                <div class="loc-card" style="display: flex; flex-direction: column; height: 420px; margin-bottom: 16px;">
                    <h2 class="loc-table-title">LOKÁCIÓK LISTÁJA</h2>
                    <div style="flex: 1; overflow-y: auto;">
                        <table class="loc-table">
                            <thead>
                                <tr>
                                    <th>Lokáció kód</th>
                                    <th>Lokáció név</th>
                                    <th>Típus</th>
                                    <th>Állapot</th>
                                    <th>Foglaltság</th>
                                    <th>Vonalkód</th>
                                    <th>Műveletek</th>
                                </tr>
                            </thead>
                            <tbody id="loc-tbody">
                                <tr><td colspan="7" style="text-align:center; padding: 20px;">Betöltés...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="loc-pagination"></div>
                </div>
                
                <div class="panels-grid">
                    <div class="loc-card" style="margin-bottom:0;">
                        <h2 class="panel-title">LOKÁCIÓ RÉSZLETEI</h2>
                        <div id="loc-details-content">
                            <div style="color:#94a3b8; font-size:12px; text-align:center; padding:40px 0;">Válassz ki egy lokációt a listából!</div>
                        </div>
                    </div>
                    <div class="loc-card" style="margin-bottom:0;">
                        <h2 class="panel-title">ÖSSZESÍTÉS</h2>
                        <div class="summary-list" id="loc-summary-content"></div>
                    </div>
                    <div class="loc-card" style="margin-bottom:0; display:flex; flex-direction:column;">
                        <h2 class="panel-title">KÉSZLET A LOKÁCIÓN</h2>
                        <input type="text" id="loc-stock-search" class="loc-input" placeholder="Tétel keresése..." style="width:100%; margin-bottom:12px; display:none;">
                        <div style="flex:1; overflow-y:auto; min-height:100px;">
                            <table class="loc-table">
                                <thead>
                                    <tr>
                                        <th>Név</th>
                                        <th style="text-align:right;">Mennyiség</th>
                                        <th style="width:40px;"></th>
                                    </tr>
                                </thead>
                                <tbody id="loc-stock-tbody">
                                    <tr><td colspan="3" style="text-align:center; color:#94a3b8;">Nincs adat</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Edit / Add Form Dialog -->
            <dialog id="loc-form-dialog" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); margin:0; padding:24px; border-radius:12px; border:none; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); width:450px;">
                <h2 id="loc-form-title" style="margin:0 0 20px 0; font-size:16px; color:#1e293b;">Új Lokáció</h2>
                <form id="loc-form">
                    <input type="hidden" id="f-id">
                    
                    <div style="display:flex; gap:12px; margin-bottom:12px;">
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600; color:#475569;">Lokáció kód (Vonalkód) *</label>
                            <input type="text" id="f-barcode" class="loc-input" style="width:100%; box-sizing:border-box;" required>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600; color:#475569;">Típus</label>
                            <select id="f-location_type" class="loc-select" style="width:100%; box-sizing:border-box;">
                                <option value="Raklap">Raklap</option>
                                <option value="Komissió">Komissió</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:12px;">
                        <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600; color:#475569;">Lokáció név *</label>
                        <input type="text" id="f-name" class="loc-input" style="width:100%; box-sizing:border-box;" required>
                    </div>
                    
                    <div style="display:flex; gap:12px; margin-bottom:12px;">
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600; color:#475569;">Állapot</label>
                            <select id="f-status" class="loc-select" style="width:100%; box-sizing:border-box;">
                                <option value="Aktív">Aktív</option>
                                <option value="Zárolt">Zárolt</option>
                            </select>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600; color:#475569;">Kapacitás (Raklap)</label>
                            <input type="number" id="f-capacity" class="loc-input" style="width:100%; box-sizing:border-box;" value="1" min="1">
                        </div>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; font-size:12px; margin-bottom:4px; font-weight:600; color:#475569;">Megjegyzés</label>
                        <input type="text" id="f-notes" class="loc-input" style="width:100%; box-sizing:border-box;">
                    </div>
                    
                    <!-- Rejtett kompatibilitási mezők -->
                    <div style="display:none;">
                        <input type="text" id="f-type_code" value="H">
                        <input type="number" id="f-building_num" value="1">
                        <input type="number" id="f-row_num" value="1">
                        <input type="number" id="f-aisle_num" value="1">
                        <input type="number" id="f-location_num" value="1">
                    </div>
                    
                    <div style="display:flex; justify-content:flex-end; gap:8px;">
                        <button type="button" class="loc-btn-outline" style="border-color:#cbd5e1; color:#475569;" id="loc-form-cancel">Mégse</button>
                        <button type="submit" class="btn-edit" style="padding:8px 24px;">Mentés</button>
                    </div>
                </form>
            </dialog>
        `;

        const tbody = winContainer.querySelector('#loc-tbody');
        const searchInput = winContainer.querySelector('#loc-search');
        const statusFilterInput = winContainer.querySelector('#loc-status-filter');
        const pagination = winContainer.querySelector('#loc-pagination');
        const summaryContent = winContainer.querySelector('#loc-summary-content');
        const detailsContent = winContainer.querySelector('#loc-details-content');
        const dialog = winContainer.querySelector('#loc-form-dialog');
        const form = winContainer.querySelector('#loc-form');

        const loadData = async () => {
            try {
                const res = await fetch('/api/v1/locations');
                locations = await res.json();
                applyFilters();
                renderSummary();
            } catch (err) {
                console.error(err);
                tbody.innerHTML = '<tr><td colspan="7" style="color:red;text-align:center;">Hiba az adatok betöltésekor.</td></tr>';
            }
        };

        const applyFilters = () => {
            const q = searchQuery.toLowerCase().trim();
            
            // Először megkeressük, mik egyeznek alapból
            const directMatches = locations.filter(loc => {
                const matchSearch = !q || 
                    (loc.barcode && loc.barcode.toLowerCase().includes(q)) || 
                    (loc.name && loc.name.toLowerCase().includes(q));
                const matchStatus = statusFilter === 'all' || loc.status === statusFilter;
                return matchSearch && matchStatus;
            });

            // Ha egy gyermek illeszkedik, a szülőjét is hozzá kell adni (hogy lássuk a fában)
            const matchSet = new Set(directMatches.map(l => l.id));
            directMatches.forEach(loc => {
                if (loc.parent_id) matchSet.add(loc.parent_id);
                // Ha a szülőre kerestünk, az összes gyerekét is érdemes mutatni
                if (loc.location_type === 'Szülő') {
                    locations.forEach(c => {
                        if (c.parent_id === loc.id && (statusFilter === 'all' || c.status === statusFilter)) {
                            matchSet.add(c.id);
                        }
                    });
                }
            });

            filteredLocations = locations.filter(l => matchSet.has(l.id));
            
            // Ha keresünk valamit, automatikusan nyissuk le a találatokat tartalmazó szülőket
            if (q) {
                filteredLocations.forEach(l => {
                    if (l.parent_id) expandedParents.add(l.parent_id);
                });
            } else {
                expandedParents.clear(); // Üres keresésnél csukjuk be
            }
            
            currentPage = 1;
            renderTable();
        };

        const renderTable = () => {
            // Főlistában csak a szülőket, vagy a szülő nélküli elemeket listázzuk, amik átmentek a szűrőn
            const topLevel = filteredLocations.filter(l => !l.parent_id);
            const totalItems = topLevel.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
            const start = (currentPage - 1) * itemsPerPage;
            const paginatedItems = topLevel.slice(start, start + itemsPerPage);

            if (paginatedItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Nincs találat.</td></tr>';
                pagination.innerHTML = '';
                return;
            }

            tbody.innerHTML = paginatedItems.map(loc => {
                const renderRow = (l, isChild = false) => {
                    const badgeClass = l.status === 'Zárolt' ? 'badge-locked' : 'badge-active';
                    const statusTxt = l.status || 'Aktív';
                    const isSelected = selectedLocation && selectedLocation.id === l.id;
                    const isExpanded = expandedParents.has(l.id);
                    
                    const children = locations.filter(child => child.parent_id === l.id);
                    const isParent = !isChild && (l.location_type === 'Szülő' || children.length > 0);

                    let cartons = parseInt(l.current_cartons) || 0;
                    let occupiedPallets = parseInt(l.occupied_pallets) || 0;
                    let capacityPallets = parseInt(l.capacity) || 1;

                    if (isParent && children.length > 0) {
                        capacityPallets = children.reduce((sum, c) => sum + (parseInt(c.capacity) || 0), 0);
                        cartons = children.reduce((sum, c) => sum + (parseInt(c.current_cartons) || 0), 0);
                        occupiedPallets = children.reduce((sum, c) => sum + (parseInt(c.occupied_pallets) || 0), 0);
                    }

                    const isOver = occupiedPallets > capacityPallets;
                    const rawPct = capacityPallets > 0 ? (occupiedPallets / capacityPallets) * 100 : 0;
                    const pct = occupiedPallets > 0 ? Math.max(3, Math.min(100, Math.round(rawPct))) : 0;
                    
                    const occFormatted = occupiedPallets || 0;
                    const statusColor = isOver ? '#b91c1c' : (occupiedPallets > 0 ? '#0f766e' : '#94a3b8');
                    const barColor = isOver ? '#ef4444' : (occupiedPallets > 0 ? '#10b981' : '#cbd5e1');
                    
                    let expandBtn = '';
                    if (!isChild && children.length > 0) {
                        expandBtn = `<button class="icon-btn expand-btn" data-id="${l.id}" style="margin-right: 8px;">${isExpanded ? '▼' : '▶'}</button>`;
                    }
                    
                    return `
                        <tr data-id="${l.id}" class="${isSelected ? 'selected' : ''}" style="${isChild ? 'background: #fdfdfd;' : ''}">
                            <td style="font-weight:${isChild ? 'normal' : '600'}; padding-left: ${isChild ? '30px' : '12px'};">
                                ${!isChild ? expandBtn : '<span style="color:#cbd5e1;margin-right:8px;">└</span>'}
                                ${l.barcode || ''}
                            </td>
                            <td>${l.name || ''}</td>
                            <td>${l.location_type || '-'}</td>
                            <td><span class="badge ${badgeClass}">${statusTxt}</span></td>
                            <td>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="width:45px; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden; flex-shrink:0;">
                                        <div style="width:${pct}%; height:100%; background:${barColor};"></div>
                                    </div>
                                    <span style="font-size:11px; font-weight:${occupiedPallets > 0 ? '600' : '400'}; color:${statusColor}; white-space:nowrap;">
                                        ${occFormatted} / ${capacityPallets} plt
                                    </span>
                                </div>
                            </td>
                            <td>
                                <button class="icon-btn print-barcode-btn" data-barcode="${l.barcode}" title="Vonalkód nyomtatása">🖨️</button>
                            </td>
                            <td>
                                <button class="icon-btn edit-btn" data-id="${l.id}">🖌️</button>
                            </td>
                        </tr>
                    `;
                };

                let html = renderRow(loc, false);
                if (expandedParents.has(loc.id)) {
                    const children = filteredLocations.filter(child => child.parent_id === loc.id);
                    children.forEach(child => {
                        html += renderRow(child, true);
                    });
                }
                return html;
            }).join('');

            // Setup events
            tbody.querySelectorAll('tr').forEach(tr => {
                tr.addEventListener('click', (e) => {
                    if(e.target.closest('button')) return;
                    const id = parseInt(tr.dataset.id);
                    selectedLocation = locations.find(l => l.id === id);
                    renderTable(); // for highlighting
                    renderDetails();
                });
            });
            
            tbody.querySelectorAll('.expand-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    if (expandedParents.has(id)) {
                        expandedParents.delete(id);
                    } else {
                        expandedParents.add(id);
                    }
                    renderTable();
                });
            });
            
            tbody.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    openForm(locations.find(l => l.id === id));
                });
            });
            
            tbody.querySelectorAll('.print-barcode-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const barcode = btn.dataset.barcode;
                    const loc = locations.find(l => l.barcode === barcode);
                    if(loc) printBarcode(loc.name, loc.barcode);
                });
            });

            // Pagination UI
            let pageHtml = `<div class="page-numbers">`;
            for(let i=1; i<=totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                    pageHtml += `<div class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</div>`;
                } else if (i === currentPage - 2 || i === currentPage + 2) {
                    pageHtml += `<div style="padding:4px;">...</div>`;
                }
            }
            pageHtml += `</div>`;
            
            const end = Math.min(start + itemsPerPage, totalItems);
            pagination.innerHTML = `
                <div>${start + 1}-${end} / ${totalItems} lokáció</div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="icon-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>
                    ${pageHtml}
                    <button class="icon-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>
                </div>
            `;
            
            pagination.querySelectorAll('.page-num').forEach(p => {
                p.addEventListener('click', () => {
                    currentPage = parseInt(p.dataset.page);
                    renderTable();
                });
            });
            const prev = pagination.querySelector('.prev-btn');
            if (prev) prev.onclick = () => { if(currentPage > 1) { currentPage--; renderTable(); }};
            const next = pagination.querySelector('.next-btn');
            if (next) next.onclick = () => { if(currentPage < totalPages) { currentPage++; renderTable(); }};
        };

        const renderStockList = (searchQ = '') => {
            const stockTbody = winContainer.querySelector('#loc-stock-tbody');
            if (!currentLoc) {
                stockTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Nincs kiválasztott lokáció</td></tr>';
                return;
            }
            
            const q = searchQ.toLowerCase().trim();
            const filtered = currentStockItems.filter(item => {
                return !q || 
                    (item.product_name && item.product_name.toLowerCase().includes(q)) || 
                    (item.gtin && item.gtin.toLowerCase().includes(q)) ||
                    (item.location_name && item.location_name.toLowerCase().includes(q));
            });
            
            if (filtered && filtered.length > 0) {
                stockTbody.innerHTML = filtered.map((item, index) => {
                    const locInfo = currentIsParent && item.location_name ? `<div style="font-size:10px; color:#3b82f6; margin-top:2px;">📍 ${item.location_name}</div>` : '';
                    
                    let weightInfo = '';
                    if (item.gross_weight != null && parseFloat(item.gross_weight) > 0) {
                        const gw = parseFloat(item.gross_weight).toFixed(1);
                        const nw = (item.net_weight != null && parseFloat(item.net_weight) > 0) ? parseFloat(item.net_weight).toFixed(1) : null;
                        weightInfo = `<div style="font-size:11px; color:#059669; font-weight:600; margin-top:2px;">⚖️ ${gw} kg bruttó${nw ? ` (${nw} kg nettó)` : ''}</div>`;
                    }
                    
                    return `
                    <tr class="stock-item-row" data-loc-id="${item.location_id || ''}" data-stock-id="${item.stock_id || ''}" style="${currentIsParent && item.location_id ? 'cursor:pointer;' : ''}">
                        <td style="padding:8px 4px;">
                            <div style="font-weight:600; color:#1e293b; font-size:12px;">${item.product_name || 'Ismeretlen termék'}</div>
                            <div style="font-size:11px; color:#64748b;">GTIN: ${item.gtin || '-'}</div>
                            ${weightInfo}
                            ${locInfo}
                        </td>
                        <td style="text-align:right; padding:8px 4px; vertical-align:middle;">
                            <div style="font-weight:700; color:#0f172a; font-size:12px;">1 raklap</div>
                            <div style="font-size:10px; color:#64748b;">(${item.total_cartons} karton)</div>
                        </td>
                        <td style="text-align:right; padding:8px 4px; vertical-align:middle;">
                            <button class="icon-btn revert-stock-btn" title="Tétel visszavonása a komissiózásról" style="color:#ef4444;">🗑️</button>
                        </td>
                    </tr>
                `}).join('');
                
                stockTbody.querySelectorAll('.stock-item-row .revert-stock-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const tr = e.target.closest('tr');
                        const stockId = tr?.dataset?.stockId;
                        if (!stockId) {
                            alert('Hiba: nem található a raklap azonosítója!');
                            return;
                        }
                        
                        if (!confirm('Biztosan visszavonod ezt a tételt a komissiózásról?\nA raklap lekerül a tárhelyről és újra komissiózható lesz.')) return;
                        
                        btn.textContent = '⏳';
                        btn.disabled = true;
                        
                        try {
                            const res = await fetch(`/api/v1/locations/stock/${stockId}/revert`, { method: 'DELETE' });
                            const contentType = res.headers.get('content-type') || '';
                            if (!contentType.includes('application/json')) {
                                throw new Error(`A szerver nem válaszolt megfelelően (${res.status}). Lehet, hogy a szerver nem frissült – kérd meg az adminisztrátort, hogy futtassa a deploy parancsot!`);
                            }
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Hiba a tétel visszavonásakor');
                            
                            alert('✅ Tétel sikeresen visszavonva a komissiózásról!');
                            // Frissítjük az adatokat + a jobb oldali részleteket is
                            await loadData();
                            if (selectedLocation) await renderDetails();
                        } catch (err) {
                            btn.textContent = '🗑️';
                            btn.disabled = false;
                            alert('❌ Hiba: ' + err.message);
                        }
                    });
                });

                if (currentIsParent) {
                    stockTbody.querySelectorAll('.stock-item-row').forEach(tr => {
                        tr.addEventListener('click', (e) => {
                            if(e.target.closest('button')) return;
                            const targetLocId = parseInt(tr.dataset.locId);
                            if (targetLocId && targetLocId !== currentLoc.id) {
                                const targetLoc = locations.find(l => l.id === targetLocId);
                                if (targetLoc) {
                                    selectedLocation = targetLoc;
                                    if (targetLoc.parent_id) expandedParents.add(targetLoc.parent_id);
                                    
                                    const stockSearchInput = winContainer.querySelector('#loc-stock-search');
                                    if(stockSearchInput) stockSearchInput.value = '';

                                    renderTable();
                                    renderDetails();
                                    
                                    setTimeout(() => {
                                        const tbody = winContainer.querySelector('#loc-tbody');
                                        const row = tbody.querySelector(`tr[data-id="${targetLoc.id}"]`);
                                        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 100);
                                }
                            }
                        });
                    });
                }
            } else {
                stockTbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#94a3b8; padding:20px 0;">Üres lokáció (nincs készleten áru a megadott feltételekkel)</td></tr>';
            }
        };

        const renderDetails = async () => {
            const stockSearchInput = winContainer.querySelector('#loc-stock-search');
            if (!selectedLocation) {
                currentLoc = null;
                currentIsParent = false;
                currentStockItems = [];
                if (stockSearchInput) stockSearchInput.style.display = 'none';
                detailsContent.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:40px 0;">Válassz ki egy lokációt a listából!</div>';
                renderStockList();
                return;
            }
            
            const loc = selectedLocation;
            currentLoc = loc;
            const badgeClass = loc.status === 'Zárolt' ? 'badge-locked' : 'badge-active';
            const stockTbody = winContainer.querySelector('#loc-stock-tbody');
            stockTbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#94a3b8; padding:15px 0;">Készlet betöltése...</td></tr>';
            
            const children = locations.filter(c => c.parent_id === loc.id);
            const isParent = loc.location_type === 'Szülő' || children.length > 0;
            currentIsParent = isParent;
            
            if (stockSearchInput) {
                stockSearchInput.style.display = isParent ? 'block' : 'none';
                stockSearchInput.value = ''; // clear search when location changes
            }
            
            // Készlet lekérdezése a szerverről
            currentStockItems = [];
            try {
                const stockRes = await fetch(`/api/v1/locations/${loc.id}/stock`);
                if (stockRes.ok) {
                    currentStockItems = await stockRes.json();
                }
            } catch(err) {
                console.error('Hiba a készlet lekérdezésekor:', err);
            }
            
            const totalCartons = currentStockItems.reduce((sum, item) => sum + (parseInt(item.total_cartons) || 0), 0);
            const totalPallets = currentStockItems.reduce((sum, item) => sum + (parseInt(item.item_count) || 0), 0);
            
            const capPallets = (isParent && children.length > 0)
                ? children.reduce((sum, c) => sum + (parseInt(c.capacity) || 0), 0)
                : (parseInt(loc.capacity) || 1);

            const occPalletsFormatted = totalPallets;
            const isOverCapacity = totalPallets > capPallets;
            
            detailsContent.innerHTML = `
                <div class="details-grid">
                    <strong>Lokáció kód</strong>
                    <div style="font-weight:600;">${loc.barcode || ''}</div>
                    
                    <strong>Lokáció név</strong>
                    <div>${loc.name || ''}</div>
                    
                    <strong>Típus</strong>
                    <div>${loc.location_type || 'Raklap'}</div>
                    
                    <strong>Foglaltság</strong>
                    <div>
                        <strong style="color: ${isOverCapacity ? '#b91c1c' : '#0f172a'};">
                            ${occPalletsFormatted} / ${capPallets} raklap
                        </strong>
                        <span style="color:#64748b; font-size:12px; margin-left:4px;">(${totalCartons} kt)</span>
                    </div>
                    
                    <strong>Állapot</strong>
                    <div><span class="badge ${badgeClass}">${loc.status || 'Aktív'}</span></div>
                    
                    <strong>Vonalkód</strong>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <input type="text" class="details-input" value="${loc.barcode || ''}" readonly>
                        <button class="icon-btn" id="btn-copy-barcode" title="Másolás">📋</button>
                    </div>
                    
                    <strong>Megjegyzés</strong>
                    <div>${loc.notes || '-'}</div>
                    
                    <strong>Létrehozva</strong>
                    <div>${loc.created_at ? new Date(loc.created_at).toLocaleString('hu-HU') : '-'}</div>
                    
                    <strong>Módosítva</strong>
                    <div>${loc.updated_at ? new Date(loc.updated_at).toLocaleString('hu-HU') : '-'}</div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-lock" id="btn-toggle-lock">
                        🔒 ${loc.status === 'Zárolt' ? 'FELOLDÁS' : 'ZÁROLÁS'}
                    </button>
                    <button class="btn-print">🖨️ VONALKÓD NYOMTATÁSA</button>
                    <button class="btn-edit" id="btn-edit-detail">SZERKESZTÉS</button>
                    <button class="btn-del" id="btn-delete-detail">🗑️ TÖRLÉS</button>
                </div>
            `;
            
            // Action bindings
            winContainer.querySelector('.btn-print').onclick = () => printBarcode(loc.name, loc.barcode);
            winContainer.querySelector('#btn-edit-detail').onclick = () => openForm(loc);
            
            const copyBtn = winContainer.querySelector('#btn-copy-barcode');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(loc.barcode || '');
                    copyBtn.textContent = '✓';
                    setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
                };
            }
            
            winContainer.querySelector('#btn-delete-detail').onclick = async () => {
                if(confirm('Biztosan törlöd ezt a lokációt?')) {
                    try {
                        await fetch(`/api/v1/locations/${loc.id}`, { method: 'DELETE' });
                        selectedLocation = null;
                        loadData();
                    } catch(e) { alert('Hiba a törléskor'); }
                }
            };
            
            winContainer.querySelector('#btn-toggle-lock').onclick = async () => {
                const newStatus = loc.status === 'Zárolt' ? 'Aktív' : 'Zárolt';
                try {
                    await fetch(`/api/v1/locations/${loc.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...loc, status: newStatus })
                    });
                    loadData();
                    selectedLocation.status = newStatus;
                    renderDetails();
                } catch(e) { alert('Hiba a módosításkor'); }
            };
            
            // Készlet megjelenítése
            renderStockList();
        };

        const renderSummary = () => {
            const total = locations.length;
            const active = locations.filter(l => l.status !== 'Zárolt').length;
            
            // Csak a fizikai tárhelyeket (nem szülőket) számoljuk a kapacitásba a duplikálás elkerülése végett
            const storageLocations = locations.filter(l => l.location_type !== 'Szülő');
            const totalCapacity = storageLocations.reduce((sum, l) => sum + (parseInt(l.capacity) || 1), 0);
            
            const currentStockCartons = storageLocations.reduce((sum, l) => sum + (parseInt(l.current_cartons) || 0), 0);
            const totalOccupiedPallets = storageLocations.reduce((sum, l) => sum + (parseInt(l.occupied_pallets) || 0), 0);
            const occupiedCount = storageLocations.filter(l => (parseInt(l.current_cartons) || 0) > 0).length;
            const avgOccupancyLocs = storageLocations.length > 0 ? ((occupiedCount / storageLocations.length) * 100).toFixed(1) : 0;
            const freeCapacity = Math.max(0, totalCapacity - totalOccupiedPallets);
            
            summaryContent.innerHTML = `
                <div class="summary-item">
                    <strong>Összes lokáció</strong>
                    <span class="summary-val">${total} db</span>
                </div>
                <div class="summary-item">
                    <strong>Aktív lokáció</strong>
                    <span class="summary-val green">${active} db</span>
                </div>
                <div class="summary-item">
                    <strong>Foglalt lokációk</strong>
                    <span class="summary-val ${occupiedCount > 0 ? 'green' : ''}">${occupiedCount} db (${avgOccupancyLocs}%)</span>
                </div>
                <div class="summary-item" style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:12px;">
                    <strong>Teljes kapacitás</strong>
                    <span class="summary-val">${totalCapacity} raklap</span>
                </div>
                <div class="summary-item">
                    <strong>Aktuális készlet</strong>
                    <span class="summary-val blue">${totalOccupiedPallets} raklap (${currentStockCartons} karton)</span>
                </div>
                <div class="summary-item">
                    <strong>Szabad kapacitás</strong>
                    <span class="summary-val blue">${freeCapacity} raklap</span>
                </div>
            `;
        };

        const openForm = (loc = null) => {
            winContainer.querySelector('#loc-form-title').textContent = loc ? 'Lokáció szerkesztése' : 'Új lokáció';
            winContainer.querySelector('#f-id').value = loc ? loc.id : '';
            winContainer.querySelector('#f-barcode').value = loc ? loc.barcode : '';
            winContainer.querySelector('#f-name').value = loc ? loc.name : '';
            winContainer.querySelector('#f-location_type').value = loc ? (loc.location_type || '') : '';
            winContainer.querySelector('#f-status').value = loc ? (loc.status || 'Aktív') : 'Aktív';
            
            const capInput = winContainer.querySelector('#f-capacity');
            const children = loc ? locations.filter(c => c.parent_id === loc.id) : [];
            const isParent = loc && (loc.location_type === 'Szülő' || children.length > 0);
            const computedCap = (isParent && children.length > 0)
                ? children.reduce((sum, c) => sum + (parseInt(c.capacity) || 0), 0)
                : (loc ? (loc.capacity || 1) : 1);

            capInput.value = computedCap;
            if (isParent) {
                capInput.setAttribute('readonly', 'true');
                capInput.style.backgroundColor = '#f1f5f9';
                capInput.title = 'A sor (szülő) kapacitása a tárhelyek összegéből adódik, automatikusan számított.';
            } else {
                capInput.removeAttribute('readonly');
                capInput.style.backgroundColor = '';
                capInput.removeAttribute('title');
            }
            
            // Rejtett parent_id
            let pIdInput = winContainer.querySelector('#f-parent_id');
            if (!pIdInput) {
                pIdInput = document.createElement('input');
                pIdInput.type = 'hidden';
                pIdInput.id = 'f-parent_id';
                winContainer.querySelector('#loc-form').appendChild(pIdInput);
            }
            pIdInput.value = loc && loc.parent_id ? loc.parent_id : '';
            
            winContainer.querySelector('#f-notes').value = loc ? (loc.notes || '') : '';
            
            // Compatibility fields for backward compatibility
            winContainer.querySelector('#f-type_code').value = loc ? loc.type_code : 'H';
            dialog.showModal();
        };

        const printBarcode = (locationName, barcodeValue) => {
            const printWindow = window.open('', '_blank', 'width=600,height=400');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Vonalkód Nyomtatása</title>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 20px; }
                        .loc-name { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
                        @media print {
                            @page { margin: 0; }
                            body { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="loc-name">${locationName}</div>
                    <svg id="barcode"></svg>
                    <script>
                        window.onload = function() {
                            JsBarcode("#barcode", "${barcodeValue}", {
                                format: "CODE128",
                                displayValue: true,
                                fontSize: 14,
                                height: 80
                            });
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        };

        // Event Listeners
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFilters();
        });
        
        const stockSearchInputEl = winContainer.querySelector('#loc-stock-search');
        if (stockSearchInputEl) {
            stockSearchInputEl.addEventListener('input', (e) => {
                renderStockList(e.target.value);
            });
        }
        
        statusFilterInput.addEventListener('change', (e) => {
            statusFilter = e.target.value;
            applyFilters();
        });
        
        winContainer.querySelector('#btn-new-loc').addEventListener('click', () => openForm());
        winContainer.querySelector('#loc-form-cancel').addEventListener('click', () => dialog.close());
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = winContainer.querySelector('#f-id').value;
            
            const pIdVal = winContainer.querySelector('#f-parent_id')?.value;
            const payload = {
                barcode: winContainer.querySelector('#f-barcode').value,
                name: winContainer.querySelector('#f-name').value,
                location_type: winContainer.querySelector('#f-location_type').value,
                status: winContainer.querySelector('#f-status').value,
                capacity: parseInt(winContainer.querySelector('#f-capacity').value) || 1,
                notes: winContainer.querySelector('#f-notes').value,
                parent_id: pIdVal ? parseInt(pIdVal) : null,
                // Backward compatibility
                type_code: winContainer.querySelector('#f-type_code').value,
                building_num: parseInt(winContainer.querySelector('#f-building_num').value),
                row_num: parseInt(winContainer.querySelector('#f-row_num').value),
                aisle_num: parseInt(winContainer.querySelector('#f-aisle_num').value),
                location_num: parseInt(winContainer.querySelector('#f-location_num').value),
                cooling_type: 'Vegyes'
            };
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `/api/v1/locations/${id}` : '/api/v1/locations';
                
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                if (!res.ok) {
                    alert(data.error || 'Hiba mentéskor');
                    return;
                }
                
                dialog.close();
                await loadData();
                if (selectedLocation) {
                    selectedLocation = locations.find(l => l.id === selectedLocation.id) || null;
                    if (selectedLocation) {
                        renderDetails();
                    }
                }
            } catch (err) {
                console.error(err);
                alert('Hálózati hiba');
            }
        });

        // Initialize
        loadData();
    });
}
