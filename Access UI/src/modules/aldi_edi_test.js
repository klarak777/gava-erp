const API = '/api/v1/aldi-edi-test';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const time = value => value ? new Date(value).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' }) : '—';
const statusName = value => ({ received: 'Archiválva', processed: 'Feldolgozva', failed: 'Hibás', duplicate: 'Már fogadva', sftp_poll: 'SFTP lekérés', sftp_failed: 'SFTP hiba', sftp_file_rejected: 'Nem vehető át' }[value] || value || 'Feldolgozásra vár');

async function request(url, options) {
  const response = await fetch(API + url, options);
  let body;
  try { body = JSON.parse(await response.text()); }
  catch (_) { throw new Error(`Nem értelmezhető szerverválasz (HTTP ${response.status}).`); }
  if (!response.ok) {
    const error = new Error(body.error || `Szerverhiba (HTTP ${response.status}).`);
    error.fileId = body.fileId;
    throw error;
  }
  return body;
}

export function renderAldiEdiTest(container) {
  container.innerHTML = `
    <div style="padding:20px;color:#1e293b;max-width:1200px;margin:auto;">
      <h2 style="margin:0 0 12px;">ALDI – EDI teszt és fogadási napló</h2>
      <p style="padding:12px;background:#eff6ff;border-radius:8px;">ORDERS 2.4 AHEAD tesztkörnyezet. A próbák külön tesztrendeléseket hoznak létre. UNB tesztjelzés (0035=1) szükséges.</p>
      <p data-edi="status">Kapcsolat állapotának betöltése…</p>
      <form data-edi="form" style="display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin:20px 0;">
        <label>EDI fájl<br><input name="file" type="file" accept=".edi,.txt,.edifact" required></label>
        <label>Módosítás értelmezése<br><select name="mode"><option value="full">Full – teljes rendelés (ALDI alapértelmezés)</option><option value="delta">Delta – csak a változott sorok, külön egyeztetéssel</option></select></label>
        <label>UNB küldő (ha egyeztetett)<br><input name="sender" maxlength="35"></label>
        <label>UNB fogadó (ha egyeztetett)<br><input name="receiver" maxlength="35"></label>
        <label>NAD szállító (ha egyeztetett)<br><input name="supplier" maxlength="35"></label>
        <button type="submit" class="primary-btn">Tesztfájl feldolgozása</button>
      </form>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button data-edi="samples">Négy összetartozó tesztminta előállítása</button>
        <button data-edi="refresh">Napló frissítése</button>
        <button data-edi="poll" disabled>SFTP tesztlekérés most</button>
      </div>
      <div data-edi="sample-links" style="display:flex;flex-wrap:wrap;gap:15px;margin-top:10px;"></div>
      <p data-edi="feedback" role="status" style="white-space:pre-wrap;"></p>
      <div data-edi="files" style="overflow:auto;"></div>
      <div data-edi="detail" style="margin-top:20px;"></div>
      <h3 style="color:#000000;">Fogadási és feldolgozási események</h3><div data-edi="events" style="overflow:auto;"></div>
    </div>`;
  const el = name => container.querySelector(`[data-edi="${name}"]`);
  let busy = false;
  const feedback = (message, error = false) => { el('feedback').textContent = message; el('feedback').style.color = error ? '#b91c1c' : '#166534'; };
  const row = values => `<tr>${values.map(v => `<td style="padding:8px;border-bottom:1px solid #e2e8f0;">${v}</td>`).join('')}</tr>`;
  const table = (headers, rows) => `<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead>${row(headers.map(escapeHtml))}</thead><tbody>${rows || row(['Nincs még tesztadat.'])}</tbody></table>`;
  async function load() {
    const [connection, files, events] = await Promise.all([request('/status'), request('/files'), request('/events')]);
    el('status').textContent = `SFTP: ${connection.enabled && connection.ready ? 'tesztkapcsolat engedélyezve' : 'nincs aktiválva'} · Lekérési időköz: ${connection.intervalMinutes} perc · Éles EDI készenlét: még nincs igazolva`;
    el('poll').disabled = !connection.enabled || !connection.ready || busy;
    el('files').innerHTML = table(['Fogadva', 'Fájl', 'Forrás', 'Eredmény', 'Részletek'], files.map(f => row([
      escapeHtml(time(f.received_at)), escapeHtml(f.filename), escapeHtml(f.source), escapeHtml(statusName(f.status)),
      `<button data-file="${escapeHtml(f.id)}">Megnyitás</button>`
    ])).join(''));
    el('events').innerHTML = table(['Sorszám', 'Időpont', 'Fájl', 'Esemény', 'Leírás'], events.map(e => row([escapeHtml(e.id), escapeHtml(time(e.created_at)), escapeHtml(e.file_id || '—'), escapeHtml(statusName(e.status)), escapeHtml(e.description)])).join(''));
  }
  async function detail(id) {
    const f = await request('/files/' + id);
    el('detail').innerHTML = `<h3>${escapeHtml(f.filename)}</h3>
      <p>SHA-256: <code>${escapeHtml(f.sha256)}</code></p>
      <a href="${API}/files/${encodeURIComponent(f.id)}/original">Eredeti üzenet letöltése</a>
      <button data-retry="${escapeHtml(f.id)}" style="margin-left:15px;">Újrafeldolgozás</button>
      <details><summary>Eredeti üzenet olvasható nézete</summary><pre style="white-space:pre-wrap;">${escapeHtml(f.originalText)}</pre></details>
      ${f.versions.map(v => {
        const s = v.snapshot;
        return `<h4>Rendelés: ${escapeHtml(s.orderNumber)} · Tesztverzió: ${escapeHtml(s.internalVersion)} · Külső verzió: ${escapeHtml(s.externalVersion || 'nincs megadva')}</h4>
          <p>UNB küldő: ${escapeHtml(s.sender)} · UNB fogadó: ${escapeHtml(s.receiver)} · NAD vevő: ${escapeHtml(s.parties.BY.identifier)}</p>
          ${table(['Tétel', 'GTIN', 'Korábbi', 'Új', 'Eltérés', 'Művelet / dátum'], s.changes.map(c => row([
            escapeHtml(c.lineId), escapeHtml(c.gtin), escapeHtml(c.previousQuantity), escapeHtml(c.quantity), escapeHtml((c.delta > 0 ? '+' : '') + c.delta),
            escapeHtml((c.action === '2' ? 'Törölt · ' : c.remainderClosed ? 'Fennmaradó mennyiség lezárva · ' : '') + c.deliveryDate)
          ])).join(''))}
          <h4 style="color:#000000;">Teljes rendelési állapot</h4>
          ${table(['Tétel', 'GTIN', 'Rendelt mennyiség', 'Szállított mennyiség', 'Hátralévő mennyiség', 'Szállítás'], s.items.map(i => row([escapeHtml(i.lineId), escapeHtml(i.gtin), escapeHtml(i.quantity), escapeHtml(i.deliveredQuantity), escapeHtml(i.remainingQuantity), escapeHtml(i.deliveryDate)])).join(''))}
          <details><summary>Feldolgozott rendelés és szereplők</summary><pre style="white-space:pre-wrap;">${escapeHtml(JSON.stringify(s, null, 2))}</pre></details>`;
      }).join('')}
      <h4 style="color:#000000;">A fájl teljes eseménynaplója</h4>${table(['Sorszám', 'Időpont', 'Esemény', 'Leírás'], f.events.map(e => row([escapeHtml(e.id), escapeHtml(time(e.created_at)), escapeHtml(statusName(e.status)), escapeHtml(e.description)])).join(''))}`;
  }
  async function perform(action) {
    if (busy) return;
    busy = true;
    el('form').querySelector('button').disabled = true;
    el('poll').disabled = true;
    feedback('Feldolgozás…');
    try { await action(); }
    catch (error) {
      feedback(error.message, true);
      if (error.fileId) { try { await detail(error.fileId); } catch (_) { /* keep original failure visible */ } }
    }
    finally {
      busy = false;
      el('form').querySelector('button').disabled = false;
      try { await load(); } catch (error) { feedback(error.message, true); }
    }
  }
  el('form').addEventListener('submit', event => {
    event.preventDefault();
    perform(async () => {
      const result = await request('/upload', { method: 'POST', body: new FormData(el('form')) });
      feedback(result.status === 'duplicate' ? 'Ezt az eredeti üzenetet már archiváltuk. Megnyithatod a korábbi eredményt.' : 'A tesztüzenet feldolgozása sikeres.');
      await detail(result.fileId);
    });
  });
  el('refresh').addEventListener('click', () => perform(async () => { await load(); feedback('A napló frissült.'); }));
  el('poll').addEventListener('click', () => perform(async () => { const result = await request('/poll', { method: 'POST' }); feedback(`SFTP lekérés: ${result.received || 0} fájl, ${result.failed || 0} feldolgozási hiba.`); }));
  container.addEventListener('click', event => {
    const file = event.target.closest('[data-file]'), retry = event.target.closest('[data-retry]');
    if (file) perform(() => detail(file.dataset.file));
    if (retry) perform(async () => { const result = await request('/files/' + retry.dataset.retry + '/retry', { method: 'POST' }); feedback(statusName(result.status)); await detail(retry.dataset.retry); });
  });
  el('samples').addEventListener('click', () => {
    const batch = Date.now().toString();
    const samples = [
      { title: '1-uj', kind: '220', items: [[1, 20], [1, 44]] },
      { title: '2-modositas', kind: '230', items: [[3, 40], [3, 52]] },
      { title: '3-teteltorles', kind: '230', items: [[2, 40], [4, 52]] },
      { title: '4-teljes-torles', kind: '230', items: [[2, 40], [2, 52]] }
    ];
    for (const anchor of el('sample-links').querySelectorAll('a')) URL.revokeObjectURL(anchor.href);
    el('sample-links').replaceChildren();
    for (const [index, sample] of samples.entries()) {
      const body = [`UNH+${index + 1}+ORDERS:D:01B:UN:EAN010+2.0`, `BGM+${sample.kind}+DEMO-${batch}:${index + 1}+9`, 'DTM+137:20261013:102', 'NAD+BY+4099200005096::9', 'NAD+SU+5013546350114::9', 'NAD+DP+4099200999609::9'];
      sample.items.forEach(([action, qty], i) => body.push(`LIN+${i === 0 ? '00040' : '00090'}+${action}+${i === 0 ? '4061462846892' : '4069365093832'}:SRV`, `QTY+21:${qty}`, 'DTM+2:20261013:102'));
      body.push('UNS+S');
      const text = ["UNA:+.? '", `UNB+UNOC:3+4012345000009:14+4012345000016:14+261013:1200+${batch.slice(-10)}${index}+++++EANCOM+1'`, ...body.map(s => s + "'"), `UNT+${body.length + 1}+${index + 1}'`, `UNZ+1+${batch.slice(-10)}${index}'`].join('\n');
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=us-ascii' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `aldi-edi-demo-${batch}-${sample.title}.edi`;
      anchor.textContent = sample.title;
      el('sample-links').append(anchor);
    }
    el('form').elements.mode.value = 'full';
    feedback('A minták összetartozó Full próbák. Feltöltési sorrend: új rendelés → módosítás → tételtörlés → teljes törlés. Használj Full módot; a mintaazonosítók nem éles kapcsolati beállítások.');
  });
  load().catch(error => feedback(error.message, true));
}
