const PAGE_WIDTH = 186;
const PAGE_HEIGHT = 272; // A4 minus 12 mm margins, with rounding clearance.

function reportBlocks(answer) {
    const clone = answer.cloneNode(true);
    const originalCanvases = answer.querySelectorAll('canvas');
    clone.querySelectorAll('canvas').forEach((canvas, index) => {
        const image = document.createElement('img');
        image.src = originalCanvases[index].toDataURL('image/png');
        image.alt = 'Elemzési grafikon';
        canvas.replaceWith(image);
    });
    const blocks = [];
    let paragraph = document.createElement('p');
    const flush = () => {
        if (paragraph.textContent.trim() || paragraph.querySelector('img')) {
            const elements = Array.from(paragraph.childNodes).filter(node => node.textContent.trim());
            if (elements.length === 1 && elements[0].nodeName === 'STRONG' && paragraph.textContent.length < 180) {
                const heading = document.createElement('h3');
                heading.append(...paragraph.childNodes);
                blocks.push(heading);
            } else blocks.push(paragraph);
        }
        paragraph = document.createElement('p');
    };
    for (const node of Array.from(clone.childNodes)) {
        if (node.nodeName === 'BR') { flush(); continue; }
        if (/^(DIV|TABLE|UL|OL|P|PRE|HR|H[1-6])$/.test(node.nodeName)) {
            flush();
            const table = node.nodeName === 'TABLE' ? node : node.querySelector('table');
            if (table) blocks.push(table);
            else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
                Array.from(node.children).forEach((item, index) => {
                    const list = node.cloneNode(false);
                    if (node.nodeName === 'OL') list.start = (node.start || 1) + index;
                    list.appendChild(item);
                    blocks.push(list);
                });
            } else blocks.push(node);
        } else paragraph.appendChild(node);
    }
    flush();
    return blocks;
}

