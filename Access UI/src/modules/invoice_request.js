// Számla Igény Keresés Modul (Invoice Request Search Module)
export function renderInvoiceRequestSearch(container, wm) {
    // Mock Data
    const requests = [
        { id: 'SZIG-2026/00045', partner: 'Tesco-Global Zrt.', date: '2026.02.15', netAmount: 4500000, currency: 'HUF', isInvoiced: true, invoiceId: 'SZ-2026/00145' },
        { id: 'SZIG-2026/00046', partner: 'Auchan Magyarország Kft.', date: '2026.02.16', netAmount: 125000, currency: 'HUF', isInvoiced: false, invoiceId: null },
        { id: 'SZIG-2026/00047', partner: 'X-Trade Kft.', date: '2026.02.17', netAmount: 3200, currency: 'EUR', isInvoiced: false, invoiceId: null },
        { id: 'SZIG-2026/00048', partner: 'Sprint Kft.', date: '2026.02.18', netAmount: 89000, currency: 'HUF', isInvoiced: true, invoiceId: 'SZ-2026/00150' },
    ];

    const formatNum = (n, currency = '') => {
        return (n ? n.toLocaleString('hu-HU') : '0') + (currency ? ` ${currency}` : '');
    };

    const getStatus = (req) => {
        if (req.isInvoiced) return { text: 'Számlázva', class: 'green' };
        return { text: 'Nyitott', class: 'blue' };
    };

    container.innerHTML = `
        <div class="req-layout">
            <!-- Left Panel: Request Grid -->
            <div class="req-left-panel">
                <!-- Toolbar -->
                <div class="req-toolbar">
                    <div class="t-left">
                        <button class="action-btn primary" id="btn-new-request">➕ Új számla igény</button>
                        <button class="action-btn">🖨️ Nyomtatás</button>
                    </div>
                    <div class="t-right">
                        <button class="icon-btn-bordered" title="Excel export">📊</button>
                        <button class="icon-btn-bordered" title="Frissítés">🔄</button>
                    </div>
                </div>

                <!-- Data Grid -->
                <div class="req-grid-container">
                    <table class="req-grid">
                        <thead>
                            <tr>
                                <th class="check-cell"><input type="checkbox"></th>
                                <th>Sorszám ↕</th>
                                <th>Partner ↕</th>
                                <th>Kiállítás dátuma ↕</th>
                                <th class="text-right">Nettó összeg ↕</th>
                                <th>Deviza ↕</th>
                                <th>Státusz ↕</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${requests.map(r => {
        const status = getStatus(r);
        return `
                                <tr class="grid-row" data-id="${r.id}">
                                    <td class="check-cell" onclick="event.stopPropagation()"><input type="checkbox"></td>
                                    <td class="bold font-mono">${r.id}</td>
                                    <td>${r.partner}</td>
                                    <td>${r.date}</td>
                                    <td class="text-right">${formatNum(r.netAmount, r.currency)}</td>
                                    <td><span class="currency-tag">${r.currency}</span></td>
                                    <td><span class="status-dot ${status.class}"></span> ${status.text}</td>
                                </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Footer -->
                <div class="req-footer">
                    <div class="f-left">
                        <span>Összesen: <strong>${requests.length}</strong> igény</span>
                    </div>
                </div>
            </div>

            <!-- Right Panel: Filters (Woodpecker v2.1 Spec) -->
            <div class="req-right-panel">
                <div class="req-filter-section">
                    <h3 class="req-filter-title">Szűrő feltételek</h3>

                    <div class="req-filter-group">
                        <label>Sorszám</label>
                        <input type="text" class="req-text-input" placeholder="Igény sorszáma...">
                    </div>

                    <div class="req-filter-group">
                        <label>Partner</label>
                        <input type="text" class="req-text-input" placeholder="Partner neve...">
                    </div>

                    <div class="req-filter-group">
                        <label>Kiállítás dátum (tól-ig)</label>
                        <div class="req-date-range">
                            <input type="date" class="req-date-input">
                            <span class="date-sep">-</span>
                            <input type="date" class="req-date-input">
                        </div>
                    </div>

                    <div class="req-filter-divider"></div>

                    <h4 class="req-filter-subtitle">Státusz szűrés</h4>
                    <div class="req-checkbox-group">
                        <label class="req-checkbox-label">
                            <input type="checkbox" class="req-checkbox-input">
                            <span>Számlázva</span>
                        </label>
                        <label class="req-checkbox-label">
                            <input type="checkbox" class="req-checkbox-input">
                            <span>Nincs bizonylaton</span>
                        </label>
                    </div>

                    <div class="req-filter-divider"></div>

                    <div class="req-filter-actions">
                        <div style="display: flex; gap: 8px;">
                            <button class="req-btn-search" style="flex: 1;">🔍 Szűrés</button>
                            <button class="req-btn-clear" style="width: 40px; padding: 0; display: flex; align-items: center; justify-content: center;" title="Törlés">❌</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .req-layout {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 300px;
                height: 100%;
                gap: 12px;
                padding: 12px;
                background: #f1f5f9;
                min-height: 0;
            }

            .req-left-panel {
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-width: 0;
                min-height: 0;
            }

            .req-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: white;
                border-radius: 12px;
                border: 1px solid var(--border);
                gap: 12px;
                flex-wrap: wrap;
            }

            .req-toolbar .t-left, .req-toolbar .t-right {
                display: flex;
                gap: 8px;
                align-items: center;
                flex-wrap: wrap;
            }

            .req-toolbar .t-left { flex: 1 1 320px; min-width: 0; }
            .req-toolbar .t-right { margin-left: auto; }

            .req-grid-container {
                flex: 1;
                border: 1px solid var(--border);
                border-radius: 12px;
                overflow: auto;
                background: white;
            }

            .req-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                font-size: 13px;
            }

            .req-grid th {
                background: #f8fafc;
                position: sticky;
                top: 0;
                padding: 12px 10px;
                text-align: left;
                border-bottom: 2px solid var(--border);
                color: var(--text-main);
                font-weight: 700;
                z-index: 3;
                white-space: nowrap;
            }

            .req-grid .grid-row td {
                padding: 10px;
                border-bottom: 1px solid #f1f5f9;
                transition: background 0.2s;
            }

            .req-grid .grid-row:hover {
                background: #f0f9ff !important;
                cursor: pointer;
            }

            .currency-tag {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
                background: #f1f5f9;
                color: var(--text-muted);
            }

            .status-dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 4px;
            }

            .status-dot.green { background: #10b981; }
            .status-dot.blue { background: #3b82f6; }

            .req-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 14px;
                background: white;
                border-radius: 10px;
                border: 1px solid var(--border);
                font-size: 12px;
                color: var(--text-muted);
            }

            /* Right Panel */
            .req-right-panel {
                width: 300px;
                max-width: 100%;
                max-height: 100%;
                min-height: 0;
                overflow-y: auto;
            }

            .req-filter-section {
                background: white;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid var(--border);
                box-shadow: var(--shadow-sm);
            }

            .req-filter-title {
                font-size: 16px;
                font-weight: 700;
                margin: 0 0 20px 0;
                color: var(--text-main);
                border-bottom: 2px solid var(--primary);
                padding-bottom: 8px;
            }

            .req-filter-subtitle {
                font-size: 13px;
                font-weight: 700;
                margin: 0 0 12px;
                color: var(--text-main);
            }

            .req-filter-group {
                margin-bottom: 16px;
            }

            .req-filter-group label {
                display: block;
                font-size: 11px;
                font-weight: 700;
                color: var(--text-muted);
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .req-text-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 13px;
                transition: all 0.2s;
                background: white;
            }

            .req-text-input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .req-date-range {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .req-date-input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 13px;
                transition: all 0.2s;
            }

            .req-date-input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .req-filter-divider {
                height: 1px;
                background: linear-gradient(to right, transparent, var(--border), transparent);
                margin: 20px 0;
            }

            .req-checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .req-checkbox-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 13px;
                color: var(--text-main);
                padding: 6px;
                border-radius: 6px;
                transition: background 0.2s;
            }

            .req-checkbox-label:hover { background: #f8fafc; }

            .req-checkbox-input {
                width: 16px;
                height: 16px;
                cursor: pointer;
                accent-color: var(--primary);
            }

            .req-filter-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 20px;
            }

            .req-btn-clear, .req-btn-search {
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                height: 38px;
            }

            .req-btn-clear {
                background: #fee2e2;
                color: #ef4444;
            }

            .req-btn-clear:hover { background: #fecaca; }

            .req-btn-search {
                background: #fbbf24;
                color: #78350f;
                box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
            }

            .req-btn-search:hover {
                background: #f59e0b;
                box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
                transform: translateY(-1px);
            }
            
            .action-btn.primary {
                background-color: var(--primary);
                color: white;
                border-color: var(--primary-dark);
            }
            
            .action-btn.primary:hover {
                background-color: var(--primary-dark);
            }
        </style>
    `;

    // Event Listeners
    const btnNew = container.querySelector('#btn-new-request');
    btnNew.addEventListener('click', () => {
        renderInvoiceRequestModal(wm, null); // Create mode
    });

    const rows = container.querySelectorAll('.grid-row');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const reqId = row.dataset.id;
            const reqData = requests.find(r => r.id === reqId);
            renderInvoiceRequestModal(wm, reqData); // Edit mode
        });
    });
}

function renderInvoiceRequestModal(wm, data) {
    const isNew = !data;
    const title = isNew ? 'Számla igény kiállítás' : `${data.id} - Számla várakozó`;

    // Simple mock data for tabs
    const mockItems = [
        { name: 'Szolgáltatás díj', quantity: 1, unit: 'db', price: 100000, vat: 27 },
        { name: 'Kiszállási díj', quantity: 1, unit: 'alkalom', price: 15000, vat: 27 }
    ];

    const content = `
        <div class="modal-tabs">
            <button class="modal-tab active" data-tab="overview">Áttekintő</button>
            <button class="modal-tab" data-tab="header">Fejléc</button>
            <button class="modal-tab" data-tab="items">Tételek</button>
            <button class="modal-tab" data-tab="vat">Áfák</button>
        </div>
        <div class="modal-content-body">
            <!-- TAB: Áttekintő (Overview) -->
            <div class="tab-pane active" id="tab-overview">
                <div class="info-panels-grid">
                    <div class="info-panel">
                        <h4>Kibocsátó</h4>
                        <p><strong>GAVÁ Villamosság Kft.</strong></p>
                        <p>1134 Budapest, Váci út 12.</p>
                        <p>Adószám: 12345678-2-41</p>
                    </div>
                    <div class="info-panel">
                        <h4>Vevő</h4>
                        <p><strong>${data ? data.partner : 'Válasszon partnert...'}</strong></p>
                        <p>${data ? '1066 Budapest, Teréz körút 4.' : ''}</p>
                    </div>
                    <div class="info-panel">
                        <h4>Dátumok</h4>
                        <p>Kiállítás: 2026.02.19</p>
                        <p>Teljesítés: 2026.02.19</p>
                        <p>Esedékesség: 2026.02.27</p>
                    </div>
                    <div class="info-panel highlight">
                        <h4>Végösszeg</h4>
                        <div class="total-display">
                            146 050 HUF
                        </div>
                        <div class="total-sub">Nettó: 115 000 HUF</div>
                    </div>
                </div>

                <h4 style="margin-top: 20px; margin-bottom: 10px;">Tételek összesítő</h4>
                <table class="simple-table">
                    <thead>
                        <tr>
                            <th>Megnevezés</th>
                            <th>Mennyiség</th>
                            <th>Egységár</th>
                            <th>Nettó</th>
                            <th>Bruttó</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity} ${item.unit}</td>
                                <td>${item.price.toLocaleString()}</td>
                                <td>${item.price.toLocaleString()}</td>
                                <td>${(item.price * 1.27).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- TAB: Fejléc (Header) -->
            <div class="tab-pane" id="tab-header" style="display: none;">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Példányszám</label>
                        <input type="number" value="2" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Sablon nyelv</label>
                        <select class="form-input">
                            <option>Magyar</option>
                            <option>Angol</option>
                            <option>Német</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Deviza</label>
                        <select class="form-input">
                            <option>HUF</option>
                            <option>EUR</option>
                            <option>USD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Megjegyzés</label>
                        <textarea class="form-input" rows="3"></textarea>
                    </div>
                     <div class="form-group">
                        <label>Előzmények</label>
                        <button class="action-btn">📜 Korábbi verziók</button>
                    </div>
                </div>
            </div>

            <!-- TAB: Tételek (Items) -->
            <div class="tab-pane" id="tab-items" style="display: none;">
                <div class="sub-tabs">
                    <button class="sub-tab active">Termék</button>
                    <button class="sub-tab">Szolgáltatás</button>
                    <button class="sub-tab">Egyéb</button>
                </div>
                <div style="padding: 10px 0;">
                    <button class="action-btn primary small">➕ Új tétel</button>
                </div>
                <table class="simple-table">
                    <thead>
                        <tr>
                            <th>Cikkszám</th>
                            <th>Megnevezés</th>
                            <th>Mennyiség</th>
                            <th>Me.</th>
                            <th>Egységár</th>
                            <th>Kedv.%</th>
                            <th>Nettó</th>
                            <th>Áfa%</th>
                            <th>Művelet</th>
                        </tr>
                    </thead>
                    <tbody>
                         ${mockItems.map(item => `
                            <tr>
                                <td>ITM-${Math.floor(Math.random() * 1000)}</td>
                                <td>${item.name}</td>
                                <td><input type="number" value="${item.quantity}" style="width: 50px;"></td>
                                <td>${item.unit}</td>
                                <td><input type="number" value="${item.price}" style="width: 80px;"></td>
                                <td>0</td>
                                <td>${item.price.toLocaleString()}</td>
                                <td>${item.vat}%</td>
                                <td><button class="icon-btn small">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- TAB: Áfák (VATs) -->
            <div class="tab-pane" id="tab-vat" style="display: none;">
                <h4>Áfa összesítő</h4>
                <table class="simple-table">
                    <thead>
                        <tr>
                            <th>Áfa kulcs</th>
                            <th>Nettó alap</th>
                            <th>Áfa érték</th>
                            <th>Bruttó</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>27%</td>
                            <td>115 000</td>
                            <td>31 050</td>
                            <td>146 050</td>
                        </tr>
                        <tr style="font-weight: bold; background: #f8fafc;">
                            <td>Összesen</td>
                            <td>115 000</td>
                            <td>31 050</td>
                            <td>146 050</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <style>
            .modal-tabs {
                display: flex;
                gap: 2px;
                border-bottom: 2px solid var(--border);
                margin-bottom: 20px;
            }
            .modal-tab {
                padding: 10px 20px;
                background: none;
                border: none;
                border-bottom: 2px solid transparent;
                cursor: pointer;
                font-weight: 600;
                color: var(--text-muted);
                transition: all 0.2s;
            }
            .modal-tab:hover {
                color: var(--primary);
                background: #f8fafc;
            }
            .modal-tab.active {
                color: var(--primary);
                border-bottom-color: var(--primary);
            }
            .info-panels-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            .info-panel {
                background: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid var(--border);
            }
            .info-panel.highlight {
                background: #eff6ff;
                border-color: #bfdbfe;
            }
            .info-panel h4 {
                margin: 0 0 10px 0;
                font-size: 13px;
                color: var(--text-muted);
                text-transform: uppercase;
            }
            .info-panel p {
                margin: 0 0 4px 0;
                font-size: 14px;
            }
            .total-display {
                font-size: 24px;
                font-weight: 700;
                color: var(--primary);
            }
            .total-sub {
                font-size: 13px;
                color: var(--text-muted);
            }
            .simple-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }
            .simple-table th {
                text-align: left;
                padding: 10px;
                background: #f1f5f9;
                border-bottom: 2px solid var(--border);
            }
            .simple-table td {
                padding: 10px;
                border-bottom: 1px solid var(--border);
            }
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .form-group label {
                display: block;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 6px;
            }
            .form-input {
                width: 100%;
                padding: 8px;
                border: 1px solid var(--border);
                border-radius: 6px;
            }
            .sub-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }
            .sub-tab {
                padding: 6px 12px;
                border-radius: 20px;
                border: 1px solid var(--border);
                background: white;
                cursor: pointer;
            }
            .sub-tab.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }
        </style>
    `;

    const modal = wm.createModal({
        title: title,
        width: 900,
        height: 700,
        content: content
    });

    // Tab Logic
    const tabs = modal.element.querySelectorAll('.modal-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            modal.element.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

            // Activate clicked tab
            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            const targetPane = modal.element.querySelector(`#tab-${targetId}`);
            if (targetPane) {
                targetPane.style.display = 'block';
            }
        });
    });
}
