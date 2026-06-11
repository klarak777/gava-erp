// Felrakók modul
export function renderFelrakok(container) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';
    view.innerHTML = '<div class="view-header"><h2 class="view-title">Felrakók</h2><p class="view-subtitle">Felrakók adatbázisa</p></div><div class="access-form-view"><p>Fejlesztés alatt...</p></div>';
    container.appendChild(view);
}
