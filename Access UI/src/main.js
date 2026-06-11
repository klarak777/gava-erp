import { WindowManager } from './components/WindowManager.js';
import { renderModuleLauncher } from './components/ModuleLauncher.js';
import { initAuth } from './auth.js';
import { renderFuvar } from './modules/fuvar.js';
import { renderTransportistas } from './modules/transportistas.js';
import { renderFuvarmegbizas } from './modules/fuvarmegbizas.js';
import { renderRakodas } from './modules/rakodas.js';
import { renderPlanning } from './modules/planning.js';
import { renderTelephelyek } from './modules/telephelyek.js';
import { renderOrderNumber } from './modules/order_number.js';
import { renderErkezesek } from './modules/erkezesek.js';
import { renderFelrakok } from './modules/felrakok.js';
import { renderTermekek } from './modules/termekek.js';
import { renderCimke } from './modules/cimke.js';
import { renderEkaerek } from './modules/ekaerek.js';
import { renderKamionSzerkesztes } from './modules/kamion_szerkesztes.js';
import { renderFuvarokMainPage } from './modules/fuvarok_main.js';

// Modules with Titles
import { renderDashboard } from './modules/dashboard.js';
import { renderPartners } from './modules/partners.js';
import { renderProducts } from './modules/products.js';
import { renderOrders } from './modules/orders.js';
import { renderProcurement } from './modules/procurement.js';
import { renderWarehouse } from './modules/warehouse.js';
import { renderDelivery } from './modules/delivery.js';
import { renderInvoicing } from './modules/invoicing.js';
import { renderInvoiceRequestSearch } from './modules/invoice_request.js';
import { renderFinance } from './modules/finance.js';
import { renderReports } from './modules/reports.js';
import { renderAssets } from './modules/assets.js';
import { renderTransport } from './modules/transport.js';
import { renderAdmin } from './modules/admin.js';
import { NAV_CATEGORIES } from './data/nav-structure.js';

const mainNav = document.getElementById('main-nav');
const contentView = document.getElementById('content-view');
const mainContainer = document.getElementById('main-container');
const navCategoriesContainer = document.getElementById('nav-categories');

// Create a persistent layer for windows and taskbar
const windowLayer = document.createElement('div');
windowLayer.id = 'window-layer';
mainContainer.appendChild(windowLayer);

const windowManager = new WindowManager(windowLayer);

const modules = {
    dashboard: { render: renderDashboard, title: 'Dashboard' },
    products: { render: renderProducts, title: 'Terméktörzs' },
    partners: { render: renderPartners, title: 'Partnertörzs' },
    assets: { render: renderAssets, title: 'Eszköztörzs' },
    procurement: { render: renderProcurement, title: 'Beszerzés' },
    orders: { render: renderOrders, title: 'Megrendelés' },
    warehouse: { render: renderWarehouse, title: 'Raktár' },
    delivery: { render: renderDelivery, title: 'Szállítólevél' },
    transport: { render: renderTransport, title: 'Fuvar' },
    fuvarok_main: { render: renderFuvarokMainPage, title: 'Fuvarok – Főmenü' },
    transportistas: { render: renderTransportistas, title: 'Transportistas' },
    fuvarok: { render: renderFuvar, title: 'Fuvarok összesítő' },
    fuvarmegbizas: { render: renderFuvarmegbizas, title: 'Fuvarmegbízások' },
    rakodas: { render: renderRakodas, title: 'Rakodás' },
    planning: { render: renderPlanning, title: 'Planning' },
    telephelyek: { render: renderTelephelyek, title: 'Telephelyek' },
    ekaerek: { render: renderEkaerek, title: 'EKAEREK' },
    kamion_szerkesztes: { render: renderKamionSzerkesztes, title: 'Kamion szerkesztés' },
    order_number: { render: renderOrderNumber, title: 'Order number' },
    erkezesek: { render: renderErkezesek, title: 'Érkezések' },
    felrakok: { render: renderFelrakok, title: 'Felrakók' },
    termekek_adat_tabla: { render: renderTermekek, title: 'Termékek adat tábla' },
    cimke: { render: renderCimke, title: 'Címke' },
    invoicing: { render: renderInvoicing, title: 'Számlázás' },
    finance: { render: renderFinance, title: 'Pénzügy' },
    reports: { render: renderReports, title: 'Kimutatás' },
    admin: { render: renderAdmin, title: 'Rendszer' }
};

