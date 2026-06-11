// Fuvarok Main Page - Access Form_Fuvarok main page alapján
// Ez a "Fuvar" főmenü nyitólapja, ahonnan a többi fuvar almodulba lehet navigálni
export function renderFuvarokMainPage(container, windowManager) {
    const view = document.createElement('div');
    view.className = 'module-view fade-in';

    const modules = [
        { icon: '📋', title: 'Fuvarok összesítő', desc: 'Összes fuvar áttekintése, szűrése (Szöveg239, Szöveg1, Szöveg243)', id: 'fuvarok' },
        { icon: '🚚', title: 'Transportistas', desc: 'Szállítók, kamionok nyilvántartása', id: 'transportistas' },
        { icon: '📝', title: 'Fuvarmegbízások', desc: 'Fuvarmegbízások kezelése', id: 'fuvarmegbizas' },
        { icon: '🏗️', title: 'Rakodás', desc: 'Rakodási adatok, FileMapDatabase alapján', id: 'rakodas' },
        { icon: '📅', title: 'Planning', desc: 'Tervezett szállítások havi bontásban', id: 'planning' },
        { icon: '📍', title: 'Telephelyek', desc: 'Felrakó és lerakó telephelyek', id: 'telephelyek' },
    ];

    view.innerHTML = `
        <div class="view-header" style="margin-bottom: 32px;">
            <h2 class="view-title">Fuvarok – Főmenü</h2>
            <p class="view-subtitle">Válassz az alábbi fuvar modulok közül (Form_Fuvarok main page)</p>
        </div>
        <div class="fuvar-modules-grid">
            ${modules.map(m => `
                <button class="fuvar-module-card" data-target="${m.id}">
                    <div class="fuvar-module-icon">${m.icon}</div>
                    <div class="fuvar-module-title">${m.title}</div>
                    <div class="fuvar-module-desc">${m.desc}</div>
                </button>
            `).join('')}
        </div>

        <style>
            .fuvar-modules-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                gap: 20px;
            }
            .fuvar-module-card {
                background: white;
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 28px 24px;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: var(--shadow);
            }
            .fuvar-module-card:hover {
                border-color: var(--primary);
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
            }
            .fuvar-module-icon { font-size: 32px; margin-bottom: 12px; }
            .fuvar-module-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; color: var(--text-main); }
            .fuvar-module-desc { font-size: 13px; color: var(--text-muted); }
        </style>
    `;

    container.appendChild(view);

    view.querySelectorAll('.fuvar-module-card').forEach(btn => {
        btn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('app:navigate', {
                detail: { moduleId: btn.dataset.target }
            }));
        });
    });
}
