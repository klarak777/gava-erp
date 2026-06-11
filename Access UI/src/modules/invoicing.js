import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderInvoicing(container, wm, subModuleId = null) {
    if (subModuleId === 'invoice-connections') {
        renderInvoiceConnections(container, wm);
        return;
    }

    if (subModuleId === 'invoice-requirement') {
        import('./invoice_request.js').then(module => {
            module.renderInvoiceRequestSearch(container, wm);
        });
        return;
    }

    console.log("Rendering Invoicing module...", subModuleId);
    const launcherContent = `
        <div class="launcher-grid">
            <div class="launcher-card" id="btn-invoice-search">
                <div class="l-icon">🔍</div>
                <div class="l-title">Számla keresés</div>
                <div class="l-desc">Meglévő számlák listázása, szűrése és kezelése.</div>
            </div>
            <div class="launcher-card" id="btn-invoice-connections">
                <div class="l-icon">🔗</div>
                <div class="l-title">Számla kapcsolatok</div>
                <div class="l-desc">Bizonylatok közötti összefüggések és láncolatok.</div>
            </div>
            <div class="launcher-card" id="btn-invoice-requirement">
                <div class="l-icon">📋</div>
                <div class="l-title">Számla igény Keresés</div>
                <div class="l-desc">Beszerzési és értékesítési számlaigények.</div>
            </div>
            <div class="launcher-card">
                <div class="l-icon">📄</div>
                <div class="l-title">Okirat kereső</div>
                <div class="l-desc">Számlával egy tekintet alá eső okiratok lekérése.</div>
            </div>
            <div class="launcher-card">
                <div class="l-icon">🚚</div>
                <div class="l-title">Számlázandó szállítólevelek</div>
                <div class="l-desc">Kiszállított tételek számlázási előkészítése.</div>
            </div>
            <div class="launcher-card">
                <div class="l-icon">🚀</div>
                <div class="l-title">Nyitó számla migrálás</div>
                <div class="l-desc">Korábbi rendszerekből áthozott nyitó tételek.</div>
            </div>
            <div class="launcher-card">
                <div class="l-icon">🗒️</div>
                <div class="l-title">navOSI napló</div>
                <div class="l-desc">NAV adatszolgáltatási események visszakövetése.</div>
            </div>
            <div class="launcher-card">
                <div class="l-icon">❌</div>
                <div class="l-title">navOSI tömeges érvénytelenítés</div>
                <div class="l-desc">Téves bizonylatok csoportos sztornózása.</div>
            </div>
            <div class="launcher-card">
                <div class="l-icon">👤</div>
                <div class="l-title">navOSI partner ellenőrző</div>
                <div class="l-desc">Adószámok és partneradatok NAV-szintű validálása.</div>
            </div>
            <div class="launcher-card">
                <div class="l-icon">📥</div>
                <div class="l-title">navOSI vevői számla lekérdezés</div>
                <div class="l-desc">NAV rendszerből érkező bejövő számlák fogadása.</div>
            </div>
            <div class="launcher-card">
                <div class="l-icon">📡</div>
                <div class="l-title">NAV adatszolgáltatás</div>
                <div class="l-desc">Online számla jelentések és hibaüzenetek.</div>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="view-header">
            <h1 class="view-title">Számlázás</h1>
            <p class="view-subtitle">Választható műveletek és lekérdezések.</p>
        </div>

        ${createCollapsibleSection('invoicing-main', 'Számlázás modulok', launcherContent)}

        <style>
            ${collapsibleSectionStyles}

            .launcher-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                padding: 24px 0;
            }
            .launcher-card {
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 24px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                text-align: left;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: var(--shadow);
                position: relative;
                overflow: hidden;
            }
            .launcher-card::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: var(--primary);
                opacity: 0;
                transition: opacity 0.3s;
            }
            .launcher-card:hover {
                transform: translateX(8px);
                border-color: var(--primary);
                box-shadow: var(--shadow-lg);
            }
            .launcher-card:hover::after {
                opacity: 1;
            }
            .l-icon {
                font-size: 32px;
                margin-bottom: 16px;
            }
            .l-title {
                font-size: 15px;
                font-weight: 700;
                margin-bottom: 8px;
                color: var(--text-main);
            }
            .l-desc {
                font-size: 12px;
                color: var(--text-muted);
                line-height: 1.4;
            }
        </style>
    `;

    // Event Listeners for Launcher
    const setupEvents = () => {
        const btnSearch = container.querySelector('#btn-invoice-search');
        if (btnSearch) {
            btnSearch.addEventListener('click', () => {
                if (wm && typeof wm.open === 'function') {
                    wm.open('invoice-search', 'Számla Keresés', renderInvoiceSearch);
                }
            });
        }
        const btnConnections = container.querySelector('#btn-invoice-connections');
        if (btnConnections) {
            btnConnections.addEventListener('click', () => {
                if (wm && typeof wm.open === 'function') {
                    wm.open('invoice-connections', 'Számla Kapcsolatok', renderInvoiceConnections);
                }
            });
        }

        const btnRequirement = container.querySelector('#btn-invoice-requirement');
        if (btnRequirement) {
            btnRequirement.addEventListener('click', () => {
                import('./invoice_request.js').then(module => {
                    if (wm && typeof wm.open === 'function') {
                        wm.open('invoice-requirement', 'Számla Igény Keresés', module.renderInvoiceRequestSearch);
                    }
                });
            });
        }

        // Handle direct sub-module navigation
        if (subModuleId && wm && typeof wm.open === 'function') {
            switch (subModuleId) {
                case 'invoice-search':
                    wm.open('invoice-search', 'Számla Keresés', renderInvoiceSearch);
                    break;
                case 'invoice-connections':
                    wm.open('invoice-connections', 'Számla Kapcsolatok', renderInvoiceConnections);
                    break;
                case 'invoice-requirement':
                    // wm.open('invoice-requirement', 'Számla igény', renderInvoiceRequirement);
                    break;
                case 'document-search':
                    // wm.open('document-search', 'Okirat kereső', renderDocumentSearch);
                    break;
                case 'nav-service':
                    // wm.open('nav-service', 'NAV adatszolgáltatatás', renderNavService);
                    break;
            }
        }
    };

    requestAnimationFrame(setupEvents);
}

