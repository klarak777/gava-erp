/**
 * Collapsible Section Helper
 * Általános funkció a szakaszok összecsukásához/kinyitásához
 */

export function setupCollapsibleSections(container, storagePrefix = 'section') {
    const sectionHeaders = container.querySelectorAll('.section-header[data-section]');

    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sectionName = header.dataset.section;
            const section = header.closest('.module-section, .dashboard-section');

            if (!section) return;

            // Toggle collapsed state
            section.classList.toggle('collapsed');

            // Save state to localStorage
            const isCollapsed = section.classList.contains('collapsed');
            localStorage.setItem(`${storagePrefix}-${sectionName}`, isCollapsed ? 'collapsed' : 'expanded');
        });
    });

    // Restore saved states
    sectionHeaders.forEach(header => {
        const sectionName = header.dataset.section;
        const savedState = localStorage.getItem(`${storagePrefix}-${sectionName}`);
        const section = header.closest('.module-section, .dashboard-section');

        if (section && savedState === 'collapsed') {
            section.classList.add('collapsed');
        }
    });
}

/**
 * Collapsible section CSS styles
 * Használd ezt a string-et a modul style-jában
 */
export const collapsibleSectionStyles = `
    .module-section,
    .dashboard-section {
        margin-bottom: 32px;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
        margin-bottom: 16px;
    }

    .section-header:hover {
        background: var(--bg-light);
        border-color: var(--primary);
    }

    .section-header h2 {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
    }

    .section-toggle {
        font-size: 12px;
        transition: transform 0.3s ease;
    }

    .module-section.collapsed .section-toggle,
    .dashboard-section.collapsed .section-toggle {
        transform: rotate(-90deg);
    }

    .section-content {
        max-height: 10000px;
        overflow: visible;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        opacity: 1;
    }

    .module-section.collapsed .section-content,
    .dashboard-section.collapsed .section-content {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
    }
`;

/**
 * Wrapper egy collapsible szakaszhoz
 * @param {string} sectionId - Egyedi azonosító a szakaszhoz
 * @param {string} title - A szakasz címe
 * @param {string} content - A szakasz tartalma (HTML string)
 * @returns {string} HTML string
 */
export function createCollapsibleSection(sectionId, title, content) {
    return `
        <div class="module-section">
            <div class="section-header" data-section="${sectionId}">
                <h2>${title}</h2>
                <span class="section-toggle">▼</span>
            </div>
            <div class="section-content" data-section-content="${sectionId}">
                ${content}
            </div>
        </div>
    `;
}
