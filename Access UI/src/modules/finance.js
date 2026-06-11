import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderFinance(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.moduleId === 'finance');
    const items = group ? group.items : [];

    const actionMap = {
        'bank-selection': () => wm && wm.open('finance-bank', 'Bank és Pénztár', renderFinanceBank),
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
            <h1 class="view-title">Pénzügy</h1>
            <p class="view-subtitle">Pénzügyi folyamatok, likviditás és elszámolások kezelése.</p>
        </div>
        ${createCollapsibleSection('finance-main', 'Pénzügyi modulok', launcherContent)}
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

function renderFinanceBank(container, wm) {
    container.innerHTML = `
        <div class="grid-layout">
            <div class="kpi-row">
                <div class="kpi-card-mini">
                    <span class="kpi-label">HUF Egyenleg</span>
                    <span class="kpi-value">14,500,200 Ft</span>
                </div>
                <div class="kpi-card-mini">
                    <span class="kpi-label">EUR Egyenleg</span>
                    <span class="kpi-value">€ 12,450.00</span>
                </div>
                <div class="kpi-card-mini warning">
                    <span class="kpi-label">Lejárt kintlévőség</span>
                    <span class="kpi-value">2.4 M Ft</span>
                </div>
            </div>

            <div class="filter-bar">
                <div class="filter-group">
                    <label>Pénztár / Bank</label>
                    <select class="select-dense">
                        <option>Összes bizonylat</option>
                        <option>OTP Bank</option>
                        <option>ERSTE Bank</option>
                        <option>Kp. Pénztár</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Időszak</label>
                    <input type="date" class="input-dense">
                </div>
                <button class="btn-dense primary">Keresés (F5)</button>
                <div class="filter-actions right">
                     <button class="btn-dense">Banki import</button>
                     <button class="icon-btn-dense">▦</button>
                </div>
            </div>

            <div class="grid-container">
                <table class="advanced-grid">
                    <thead>
                        <tr>
                            <th style="width: 40px;"></th>
                            <th>Bizonylatszám ↕</th>
                            <th>Partner ↕</th>
                            <th>Dátum ↕</th>
                            <th>Típus ↕</th>
                            <th class="text-right">Összeg ↕</th>
                            <th>Valuta ↕</th>
                            <th>Státusz ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="grid-row">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">BANK-2026/0045</td>
                            <td>Tesco-Global Zrt.</td>
                            <td>2026.02.10</td>
                            <td>Bejövetel</td>
                            <td class="text-right">1,250,500</td>
                            <td>HUF</td>
                            <td><span class="status-dot green"></span> Könyvelt</td>
                        </tr>
                        <tr class="grid-row">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">UTAL-2026/0122</td>
                            <td>SprintKft.</td>
                            <td>2026.02.09</td>
                            <td>Kiadás</td>
                            <td class="text-right">180,400</td>
                            <td>HUF</td>
                            <td><span class="status-dot blue"></span> Előre jelzett</td>
                        </tr>
                        <tr class="grid-row warning">
                            <td class="expand-cell">[+]</td>
                            <td class="bold">KP-2026/0012</td>
                            <td>Készpénzes vásárlás</td>
                            <td>2026.02.08</td>
                            <td>Kiadás</td>
                            <td class="text-right">12,500</td>
                            <td>HUF</td>
                            <td><span class="status-dot red"></span> Hiányzó bizonylat</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="8">Záró egyenleg: 14,500,200 Ft (szűrt)</td>
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
            .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
            .status-dot.green { background: #10b981; }
            .status-dot.blue { background: #3b82f6; }
            .status-dot.red { background: #ef4444; }
            tfoot td { background: #f8fafc; font-weight: 600; border-top: 2px solid var(--border); padding: 10px; }
        </style>
    `;
}
