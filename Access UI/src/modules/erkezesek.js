// Érkezések modul
export function renderErkezesek(container) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';
    view.innerHTML = '<div class="view-header"><h2 class="view-title">Érkezések</h2><p class="view-subtitle">Érkezések kezelése</p></div><div class="access-form-view"><p>Fejlesztés alatt...</p></div>';
    container.appendChild(view);
}
