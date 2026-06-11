// Címke modul
export function renderCimke(container) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';
    view.innerHTML = '<div class="view-header"><h2 class="view-title">Címke</h2><p class="view-subtitle">Címkék nyomtatása és kezelése</p></div><div class="access-form-view"><p>Fejlesztés alatt...</p></div>';
    container.appendChild(view);
}
