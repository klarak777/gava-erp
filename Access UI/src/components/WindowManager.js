export class WindowManager {
    constructor(container) {
        this.container = container;
        this.windows = new Map(); // id -> window element
        this.activeWindowId = null;
        this.zIndexCounter = 1000; // Start high to ensure windows are above sidebar and topbar
        this.windowCount = 0;

        // Container positioning handled in CSS

        // Create Taskbar
        this.taskbar = document.createElement('div');
        this.taskbar.className = 'mdi-taskbar';
        this.taskbar.style.display = 'none'; // Initially hidden
        this.container.appendChild(this.taskbar);
    }

    open(moduleId, title, renderCallback) {
        // Check if window already exists (singleton per module for now)
        const existingWindowId = Array.from(this.windows.keys()).find(id => id.startsWith(moduleId));
        if (existingWindowId) {
            this.focus(existingWindowId);
            return;
        }

        const id = `${moduleId}-${this.windowCount++}`;
        const windowEl = this.createWindowElement(id, title);

        this.windows.set(id, windowEl);
        this.container.appendChild(windowEl);

        // Ensure window starts visible
        windowEl.style.display = 'flex';

        // Render content
        const contentEl = windowEl.querySelector('.window-content');
        if (renderCallback) {
            renderCallback(contentEl, this);
        }

        // Create Taskbar Item (hidden until minimized)
        this.createTaskbarItem(id, title);
        this.updateTaskbarTray();

        // Setup Dragging
        this.makeDraggable(windowEl);

        // Focus
        this.focus(id);

        // Initial Position (cascade)
        // Start below topbar (70px)
        const offset = 30 * (this.windowCount % 10);
        windowEl.style.top = `${70 + 20 + offset}px`;
        windowEl.style.left = `${20 + offset}px`;
    }

    createModal({ title, width, height, content }) {
        const id = `modal-${this.windowCount++}`;
        const windowEl = this.createWindowElement(id, title);

        // Apply Custom Dimensions
        if (width) windowEl.style.width = typeof width === 'number' ? `${width}px` : width;
        if (height) windowEl.style.height = typeof height === 'number' ? `${height}px` : height;

        this.windows.set(id, windowEl);
        this.container.appendChild(windowEl);

        // Ensure window starts visible
        windowEl.style.display = 'flex';

        // Center the modal
        // We need to wait for render to know exact dimensions if not set, but here we likely set them.
        setTimeout(() => {
            const containerWidth = this.container.offsetWidth || window.innerWidth;
            const containerHeight = this.container.offsetHeight || window.innerHeight;
            const winWidth = windowEl.offsetWidth;
            const winHeight = windowEl.offsetHeight;

            const left = Math.max(20, (containerWidth - winWidth) / 2);
            const top = Math.max(70, (containerHeight - winHeight) / 2);

            windowEl.style.left = `${left}px`;
            windowEl.style.top = `${top}px`;
        }, 0);

        // Set Content directly
        if (content) {
            const contentEl = windowEl.querySelector('.window-content');
            if (typeof content === 'string') {
                contentEl.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                contentEl.appendChild(content);
            }
        }

        // Create Taskbar Item (hidden until minimized)
        this.createTaskbarItem(id, title);
        this.updateTaskbarTray();

        // Setup Dragging
        this.makeDraggable(windowEl);

        // Focus
        this.focus(id);

        return {
            id,
            element: windowEl,
            close: () => this.close(id)
        };
    }

    createWindowElement(id, title) {
        const el = document.createElement('div');
        el.className = 'mdi-window';
        el.id = id;

        el.innerHTML = `
            <div class="window-header">
                <span class="window-title">${title}</span>
                <div class="window-controls">
                    <button class="win-btn minimize" title="Kis méret">_</button>
                    <button class="win-btn maximize" title="Teljes méret">□</button>
                    <button class="win-btn close" title="Bezárás">×</button>
                </div>
            </div>
            <div class="window-content"></div>
        `;

        // Event Listeners
        el.addEventListener('mousedown', () => this.focus(id));

        el.querySelector('.close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.close(id);
        });

        el.querySelector('.minimize').addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimize(id);
        });

        el.querySelector('.maximize').addEventListener('click', (e) => {
            e.stopPropagation();
            this.maximize(id);
        });

        return el;
    }

    createTaskbarItem(id, title) {
        const item = document.createElement('div');
        item.className = 'taskbar-item';
        item.dataset.windowId = id;
        item.textContent = title;
        item.style.display = 'none'; // Initially hidden
        item.onclick = (e) => {
            e.stopPropagation();
            this.restore(id);
        };
        this.taskbar.appendChild(item);
    }

    updateTaskbarTray() {
        if (!this.taskbar) return;
        const visibleItems = Array.from(this.taskbar.children).some(item => item.style.display !== 'none');
        this.taskbar.style.display = visibleItems ? 'flex' : 'none';
        this.taskbar.style.visibility = visibleItems ? 'visible' : 'hidden'; // Ensure it doesn't take pointer events when hidden
    }

    close(id) {
        const win = this.windows.get(id);
        if (win) {
            win.remove();
            this.windows.delete(id);

            // Remove taskbar item
            const taskItem = this.taskbar.querySelector(`[data-window-id="${id}"]`);
            if (taskItem) taskItem.remove();

            this.updateTaskbarTray();
        }
    }

    closeAll() {
        // Close all windows
        const windowIds = Array.from(this.windows.keys());
        windowIds.forEach(id => this.close(id));
        this.activeWindowId = null;
    }

    hideTaskbar() {
        if (this.taskbar) {
            this.taskbar.style.display = 'none';
        }
    }

    showTaskbar() {
        if (this.taskbar) {
            this.taskbar.style.display = 'flex';
        }
    }

    focus(id) {
        const win = this.windows.get(id);
        if (win) {
            this.activeWindowId = id;
            win.style.zIndex = ++this.zIndexCounter;
            win.classList.add('active');

            // Update other windows style
            this.windows.forEach((w, key) => {
                if (key !== id) w.classList.remove('active');
            });

            // Update taskbar
            Array.from(this.taskbar.children).forEach(item => {
                item.classList.toggle('active', item.dataset.windowId === id);
            });

            // If it was minimized
            if (win.style.display === 'none') {
                this.restore(id);
            }
        }
    }

    minimize(id) {
        const win = this.windows.get(id);
        if (win) {
            win.style.display = 'none';
            const taskItem = this.taskbar.querySelector(`[data-window-id="${id}"]`);
            if (taskItem) {
                taskItem.style.display = 'flex';
                taskItem.classList.remove('active');
            }
            this.activeWindowId = null;
            this.updateTaskbarTray();
        }
    }

    restore(id) {
        const win = this.windows.get(id);
        if (win) {
            win.style.display = 'flex';
            const taskItem = this.taskbar.querySelector(`[data-window-id="${id}"]`);
            if (taskItem) {
                taskItem.style.display = 'none';
            }
            this.updateTaskbarTray();
            this.focus(id);
        }
    }

    maximize(id) {
        const win = this.windows.get(id);
        if (win) {
            win.classList.toggle('maximized');
        }
    }

    makeDraggable(element) {
        const header = element.querySelector('.window-header');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.addEventListener('mousedown', (e) => {
            if (element.classList.contains('maximized')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = element.offsetLeft;
            initialTop = element.offsetTop;
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            // Boundary checks
            // Stop at browser viewport top (0 in main-container)
            // Allow some header to stay visible if dragged up?
            if (newTop < 0) newTop = 0;

            // Optional: Constrain left/right/bottom to keep window partially visible
            const minVisible = 100; // pixels
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            const winWidth = element.offsetWidth;
            const winHeight = element.offsetHeight;

            if (newLeft < -winWidth + minVisible) newLeft = -winWidth + minVisible;
            if (newLeft > containerWidth - minVisible) newLeft = containerWidth - minVisible;
            if (newTop > containerHeight - minVisible) newTop = containerHeight - minVisible;

            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'grab';
        });
    }
}
