import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderTransport(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.moduleId === 'transport');
    const items = group ? group.items : [];

    const actionMap = {
        'transport-orders': () => wm && wm.open('transport-list', 'Fuvarfeladatok', renderTransportList),
    };

    const launcherContent = `
        <div class="launcher-grid">
            ${items.map(item => `
                <div class="launcher-card" data-sub-id="${item.id}">
                    <div class="l-icon">${item.icon || '\ud83d\udcc4'}</div>
                    <div class="l-title">${item.label}</div>
                    <div class="l-desc">${item.description || ''}</div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = `
        <div class="view-header">
            <h1 class="view-title">Fuvar</h1>
            <p class="view-subtitle">Logisztikai tervez\u00e9s \u00e9s j\u00e1ratkezel\u00e9s.</p>
        </div>
        ${createCollapsibleSection('transport-main', 'Fuvaroz\u00e1si modulok', launcherContent)}
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

function renderTransportList(container, wm) {
    container.innerHTML = `
        <div class="grid-layout">
            <div class="filter-bar">
                <div class="filter-group">
                    <label>Jármű</label>
                    <select class="select-dense">
                        <option>Összes járat</option>
                        <option>RRR-123 (Iveco)</option>
                        <option>KKK-998 (Scania)</option>
                        <option>Alvállalkozó</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Keresés</label>
                    <input type="text" class="input-dense" placeholder="Fuvarszám, sofőr...">
                </div>
                <button class="btn-dense primary">Frissítés (F5)</button>
                <div class="filter-actions right">
                     <button class="btn-dense">+ Új fuvar (ins)</button>
                     <button class="icon-btn-dense">▦</button>
                </div>
            </div>

            <div class="grid-container">
                <table class="advanced-grid">
                    <thead>
                        <tr>
                            <th style="width: 40px;"></th>
                            <th>Fuvarszám ↕</th>
                            <th>Rendszám ↕</th>
                            <th>Sofőr ↕</th>
                            <th>Indulás ↕</th>
                            <th>Címek száma ↕</th>
                            <th class="text-right">Súly (kg) ↕</th>
                            <th>Státusz ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="grid-row">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">FUV-2026/0511</td>
                            <td>RRR-123</td>
                            <td>Kovács János</td>
                            <td>2026.02.10 07:00</td>
                            <td>8</td>
                            <td class="text-right">4,200</td>
                            <td><span class="status-dot green"></span> Úton</td>
                        </tr>
                        <tr class="grid-row">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">FUV-2026/0512</td>
                            <td>KKK-998</td>
                            <td>Nagy Béla</td>
                            <td>2026.02.10 08:30</td>
                            <td>5</td>
                            <td class="text-right">12,500</td>
                            <td><span class="status-dot blue"></span> Rakodás alatt</td>
                        </tr>
                        <tr class="grid-row warning">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">FUV-2026/0508</td>
                            <td>ABC-776</td>
                            <td>Szabó Gábor</td>
                            <td>2026.02.09 06:00</td>
                            <td>12</td>
                            <td class="text-right">3,800</td>
                            <td><span class="status-dot red"></span> Késés / Hiba</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="8">Összesen: 3 járat (mai)</td>
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
            .status-dot.blue { background: #3b82f6; }
            .status-dot.red { background: #ef4444; }
            tfoot td { background: #f8fafc; font-weight: 600; border-top: 2px solid var(--border); padding: 10px; }
        </style>
    `;
}
