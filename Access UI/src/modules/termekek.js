import { openAdminTable } from './admin.js';

// Termékek adat tábla modul
export function renderTermekek(container, wm) {
    container.innerHTML = `
        <div class="module-view fade-in" style="height: 100%; display: flex; flex-direction: column;">
            <div class="view-header">
                <h1 class="view-title">Termékek (Products)</h1>
                <p class="view-subtitle">Angol és magyar terméknevek, cikkszámok kezelése.</p>
            </div>
            <div id="termekek-table-target" style="flex: 1; height: calc(100vh - 160px);"></div>
        </div>
    `;

    const target = container.querySelector('#termekek-table-target');
    openAdminTable(wm, 'Products', 'products', [
        { field: 'code', label: 'Code Prod' },
        { field: 'name', label: 'Products (English)' },
        { field: 'name_hu', label: 'Products:Magyar (Hungarian)' }
    ], { sortBy: 'name' }, target);
}
