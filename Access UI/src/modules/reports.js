import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { setupCollapsibleSections, collapsibleSectionStyles, createCollapsibleSection } from '../utils/collapsible.js';

export function renderReports(container, wm, subModuleId = null) {
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.moduleId === 'reports');
    const items = group ? group.items : [];

    const actionMap = {
        'sales-report': () => wm && wm.open('sales-report', 'Értékesítési jelentés', renderSalesReport),
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
            <h1 class="view-title">Kimutatások</h1>
            <p class="view-subtitle">Vezetői összefoglalók, BI riportok és döntéstámogatás.</p>
        </div>
        ${createCollapsibleSection('reports-main', 'Kimutatás modulok', launcherContent)}
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

function renderSalesReport(container, wm) {
    container.innerHTML = `
        <div class="grid-layout">
            <div class="report-header">
                <h2>Értékesítési trendek - 2026. Február</h2>
                <div class="report-controls">
                    <button class="btn-dense">Excel export</button>
                    <button class="btn-dense">PDF nyomtatás</button>
                </div>
            </div>

            <div class="kpi-row">
                <div class="kpi-card-mini">
                    <span class="kpi-label">Havi forgalom</span>
                    <span class="kpi-value">42.8 M Ft</span>
                    <span class="kpi-trend up">+12% vs előző hó</span>
                </div>
                <div class="kpi-card-mini">
                    <span class="kpi-label">Várható árbevétel</span>
                    <span class="kpi-value">15.4 M Ft</span>
                    <span class="kpi-trend">Függő rendelésekből</span>
                </div>
                <div class="kpi-card-mini">
                    <span class="kpi-label">Átl. kosárérték</span>
                    <span class="kpi-value">245,600 Ft</span>
                    <span class="kpi-trend down">-2% vs előző hó</span>
                </div>
            </div>

            <div class="grid-container">
                <table class="advanced-grid">
                    <thead>
                        <tr>
                            <th>Időszak ↕</th>
                            <th class="text-right">Rendelések ↕</th>
                            <th class="text-right">Nettó forgalom ↕</th>
                            <th class="text-right">Árrés % ↕</th>
                            <th class="text-right">Bruttó érték ↕</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="grid-row">
                            <td class="bold">2026.02.01 - 2026.02.07</td>
                            <td class="text-right">142</td>
                            <td class="text-right">12,450,000</td>
                            <td class="text-right">18.5%</td>
                            <td class="text-right">15,811,500</td>
                        </tr>
                        <tr class="grid-row">
                            <td class="bold">2026.02.08 - 2026.02.14</td>
                            <td class="text-right">85</td>
                            <td class="text-right">8,200,000</td>
                            <td class="text-right">24.1%</td>
                            <td class="text-right">10,414,000</td>
                        </tr>
                        <tr class="grid-row disabled">
                            <td class="bold">2026.02.15 - 2026.02.21</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>Összesen</td>
                            <td class="text-right">227</td>
                            <td class="text-right">20,650,000</td>
                            <td class="text-right">20.8%</td>
                            <td class="text-right">26,225,500</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <style>
            .grid-layout { display: flex; flex-direction: column; height: 100%; gap: 16px; padding: 16px; }
            .report-header { display: flex; justify-content: space-between; align-items: center; }
            .report-header h2 { font-size: 18px; margin: 0; }
            .report-controls { display: flex; gap: 12px; }
            .kpi-row { display: flex; gap: 16px; }
            .kpi-card-mini { flex: 1; background: white; padding: 16px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
            .kpi-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
            .kpi-value { font-size: 20px; font-weight: 700; color: var(--text); }
            .kpi-trend { font-size: 11px; font-weight: 600; }
            .kpi-trend.up { color: #10b981; }
            .kpi-trend.down { color: #ef4444; }
            .grid-container { flex: 1; border: 1px solid var(--border); border-radius: 8px; overflow: auto; background: white; }
            .advanced-grid { width: 100%; border-collapse: collapse; font-size: 13px; }
            .advanced-grid th { background: #f8fafc; position: sticky; top: 0; padding: 12px; text-align: left; border-bottom: 1px solid var(--border); color: var(--text-muted); }
            .advanced-grid td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
            .grid-row:hover { background-color: #f0f9ff; }
            .grid-row.disabled { opacity: 0.5; font-style: italic; }
            .text-right { text-align: right; }
            .bold { font-weight: 600; }
            tfoot td { background: #f8fafc; font-weight: 700; border-top: 2px solid var(--border); padding: 12px; }
        </style>
    `;
}
