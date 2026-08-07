const AI_CHAT_HTML = `
<div id="ai-chat-modal" class="ai-modal-overlay" style="display: none;">
    <div class="ai-modal-content premium-glass">
        <div class="ai-header">
            <div class="ai-header-title">
                <span class="ai-icon">✨</span> GAVA MI Asszisztens
            </div>
            <div class="ai-header-actions" style="display: flex; gap: 8px; align-items: center;">
                <button id="ai-export-btn" class="icon-btn-sm" style="color: white; font-size: 14px; background: transparent; border: none; cursor: pointer;" title="Teljes beszélgetés mentése PDF-be">💾</button>
                <button id="ai-minimize-btn" class="icon-btn-sm" style="color: white; font-size: 14px; background: transparent; border: none; cursor: pointer;" title="Letétel a tálcára">🗕</button>
                <button id="ai-fullscreen-btn" class="icon-btn-sm" style="color: white; font-size: 14px; background: transparent; border: none; cursor: pointer;" title="Teljes képernyő">🗖</button>
                <button id="ai-close-btn" class="icon-btn-sm" style="color: white; font-size: 14px; background: transparent; border: none; cursor: pointer;">✕</button>
            </div>
        </div>
        
        <div id="ai-chat-history" class="ai-chat-history">
            <div class="ai-message system">Üdvözlöm! Miben segíthetek? Töltsön fel egy dokumentumot (PDF, DOCX, CSV, XLSX) az elemzéshez.</div>
        </div>

        <div id="ai-document-section" class="ai-document-section">
            <input type="file" id="ai-file-input" style="display: none;" accept=".pdf,.docx,.csv,.xlsx">
            <button id="ai-upload-btn" class="secondary-btn" style="width: 100%; border: 1px dashed var(--border);">📄 Dokumentum feltöltése</button>
            <div id="ai-active-doc" style="display: none; margin-top: 10px; font-size: 12px; color: var(--primary);">
                <span id="ai-active-doc-name"></span>
                <button id="ai-detach-doc-btn" title="Dokumentum leválasztása" style="background: transparent; border: none; cursor: pointer; font-size: 12px; margin-left: 6px;">✕ leválasztás</button>
            </div>
        </div>
        
        <div id="ai-options-section" class="ai-options-section" style="display: none; flex-wrap: wrap; gap: 8px; padding: 10px;">
            <!-- Options injected here -->
        </div>

        <div id="ai-quick-analysis" class="ai-quick-analysis">
            <!-- Gyorselemzés gombok (dokumentum nélkül is elérhetők) -->
        </div>

        <div class="ai-input-area">
            <input type="text" id="ai-text-input" class="access-input" placeholder="Tegye fel kérdését..." style="flex-grow: 1;">
            <button id="ai-send-btn" class="primary-btn" style="min-width: 80px;">Küldés</button>
        </div>
    </div>
</div>

<div id="ai-chat-minimized-badge" class="ai-minimized-badge" style="display: flex;">
    <span class="ai-icon">✨</span> GAVA MI Asszisztens
</div>

<style>
.ai-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; /* Átkattintható hátter */
    z-index: 9999;
}

.ai-modal-content {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 450px;
    height: 600px;
    background: var(--surface);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.1);
    transition: width 0.3s, height 0.3s;
    pointer-events: auto; /* A panel viszont fogadja a kattintást */
}

.ai-modal-content.fullscreen {
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    border-radius: 0 !important;
    transform: none !important;
}

.ai-minimized-badge {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: white;
    padding: 10px 18px;
    border-radius: 30px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5);
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    user-select: none;
    touch-action: none;
}

.ai-minimized-badge.dragging {
    cursor: grabbing;
    transition: none;
}

.ai-minimized-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(99, 102, 241, 0.7);
}

.ai-header {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    font-weight: 600;
    cursor: grab;
}
.ai-header:active {
    cursor: grabbing;
}
.ai-chart-container {
    background: white;
    border-radius: 8px;
    padding: 10px;
    margin-top: 10px;
}

.ai-chat-history {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.ai-message {
    padding: 10px 14px;
    border-radius: 12px;
    max-width: 85%;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-word;
}

.ai-message.system {
    background: rgba(255,255,255,0.05);
    align-self: flex-start;
    border: 1px solid var(--border);
    color: var(--text-main);
}

.ai-message.user {
    background: var(--primary);
    color: white;
    align-self: flex-end;
}

.ai-message ul {
    margin: 4px 0;
    padding-left: 18px;
}

.ai-message code {
    background: rgba(255,255,255,0.1);
    padding: 1px 4px;
    border-radius: 4px;
    font-size: 13px;
}

.ai-document-section {
    padding: 10px 20px;
    border-top: 1px solid var(--border);
}

.ai-option-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    color: var(--text-main);
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.ai-option-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: var(--primary);
}

.ai-option-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.ai-quick-analysis {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 20px;
    border-top: 1px solid var(--border);
}

.ai-input-area {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 10px;
    background: rgba(0,0,0,0.1);
}
</style>
`;

