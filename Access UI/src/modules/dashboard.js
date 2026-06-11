import { setupCollapsibleSections, collapsibleSectionStyles } from '../utils/collapsible.js';
import { NAV_CATEGORIES } from '../data/nav-structure.js';

export function renderDashboard(container, wm, subModuleId = null) {
    const groupId = subModuleId && subModuleId.startsWith('group:') ? subModuleId.slice(6) : null;
    const group = groupId
        ? NAV_CATEGORIES.flatMap((item) => item.groups).find((g) => g.id === groupId)
        : null;

    const groupSection = group
        ? `
        <div class="dashboard-section">
            <div class="section-header" data-section="submodules">
                <h2>AlmenÃ¼k</h2>
                <span class="section-toggle">â–¼</span>
            </div>
            <div class="section-content" data-section-content="submodules">
                <div class="submodule-grid">
                    ${(group.items && group.items.length)
            ? group.items.map(item => `
                            <button class="submodule-card" data-module="${group.moduleId}" data-sub="${item.id}">
                                <span class="submodule-label">${item.label}</span>
                            </button>
                        `).join('')
            : `<div class="submodule-empty">Nincs mÃ©g konfigurÃ¡lt almenÃ¼.</div>`
        }
                </div>
            </div>
        </div>
        `
        : '';

    const headerTitle = group ? group.title : 'Dashboard';
    const headerSubtitle = group
        ? 'Válasszon almenüt a listából.'
        : 'Üdvözlünk a GAVA ERP rendszerben!';

    const dashboardSections = group
        ? ''
        : `
        <div class="dashboard-section">
            <div class="section-header" data-section="quick-links">
                <h2>Gyakori modulok</h2>
                <span class="section-toggle">▼</span>
            </div>
            <div class="section-content" data-section-content="quick-links">
                <div class="dashboard-widgets-grid">
                    <div class="widget-card full-width">
                         <div class="widget-header">
                            
                         </div>
                         <div class="quick-links">
                            <button class="quick-link" data-module="orders">
                                <span class="ql-icon">🛒</span>
                                <span>Új rendelés</span>
                            </button>
                             <button class="quick-link" data-module="invoicing">
                                <span class="ql-icon">🧾</span>
                                <span>Számla kiállítás</span>
                            </button>
                             <button class="quick-link" data-module="partners">
                                <span class="ql-icon">🤝</span>
                                <span>Partner keresés</span>
                            </button>
                             <button class="quick-link" data-module="warehouse">
                                <span class="ql-icon">🏭</span>
                                <span>Raktári bevét</span>
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-section">
            <div class="section-header" data-section="kpi">
                <h2>KPI mutatók</h2>
                <span class="section-toggle">▼</span>
            </div>
            <div class="section-content" data-section-content="kpi">
                <div class="stats-grid" style="margin-bottom: 24px;">
                    <div class="stat-card">
                        <div class="stat-icon p-blue">💰</div>
                        <div class="stat-content">
                            <span class="stat-label">Havi forgalom</span>
                            <span class="stat-value">24.5 M Ft</span>
                            <span class="stat-trend up">↗ +12%</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon p-orange">📦</div>
                        <div class="stat-content">
                            <span class="stat-label">Nyitott rendelések</span>
                            <span class="stat-value">18 db</span>
                            <span class="stat-trend down">↘ -2%</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon p-green">👥</div>
                        <div class="stat-content">
                            <span class="stat-label">Új partnerek</span>
                            <span class="stat-value">12</span>
                            <span class="stat-trend up">↗ +5%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-section">
            <div class="section-header" data-section="widgets">
                <h2>Widgetek</h2>
                <span class="section-toggle">▼</span>
            </div>
            <div class="section-content" data-section-content="widgets">
        <div class="dashboard-widgets-grid">
            <!-- Widget 1: KPIs -->
            <div class="widget-card full-width">
                 <div class="stats-grid" style="margin-bottom: 0;">
                    <div class="stat-card">
                        <div class="stat-icon p-blue">💰</div>
                        <div class="stat-content">
                            <span class="stat-label">Havi forgalom</span>
                            <span class="stat-value">24.5 M Ft</span>
                            <span class="stat-trend up">↗ +12%</span>
                        </div>
                    </div>
                     <div class="stat-card">
                        <div class="stat-icon p-orange">📦</div>
                        <div class="stat-content">
                            <span class="stat-label">Nyitott rendelések</span>
                            <span class="stat-value">18 db</span>
                            <span class="stat-trend down">↘ -2%</span>
                        </div>
                    </div>
                     <div class="stat-card">
                        <div class="stat-icon p-green">👥</div>
                        <div class="stat-content">
                            <span class="stat-label">Új partnerek</span>
                            <span class="stat-value">12</span>
                            <span class="stat-trend up">↗ +5%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Widget 2: Chart -->
            <div class="widget-card">
                 <div class="widget-header">
                    <h3>Értékesítési statisztika</h3>
                    <button class="icon-btn-sm">⋮</button>
                 </div>
                 <div class="chart-placeholder">
                    <div class="donut-ring"></div>
                     <div class="legend">
                        <div class="legend-item"><span class="dot primary"></span>Termék értékesítés (65%)</div>
                        <div class="legend-item"><span class="dot accent"></span>Szolgáltatás (20%)</div>
                         <div class="legend-item"><span class="dot muted"></span>Egyéb (15%)</div>
                    </div>
                 </div>
            </div>

             <!-- Widget 3: Tasks -->
            <div class="widget-card">
                 <div class="widget-header">
                    <h3>Teendők listája</h3>
                    <button class="icon-btn-sm">+</button>
                 </div>
                 <div class="task-list">
                    <div class="task-item">
                        <input type="checkbox" checked>
                        <span class="done">Havi áfa rögzítés</span>
                    </div>
                    <div class="task-item">
                        <input type="checkbox">
                        <span>Beszállítói egyeztetés</span>
                    </div>
                     <div class="task-item">
                        <input type="checkbox">
                        <span>Készletleltár ellenőrzés</span>
                    </div>
                     <div class="task-item">
                        <input type="checkbox">
                        <span>Pénteki meeting előkészítés</span>
                    </div>
                 </div>
            </div>
        </div>
            </div>
        </div>
`;
    container.innerHTML = `
        <div class="view-header">
            <h1 class="view-title">${headerTitle}</h1>
            <p class="view-subtitle">${headerSubtitle}</p>
        </div>
        ${groupSection}

        ${dashboardSections}

        <style>
            ${collapsibleSectionStyles}
            .dashboard-widgets-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 24px;
            }
            .full-width {
                grid-column: span 2;
            }
            .widget-card {
                background: var(--surface);
                border-radius: 20px;
                padding: 24px;
                border: 1px solid var(--border);
                box-shadow: var(--shadow);
            }
            .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                font-size: 16px;
                font-weight: 600;
            }
            .task-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .task-item {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
            }
            .task-item .done {
                text-decoration: line-through;
                opacity: 0.5;
            }
            .quick-links {
                display: flex;
                gap: 16px;
            }
            .quick-link {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 16px;
                border: 1px solid var(--border);
                border-radius: 12px;
                background: var(--bg-light);
                cursor: pointer;
                transition: all 0.2s;
                min-width: 100px;
            }
            .quick-link:hover {
                border-color: var(--primary);
                background: white;
                box-shadow: var(--shadow);
            }
            .ql-icon {
                font-size: 24px;
            }

            .submodule-group {
                padding: 12px 0 20px;
                border-bottom: 1px dashed var(--border);
            }

            .submodule-group:last-child {
                border-bottom: none;
            }

            .submodule-group-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                font-size: 16px;
                font-weight: 700;
            }

            .submodule-icon {
                font-size: 20px;
            }

            .submodule-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 12px;
            }

            .submodule-card {
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 12px;
                padding: 14px 16px;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: var(--shadow);
            }

            .submodule-card:hover {
                border-color: var(--primary);
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
            }

            .submodule-label {
                font-size: 13px;
                font-weight: 700;
                color: var(--text-main);
            }

            .submodule-empty {
                font-size: 12px;
                color: var(--text-muted);
                padding: 6px 0;
            }
        </style>
    `;

    // Add event listeners to quick-links
    setTimeout(() => {
        const quickLinks = container.querySelectorAll('.quick-link');
        quickLinks.forEach(btn => {
            btn.addEventListener('click', () => {
                const moduleId = btn.dataset.module;
                if (moduleId) {
                    window.dispatchEvent(new CustomEvent('app:navigate', {
                        detail: { moduleId }
                    }));
                }
            });
        });

        const submoduleCards = container.querySelectorAll('.submodule-card');
        submoduleCards.forEach(card => {
            card.addEventListener('click', () => {
                const moduleId = card.dataset.module;
                const sub = card.dataset.sub || null;
                if (moduleId) {
                    window.dispatchEvent(new CustomEvent('app:navigate', {
                        detail: { moduleId, subModuleId: sub }
                    }));
                }
            });
        });

        // Add collapse/expand functionality for dashboard sections
        const sectionHeaders = container.querySelectorAll('.section-header[data-section]');
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sectionName = header.dataset.section;
                const section = header.closest('.dashboard-section');

                // Toggle collapsed state
                section.classList.toggle('collapsed');

                // Save state to localStorage
                const isCollapsed = section.classList.contains('collapsed');
                localStorage.setItem(`dashboard-section-${sectionName}`, isCollapsed ? 'collapsed' : 'expanded');
            });
        });

        // Restore saved states
        sectionHeaders.forEach(header => {
            const sectionName = header.dataset.section;
            const savedState = localStorage.getItem(`dashboard-section-${sectionName}`);
            const section = header.closest('.dashboard-section');

            if (savedState === 'collapsed') {
                section.classList.add('collapsed');
            }
        });
    }, 0);
}
