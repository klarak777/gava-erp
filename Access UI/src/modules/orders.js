import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderOrders(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.moduleId === 'orders');
    const items = group ? group.items : [];

    const actionMap = {
        'order-search': () => wm && wm.open('orders-list', 'Megrendelések', renderOrdersList),
    };

    const launcherContent = `
        <div class="launcher-grid">
            ${items.map(item => `
                <div class="launcher-card" data-sub-id="${item.id}">
                    <div class="l-icon">${item.icon || '📄'}</div>
                    <div class="l-title">${item.label}</div>
                    <div class="l-desc">${item.description || ''}</div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = `
        <div class="view-header">
            <h1 class="view-title">Megrendelések</h1>
            <p class="view-subtitle">Vevői rendelések és értékesítési folyamatok kezelése.</p>
        </div>
        ${createCollapsibleSection('orders-main', 'Megrendelések modulok', launcherContent)}
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

function renderOrdersList(container) {
    container.innerHTML = `
        <div class="orders-layout">
            <div class="table-toolbar">
                <div class="search-field">
                    <span class="icon">🔍</span>
                    <input type="text" placeholder="Rendelésszám keresése...">
                </div>
                <div class="status-tabs">
                    <button class="tab-btn active">Mind</button>
                    <button class="tab-btn">Készítés alatt</button>
                    <button class="tab-btn">Véglegesítve</button>
                    <button class="tab-btn">Kiszállítva</button>
                </div>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Sorszám</th>
                        <th>Partner</th>
                        <th>Dátum</th>
                        <th>Határidő</th>
                        <th>Nettó érték</th>
                        <th>Státusz</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="bold">MR-2026/0115</td>
                        <td>Aldi Magyarország Bt.</td>
                        <td>2026.02.10</td>
                        <td>2026.02.12</td>
                        <td>842,500 Ft</td>
                        <td><span class="badge status-processing">Készítés alatt</span></td>
                    </tr>
                    <tr>
                        <td class="bold">MR-2026/0102</td>
                        <td>Tesco-Global Zrt.</td>
                        <td>2026.02.08</td>
                        <td>2026.02.10</td>
                        <td>1,120,000 Ft</td>
                        <td><span class="badge status-success">Lezárt</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <style>
            .orders-layout { padding: 16px; }
            .table-toolbar { display: flex; gap: 16px; margin-bottom: 16px; align-items: center; }
            .search-field { flex: 1; display: flex; align-items: center; background: #fff; border: 1px solid var(--border); padding: 8px 12px; border-radius: 8px; }
            .search-field input { border: none; outline: none; width: 100%; margin-left: 8px; }
            .status-tabs { display: flex; gap: 8px; }
            .tab-btn { padding: 6px 12px; border: 1px solid var(--border); background: #fff; border-radius: 6px; cursor: pointer; }
            .tab-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
            .data-table { width: 100%; border-collapse: collapse; }
            .data-table th { text-align: left; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-muted); }
            .data-table td { padding: 12px; border-bottom: 1px solid var(--border); }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
            .status-processing { background: #e0f2fe; color: #075985; }
            .status-success { background: #dcfce7; color: #166534; }
        </style>
    `;
}