// Measure real browser layout before rendering. Each canvas is just one page,
// so long reports never become a single canvas above the browser's size limit.
export async function buildReportPages(answer, documentName = '') {
    await document.fonts?.ready;
    const staging = document.createElement('div');
    staging.className = 'ai-pdf-staging';
    staging.style.cssText = 'position:absolute;left:-10000px;top:0;width:186mm;';
    const style = document.createElement('style');
    style.textContent = `
      .ai-pdf-page { width:${PAGE_WIDTH}mm;height:${PAGE_HEIGHT}mm;box-sizing:border-box;background:white;
        color:#111827;font:12px/1.55 Arial,sans-serif;padding:8px 12px;display:flex;flex-direction:column; }
      .ai-pdf-body { flex:1;min-height:0;display:flow-root;overflow:hidden; }
      .ai-pdf-block { display:flow-root;margin:0 0 8px; }
      .ai-pdf-page h2 { font-size:19px;color:#4f46e5;border-bottom:2px solid #6366f1;padding-bottom:8px;margin:0 0 10px; }
      .ai-pdf-page h3,.ai-pdf-page h4 { font-size:13px;margin:8px 0; }
      .ai-pdf-page p { margin:0 0 7px;white-space:normal;overflow-wrap:anywhere; }
      .ai-pdf-page ul,.ai-pdf-page ol { margin:0 0 4px;padding-left:20px; }
      .ai-pdf-page pre { white-space:pre-wrap;overflow-wrap:anywhere; }
      .ai-pdf-page table { width:100%;border-collapse:collapse;table-layout:fixed;font:12px/1.45 Arial,sans-serif;margin:0; }
      .ai-pdf-page th,.ai-pdf-page td { border:1px solid #dbe2ea;padding:7px 9px;text-align:left;
        white-space:normal;overflow-wrap:anywhere;color:#111827; }
      .ai-pdf-page th { background:#f3f4f6;font-weight:bold; }
      .ai-pdf-page hr { border:0;border-top:1px solid #e5e7eb;margin:8px 0; }
      .ai-pdf-page img { max-width:100%;height:auto;display:block;object-fit:contain; }
      .ai-pdf-page .ai-chart-container { width:100%;height:auto;max-height:none; }
      .ai-pdf-doc-info { font-size:10px;color:#6b7280;margin-bottom:12px;overflow-wrap:anywhere; }
      .ai-pdf-footer { height:5mm;flex-shrink:0;font-size:9px;color:#6b7280;text-align:right;padding-top:5px; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(staging);
    const pages = [];
    let body;
    const cleanup = () => { staging.remove(); style.remove(); };
    const newPage = () => {
        const page = document.createElement('div');
        page.className = 'ai-pdf-page';
        body = document.createElement('div');
        body.className = 'ai-pdf-body';
        page.appendChild(body);
        const footer = document.createElement('div');
        footer.className = 'ai-pdf-footer';
        page.appendChild(footer);
        staging.appendChild(page);
        pages.push(page);
    };
    const fits = () => body.scrollHeight <= body.clientHeight + 1 &&
        (!body.lastElementChild || body.lastElementChild.getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom + 0.5);
    const wrap = nodes => {
        const block = document.createElement('div');
        block.className = 'ai-pdf-block';
        block.append(...nodes);
        return block;
    };
    const textFragment = (element, start, end) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let offset = 0, started = false, node;
        while ((node = walker.nextNode())) {
            const next = offset + node.length;
            if (!started && start < next) { range.setStart(node, start - offset); started = true; }
            if (started && end <= next) { range.setEnd(node, end - offset); break; }
            offset = next;
        }
        const fragment = element.cloneNode(false);
        fragment.appendChild(range.cloneContents());
        return fragment;
    };
    const splitParagraph = (element, lead) => {
        const text = element.textContent;
        const ends = Array.from(text.matchAll(/\S+\s*/g), match => match.index + match[0].length);
        let start = 0, first = true;
        while (start < text.length) {
            const candidates = ends.filter(end => end > start);
            let low = 0, high = candidates.length - 1, best = -1;
            while (low <= high) {
                const middle = Math.floor((low + high) / 2);
                const candidate = wrap([...(first ? lead.map(node => node.cloneNode(true)) : []), textFragment(element, start, candidates[middle])]);
                body.appendChild(candidate);
                const fitsHere = fits();
                candidate.remove();
                if (fitsHere) { best = middle; low = middle + 1; } else high = middle - 1;
            }
            if (best < 0) throw new Error('A PDF szövegblokkja nem fér el az oldalon.');
            body.appendChild(wrap([...(first ? lead : []), textFragment(element, start, candidates[best])]));
            start = candidates[best]; first = false;
            if (start < text.length) newPage();
        }
    };
    const append = nodes => {
        const block = wrap(nodes);
        body.appendChild(block);
        if (fits()) return;
        block.remove();
        if (body.children.length) newPage();
        body.appendChild(block);
        if (!fits()) {
            const images = block.querySelectorAll('img');
            images.forEach(image => {
                image.style.maxHeight = Math.max(80, body.clientHeight - 80) + 'px';
                image.style.width = 'auto';
            });
            if (!fits()) {
                const last = nodes[nodes.length - 1];
                if (last.nodeName === 'P' || last.nodeName === 'PRE') {
                    block.remove(); splitParagraph(last, nodes.slice(0, -1));
                } else throw new Error('Egy tartalmi blokk túl magas egy PDF-oldalhoz.');
            }
        }
    };
    const appendTable = (table, lead) => {
        const whole = wrap([...lead, table]);
        body.appendChild(whole);
        if (fits()) return;
        const wholeHeight = whole.getBoundingClientRect().height;
        whole.remove();
        if (wholeHeight + 8 <= body.clientHeight) { if (body.children.length) newPage(); body.appendChild(whole); return; }

        const rows = Array.from(table.querySelectorAll('tbody > tr'));
        if (!rows.length) { append([...lead, table]); return; }
        let tbody;
        const startFragment = includeLead => {
            const fragment = table.cloneNode(false);
            for (const child of table.children) if (child.nodeName !== 'TBODY') fragment.appendChild(child.cloneNode(true));
            tbody = document.createElement('tbody');
            fragment.appendChild(tbody);
            body.appendChild(wrap([...(includeLead ? lead : []), fragment]));
        };
        startFragment(true);
        for (const row of rows) {
            const copy = row.cloneNode(true);
            tbody.appendChild(copy);
            if (fits()) continue;
            copy.remove();
            const firstRow = tbody.children.length === 0;
            if (firstRow) body.lastElementChild.remove();
            newPage();
            startFragment(firstRow);
            tbody.appendChild(copy);
            if (!fits()) throw new Error('Egy táblázatsor túl magas egy PDF-oldalhoz. Rövidebb cellaszövegre van szükség.');
        }
    };
    try {
        const blocks = reportBlocks(answer);
        await Promise.all(blocks.flatMap(block => Array.from(block.querySelectorAll('img')))
            .map(image => image.decode().catch(() => {})));
        newPage();
        const title = document.createElement('h2');
        title.textContent = 'GAVA MI Asszisztens – Elemzési Riport';
        body.appendChild(title);
        if (documentName) {
            const info = document.createElement('div');
            info.className = 'ai-pdf-doc-info';
            info.textContent = documentName;
            body.appendChild(info);
        }
        let lead = [];
        for (let index = 0; index < blocks.length; index++) {
            const block = blocks[index];
            if (/^H[1-6]$/.test(block.nodeName) ||
                (lead.length && block.nodeName === 'P' && block.textContent.length < 180 && blocks[index + 1]?.nodeName === 'TABLE')) {
                lead.push(block); continue;
            }
            if (block.nodeName === 'TABLE') appendTable(block, lead);
            else append([...lead, block]);
            lead = [];
        }
        if (lead.length) append(lead);
        pages.forEach((page, index) => { page.querySelector('.ai-pdf-footer').textContent = `${index + 1} / ${pages.length}`; });
        return { pages, cleanup };
    } catch (error) { cleanup(); throw error; }
}

export async function exportAiReport(answer, documentName, onProgress = () => {}, save = true) {
    const { pages, cleanup } = await buildReportPages(answer, documentName);
    try {
        let pdf;
        for (let index = 0; index < pages.length; index++) {
            onProgress(index + 1, pages.length);
            const worker = window.html2pdf().set({ margin: 12, filename: 'Gava_MI_Elemzes.pdf',
                image: { type: 'jpeg', quality: 0.98 }, pagebreak: { mode: [] },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(pages[index]).toCanvas();
            const canvas = await worker.get('canvas');
            if (!pdf) pdf = await worker.toPdf().get('pdf');
            else {
                pdf.addPage();
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 12, 12, PAGE_WIDTH, PAGE_HEIGHT);
            }
        }
        if (save) pdf.save('Gava_MI_Elemzes.pdf');
        return pdf;
    } finally { cleanup(); }
}
