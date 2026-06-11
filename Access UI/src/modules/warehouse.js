import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderWarehouse(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.moduleId === 'warehouse');
    const items = group ? group.items : [];

    const actionMap = {
        'stock-list': () => wm && wm.open('warehouse-stock', 'Készlet lekérdezés', renderWarehouseStock),
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
            <h1 class="view-title">Raktár</h1>
            <p class="view-subtitle">Raktárkészlet, lokációk és logisztikai bizonylatok kezelése.</p>
        </div>
        ${createCollapsibleSection('warehouse-main', 'Raktár modulok', launcherContent)}
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
    setTimeout(setupEvents, 0);
}

function renderWarehouseStock(container, wm) {
    container.innerHTML = `
        <div class="grid-layout">
            <div class="kpi-row">
                <div class="kpi-card-mini">
                    <span class="kpi-label">Össz. készletérték</span>
                    <span class="kpi-value">154.2 M Ft</span>
                </div>
                <div class="kpi-card-mini">
                    <span class="kpi-label">Készleten lévő cikkek</span>
                    <span class="kpi-value">1,420 tétel</span>
                </div>
                <div class="kpi-card-mini warning">
                    <span class="kpi-label">Kritikus készlet</span>
                    <span class="kpi-value">12 cikk</span>
                </div>
            </div>

            <div class="filter-bar">
                <div class="filter-group">
                    <label>Raktár</label>
                    <select class="select-dense">
                        <option>Összes raktár</option>
                        <option>Központi raktár</option>
                        <option>Hűtőház</option>
                        <option>Külső telephely</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Keresés</label>
                    <input type="text" class="input-dense" placeholder="Cikk, lokáció, sarzs...">
                </div>
                <button class="btn-dense primary">Frissítés (F5)</button>
                <div class="filter-actions right">
                     <button class="btn-dense">Készlet ív nyomtatás</button>
                     <button class="icon-btn-dense">▦</button>
                </div>
            </div>

            <div class="grid-container">
                <table class="advanced-grid">
                    <thead>
                        <tr>
                            <th style="width: 40px;"></th>
                            <th>Cikkszám ↕</th>
                            <th>Megnevezés ↕</th>
                            <th>Raktár ↕</th>
                            <th>Lokáció ↕</th>
                            <th class="text-right">Mennyiség ↕</th>
                            <th>M.egys. ↕</th>
                            <th class="text-right">Érték ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="grid-row">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">100234</td>
                            <td>Cappy 0,5 Narancs</td>
                            <td>Központi</td>
                            <td>A-12-04</td>
                            <td class="text-right">1,250</td>
                            <td>db</td>
                            <td class="text-right">431,250</td>
                        </tr>
                        <tr class="grid-row warning">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">PROD-992</td>
                            <td>TV Paprika I. osztály</td>
                            <td>Hűtőház</td>
                            <td>H1-02-B</td>
                            <td class="text-right">420</td>
                            <td>kg</td>
                            <td class="text-right">373,800</td>
                        </tr>
                        <tr class="grid-row">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">GNG-001</td>
                            <td>EUR Raklap</td>
                            <td>Központi</td>
                            <td>UDVAR</td>
                            <td class="text-right">85</td>
                            <td>db</td>
                            <td class="text-right">382,500</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="8">Összesen: 45.2 M Ft (szűrt érték)</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <style>
            .grid-layout { display: flex; flex-direction: column; height: 100%; gap: 16px; }
            .kpi-row { display: flex; gap: 16px; }
            .kpi-card-mini { flex: 1; background: white; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
            .kpi-card-mini.warning { border-left: 4px solid #ef4444; }
            .kpi-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
            .kpi-value { font-size: 18px; font-weight: 700; color: var(--text); }
            .filter-bar { display: flex; align-items: flex-end; gap: 12px; padding: 12px; background: #f1f5f9; border-radius: 8px; border: 1px solid var(--border); }
            .filter-group { display: flex; flex-direction: column; gap: 4px; }
            .filter-group label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
            .input-dense, .select-dense { padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; min-width: 140px; }
            .btn-dense { padding: 6px 16px; border-radius: 6px; border: 1px solid var(--border); font-size: 13px; font-weight: 600; cursor: pointer; height: 30px; background: white; }
            .btn-dense.primary { background: var(--primary); color: white; border: none; }
            .filter-actions.right { margin-left: auto; display: flex; gap: 8px; }
            .icon-btn-dense { width: 30px; height: 30px; border: 1px solid var(--border); background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .grid-container { flex: 1; border: 1px solid var(--border); border-radius: 8px; overflow: auto; background: white; }
            .advanced-grid { width: 100%; border-collapse: collapse; font-size: 13px; }
            .advanced-grid th { background: #f8fafc; position: sticky; top: 0; padding: 10px; text-align: left; border-bottom: 1px solid var(--border); color: var(--text-muted); }
            .advanced-grid td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
            .grid-row:hover { background-color: #f0f9ff; cursor: pointer; }
            .grid-row.warning { color: #b45309; }
            .grid-row.warning td { background-color: #fffbeb; }
            .expand-cell { color: var(--primary); font-weight: bold; text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: 600; }
            tfoot td { background: #f8fafc; font-weight: 600; border-top: 2px solid var(--border); padding: 10px; }
        </style>
    `;
}
