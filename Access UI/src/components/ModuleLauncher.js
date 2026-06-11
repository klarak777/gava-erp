import { NAV_CATEGORIES } from '../data/nav-structure.js';
import { createCollapsibleSection, setupCollapsibleSections, collapsibleSectionStyles } from '../utils/collapsible.js';

export function renderModuleLauncher(container, wm, moduleId, subModuleId = null) {
    // Find the group configuration for this module
    const group = NAV_CATEGORIES.flatMap(c => c.groups).find(g => g.moduleId === moduleId);

    if (!group) {
        container.innerHTML = `<div class="p-4 text-red-500">Error: Module configuration not found for ${moduleId}</div>`;
        return;
    }

    // Handle submodule view
    if (subModuleId) {
        const item = group.items?.find(i => i.id === subModuleId);
        if (item) {
            container.innerHTML = `
                <div class="view-header">
                    <h1 class="view-title">${group.title} / ${item.label}</h1>
                    <p class="view-subtitle">${item.description || 'Funkció kiválasztva.'}</p>
                </div>
                <div class="p-6 bg-white rounded-xl border border-blue-100 text-center shadow-sm">
                    <div class="text-4xl mb-4">🚧</div>
                    <h3 class="text-xl font-bold text-gray-700 mb-2">Fejlesztés alatt</h3>
                    <p class="text-gray-500">A(z) <strong>${item.label}</strong> modul jelenleg fejlesztés alatt áll.</p>
                    <button class="mt-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors" onclick="history.back()">
                        ← Vissza a modulhoz
                    </button>
                    ${wm ? `<button id="open-window-btn" class="mt-2 ml-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                        Ablak megnyitása (Demo)
                    </button>` : ''}
                </div>
            `;

            // Optional: Demo window opener for testing
            if (wm) {
                setTimeout(() => {
                    const btn = container.querySelector('#open-window-btn');
                    if (btn) btn.addEventListener('click', () => {
                        wm.open(`win-${subModuleId}`, item.label, (content) => {
                            content.innerHTML = `<div class="p-4">Demo tartalom: ${item.label}</div>`;
                        });
                    });
                    // Also hook up the back button properly if needed, although history.back() might not work in SPA.
                    // Better to use app:navigate to the parent module.
                    const backBtn = container.querySelector('button[onclick="history.back()"]');
                    if (backBtn) {
                        backBtn.onclick = (e) => {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent('app:navigate', {
                                detail: { moduleId }
                            }));
                        };
                    }

                }, 0);
            }
            return;
        }
    }

    const items = group.items || [];

    // Prioritize items that have an icon defined, otherwise use a default
    const getIcon = (item) => item.icon || '📄';

    const launcherContent = `
        <div class="launcher-grid">
            ${items.length > 0 ? items.map(item => `
                <div class="launcher-card" data-sub-id="${item.id}">
                    <div class="l-icon">${getIcon(item)}</div>
                    <div class="l-title">${item.label}</div>
                    <div class="l-desc">${item.description || item.label + ' képernyő megnyitása.'}</div>
                </div>
            `).join('') : '<div class="col-span-full text-center text-gray-500">Nincsenek elérhető almenük ebben a modulban.</div>'}
        </div>
    `;

    container.innerHTML = `
        <div class="view-header">
            <h1 class="view-title">${group.title}</h1>
            <p class="view-subtitle">Válasszon az alábbi modulok közül.</p>
        </div>

        ${createCollapsibleSection('module-launcher', 'Elérhető funkciók', launcherContent)}

        <style>
            ${collapsibleSectionStyles}
            /* Ensure styles are present even if style.css hasn't loaded fully or for modularity */
            .launcher-card { cursor: pointer; }
        </style>
    `;

    // Attach event listeners
    const cards = container.querySelectorAll('.launcher-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const subId = card.dataset.subId;
            if (subId) {
                // Dispatch navigation event to open the specific submodule
                window.dispatchEvent(new CustomEvent('app:navigate', {
                    detail: { moduleId, subModuleId: subId }
                }));
            }
        });
    });

    // Initialize collapsible
    setupCollapsibleSections(container, 'module-launcher-section');
}