function navigateTo(moduleId, subModuleId = null) {
    const module = modules[moduleId];
    if (module) {
        console.log(`Navigating to ${moduleId}${subModuleId ? ' / ' + subModuleId : ''}...`);

        // All modules now render directly in content-view as a workspace launcher
        contentView.innerHTML = '';
        // Set to visible to allow windows to overlap sidebar/topbar
        contentView.style.overflow = 'visible';

        // Create a scrollable wrapper for the launcher/dashboard content
        const launcherWrapper = document.createElement('div');
        launcherWrapper.className = 'launcher-wrapper';
        contentView.appendChild(launcherWrapper);

        module.render(launcherWrapper, windowManager, subModuleId);
    } else {
        console.error(`Module ${moduleId} not found`);
    }
}

function setSidebarActive(targetEl) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (targetEl) {
        targetEl.classList.add('active');
    }
}

function setGroupActive(targetEl) {
    document.querySelectorAll('.nav-group-button').forEach(item => {
        item.classList.remove('active');
    });
    if (targetEl) {
        targetEl.classList.add('active');
    }
}

function renderNavCategories() {
    if (!navCategoriesContainer) return;
    navCategoriesContainer.innerHTML = NAV_CATEGORIES.map((category) => `
        <div class="nav-category" data-category-id="${category.id}">
            <button class="nav-category-header" type="button" data-category-id="${category.id}" aria-expanded="false">
                <span class="nav-category-title">${category.label}</span>
                <span class="nav-category-toggle">▼</span>
            </button>
            <div class="nav-category-items">
                ${(category.groups && category.groups.length)
            ? category.groups.map(group => `
                        <button class="nav-group-button" type="button" data-group-id="${group.id}" data-module="${group.moduleId}">
                            <span class="nav-icon">${group.icon || '📁'}</span>
                            <span class="nav-label">${group.title}</span>
                        </button>
                    `).join('')
            : `<div class="nav-group-empty">Nincs főmenü.</div>`
        }
            </div>
        </div>
    `).join('');
}

mainNav.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        e.preventDefault();
        const moduleId = navItem.dataset.module;
        const subModuleId = navItem.dataset.sub;

        setSidebarActive(navItem);
        setGroupActive(null);
        navigateTo(moduleId, subModuleId);
        return;
    }

    const groupItem = e.target.closest('.nav-group-button');
    if (groupItem) {
        e.preventDefault();
        const groupId = groupItem.dataset.groupId;
        const moduleId = groupItem.dataset.module;
        setGroupActive(groupItem);
        setSidebarActive(null);
        const categoryEl = groupItem.closest('.nav-category');
        if (categoryEl) {
            categoryEl.classList.add('expanded');
            const header = categoryEl.querySelector('.nav-category-header');
            if (header) header.setAttribute('aria-expanded', 'true');
        }
        navigateTo(moduleId || 'dashboard');
    }

    const categoryHeader = e.target.closest('.nav-category-header');
    if (categoryHeader) {
        e.preventDefault();
        const categoryId = categoryHeader.dataset.categoryId;
        const categoryEl = navCategoriesContainer?.querySelector(`.nav-category[data-category-id="${categoryId}"]`);
        if (categoryEl) {
            // Collapse all other categories first
            navCategoriesContainer.querySelectorAll('.nav-category').forEach(cat => {
                if (cat !== categoryEl) {
                    cat.classList.remove('expanded');
                    const h = cat.querySelector('.nav-category-header');
                    if (h) h.setAttribute('aria-expanded', 'false');
                }
            });
            
            const isExpanded = categoryEl.classList.toggle('expanded');
            categoryHeader.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        }
    }
});

// Close all category dropdowns when clicking outside the navigation
document.addEventListener('click', (e) => {
    if (!e.target.closest('#nav-categories') && !e.target.closest('.nav-category-header')) {
        document.querySelectorAll('.nav-category').forEach(cat => {
            cat.classList.remove('expanded');
            const header = cat.querySelector('.nav-category-header');
            if (header) header.setAttribute('aria-expanded', 'false');
        });
    }
});

window.addEventListener('app:navigate', (e) => {
    const { moduleId, subModuleId } = e.detail || {};
    if (!moduleId) return;
    navigateTo(moduleId, subModuleId || null);
});

function init() {
    renderNavCategories();
    initAuth(() => {
        navigateTo('dashboard');
    });
}

// Listen for login-success from the inline fallback script
window.addEventListener('app:login-success', () => {
    renderNavCategories();
    navigateTo('dashboard');
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
