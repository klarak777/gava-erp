// Termékek adat tábla modul
export function renderTermekek(container) {
    var view = document.createElement('div');
    view.className = 'module-view fade-in';
    view.innerHTML = '<div class="view-header"><h2 class="view-title">Termékek adat tábla</h2><p class="view-subtitle">Termékek és adatok kezelése</p></div><div class="access-form-view"><p>Fejlesztés alatt...</p></div>';
    container.appendChild(view);
}