/**
 * Egyszerű, biztonságos markdown-renderelés:
 * HTML-escape után félkövér, kód, fejléc és lista elemeket alakít.
 */
function renderMarkdown(text) {
    const escaped = String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const lines = escaped.split('\n');
    let html = '';
    let inList = false;
    let inTable = false;

    const inline = (s) => s
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    for (const rawLine of lines) {
        const line = rawLine;

        // Table row detection
        const isTableRow = /^\s*\|(.*)\|\s*$/.test(line);
        const isTableSeparator = /^\s*\|(?:[\s\-\:]+\|)+\s*$/.test(line);
        
        if (isTableRow) {
            if (inList) { html += '</ul>'; inList = false; }
            if (isTableSeparator) continue; // Skip separator line
            
            const cols = line.match(/^\s*\|(.*)\|\s*$/)[1].split('|').map(c => c.trim());
            
            if (!inTable) {
                html += '<div class="ai-table-container"><table class="ai-table"><thead><tr>';
                cols.forEach(c => html += `<th>${inline(c)}</th>`);
                html += '</tr></thead><tbody>';
                inTable = true;
            } else {
                html += '<tr>';
                cols.forEach(c => html += `<td>${inline(c)}</td>`);
                html += '</tr>';
            }
            continue;
        } else if (inTable) {
            html += '</tbody></table></div>';
            inTable = false;
        }

        const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
        if (bulletMatch) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += `<li>${inline(bulletMatch[1])}</li>`;
            continue;
        }
        if (inList) { html += '</ul>'; inList = false; }

        const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (headerMatch) {
            html += `<strong>${inline(headerMatch[2])}</strong><br>`;
        } else if (line.trim() === '---') {
            html += '<hr style="border: none; border-top: 1px solid var(--border); margin: 6px 0;">';
        } else {
            html += inline(line) + '<br>';
        }
    }
    if (inList) html += '</ul>';
    if (inTable) html += '</tbody></table></div>';
    
    // Parse ```chart ... ``` blocks
    html = html.replace(/```chart(?:<br>|\s)*(\{[\s\S]*?\})(?:<br>|\s)*```/g, (match, jsonString) => {
        try {
            // Restore newlines and clean up HTML entities and simple tags that might have been added
            let cleanJson = jsonString
                .replace(/<br>/g, '\n')
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/<strong>(.*?)<\/strong>/g, '$1')
                .replace(/<em>(.*?)<\/em>/g, '$1')
                .replace(/<code>(.*?)<\/code>/g, '$1');

            const config = JSON.parse(cleanJson);
            const uuid = 'chart-' + Math.random().toString(36).substr(2, 9);
            return `<div class="ai-chart-container"><canvas id="${uuid}" class="ai-chart-canvas" data-chart-config='${JSON.stringify(config).replace(/'/g, "&#39;")}'></canvas></div>`;
        } catch (e) {
            return `<div style="color:red">Grafikon hiba: ${e.message}</div>`;
        }
    });

    return html;
}

