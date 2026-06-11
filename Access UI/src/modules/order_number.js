// Order number modul
export function renderOrderNumber(container) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';
    view.innerHTML = '<div class="view-header"><h2 class="view-title">Order number</h2><p class="view-subtitle">Order number kezelése</p></div><div class="access-form-view"><p>Fejlesztés alatt...</p></div>';
    container.appendChild(view);
}
