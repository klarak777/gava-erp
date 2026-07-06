export function renderLogisztika(container, windowManager) {
    container.style.overflow = 'hidden';
    container.style.padding = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    const filterPanel = document.createElement('div');
    filterPanel.style.cssText = 'flex-shrink:0; padding:16px 32px 0px 32px; background:var(--bg-light);';
    filterPanel.innerHTML = `
        <div style="margin-bottom:6px;">
            <h2 class="view-title" style="margin:0 0 2px 0;">Logisztika</h2>
            <p class="view-subtitle" style="margin:0;">Nem-GHU szállítmányok és fuvarozási adatok</p>
        </div>
        <div class="access-form-view" style="padding:10px 18px; margin-bottom:10px; color:var(--text-muted); font-size:13px;">
            <p>A modul részletes fejlesztési terve még kidolgozás alatt áll.</p>
        </div>
    `;

    container.appendChild(filterPanel);
}