// Advanced Grid View for Invoice Search
export function renderInvoiceSearch(container, wm) {
    // Generate dummy data with multi-currency and link info
    const invoices = [
        { id: 'SZ-2026/00145', partner: 'Tesco-Global Zrt.', date: '2026.02.10', due: '2026.03.12', performanceDate: '2026.02.10', vatPerformanceDate: '2026.02.10', type: 'Számla', paymentMethod: 'Átutalás', availableAmount: 0, net: 4500000, vat: 1215000, gross: 5715000, remainingAmount: 0, currency: 'HUF', status: 'Fizetve', nav: 'OK' },
        { id: 'SZ-2026/00144', partner: 'Sprint Kft.', date: '2026.01.15', due: '2026.01.30', performanceDate: '2026.01.15', vatPerformanceDate: '2026.01.15', type: 'Számla', paymentMethod: 'Átutalás', availableAmount: 0, net: 120000, vat: 32400, gross: 152400, remainingAmount: 152400, currency: 'HUF', status: 'Lejárt (11 nap)', nav: 'OK' },
        { id: 'SZ-2026/00143', partner: 'Auchan Magyarország Kft.', date: '2026.01.10', due: '2026.02.20', performanceDate: '2026.01.10', vatPerformanceDate: '2026.01.10', type: 'Számla', paymentMethod: 'Készpénz', availableAmount: 0, net: 6500, vat: 1755, gross: 8255, remainingAmount: 8255, currency: 'EUR', status: 'Nyitott', nav: 'OK' },
        { id: 'SZ-2026/00142', partner: 'Mol Nyrt.', date: '2026.01.05', due: '2026.01.20', performanceDate: '2026.01.05', vatPerformanceDate: '2026.01.05', type: 'Számla', paymentMethod: 'Átutalás', availableAmount: 0, net: 850000, vat: 229500, gross: 1079500, remainingAmount: 0, currency: 'HUF', status: 'Fizetve', nav: 'OK' },
        { id: 'SZ-2026/00146', partner: 'X-Trade Kft.', date: '2026.02.12', due: '2026.02.12', performanceDate: '2026.02.12', vatPerformanceDate: '2026.02.12', type: 'Sztornó', paymentMethod: 'Átutalás', availableAmount: 0, net: -450000, vat: -121500, gross: -571500, remainingAmount: 0, currency: 'HUF', status: 'Sztornozva', nav: 'Küldés alatt' }
    ];

    const formatNum = (n) => n.toLocaleString('hu-HU');

    container.innerHTML = `
        <div class="invoice-search-layout">
            <!-- Left Panel: Data Grid -->
            <div class="left-panel">
                <!-- Toolbar Actions -->
                <div class="grid-toolbar">
                    <div class="t-left">
                        <button class="action-btn">🖨️ Nyomtatás</button>
                        <button class="action-btn">📧 E-mail</button>
                        <button class="action-btn">↩️ Sztornó</button>
                        <div class="v-divider"></div>
                        <button class="action-btn">🔗 Kapcsolatok</button>
                        <button class="action-btn">📡 NAV beküldés</button>
                    </div>
                    <div class="t-right">
                        <button class="icon-btn-bordered" title="Oszlopok">▦</button>
                        <button class="icon-btn-bordered" title="Excel export">📊</button>
                        <button class="icon-btn-bordered" title="Frissítés">🔄</button>
                    </div>
                </div>

                <!-- Data Grid -->
                <div class="grid-container">
                    <table class="advanced-grid">
                        <thead>
                            <tr>
                                <th class="check-cell"><input type="checkbox"></th>
                                <th>Sorszám</th>
                                <th>Partner</th>
                                <th>Kiállítás dátum</th>
                                <th>Fizetési határidő</th>
                                <th>Teljesítés dátum</th>
                                <th>Áfa teljesítés dátum</th>
                                <th>Típus</th>
                                <th>Fizetés mód</th>
                                <th class="text-right">Felhasználható összeg</th>
                                <th class="text-right">Nettó végösszeg</th>
                                <th class="text-right">Áfa érték</th>
                                <th class="text-right">Bruttó végösszeg</th>
                                <th class="text-right">Fennmaradó összeg</th>
                                <th style="width: 100px;">Műveletek</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoices.map(inv => `
                                <tr class="grid-row inv-row ${inv.status.includes('Lejárt') ? 'delay-warning' : ''} ${inv.type === 'Sztornó' ? 'row-storno' : ''}" data-inv-id="${inv.id}" data-inv-partner="${inv.partner}" data-inv-status="${inv.status}">
                                    <td class="check-cell" onclick="event.stopPropagation()"><input type="checkbox"></td>
                                    <td class="bold font-mono">${inv.id}</td>
                                    <td>${inv.partner}</td>
                                    <td>${inv.date}</td>
                                    <td>${inv.due}</td>
                                    <td>${inv.performanceDate}</td>
                                    <td>${inv.vatPerformanceDate}</td>
                                    <td>${inv.type}</td>
                                    <td>${inv.paymentMethod}</td>
                                    <td class="text-right">${formatNum(inv.availableAmount)}</td>
                                    <td class="text-right">${formatNum(inv.net)}</td>
                                    <td class="text-right">${formatNum(inv.vat)}</td>
                                    <td class="text-right bold">${formatNum(inv.gross)}</td>
                                    <td class="text-right">${formatNum(inv.remainingAmount)}</td>
                                    <td class="actions-cell" onclick="event.stopPropagation()">
                                        <div class="row-actions">
                                            <button class="row-action-btn btn-save" title="Mentés">💾</button>
                                            <button class="row-action-btn btn-history" title="Fizetés élettörténet">📓</button>
                                            <button class="row-action-btn btn-money" title="Pénzügyi művelet">💰</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Grid Footer / Summary -->
                <div class="grid-footer">
                    <div class="f-left">
                        <span>Összesen: <strong>${invoices.length}</strong> bizonylat</span>
                        <span class="sep">|</span>
                        <span>Kiválasztva: <strong>0</strong></span>
                    </div>
                    <div class="f-right multi-currency-summary">
                        <div class="summary-group">
                            <span class="summary-label">HUF:</span>
                            <div class="summary-values">
                                <span>Net: 5,320,000</span>
                                <span class="sum-brutto">Bruttó: 6,756,500</span>
                            </div>
                        </div>
                        <div class="summary-group">
                            <span class="summary-label">EUR:</span>
                            <div class="summary-values">
                                <span>Net: 6,500</span>
                                <span class="sum-brutto">Bruttó: 8,255</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Panel: Filter Section -->
            <div class="right-panel">
                <div class="filter-section">
                    <h3 class="filter-title">Szűrő feltételek</h3>

                    <!-- Szűrőmezők -->
                    <div class="filter-group">
                        <label>Számlatípus</label>
                        <select class="select-input">
                            <option value="">Elóleg</option>
                            <option value="">Elóleg érvénytelenítése</option>
                            <option value="">Elóleg helyesbítés</option>
                            <option value="">Proforma</option>
                            <option value="" selected>Számla</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>Sorszám</label>
                        <input type="text" class="text-input" placeholder="Konkrét számlaszám keresése">
                    </div>

                    <div class="filter-group">
                        <label>Kibocsátó</label>
                        <select class="select-input">
                            <option value="">Saját telephely vagy cég szerinti szűrés</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>Partner</label>
                        <input type="text" class="text-input" placeholder="Vevő neve szerinti keresés">
                    </div>

                    <div class="filter-group">
                        <label>Kiállítás dátum (tól-ig)</label>
                        <div class="date-range">
                            <input type="date" class="date-input">
                            <span class="date-sep">-</span>
                            <input type="date" class="date-input">
                        </div>
                    </div>

                    <div class="filter-group">
                        <label>Fizetési határidő (tól-ig)</label>
                        <div class="date-range">
                            <input type="date" class="date-input">
                            <span class="date-sep">-</span>
                            <input type="date" class="date-input">
                        </div>
                    </div>

                    <div class="filter-group">
                        <label>Teljesítés dátum (tól-ig)</label>
                        <div class="date-range">
                            <input type="date" class="date-input">
                            <span class="date-sep">-</span>
                            <input type="date" class="date-input">
                        </div>
                    </div>

                    <div class="filter-group">
                        <label>Létrehozó</label>
                        <select class="select-input">
                            <option value="">A számlát rögzítő felhasználó neve</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>Fizetési mód</label>
                        <select class="select-input">
                            <option value="">Készpénz, Átutalás, stb.</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>Deviza</label>
                        <select class="select-input">
                            <option value="">HUF, EUR, USD, stb.</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>Termék</label>
                        <input type="text" class="text-input" placeholder="Tétel szintű keresés (mire számlázunk)">
                    </div>

                    <!-- Jelölőnégyzetek (Állapot szerinti szűrés) -->
                    <div class="filter-section-divider"></div>
                    <h4 class="filter-subtitle">Jelölőnégyzetek (Állapot szerinti szűrés)</h4>

                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Helyesbített / Helyesbítő</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Érvénytelenített / Érvénytelenítő</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Nincs fizetve / Fizetve</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Ideiglenes</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Lezárt</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Nyitó bizonylat</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Van okirat</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Nincs kopogtatva / Külsős számla</span>
                        </label>
                    </div>

                    <!-- Funkciógombok -->
                    <div class="filter-section-divider"></div>
                    <div class="filter-actions">
                        <button class="btn-clear" id="btn-clear-filters">🧹 Szűrési feltételek törlése</button>
                        <button class="btn-search" id="btn-search">🔍 Szűrés</button>
                        <button class="btn-primary" id="btn-new-invoice">➕ Új számla</button>
                        <button class="btn-secondary" id="btn-new-external-invoice">📄 Új külsős számla</button>
                        <button class="btn-dimension" id="btn-dimension-filter">📊 Dimenzió besoroltság szűrés</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dimenzió besoroltság szűrés felugró ablak -->
        <div class="modal-overlay" id="dimension-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Dimenzió besoroltság szűrés</h3>
                    <button class="modal-close" id="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="dimension-group">
                        <h4>Egyéb:</h4>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Besorolva</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Nincs besorolva</span>
                        </label>
                    </div>
                    <div class="dimension-group">
                        <h4>Könyvelés:</h4>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Besorolva</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="checkbox-input">
                            <span>Nincs besorolva</span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal-clear">🧹 Besoroltság szűrés törlése</button>
                    <button class="btn-modal-close" id="modal-close-btn">Bezárás</button>
                </div>
            </div>
        </div>

        <style>
            .invoice-search-layout {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 360px;
                height: 100%;
                gap: 12px;
                padding: 12px;
                background: #f1f5f9;
                min-height: 0;
            }

            /* Left Panel - Data Grid */
            .left-panel {
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-width: 0;
                min-height: 0;
            }

            /* Right Panel - Filter Section */
            .right-panel {
                width: 360px;
                max-width: 100%;
                max-height: 100%;
                min-height: 0;
                overflow-y: auto;
            }

            .filter-section {
                background: white;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid var(--border);
                box-shadow: var(--shadow-sm);
            }

            .filter-title {
                font-size: 16px;
                font-weight: 700;
                margin: 0 0 20px 0;
                color: var(--text-main);
                border-bottom: 2px solid var(--primary);
                padding-bottom: 8px;
            }

            .filter-subtitle {
                font-size: 13px;
                font-weight: 700;
                margin: 16px 0 12px 0;
                color: var(--text-main);
            }

            .filter-group {
                margin-bottom: 16px;
            }

            .filter-group label {
                display: block;
                font-size: 11px;
                font-weight: 700;
                color: var(--text-muted);
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .select-input, .text-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 13px;
                transition: all 0.2s;
                background: white;
            }

            .select-input:focus, .text-input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .date-range {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .date-input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 13px;
                transition: all 0.2s;
            }

            .date-input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .date-sep {
                color: var(--text-muted);
                font-weight: 700;
            }

            .filter-section-divider {
                height: 1px;
                background: linear-gradient(to right, transparent, var(--border), transparent);
                margin: 20px 0;
            }

            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .checkbox-label {
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

            .checkbox-label:hover {
                background: #f8fafc;
            }

            .checkbox-input {
                width: 16px;
                height: 16px;
                cursor: pointer;
                accent-color: var(--primary);
            }

            .filter-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 20px;
            }

            .btn-clear, .btn-search, .btn-dimension, .btn-primary, .btn-secondary {
                width: 100%;
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-clear {
                background: #f1f5f9;
                color: var(--text-main);
            }

            .btn-clear:hover {
                background: #e2e8f0;
            }

            .btn-search {
                background: #fbbf24;
                color: #78350f;
                box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
            }

            .btn-search:hover {
                background: #f59e0b;
                box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
                transform: translateY(-1px);
            }

            .btn-primary {
                background: #3b82f6;
                color: white;
            }

            .btn-primary:hover {
                background: #2563eb;
                transform: translateY(-1px);
            }

            .btn-secondary {
                background: #f1f5f9;
                color: var(--text-main);
                border: 1px solid var(--border);
            }

            .btn-secondary:hover {
                background: #e2e8f0;
            }

            .btn-dimension {
                background: #0ea5e9;
                color: white;
            }

            .btn-dimension:hover {
                background: #0284c7;
                transform: translateY(-1px);
            }

            /* Grid Toolbar */
            .grid-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 12px;
                background: white;
                border-radius: 12px;
                border: 1px solid var(--border);
                gap: 12px;
                flex-wrap: wrap;
            }

            .t-left, .t-right {
                display: flex;
                gap: 8px;
                align-items: center;
                flex-wrap: wrap;
            }

            .t-left {
                flex: 1 1 320px;
                min-width: 0;
            }

            .t-right {
                margin-left: auto;
            }

            .action-btn {
                padding: 8px 14px;
                border: 1px solid var(--border);
                background: white;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
            }

            .action-btn:hover {
                background: #f8fafc;
                border-color: var(--primary);
            }

            .btn-blue {
                background: var(--primary) !important;
                color: white !important;
                border-color: var(--primary) !important;
            }

            .btn-blue:hover {
                background: #2563eb !important;
                transform: translateY(-1px);
            }

            .icon-btn-bordered {
                padding: 8px 12px;
                border: 1px solid var(--border);
                background: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .icon-btn-bordered:hover {
                background: #f8fafc;
                border-color: var(--primary);
            }

            .v-divider {
                width: 1px;
                height: 24px;
                background: var(--border);
            }

            /* Grid Container */
            .grid-container {
                flex: 1;
                border: 1px solid var(--border);
                border-radius: 12px;
                overflow: auto;
                background: white;
            }

            .advanced-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                font-size: 13px;
            }

            .advanced-grid th {
                background: #f8fafc;
                position: sticky;
                top: 0;
                padding: 12px 10px;
                text-align: left;
                border-bottom: 2px solid var(--border);
                color: var(--text-main);
                font-weight: 700;
                z-index: 10;
            }

            .grid-row td {
                padding: 10px;
                border-bottom: 1px solid #f1f5f9;
                transition: background 0.2s;
            }

            .grid-row:hover {
                background: #f0f9ff !important;
                cursor: pointer;
            }

            .row-storno td {
                color: #94a3b8;
                font-style: italic;
            }

            .delay-warning td {
                background: #fffbeb;
            }

            .row-actions {
                display: flex;
                gap: 6px;
                justify-content: flex-start;
                align-items: center;
            }

            .row-action-btn {
                background: #f1f5f9;
                border: 1px solid var(--border);
                border-radius: 6px;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
                padding: 0;
            }

            .row-action-btn:hover {
                background: white;
                border-color: var(--primary);
                transform: scale(1.1);
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }

            .check-cell {
                width: 40px;
                text-align: center;
            }

            .expand-cell {
                width: 32px;
                text-align: center;
                cursor: pointer;
                color: var(--text-muted);
            }

            .text-right {
                text-align: right;
            }

            .text-center {
                text-align: center;
            }

            .bold {
                font-weight: 700;
            }

            .font-mono {
                font-family: 'JetBrains Mono', 'Courier New', monospace;
                font-size: 12px;
            }

            .currency-tag {
                background: #f1f5f9;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 700;
                font-size: 10px;
                color: #475569;
            }

            .status-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            }

            .status-badge.green {
                background: #dcfce7;
                color: #166534;
            }

            .status-badge.red {
                background: #fee2e2;
                color: #991b1b;
            }

            .status-badge.orange {
                background: #fed7aa;
                color: #9a3412;
            }

            .status-badge.blue {
                background: #dbeafe;
                color: #1e40af;
            }

            .status-badge.gray {
                background: #f1f5f9;
                color: #475569;
            }

            .link-icon {
                color: var(--primary);
                cursor: help;
                font-size: 14px;
            }

            /* Grid Footer */
            .grid-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                background: white;
                border-radius: 12px;
                border: 1px solid var(--border);
            }

            .f-left, .f-right {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .sep {
                color: var(--text-muted);
            }

            .multi-currency-summary {
                display: flex;
                gap: 24px;
            }

            .summary-group {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 4px 12px;
                background: #f8fafc;
                border-radius: 8px;
                border: 1px solid var(--border);
            }

            .summary-label {
                font-weight: 800;
                font-size: 11px;
                color: var(--text-muted);
            }

            .summary-values {
                display: flex;
                flex-direction: column;
                font-size: 11px;
                line-height: 1.2;
            }

            .sum-brutto {
                font-weight: 700;
                color: var(--text-main);
            }

            @media (max-width: 1200px) {
                .invoice-search-layout {
                    grid-template-columns: 1fr;
                    height: auto;
                }

                .right-panel {
                    width: 100%;
                }
            }

            /* Modal Styles */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }

            .modal-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--border);
            }

            .modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: var(--text-main);
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-muted);
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                transition: all 0.2s;
            }

            .modal-close:hover {
                background: #f1f5f9;
                color: var(--text-main);
            }

            .modal-body {
                padding: 20px;
            }

            .dimension-group {
                margin-bottom: 20px;
            }

            .dimension-group h4 {
                font-size: 14px;
                font-weight: 700;
                margin: 0 0 12px 0;
                color: var(--text-main);
            }

            .modal-footer {
                display: flex;
                gap: 8px;
                padding: 20px;
                border-top: 1px solid var(--border);
            }

            .btn-modal-clear, .btn-modal-close {
                flex: 1;
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-modal-clear {
                background: #f1f5f9;
                color: var(--text-main);
            }

            .btn-modal-clear:hover {
                background: #e2e8f0;
            }

            .btn-modal-close {
                background: var(--primary);
                color: white;
            }

            .btn-modal-close:hover {
                background: #2563eb;
                transform: translateY(-1px);
            }
        </style>
    `;

    function getStatusClass(status) {
        if (status === 'Fizetve') return 'green';
        if (status.includes('Lejárt')) return 'red';
        if (status === 'Nyitott') return 'orange';
        if (status === 'Sztornozva') return 'gray';
        return '';
    }

    const setupEvents = () => {
        // Dimenzió besoroltság szűrés modal megnyitása
        const btnDimension = container.querySelector('#btn-dimension-filter');
        const dimensionModal = container.querySelector('#dimension-modal');
        const modalClose = container.querySelector('#modal-close');
        const modalCloseBtn = container.querySelector('#modal-close-btn');

        if (btnDimension && dimensionModal) {
            btnDimension.addEventListener('click', () => {
                dimensionModal.style.display = 'flex';
            });
        }

        if (modalClose && dimensionModal) {
            modalClose.addEventListener('click', () => {
                dimensionModal.style.display = 'none';
            });
        }

        if (modalCloseBtn && dimensionModal) {
            modalCloseBtn.addEventListener('click', () => {
                dimensionModal.style.display = 'none';
            });
        }

        // Modal overlay click to close
        if (dimensionModal) {
            dimensionModal.addEventListener('click', (e) => {
                if (e.target === dimensionModal) {
                    dimensionModal.style.display = 'none';
                }
            });
        }

        // Szűrés gomb
        const btnSearch = container.querySelector('#btn-search');
        if (btnSearch) {
            btnSearch.addEventListener('click', () => {
                console.log("Szűrés indítása...");
                // Itt a valódi szűrési logika lenne
            });
        }

        // Szűrési feltételek törlése
        const btnClearFilters = container.querySelector('#btn-clear-filters');
        if (btnClearFilters) {
            btnClearFilters.addEventListener('click', () => {
                console.log("Szűrési feltételek törlése...");
                // Itt törölnénk az összes mezőt
                container.querySelectorAll('.text-input').forEach(input => {
                    input.value = '';
                });
                container.querySelectorAll('.date-input').forEach(input => {
                    input.value = '';
                });
                container.querySelectorAll('.checkbox-input').forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        }

        // Új számla gomb
        const btnNewInvoice = container.querySelector('#btn-new-invoice');
        if (btnNewInvoice) {
            btnNewInvoice.addEventListener('click', () => {
                console.log("Új számla létrehozása...");
                // Itt nyílna meg az új számla ablak
                if (wm && typeof wm.open === 'function') {
                    wm.open('invoice-issuance', 'Számla kiállítás', renderInvoiceIssuance);
                }

            });
        }

        // Új külsős számla gomb
        const btnNewExternalInvoice = container.querySelector('#btn-new-external-invoice');
        if (btnNewExternalInvoice) {
            btnNewExternalInvoice.addEventListener('click', () => {
                if (wm && typeof wm.open === 'function') {
                    wm.open('invoice-issuance', 'Számla kiállítás – Külsős', (c, w) => renderInvoiceIssuance(c, w, 'new'));
                }
            });
        }

        // Sor kattintás → Számla kiállítás (5 fül)
        container.querySelectorAll('.inv-row').forEach(row => {
            row.addEventListener('click', () => {
                const invId = row.dataset.invId;
                const invPartner = row.dataset.invPartner;
                if (wm && typeof wm.open === 'function') {
                    wm.open('invoice-issuance', `Számla kiállítás – ${invId}`, (c, w) => renderInvoiceIssuance(c, w, 'view', { id: invId, partner: invPartner }));
                }
            });
        });

        // 💰 Pénz ikon → rendszerüzenet
        container.querySelectorAll('.btn-money').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.inv-row');
                const invId = row ? row.dataset.invId : '';
                showInvoiceAlert(container, `A kiválasztott számla (${invId}) még nincs lezárva!`);
            });
        });

        // 📓 Napló ikon → Fizetés élettörténet popup
        container.querySelectorAll('.btn-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.inv-row');
                const invId = row ? row.dataset.invId : '';
                const invPartner = row ? row.dataset.invPartner : '';
                showPaymentHistory(container, invId, invPartner);
            });
        });

        // 💾 Mentés ikon
        container.querySelectorAll('.btn-save').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showInvoiceAlert(container, 'Mentés sikeres!');
            });
        });

        // Keyboard Navigation (F5 for search)
        container.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                console.log("Triggering Search...");
                if (btnSearch) btnSearch.click();
            }
        });

        // Trigger search on Enter in any input
        container.querySelectorAll('.text-input, .date-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log("Enter pressed, searching...");
                    if (btnSearch) btnSearch.click();
                }
            });
        });

        setupCollapsibleSections(container, 'module-section');
    };
    requestAnimationFrame(setupEvents);
}

// Helper: rendszerüzenet toast
function showInvoiceAlert(container, msg) {
    let toast = container.querySelector('.inv-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'inv-toast';
        container.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// Helper: Fizetés élettörténet popup
function showPaymentHistory(container, invId, partner) {
    let overlay = container.querySelector('#payment-history-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'payment-history-overlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3>Fizetés élettörténet</h3>
                    <button class="modal-close" id="ph-close">✕</button>
                </div>
                <div class="modal-body" id="ph-body"></div>
                <div class="modal-footer">
                    <button class="btn-modal-close" id="ph-close-btn">Bezárás</button>
                </div>
            </div>
        `;
        container.appendChild(overlay);
        overlay.querySelector('#ph-close').addEventListener('click', () => overlay.style.display = 'none');
        overlay.querySelector('#ph-close-btn').addEventListener('click', () => overlay.style.display = 'none');
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
    }
    const body = overlay.querySelector('#ph-body');
    body.innerHTML = `
        <p style="margin:0 0 12px;font-size:13px;color:#64748b;"><strong>${invId}</strong> – ${partner}</p>
        <table class="items-grid" style="width:100%;font-size:13px;">
            <thead><tr>
                <th>Dátum</th><th>Esemény</th><th>Összeg</th><th>Deviza</th><th>Felhasználó</th>
            </tr></thead>
            <tbody>
                <tr><td>2026.02.10</td><td>Számla kiállítva</td><td class="text-right">5 715 000</td><td>HUF</td><td>Kiss Péter</td></tr>
                <tr><td>2026.02.15</td><td>Részfizetés érkezett</td><td class="text-right">2 000 000</td><td>HUF</td><td>Rendszer</td></tr>
                <tr><td>2026.03.01</td><td>Végső kifizetés</td><td class="text-right">3 715 000</td><td>HUF</td><td>Rendszer</td></tr>
                <tr style="font-weight:700;background:#f0fdf4;"><td colspan="2">Egyenleg</td><td class="text-right">0</td><td>HUF</td><td>–</td></tr>
            </tbody>
        </table>
    `;
    overlay.style.display = 'flex';
}

