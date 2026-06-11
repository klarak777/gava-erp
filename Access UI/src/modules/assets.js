import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderAssets(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.moduleId === 'assets');
    const items = group ? group.items : [];

    const actionMap = {
        'asset-selection': () => wm && wm.open('assets-list', 'Eszközlista', renderAssetsList),
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
            <h1 class="view-title">Eszköztörzs</h1>
            <p class="view-subtitle">Tárgyi eszközök és beruházások kezelése.</p>
        </div>
        ${createCollapsibleSection('assets-main', 'Eszköztörzs modulok', launcherContent)}
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

function renderAssetsList(container, wm) {
    container.innerHTML = `
        <div class="grid-layout">
            <div class="filter-bar">
                <div class="filter-group">
                    <label>Eszközcsoport</label>
                    <select class="select-dense">
                        <option>Összes eszköz</option>
                        <option>Gépek, berendezések</option>
                        <option>Járművek</option>
                        <option>Ingatlanok</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Keresés</label>
                    <input type="text" class="input-dense" placeholder="Leltári szám, név...">
                </div>
                <button class="btn-dense primary">Keresés (F5)</button>
                <div class="filter-actions right">
                     <button class="btn-dense">+ Új eszköz (ins)</button>
                     <button class="icon-btn-dense">▦</button>
                </div>
            </div>

            <div class="grid-container">
                <table class="advanced-grid">
                    <thead>
                        <tr>
                            <th style="width: 40px;"></th>
                            <th>Leltári szám ↕</th>
                            <th>Megnevezés ↕</th>
                            <th>Aktiválás kelte ↕</th>
                            <th>Helyszín ↕</th>
                            <th class="text-right">Bruttó érték ↕</th>
                            <th class="text-right">Nettó érték ↕</th>
                            <th>Állapot ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="grid-row">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">ESZ-2024-001</td>
                            <td>Targonca (Still RX20)</td>
                            <td>2024.01.15</td>
                            <td>Raktár A</td>
                            <td class="text-right">12,500,000</td>
                            <td class="text-right bold">10,250,000</td>
                            <td><span class="status-dot green"></span> Aktív</td>
                        </tr>
                        <tr class="grid-row">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">ESZ-2023-042</td>
                            <td>Hűtőkamra vezérlés</td>
                            <td>2023.06.10</td>
                            <td>Hűtőház</td>
                            <td class="text-right">2,450,000</td>
                            <td class="text-right bold">1,820,000</td>
                            <td><span class="status-dot green"></span> Aktív</td>
                        </tr>
                        <tr class="grid-row warning">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">ESZ-2022-015</td>
                            <td>Szállítószalag motor</td>
                            <td>2022.03.20</td>
                            <td>Csomagoló</td>
                            <td class="text-right">850,000</td>
                            <td class="text-right bold">120,000</td>
                            <td><span class="status-dot orange"></span> Karbantartás esedékes</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="8">Összesen: 3 eszköz</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <style>
            .grid-layout { display: flex; flex-direction: column; height: 100%; gap: 16px; }
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
            .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
            .status-dot.green { background: #10b981; }
            .status-dot.orange { background: #f59e0b; }
            tfoot td { background: #f8fafc; font-weight: 600; border-top: 2px solid var(--border); padding: 10px; }
        </style>
    `;
}