export function initAiChat() {
    if (!document.getElementById('chart-js-lib')) {
        const script = document.createElement('script');
        script.id = 'chart-js-lib';
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(script);
    }

    // Append HTML if not exists
    if (!document.getElementById('ai-chat-modal')) {
        const div = document.createElement('div');
        div.innerHTML = AI_CHAT_HTML;
        document.body.appendChild(div);
    }

    const modal = document.getElementById('ai-chat-modal');
    const modalContent = modal.querySelector('.ai-modal-content');
    const closeBtn = document.getElementById('ai-close-btn');
    const fullscreenBtn = document.getElementById('ai-fullscreen-btn');
    const minimizeBtn = document.getElementById('ai-minimize-btn');
    const exportBtn = document.getElementById('ai-export-btn');
    const minimizedBadge = document.getElementById('ai-chat-minimized-badge');
    const fileInput = document.getElementById('ai-file-input');
    const uploadBtn = document.getElementById('ai-upload-btn');
    const activeDocDiv = document.getElementById('ai-active-doc');
    const activeDocName = document.getElementById('ai-active-doc-name');
    const detachDocBtn = document.getElementById('ai-detach-doc-btn');
    const optionsSection = document.getElementById('ai-options-section');
    const textInput = document.getElementById('ai-text-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const chatHistory = document.getElementById('ai-chat-history');

    let currentDocumentId = null;
    // Besztélgetés-history a kontextuális follow-up kérdésekhez
    const conversationHistory = [];
    let isSending = false;

    // Gyórselemzés gombok betöltése
    const quickAnalysisSection = document.getElementById('ai-quick-analysis');

    function renderQuickReplies(optionsStr) {
        if (!quickAnalysisSection) return;
        quickAnalysisSection.innerHTML = '';
        if (!optionsStr) return;
        
        const options = optionsStr.split('|').map(s => s.trim()).filter(Boolean);
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'ai-option-btn';
            btn.textContent = opt;
            btn.title = opt;
            btn.addEventListener('click', () => sendChat(opt, null));
            quickAnalysisSection.appendChild(btn);
        });
    }


    // Draggable logic
    const header = modal.querySelector('.ai-header');
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let startLeft = 0, startTop = 0;

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return; // Ignore buttons
        if (isFullscreen) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        const rect = modalContent.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        // Convert bottom/right fixed positioning to explicit top/left for dragging
        modalContent.style.bottom = 'auto';
        modalContent.style.right = 'auto';
        modalContent.style.left = startLeft + 'px';
        modalContent.style.top = startTop + 'px';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        modalContent.style.left = (startLeft + dx) + 'px';
        modalContent.style.top = (startTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Open listener
    window.addEventListener('app:open-ai-chat', () => {
        if (minimizedBadge) minimizedBadge.style.display = 'none';
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        // X gombnál is megy vissza a jelvény (minimalizált állapot), ne tűnjön el teljesen
        if (minimizedBadge) minimizedBadge.style.display = 'flex';
    });

    if (minimizeBtn && minimizedBadge) {
        minimizeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            minimizedBadge.style.display = 'flex';
        });

        minimizedBadge.addEventListener('click', (e) => {
            // Drag művelet végén ne nyissa meg a modalt
            if (minimizedBadge.dataset.dragged === 'true') {
                minimizedBadge.dataset.dragged = 'false';
                return;
            }
            minimizedBadge.style.display = 'none';
            modal.style.display = 'block';
        });
    }

    // Badge drag logic – szabadon mozgatható a jelvény a képernyőn
    let badgeDragging = false;
    let badgeStartX = 0, badgeStartY = 0, badgePosX = 0, badgePosY = 0;
    minimizedBadge.addEventListener('mousedown', (e) => {
        badgeDragging = true;
        badgeStartX = e.clientX;
        badgeStartY = e.clientY;
        const rect = minimizedBadge.getBoundingClientRect();
        badgePosX = rect.left;
        badgePosY = rect.top;
        minimizedBadge.classList.add('dragging');
        minimizedBadge.dataset.dragged = 'false';
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!badgeDragging) return;
        const dx = e.clientX - badgeStartX;
        const dy = e.clientY - badgeStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) minimizedBadge.dataset.dragged = 'true';
        minimizedBadge.style.left = (badgePosX + dx) + 'px';
        minimizedBadge.style.top = (badgePosY + dy) + 'px';
        minimizedBadge.style.bottom = 'auto';
        minimizedBadge.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => {
        if (badgeDragging) {
            badgeDragging = false;
            minimizedBadge.classList.remove('dragging');
        }
    });

    let isFullscreen = false;
    fullscreenBtn.addEventListener('click', () => {
        isFullscreen = !isFullscreen;
        if (isFullscreen) {
            modalContent.classList.add('fullscreen');
            fullscreenBtn.textContent = '🗗';
            // Reset drag positions so it fills the screen
            modalContent.style.left = '';
            modalContent.style.top = '';
        } else {
            modalContent.classList.remove('fullscreen');
            fullscreenBtn.textContent = '🗖';
            // Visszatesszük a bal alsó sarokba, ha bezárjuk a fullscreent
            modalContent.style.right = 'auto';
            modalContent.style.top = 'auto';
            modalContent.style.bottom = '20px';
            modalContent.style.left = '20px';
        }
    });

    exportBtn.addEventListener('click', () => {
        if (typeof html2pdf === 'undefined') {
            alert('A PDF exportáló modul még töltődik, vagy nem érhető el.');
            return;
        }

        // Kikeressük az összes üzenetet
        const messages = Array.from(chatHistory.querySelectorAll('.ai-message'));

        // Kiszűrjük az üdvözlő és a folyamatjelző üzeneteket
        const validMessages = messages.filter(m =>
            !m.textContent.includes('Üdvözlöm! Miben segíthetek?') &&
            !m.textContent.includes('Gondolkodom...') &&
            !m.textContent.includes('PDF generálása folyamatban...') &&
            !m.textContent.includes('Sajnos nem érkezett válasz')
        );

        if (validMessages.length === 0) {
            alert('Még nincs exportálható elemzés vagy válasz a beszélgetésben.');
            return;
        }

        // Kiválasztjuk az UTOLSÓ generált választ
        const lastAnswer = validMessages[validMessages.length - 1];

        // Átmeneti konténer a letisztult PDF exportáláshoz
        const printContainer = document.createElement('div');
        printContainer.style.padding = '25px';
        printContainer.style.background = '#ffffff';
        printContainer.style.color = '#1f2937';
        printContainer.style.fontFamily = 'Outfit, sans-serif';
        printContainer.style.lineHeight = '1.6';

        // Fejléc információk
        const title = document.createElement('h2');
        title.textContent = 'GAVA MI Asszisztens - Elemzési Riport';
        title.style.color = '#4f46e5';
        title.style.borderBottom = '2px solid #6366f1';
        title.style.paddingBottom = '10px';
        title.style.marginBottom = '12px';
        printContainer.appendChild(title);

        if (activeDocName && activeDocName.textContent) {
            const docInfo = document.createElement('div');
            docInfo.style.fontSize = '12px';
            docInfo.style.color = '#6b7280';
            docInfo.style.marginBottom = '15px';
            docInfo.textContent = activeDocName.textContent;
            printContainer.appendChild(docInfo);
        }

        // Tartalmi doboz az utolsó generált válasznak
        const contentBox = document.createElement('div');
        contentBox.style.background = '#ffffff';
        contentBox.style.border = '1px solid #e5e7eb';
        contentBox.style.borderRadius = '8px';
        contentBox.style.padding = '18px';
        contentBox.style.fontSize = '12px';
        contentBox.style.color = '#111827';
        contentBox.innerHTML = lastAnswer.innerHTML;

        // Copy canvas content from original chart canvases to printed ones
        const originalCanvases = lastAnswer.querySelectorAll('canvas');
        const printedCanvases = contentBox.querySelectorAll('canvas');
        printedCanvases.forEach((canvas, index) => {
            const original = originalCanvases[index];
            if (original) {
                canvas.width = original.width;
                canvas.height = original.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(original, 0, 0);
            }
        });

        printContainer.appendChild(contentBox);

        const opt = {
            margin: 12,
            filename: 'Gava_MI_Elemzes.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        addMessage('⏳ Legutóbbi válasz exportálása PDF-be...', 'system');
        html2pdf().from(printContainer).set(opt).save();
    });

    // File upload
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        addMessage(`⏳ ${file.name} feltöltése és feldolgozása...`, 'system');
        uploadBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/v1/ai/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                currentDocumentId = data.documentId;
                activeDocName.textContent = `Aktív dokumentum: ${file.name} (${data.category})`;
                activeDocDiv.style.display = 'block';
                addMessage(`✅ ${file.name} sikeresen feldolgozva! Válasszon egy opciót vagy tegye fel a kérdését.`, 'system');
                loadOptions(currentDocumentId);
            } else {
                addMessage(`❌ Hiba a feltöltés során: ${data.error}`, 'system');
            }
        } catch (err) {
            addMessage(`❌ Hálózati hiba a fájl feltöltésekor.`, 'system');
        } finally {
            uploadBtn.disabled = false;
            fileInput.value = ''; // reset
        }
    });

    // Aktív dokumentum leválasztása – töröljük a fizikai adatbázisból is a temporary vektort!
    detachDocBtn.addEventListener('click', async () => {
        if (currentDocumentId) {
            const docIdToDelete = currentDocumentId;
            currentDocumentId = null;
            activeDocDiv.style.display = 'none';
            activeDocName.textContent = '';
            optionsSection.style.display = 'none';
            optionsSection.innerHTML = '';
            
            try {
                await fetch(`/api/v1/ai/documents/${docIdToDelete}`, { method: 'DELETE' });
                addMessage('📄 Dokumentum leválasztva és törölve az adatbázisból.', 'system');
            } catch (err) {
                console.error('Hiba a dokumentum törlésekor:', err);
                addMessage('📄 Dokumentum leválasztva.', 'system');
            }
        }
    });

    async function loadOptions(docId) {
        try {
            const res = await fetch(`/api/v1/ai/options/${docId}`);
            const data = await res.json();

            if (data.success && data.options.length > 0) {
                optionsSection.innerHTML = '';
                data.options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'ai-option-btn';
                    btn.textContent = opt.label;
                    btn.addEventListener('click', () => {
                        if (opt.id === 'other') {
                            textInput.focus();
                        } else {
                            sendChat(null, opt.id, opt.label);
                        }
                    });
                    optionsSection.appendChild(btn);
                });
                optionsSection.style.display = 'flex';
            }
        } catch (err) {
            console.error('Failed to load options', err);
        }
    }

    function addMessage(text, type = 'system') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${type}`;
        if (type === 'system') {
            msgDiv.innerHTML = renderMarkdown(text);
        } else {
            msgDiv.textContent = text;
        }
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return msgDiv;
    }

    function getUiContext() {
        if (typeof window.gavaWindowManager === 'undefined') return [];
        const context = [];
        const windows = window.gavaWindowManager.getWindows();
        windows.forEach(win => {
            const formData = {};
            const gridData = {};
            if (win.contentElement) {
                const inputs = win.contentElement.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    if (input.dataset && input.dataset.index !== undefined && input.dataset.field) {
                        const idx = input.dataset.index;
                        const field = input.dataset.field;
                        if (input.value && input.value.trim() !== '') {
                            if (!gridData[idx]) gridData[idx] = {};
                            gridData[idx][field] = input.value;
                        }
                    } else if (input.name || input.id) {
                        formData[input.name || input.id] = input.value;
                    }
                });
            }
            
            const tableRows = Object.values(gridData).filter(row => Object.keys(row).length > 0);
            if (tableRows.length > 0) {
                formData['table_rows'] = tableRows;
            }
            context.push({
                id: win.id,
                title: win.title,
                isActive: win.isActive,
                formData: Object.keys(formData).length > 0 ? formData : null
            });
        });
        return context;
    }

    function renderActionCard(action, container) {
        const card = document.createElement('div');
        card.className = 'ai-action-card premium-glass';
        card.style.padding = '12px';
        card.style.marginTop = '10px';
        card.style.border = '1px solid var(--primary)';
        card.style.borderRadius = '8px';
        
        let html = `<strong style="color: var(--primary);">Javasolt Művelet: ${action.name}</strong><br>`;
        html += `<pre style="font-size: 11px; background: rgba(0,0,0,0.1); padding: 8px; margin: 8px 0; border-radius: 4px; overflow-x: auto;">${JSON.stringify(action.payload, null, 2)}</pre>`;
        
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '8px';
        
        const approveBtn = document.createElement('button');
        approveBtn.className = 'primary-btn';
        approveBtn.textContent = 'Jóváhagyás';
        approveBtn.style.padding = '6px 12px';
        approveBtn.style.fontSize = '12px';
        approveBtn.onclick = () => executeAction(action.name, action.payload, 'approve', card);
        
        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'secondary-btn';
        rejectBtn.textContent = 'Elutasítás';
        rejectBtn.style.padding = '6px 12px';
        rejectBtn.style.fontSize = '12px';
        rejectBtn.onclick = () => executeAction(action.name, action.payload, 'reject', card);
        
        btnGroup.appendChild(approveBtn);
        btnGroup.appendChild(rejectBtn);
        
        card.innerHTML = html;
        card.appendChild(btnGroup);
        container.appendChild(card);
        container.scrollTop = container.scrollHeight;
    }

    async function executeAction(actionName, payload, decision, cardElement) {
        const buttons = cardElement.querySelectorAll('button');
        buttons.forEach(b => b.disabled = true);
        
        try {
            const res = await fetch('/api/v1/ai/actions/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action_name: actionName, payload, decision })
            });
            const data = await res.json();
            
            if (data.success) {
                cardElement.innerHTML += `<div style="margin-top: 8px; font-weight: bold; font-size: 13px; color: ${decision === 'approve' ? '#10b981' : '#f43f5e'};">✅ Végrehajtva: ${decision === 'approve' ? 'Jóváhagyva' : 'Elutasítva'}</div>`;
            } else {
                cardElement.innerHTML += `<div style="margin-top: 8px; font-weight: bold; font-size: 13px; color: #f43f5e;">❌ Hiba: ${data.error}</div>`;
            }
        } catch (err) {
            cardElement.innerHTML += `<div style="margin-top: 8px; font-weight: bold; font-size: 13px; color: #f43f5e;">❌ Hálózati hiba.</div>`;
        }
    }

    async function sendChat(messageText, optionId = null, optionLabel = null) {
        if (isSending) return; // dupla küldés megakadályozása
        isSending = true;
        sendBtn.disabled = true;

        const textToSend = messageText || optionLabel || 'Kérdés';
        addMessage(textToSend, 'user');
        textInput.value = '';
        conversationHistory.push({ role: 'user', content: messageText || optionLabel || '' });

        const answerDiv = document.createElement('div');
        answerDiv.className = 'ai-message system';
        answerDiv.innerHTML = '<span class="loading-dots">Gondolkodom...</span>';
        chatHistory.appendChild(answerDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        let fullAnswer = '';
        let streamStarted = false;

        try {
            const res = await fetch('/api/v1/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: currentDocumentId,
                    message: messageText,
                    optionId: optionId,
                    history: conversationHistory.slice(-10),
                    uiContext: getUiContext()
                })
            });

            if (!res.ok || !res.body) {
                answerDiv.remove();
                addMessage(`❌ Hiba: a szerver ${res.status} hibát adott.`, 'system');
                return;
            }

            // SSE stream olvasása
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const events = buffer.split('\n\n');
                buffer = events.pop(); // az utolsó (esetleg félbemaradt) esemény marad

                for (const evt of events) {
                    const dataLine = evt.split('\n').find(l => l.startsWith('data: '));
                    if (!dataLine) continue;
                    const payload = dataLine.slice(6).trim();
                    if (payload === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(payload);
                        if (parsed.error) {
                            fullAnswer += `\n\n❌ Hiba: ${parsed.error}`;
                        } else if (parsed.action) {
                            renderActionCard(parsed.action, chatHistory);
                        } else if (parsed.delta) {
                            fullAnswer += parsed.delta;
                        }
                    } catch (_) { /* félbemaradt JSON – kihagyjuk */ }
                }

                if (fullAnswer) {
                    if (!streamStarted) streamStarted = true;
                    answerDiv.innerHTML = renderMarkdown(fullAnswer);
                    chatHistory.scrollTop = chatHistory.scrollHeight;
                }
            }

            // Ha nem SSE stream volt (vagy a lezáratlan pufferben maradt a JSON válasz), próbáljuk JSON-ként feldolgozni
            if (!fullAnswer && buffer.trim()) {
                try {
                    const jsonRes = JSON.parse(buffer.trim());
                    if (jsonRes.response) fullAnswer = jsonRes.response;
                    else if (jsonRes.message) fullAnswer = jsonRes.message;
                    else if (jsonRes.error) fullAnswer = `❌ Hiba: ${jsonRes.error}`;
                } catch (_) { }
            }

            // Keresünk gyorsgombokat a válasz végén
            let quickRepliesStr = null;
            const qrMatch = fullAnswer.match(/\[QUICK_REPLIES:\s*(.+?)\]/);
            if (qrMatch) {
                quickRepliesStr = qrMatch[1];
                fullAnswer = fullAnswer.replace(qrMatch[0], '').trim();
            }
            renderQuickReplies(quickRepliesStr);

            if (!fullAnswer) {
                answerDiv.innerHTML = renderMarkdown('Sajnos nem érkezett válasz a szervertől.');
            } else {
                answerDiv.innerHTML = renderMarkdown(fullAnswer);
            }
            conversationHistory.push({ role: 'assistant', content: fullAnswer });
            
            // Initialize any charts
            setTimeout(() => {
                const canvases = answerDiv.querySelectorAll('.ai-chart-canvas');
                canvases.forEach(canvas => {
                    if (!canvas.dataset.initialized) {
                        const initChart = () => {
                            if (window.Chart) {
                                try {
                                    const config = JSON.parse(canvas.dataset.chartConfig);
                                    new Chart(canvas, {
                                        type: config.type || 'bar',
                                        data: {
                                            labels: config.labels || [],
                                            datasets: config.datasets || []
                                        },
                                        options: {
                                            responsive: true,
                                            plugins: {
                                                title: {
                                                    display: !!config.title,
                                                    text: config.title || ''
                                                }
                                            }
                                        }
                                    });
                                    canvas.dataset.initialized = 'true';
                                } catch (e) {
                                    console.error('Chart init error', e);
                                }
                            } else {
                                setTimeout(initChart, 200);
                            }
                        };
                        initChart();
                    }
                });
            }, 100);

        } catch (err) {
            answerDiv.remove();
            addMessage(`❌ Hálózati hiba a válaszadás során: ${err.message}`, 'system');
        } finally {
            isSending = false;
            sendBtn.disabled = false;
        }
    }

    sendBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            sendChat(text, null);
        }
    });

    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = textInput.value.trim();
            if (text) {
                sendChat(text, null);
            }
        }
    });
}