// Invoice Issuance Popup (Számla kiállítás)
export function renderInvoiceIssuance(container, wm, mode = 'new', invoiceData = null) {
    const isViewMode = mode === 'view';
    container.innerHTML = `
        <div class="issuance-layout">
            <!-- Tabs Navigation -->
            <div class="issuance-tabs">
                <button class="issuance-tab-link active" data-tab="fejlec">Fejléc</button>
                <button class="issuance-tab-link" data-tab="attekinto">Áttekintő</button>
                <button class="issuance-tab-link" data-tab="afak">Áfák</button>
                ${isViewMode ? `
                <button class="issuance-tab-link" data-tab="tetelek">Tételek</button>
                <button class="issuance-tab-link" data-tab="eladasi">Eladási tételek</button>
                ` : ''}
            </div>

            <!-- Tab Contents -->
            <div class="issuance-content">
                <!-- Tab 1: Fejléc -->
                <div class="issuance-tab-content active" id="tab-fejlec">
                    <div class="section-title">Partner és adózási adatok</div>
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label>Partner</label>
                            <div class="input-with-action">
                                <input type="text" class="issuance-input" placeholder="Auto-complete kereső...">
                                <button class="small-action-btn" title="Keresés">🔍</button>
                                <button class="small-action-btn" title="Partner frissítése">🔄</button>
                                <button class="small-action-btn" title="Új partner">＋</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Adószám</label>
                            <input type="text" class="issuance-input" placeholder="Automatikusan töltődik">
                        </div>
                        <div class="form-group">
                            <label>EU adószám</label>
                            <input type="text" class="issuance-input" placeholder="Automatikusan töltődik">
                        </div>
                        <div class="form-group">
                            <label>Külföldi adószám</label>
                            <input type="text" class="issuance-input" placeholder="Automatikusan töltődik">
                        </div>
                        <div class="form-group">
                            <label>Magánsz. adóazon.</label>
                            <input type="text" class="issuance-input">
                        </div>
                        <div class="form-group">
                            <label>Csoportos adószám</label>
                            <input type="text" class="issuance-input">
                        </div>
                    </div>

                    <div class="section-title">Időpontok és pénzügyi paraméterek</div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Kiállítás dátuma</label>
                            <input type="date" class="issuance-input" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Fizetési határidő</label>
                            <input type="date" class="issuance-input" value="${new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Számviteli teljesítés</label>
                            <input type="date" class="issuance-input" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>ÁFA teljesítés</label>
                            <input type="date" class="issuance-input" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Könyvelés dátuma</label>
                            <input type="date" class="issuance-input" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Számviteli időszak (tól-ig)</label>
                            <div class="issuance-date-range">
                                <input type="date" class="issuance-input">
                                <span class="date-sep">-</span>
                                <input type="date" class="issuance-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Számla típusa</label>
                            <select class="issuance-select">
                                <option>Számla</option>
                                <option>Előleg</option>
                                <option>Proforma</option>
                                <option>Helyesbítő</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Kibocsátó</label>
                            <select class="issuance-select">
                                <option>Központi telephely</option>
                                <option>Budapesti iroda</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Bankszámlaszám</label>
                            <select class="issuance-select">
                                <option>OTP HUF - 11700000-00000000</option>
                                <option>K&H EUR - 10400000-00000000</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Szállítási cím</label>
                            <input type="text" class="issuance-input">
                        </div>
                        <div class="form-group">
                            <label>Szállítási mód</label>
                            <select class="issuance-select">
                                <option>Saját fuvar</option>
                                <option>Futár</option>
                                <option>Átvevő</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Deviza</label>
                            <select class="issuance-select">
                                <option>HUF</option>
                                <option>EUR</option>
                                <option>USD</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Fizetési mód</label>
                            <select class="issuance-select">
                                <option>Átutalás</option>
                                <option>Készpénz</option>
                                <option>Bankkártya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ÁFA kategória</label>
                            <select class="issuance-select">
                                <option>27%</option>
                                <option>18%</option>
                                <option>5%</option>
                                <option>TAM</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Nyelv</label>
                            <select class="issuance-select">
                                <option>Magyar</option>
                                <option>Angol</option>
                                <option>Német</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Árfolyam</label>
                            <input type="number" class="issuance-input" value="1.00" step="0.01">
                        </div>
                    </div>

                    <div class="section-title">Megjegyzések és gombok</div>
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label>Kézi számla megjegyzés</label>
                            <textarea class="issuance-textarea" placeholder="A számlán megjelenő szöveg..."></textarea>
                        </div>
                        <div class="form-group full-width">
                            <label>Generált számla megjegyzés</label>
                            <textarea class="issuance-textarea" placeholder="Automatikus rendszerszöveg..." readonly></textarea>
                        </div>
                        <div class="form-group full-width">
                            <div class="form-actions">
                                <button class="secondary-btn btn-dense">Könyvelés adatok</button>
                                <button class="primary-btn btn-dense">Rögzítés</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 2: Áttekintő -->
                <div class="issuance-tab-content" id="tab-attekinto">
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-title">Kiállító / Átvevő adatai</div>
                            <div class="summary-value">Minta Kft. • Partner Kft.</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-title">Dátumok</div>
                            <div class="summary-value">Kiállítás, Teljesítés, Határidő</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-title">Fizetési mód</div>
                            <div class="summary-value">Átutalás</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-title">Deviza / Árfolyam</div>
                            <div class="summary-value">HUF • 1.00</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-title">Végösszegek</div>
                            <div class="summary-value">Nettó • ÁFA • Bruttó</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-title">Fizetett / Fennmaradó</div>
                            <div class="summary-value">0 HUF / 0 HUF</div>
                        </div>
                    </div>

                    <div class="table-block">
                        <h4>Számla tételek</h4>
                        <div class="table-scroll-container">
                            <table class="items-grid">
                                <thead>
                                    <tr>
                                        <th style="width: 80px;">Cikkszám</th>
                                        <th>Megnevezés</th>
                                        <th style="width: 110px;">Áfa kategória</th>
                                        <th style="width: 80px;">Mennyiség</th>
                                        <th style="width: 120px;">Egységár</th>
                                        <th style="width: 90px;">Áfa</th>
                                        <th style="width: 120px;">Nettó érték</th>
                                        <th style="width: 120px;">Áfa érték</th>
                                        <th style="width: 120px;">Bruttó érték</th>
                                        <th style="width: 80px;">Visszáru</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>PRD-001</td>
                                        <td>Minta termék</td>
                                        <td>27%</td>
                                        <td class="text-right">1</td>
                                        <td class="text-right">10 000</td>
                                        <td class="text-right">2 700</td>
                                        <td class="text-right">10 000</td>
                                        <td class="text-right">2 700</td>
                                        <td class="text-right">12 700</td>
                                        <td class="text-center">-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="table-block">
                        <h4>Könyvelési összesítő táblázat</h4>
                        <div class="table-scroll-container">
                            <table class="items-grid">
                                <thead>
                                    <tr>
                                        <th>Megnevezés</th>
                                        <th style="width: 110px;">Áfa kategória</th>
                                        <th style="width: 90px;">Áfa</th>
                                        <th style="width: 140px;">Főkönyvi szám</th>
                                        <th style="width: 140px;">Költséghely</th>
                                        <th style="width: 160px;">Nettó összeg (deviza / Ft)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Áruértékesítés</td>
                                        <td>27%</td>
                                        <td class="text-right">2 700</td>
                                        <td>9110</td>
                                        <td>Értékesítés</td>
                                        <td class="text-right">10 000 / 10 000</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Tab 3: Áfák -->
                <div class="issuance-tab-content" id="tab-afak">
                    <div class="table-block">
                        <h4>Áfa összesítő a számla tételekből</h4>
                        <div class="table-scroll-container">
                            <table class="items-grid">
                                <thead>
                                    <tr>
                                        <th style="width: 120px;">ÁFA kulcs</th>
                                        <th style="width: 160px;">Adóalap</th>
                                        <th style="width: 160px;">Áfa összege</th>
                                        <th style="width: 160px;">Bruttó</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>27%</td>
                                        <td class="text-right">10 000</td>
                                        <td class="text-right">2 700</td>
                                        <td class="text-right">12 700</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="table-block">
                        <h4>Áfa összesítő a besorolás tételekből</h4>
                        <div class="table-scroll-container">
                            <table class="items-grid">
                                <thead>
                                    <tr>
                                        <th style="width: 120px;">ÁFA kulcs</th>
                                        <th style="width: 160px;">Adóalap</th>
                                        <th style="width: 160px;">Áfa összege</th>
                                        <th style="width: 160px;">Bruttó</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>27%</td>
                                        <td class="text-right">10 000</td>
                                        <td class="text-right">2 700</td>
                                        <td class="text-right">12 700</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                ${isViewMode ? `
                <!-- Tab 4: Tételek (3 alfüllel) -->
                <div class="issuance-tab-content" id="tab-tetelek">
                    <div class="sub-tabs">
                        <button class="sub-tab-link active" data-subtab="alap">Alap adatok</button>
                        <button class="sub-tab-link" data-subtab="dimenzio">Dimenzió besorolás</button>
                        <button class="sub-tab-link" data-subtab="szallito">Szállítólevél kapcsolat</button>
                    </div>
                    <div class="sub-tab-content active" id="subtab-alap">
                        <div class="table-block">
                            <h4>Számla tételek – Alap adatok</h4>
                            <div class="table-scroll-container">
                                <table class="items-grid">
                                    <thead><tr>
                                        <th>Cikkszám</th><th>Megnevezés</th><th>Mennyiség</th><th>ME</th>
                                        <th class="text-right">Egységár</th><th class="text-right">Nettó</th>
                                        <th class="text-right">ÁFA</th><th class="text-right">Bruttó</th>
                                    </tr></thead>
                                    <tbody>
                                        <tr><td>PRD-001</td><td>Minta termék A</td><td class="text-right">10</td><td>db</td><td class="text-right">450 000</td><td class="text-right">4 500 000</td><td class="text-right">1 215 000</td><td class="text-right">5 715 000</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="sub-tab-content" id="subtab-dimenzio">
                        <div class="table-block">
                            <h4>Dimenzió besorolás</h4>
                            <div class="table-scroll-container">
                                <table class="items-grid">
                                    <thead><tr>
                                        <th>Tétel</th><th>Főkönyvi szám</th><th>Költséghely</th><th>Projekt</th><th class="text-right">Nettó összeg</th>
                                    </tr></thead>
                                    <tbody>
                                        <tr><td>Minta termék A</td><td>9110</td><td>Értékesítés</td><td>–</td><td class="text-right">4 500 000</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="sub-tab-content" id="subtab-szallito">
                        <div class="table-block">
                            <h4>Szállítólevél kapcsolat</h4>
                            <div class="table-scroll-container">
                                <table class="items-grid">
                                    <thead><tr>
                                        <th>Szállítólevél sz.</th><th>Tétel</th><th>Mennyiség</th><th>Dátum</th><th>Státusz</th>
                                    </tr></thead>
                                    <tbody>
                                        <tr><td>SZL-2026/00142</td><td>Minta termék A</td><td class="text-right">10</td><td>2026.02.08</td><td><span style="color:#10b981;font-weight:700;">Számlázva</span></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 5: Eladási tételek -->
                <div class="issuance-tab-content" id="tab-eladasi">
                    <div class="table-block">
                        <h4>Eladási tételek</h4>
                        <div class="table-scroll-container">
                            <table class="items-grid">
                                <thead><tr>
                                    <th>Cikkszám</th><th>Megnevezés</th><th>Mennyiség</th><th>ME</th>
                                    <th class="text-right">Eladási egységár</th><th class="text-right">Engedmény %</th>
                                    <th class="text-right">Nettó ár</th><th class="text-right">Bruttó ár</th>
                                    <th>Raktár</th>
                                </tr></thead>
                                <tbody>
                                    <tr><td>PRD-001</td><td>Minta termék A</td><td class="text-right">10</td><td>db</td><td class="text-right">500 000</td><td class="text-right">10%</td><td class="text-right">450 000</td><td class="text-right">571 500</td><td>Központi raktár</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Action Buttons -->
            <div class="issuance-footer">
                <button class="secondary-btn btn-dense" id="btn-cancel-issuance">Mégse</button>
                <div style="flex: 1;"></div>
                <button class="secondary-btn btn-dense" style="margin-right: 8px;">Mentés piszkozatként</button>
                <button class="primary-btn btn-dense" style="background: #166534 !important;">✔️ Számla Kiállítása</button>
            </div>
        </div>

        <style>
            .issuance-layout {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: white;
            }

            .issuance-tabs {
                display: flex;
                background: #f8fafc;
                border-bottom: 1px solid var(--border);
                padding: 0 16px;
            }

            .issuance-tab-link {
                padding: 14px 20px;
                background: none;
                border: none;
                border-bottom: 2px solid transparent;
                font-size: 13px;
                font-weight: 700;
                color: var(--text-muted);
                cursor: pointer;
                transition: all 0.2s;
            }

            .issuance-tab-link:hover {
                color: var(--primary);
            }

            .issuance-tab-link.active {
                color: var(--primary);
                border-bottom-color: var(--primary);
            }

            .issuance-content {
                flex: 1;
                padding: 24px;
                overflow-y: auto;
            }

            .issuance-tab-content {
                display: none;
                height: 100%;
            }

            .issuance-tab-content.active {
                display: block;
            }

            .form-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                max-width: 800px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .form-group.full-width {
                grid-column: 1 / -1;
            }

            .form-group label {
                font-size: 11px;
                font-weight: 800;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .required { color: #ef4444; }

            .issuance-input, .issuance-select, .issuance-textarea {
                padding: 10px 12px;
                border: 1px solid var(--border);
                border-radius: 8px;
                font-size: 14px;
                background: white;
                outline: none;
                transition: all 0.2s;
            }

            .issuance-input:focus, .issuance-select:focus, .issuance-textarea:focus {
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .issuance-textarea {
                height: 80px;
                resize: vertical;
            }

            .input-with-action {
                display: flex;
                gap: 8px;
            }

            .input-with-action input { flex: 1; }

            .small-action-btn {
                width: 40px;
                background: #f1f5f9;
                border: 1px solid var(--border);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .small-action-btn:hover { background: #e2e8f0; border-color: var(--primary); }

            .section-title {
                margin: 20px 0 12px;
                font-size: 12px;
                font-weight: 800;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .issuance-date-range {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
            }

            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 12px;
                margin-bottom: 16px;
            }

            .summary-card {
                background: #f8fafc;
                border: 1px solid var(--border);
                border-radius: 10px;
                padding: 12px;
            }

            .summary-title {
                font-size: 11px;
                font-weight: 800;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
            }

            .summary-value {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-main);
            }

            .table-block {
                margin-top: 16px;
            }

            .table-block h4 {
                margin: 0 0 8px;
                font-size: 13px;
                font-weight: 800;
                color: var(--text-main);
            }

            .table-scroll-container {
                max-height: 320px;
                overflow: auto;
                border: 1px solid var(--border);
                border-radius: 10px;
                background: white;
            }

            .items-grid {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }

            .items-grid th {
                background: #f8fafc;
                padding: 10px;
                text-align: left;
                border-bottom: 2px solid var(--border);
                font-weight: 700;
                position: sticky;
                top: 0;
                z-index: 1;
            }

            .items-grid td {
                padding: 8px;
                border-bottom: 1px solid #f1f5f9;
            }

            .issuance-footer {
                padding: 16px 24px;
                background: white;
                border-top: 1px solid var(--border);
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .checkbox-field label {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }

            .checkbox-field input {
                width: 18px;
                height: 18px;
            }
        </style>

        <style>
            /* Toast notification */
            .inv-toast {
                position: fixed;
                bottom: 32px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: #1e293b;
                color: white;
                padding: 12px 24px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 9999;
                white-space: nowrap;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            }
            .inv-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            /* Sub-tabs (inside Tételek tab) */
            .sub-tabs {
                display: flex;
                border-bottom: 1px solid var(--border);
                margin-bottom: 16px;
                gap: 0;
            }
            .sub-tab-link {
                padding: 10px 18px;
                background: none;
                border: none;
                border-bottom: 2px solid transparent;
                font-size: 12px;
                font-weight: 700;
                color: var(--text-muted);
                cursor: pointer;
                transition: all 0.2s;
            }
            .sub-tab-link:hover { color: var(--primary); }
            .sub-tab-link.active {
                color: var(--primary);
                border-bottom-color: var(--primary);
            }
            .sub-tab-content { display: none; }
            .sub-tab-content.active { display: block; }
        </style>
    `;

    const setupEvents = () => {
        // Tab switching logic
        const tabs = container.querySelectorAll('.issuance-tab-link');
        const contents = container.querySelectorAll('.issuance-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                container.querySelector(`#tab-${target}`).classList.add('active');
            });
        });

        // Cancel button
        const btnCancel = container.querySelector('#btn-cancel-issuance');
        if (btnCancel && wm) {
            btnCancel.addEventListener('click', () => {
                wm.close('invoice-issuance');
            });
        }

        // Sub-tab switching (Tételek fül alfülei)
        const subTabs = container.querySelectorAll('.sub-tab-link');
        const subContents = container.querySelectorAll('.sub-tab-content');
        subTabs.forEach(st => {
            st.addEventListener('click', () => {
                const target = st.dataset.subtab;
                subTabs.forEach(t => t.classList.remove('active'));
                subContents.forEach(c => c.classList.remove('active'));
                st.classList.add('active');
                const targetEl = container.querySelector(`#subtab-${target}`);
                if (targetEl) targetEl.classList.add('active');
            });
        });

    };

    requestAnimationFrame(setupEvents);
}

// Számla Kapcsolatok Modul (Invoice Connections Module)
function renderInvoiceConnections(container, wm) {
    // Mock Data - Invoices with utilization info (Woodpecker v2.1 requirement)
    const invoices = [
        { id: 'SZ-2026/00145', type: 'Végszámla', partner: 'Tesco-Global Zrt.', performanceDate: '2026.02.10', totalAmount: 5715000, usedAmount: 50000, totalUsedAmount: 50000, currency: 'HUF', hasConnection: true, status: 'Aktív' },
        { id: 'EL-2026/00010', type: 'Előleg', partner: 'Tesco-Global Zrt.', performanceDate: '2026.01.15', totalAmount: 100000, usedAmount: 50000, totalUsedAmount: 50000, currency: 'HUF', hasConnection: true, status: 'Aktív' },
        { id: 'SZ-2026/00146', type: 'Sztornó', partner: 'X-Trade Kft.', performanceDate: '2026.02.12', totalAmount: -571500, usedAmount: 0, totalUsedAmount: 0, currency: 'HUF', hasConnection: true, status: 'Érvénytelenített' },
        { id: 'SZ-2026/00144', type: 'Számla', partner: 'Sprint Kft.', performanceDate: '2026.01.15', totalAmount: 152400, usedAmount: 0, totalUsedAmount: 0, currency: 'HUF', hasConnection: false, status: 'Aktív' },
        { id: 'HEL-2026/00005', type: 'Helyesbítő', partner: 'Auchan Magyarország Kft.', performanceDate: '2026.02.05', totalAmount: 1200, usedAmount: 0, totalUsedAmount: 1200, currency: 'EUR', hasConnection: true, status: 'Aktív' },
        { id: 'SZ-2026/00142', type: 'Számla', partner: 'Mol Nyrt.', performanceDate: '2026.01.20', totalAmount: 1079500, usedAmount: 1079500, totalUsedAmount: 1079500, currency: 'HUF', hasConnection: true, status: 'Rendezett' },
    ];

    const formatNum = (n, currency = '') => {
        return (n ? n.toLocaleString('hu-HU') : '0') + (currency ? ` ${currency}` : '');
    };

    container.innerHTML = `
        <div class="conn-layout">
            <!-- Left Panel: Invoice Grid -->
            <div class="conn-left-panel">
                <!-- Toolbar -->
                <div class="conn-toolbar">
                    <div class="t-left">
                        <button class="action-btn">🔗 Új kapcsolat</button>
                        <button class="action-btn">❌ Kapcsolat törlés</button>
                        <div class="v-divider"></div>
                        <button class="action-btn">🌳 Fából fa nézet</button>
                        <button class="action-btn">🖨️ Nyomtatás</button>
                    </div>
                    <div class="t-right">
                        <button class="icon-btn-bordered" title="Oszlopok">▦</button>
                        <button class="icon-btn-bordered" title="Excel export">📊</button>
                        <button class="icon-btn-bordered" title="Frissítés">🔄</button>
                    </div>
                </div>

                <!-- Data Grid -->
                <div class="conn-grid-container">
                    <table class="conn-grid">
                        <thead>
                            <tr>
                                <th class="check-cell"><input type="checkbox"></th>
                                <th>Típus ↕</th>
                                <th>Partner ↕</th>
                                <th>Sorszám ↕</th>
                                <th>Teljesítés ↕</th>
                                <th class="text-right">Végösszeg ↕</th>
                                <th class="text-right">Felhasznált összeg ↕</th>
                                <th class="text-right">Teljes felhasznált összeg ↕</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoices.map(inv => `
                                <tr class="grid-row ${inv.status === 'Érvénytelenített' ? 'row-storno' : ''}">
                                    <td class="check-cell"><input type="checkbox"></td>
                                    <td><span class="type-tag">${inv.type}</span></td>
                                    <td>${inv.partner}</td>
                                    <td class="bold font-mono">${inv.id}</td>
                                    <td>${inv.performanceDate}</td>
                                    <td class="text-right bold">${formatNum(inv.totalAmount, inv.currency)}</td>
                                    <td class="text-right">${formatNum(inv.usedAmount, inv.currency)}</td>
                                    <td class="text-right">${formatNum(inv.totalUsedAmount, inv.currency)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Footer -->
                <div class="conn-footer">
                    <div class="f-left">
                        <span>Összesen: <strong>${invoices.length}</strong> bizonylat</span>
                        <span class="sep">|</span>
                        <span>Kiválasztva: <strong>0</strong></span>
                    </div>
                </div>
            </div>

            <!-- Right Panel: Filters (Woodpecker v2.1 Spec) -->
            <div class="conn-right-panel">
                <div class="conn-filter-section">
                    <h3 class="conn-filter-title">Szűrő feltételek</h3>

                    <div class="conn-filter-group">
                        <label>Partner</label>
                        <input type="text" class="conn-text-input" placeholder="Partner neve...">
                    </div>

                    <div class="conn-filter-group">
                        <label>Kiállítás / Teljesítés dátum</label>
                        <div class="conn-date-range">
                            <input type="date" class="conn-date-input">
                            <span class="date-sep">-</span>
                            <input type="date" class="conn-date-input">
                        </div>
                    </div>

                    <div class="conn-filter-group">
                        <label>Sorszám</label>
                        <input type="text" class="conn-text-input" placeholder="Bizonylatszám...">
                    </div>

                    <div class="conn-filter-group">
                        <label>Számla típus</label>
                        <select class="conn-select-input">
                            <option value="">Összes típus</option>
                            <option>Előleg</option>
                            <option>Végszámla</option>
                            <option>Helyesbítő</option>
                            <option>Sztornó</option>
                        </select>
                    </div>

                    <div class="conn-filter-group">
                        <label>Deviza</label>
                        <select class="conn-select-input">
                            <option value="">Összes</option>
                            <option>HUF</option>
                            <option>EUR</option>
                            <option>USD</option>
                        </select>
                    </div>

                    <div class="conn-filter-divider"></div>

                    <h4 class="conn-filter-subtitle">Kapcsolat státusz</h4>
                    <div class="conn-checkbox-group">
                        <label class="conn-checkbox-label">
                            <input type="checkbox" class="conn-checkbox-input">
                            <span>Kapcsolattal rendelkezők</span>
                        </label>
                        <label class="conn-checkbox-label">
                            <input type="checkbox" class="conn-checkbox-input">
                            <span>Kapcsolat nélküliek</span>
                        </label>
                    </div>

                    <div class="conn-filter-divider"></div>

                    <div class="conn-filter-actions">
                        <div style="display: flex; gap: 8px;">
                            <button class="conn-btn-search" style="flex: 1;">🔍 Szűrés</button>
                            <button class="conn-btn-clear" style="width: 40px; padding: 0; display: flex; align-items: center; justify-content: center;" title="Törlés">❌</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .conn-layout {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 300px;
                height: 100%;
                gap: 12px;
                padding: 12px;
                background: #f1f5f9;
                min-height: 0;
            }

            .conn-left-panel {
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-width: 0;
                min-height: 0;
            }

            .conn-toolbar {
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

            .conn-toolbar .t-left, .conn-toolbar .t-right {
                display: flex;
                gap: 8px;
                align-items: center;
                flex-wrap: wrap;
            }

            .conn-toolbar .t-left { flex: 1 1 320px; min-width: 0; }
            .conn-toolbar .t-right { margin-left: auto; }

            .conn-grid-container {
                flex: 1;
                border: 1px solid var(--border);
                border-radius: 12px;
                overflow: auto;
                background: white;
            }

            .conn-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                font-size: 13px;
            }

            .conn-grid th {
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

            .conn-grid .grid-row td {
                padding: 10px;
                border-bottom: 1px solid #f1f5f9;
                transition: background 0.2s;
            }

            .conn-grid .grid-row:hover {
                background: #f0f9ff !important;
                cursor: pointer;
            }

            .conn-grid .row-storno td {
                color: #94a3b8;
                font-style: italic;
            }

            .type-tag {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
                background: #e0e7ff;
                color: #4338ca;
            }

            .conn-footer {
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

            .conn-footer .f-left { display: flex; gap: 8px; align-items: center; }
            .conn-footer .sep { color: var(--border); }

            /* Right Panel */
            .conn-right-panel {
                width: 300px;
                max-width: 100%;
                max-height: 100%;
                min-height: 0;
                overflow-y: auto;
            }

            .conn-filter-section {
                background: white;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid var(--border);
                box-shadow: var(--shadow-sm);
            }

            .conn-filter-title {
                font-size: 16px;
                font-weight: 700;
                margin: 0 0 20px 0;
                color: var(--text-main);
                border-bottom: 2px solid var(--primary);
                padding-bottom: 8px;
            }

            .conn-filter-group {
                margin-bottom: 16px;
            }

            .conn-filter-group label {
                display: block;
                font-size: 11px;
                font-weight: 700;
                color: var(--text-muted);
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .conn-text-input, .conn-select-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 13px;
                transition: all 0.2s;
                background: white;
            }

            .conn-text-input:focus, .conn-select-input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .conn-date-range {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .conn-date-input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 13px;
                transition: all 0.2s;
            }

            .conn-date-input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .conn-filter-divider {
                height: 1px;
                background: linear-gradient(to right, transparent, var(--border), transparent);
                margin: 20px 0;
            }

            .conn-filter-subtitle {
                font-size: 13px;
                font-weight: 700;
                margin: 0 0 12px;
                color: var(--text-main);
            }

            .conn-checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .conn-checkbox-label {
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

            .conn-checkbox-label:hover { background: #f8fafc; }

            .conn-checkbox-input {
                width: 16px;
                height: 16px;
                cursor: pointer;
                accent-color: var(--primary);
            }

            .conn-filter-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 20px;
            }

            .conn-btn-clear, .conn-btn-search {
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                height: 38px;
            }

            .conn-btn-clear {
                background: #fee2e2;
                color: #ef4444;
            }

            .conn-btn-clear:hover { background: #fecaca; }

            .conn-btn-search {
                background: #fbbf24;
                color: #78350f;
                box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
            }

            .conn-btn-search:hover {
                background: #f59e0b;
                box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
                transform: translateY(-1px);
            }
        </style>
    `;
}
