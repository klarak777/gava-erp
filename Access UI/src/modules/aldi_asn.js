const API = '/api/v1/aldi-asn';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stateName = v => ({ queued: 'Küldésre vár', sending: 'Küldés folyamatban', sent: 'Továbbítva; ALDI-befogadás nem igazolt', blocked: 'Adathiány / eltérés', retry: 'Újrapróbálásra vár', failed: 'Sikertelen', uncertain: 'Kézbesítés ellenőrzendő', existing: 'Korábban elkészült', superseded: 'Új változattal felváltva' }[v] || v);
async function request(path, options) {
  const response = await fetch(API + path, options);
  let data;
  try { data = await response.json(); } catch (_) { throw new Error(`ASN szerverválasz nem olvasható (HTTP ${response.status}).`); }
  if (!response.ok) throw new Error(data.error || `ASN hiba (HTTP ${response.status}).`);
  return data;
}
const put = data => ({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
const table = (headers, rows) => `<table style="width:100%;border-collapse:collapse;"><thead><tr>${headers.map(h => `<th style="text-align:left;padding:8px;">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(cells => `<tr>${cells.map(c => `<td style="padding:8px;border-bottom:1px solid #ddd;">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
export function renderAldiAsn(container) {
  container.innerHTML = `<hr><h2>Warehouse DESADV – szállítási értesítő (ASN)</h2>
    <p>A Rakodva állapot mentésekor a tényleges áruból szállítási értesítő készül. A kötelező adatokat ellenőrizzük; a továbbítás eredménye külön jelenik meg.</p>
    <p data-asn="status"></p><p data-asn="feedback" role="status" style="white-space:pre-wrap;"></p>
    <details><summary>ALDI kapcsolat és üzenetprofil</summary><form data-asn="profile" style="display:flex;gap:12px;flex-wrap:wrap;margin:15px 0;"></form></details>
    <div style="margin:16px 0;"><label>Kamion <select data-asn="truck"></select></label> <button data-asn="audit">Adatok ellenőrzése</button> <button data-asn="prepare">ASN elkészítése / hiányok javítása után ismételt ellenőrzés</button> <button data-asn="regenerate">Nem továbbított ASN újraépítése</button></div>
    <div data-asn="audit-result" style="overflow:auto;"></div>
    <button data-asn="refresh">ASN napló frissítése</button> <button data-asn="send" disabled>Küldésre váró ASN-ek továbbítása</button>
    <div data-asn="shipments" style="overflow:auto;margin-top:16px;"></div><div data-asn="detail"></div>`;
  const el = key => container.querySelector(`[data-asn="${key}"]`);
  let busy = false, profile, currentAudit;
  const feedback = (message, error = false) => { el('feedback').textContent = message; el('feedback').style.color = error ? '#b91c1c' : '#166534'; };
  async function perform(action) {
    if (busy) return;
    busy = true;
    try { await action(); } catch (e) { feedback(e.message, true); }
    finally { busy = false; }
  }
  function routingRow(d = {}) {
    return `<tr data-asn-routing><td><input data-routing="name" placeholder="ERP célraktár neve" value="${esc(d.name)}"></td><td><input data-routing="receiver" placeholder="UNB fogadó GLN" value="${esc(d.receiver)}"></td><td><input data-routing="buyer" placeholder="Beszerző GLN" value="${esc(d.buyer)}"></td><td><button type="button" data-asn-remove-routing>Eltávolítás</button></td></tr>`;
  }
  function showProfile(p) {
    const fields = [['sender', 'Gava UNB küldő GLN'], ['supplier', 'Gava szállító GLN'], ['receiver', 'ALDI UNB fogadó GLN'], ['buyer', 'ALDI beszerző GLN']];
    el('profile').innerHTML = fields.map(([key, title]) => `<label>${title}<br><input name="${key}" maxlength="13" value="${esc(p[key])}"></label>`).join('') +
      `<label>Üzenet<br><select name="asn-mode"><option value="test">Teszt</option><option value="live">Éles</option></select></label>
      <label>Karakterkészlet<br><select name="syntax"><option>UNOC</option><option>UNOD</option></select></label>
      <span>LPN and Item Level – DESADV 2.4 AHEAD</span>
      <label><input type="checkbox" name="confirmed" ${p.confirmed ? 'checked' : ''}>OpenText/ALDI kapcsolat, MIG és fájlátadás visszaigazolva</label>
      <label><input type="checkbox" name="quantityConfirmed" ${p.quantityConfirmed ? 'checked' : ''}>GTIN-ek és kartonmennyiségek partnerrel egyeztetve</label>
      <label><input type="checkbox" name="requireLot" ${p.requireLot ? 'checked' : ''}>Gyártási tétel kötelező a partnerprofilban</label>
      <label>Eltarthatósági dátum<br><select name="requiredDateType"><option value="none">Partner szerint nem kötelező</option><option value="best_before">Minőségmegőrzési dátum kötelező</option><option value="expiry">Lejárati dátum kötelező</option></select></label>
      <div style="width:100%;"><p>Raktáranként eltérő ALDI azonosítók esetén:</p><table><tbody data-asn="routing">${(p.destinations || []).map(routingRow).join('')}</tbody></table><button type="button" data-asn="add-routing">Célraktár hozzáadása</button></div>
      <button type="submit">ASN profil mentése</button>`;
    el('profile').elements['asn-mode'].value = p.mode || 'test';
    el('profile').elements.syntax.value = p.syntax || 'UNOC';
    el('profile').elements.requiredDateType.value = p.requiredDateType || 'none';
    el('add-routing').onclick = () => el('routing').insertAdjacentHTML('beforeend', routingRow());
  }
  async function load() {
    const [status, shipments, trucksResponse] = await Promise.all([request('/status'), request('/shipments'), fetch('/api/v1/aldi-cross-docking/trucks')]);
    if (!trucksResponse.ok) throw new Error('A kamionlista nem tölthető be.');
    const trucks = await trucksResponse.json();
    profile = status.profile || {};
    if (!el('profile').children.length) showProfile(profile);
    el('status').textContent = `ASN továbbítás: ${status.enabled && status.ready && profile.confirmed && profile.quantityConfirmed ? 'engedélyezve a beállított profilhoz' : 'nincs aktiválva vagy a partnerprofil nincs visszaigazolva'} · A helyi üzenet előállítható és letölthető teszteléshez.`;
    el('send').disabled = !(status.enabled && status.ready && profile.confirmed && profile.quantityConfirmed);
    const selected = el('truck').value;
    el('truck').innerHTML = trucks.map(t => `<option value="${esc(t.id)}">${esc(t.truck_number)} · ${esc(t.delivery_date)} · ${t.is_loaded ? 'Rakodva' : 'Rakodás alatt'}</option>`).join('');
    if (trucks.some(t => String(t.id) === selected)) el('truck').value = selected;
    el('shipments').innerHTML = table(['Kamion', 'Verzió / időpont', 'Eredmény', 'Részletek'], shipments.map(s => [esc(s.truck_number), `${esc(s.generation)} · ${esc(new Date(s.created_at).toLocaleString('hu-HU'))}`, esc(s.issues.length ? stateName('blocked') : s.messages.map(m => stateName(m.state)).join('; ')), `<button data-asn-shipment="${esc(s.id)}">ASN megnyitása</button>`]));
  }
  function showAudit(a) {
    currentAudit = a;
    el('audit-result').innerHTML = `<h3>Kamionadatok és ASN megfelelőség</h3><p>${a.ready ? 'A helyi LPN and Item Level ellenőrzések sikeresek.' : 'Az ASN még nem állítható elő:'}</p>
      <ul>${a.issues.map(i => `<li>${esc(i.lineId ? 'Kamionsor ' + i.lineId + ': ' : '')}${esc(i.message)}</li>`).join('')}</ul>
      ${table(['Termék / GTIN', 'Eredeti rendelés', 'Eredeti ALDI tételsorszám', 'Célraktár', 'Tényleges karton'], a.lines.map(l => [esc(l.productName) + '<br>' + esc(l.gtin), esc(l.orderNumber), `<input data-asn-ref="${esc(l.id)}" maxlength="6" value="${esc(l.reference)}">`, `<input data-asn-dest="${esc(l.id)}" maxlength="255" value="${esc(l.destination)}">`, esc(l.pickedCartons)]))}
      ${table(['Raklap SSCC', 'Gyártási tétel', 'Minőségmegőrzési dátum', 'Lejárati dátum'], a.labels.map(l => [esc(l.sscc), esc(l.lot), `<input type="date" data-asn-bbd="${esc(l.id)}" value="${esc(l.bestBefore ? String(l.bestBefore).slice(0, 10) : '')}">`, `<input type="date" data-asn-expiry="${esc(l.id)}" value="${esc(l.expiryDate ? String(l.expiryDate).slice(0, 10) : '')}">`]))}
      <button data-asn="save-data">Hivatkozások és célraktár mentése</button><p>A mennyiségek és SSCC-k javítása a rakodási/komissiózási folyamatban történik. Több rendelés ASN-jéhez az eredeti ALDI tételsorszám szükséges.</p>`;
    el('save-data').onclick = () => perform(async () => {
      const lines = currentAudit.lines.map(l => ({ id: l.id, reference: container.querySelector(`[data-asn-ref="${l.id}"]`).value.trim(), destination: container.querySelector(`[data-asn-dest="${l.id}"]`).value.trim() }));
      const labels = a.labels.map(l => ({ id: l.id, bestBefore: container.querySelector(`[data-asn-bbd="${l.id}"]`).value, expiryDate: container.querySelector(`[data-asn-expiry="${l.id}"]`).value }));
      showAudit(await request('/trucks/' + a.truck.id + '/data', put({ lines, labels })));
      feedback('Az ASN hivatkozásai és célraktára mentve.');
    });
  }
  el('profile').onsubmit = event => {
    event.preventDefault();
    perform(async () => {
      const f = el('profile'), next = { variant: 'lpn_item' };
      for (const name of ['sender', 'supplier', 'receiver', 'buyer', 'syntax', 'requiredDateType']) next[name] = f.elements[name].value.trim();
      next.mode = f.elements['asn-mode'].value;
      for (const name of ['confirmed', 'quantityConfirmed', 'requireLot']) next[name] = f.elements[name].checked;
      next.destinations = [...container.querySelectorAll('[data-asn-routing]')].map(r => Object.fromEntries(['name', 'buyer', 'receiver'].map(k => [k, r.querySelector(`[data-routing="${k}"]`).value.trim()])));
      await request('/profile', put(next)); await load(); feedback('Az ASN profil mentve. A már elkészült üzenetek tartalma változatlan.');
    });
  };
  el('audit').onclick = () => perform(async () => { showAudit(await request('/trucks/' + el('truck').value + '/audit')); });
  el('prepare').onclick = () => perform(async () => {
    const result = await request('/trucks/' + el('truck').value + '/prepare', { method: 'POST' });
    feedback(stateName(result.status), result.status === 'blocked'); await load(); showAudit(await request('/trucks/' + el('truck').value + '/audit'));
  });
  el('regenerate').onclick = () => perform(async () => {
    const result = await request('/trucks/' + el('truck').value + '/prepare', { ...put({ regenerate: true }), method: 'POST' });
    feedback(stateName(result.status), result.status === 'blocked'); await load();
  });
  el('refresh').onclick = () => perform(load);
  el('send').onclick = () => perform(async () => { const r = await request('/send-pending', { method: 'POST' }); feedback(r.reason || `${r.processed || 0} ASN továbbítási kísérlet.`); await load(); });
  container.onclick = event => {
    if (event.target.closest('[data-asn-remove-routing]')) event.target.closest('[data-asn-routing]').remove();
    const open = event.target.closest('[data-asn-shipment]'), retry = event.target.closest('[data-asn-retry]');
    if (retry) perform(async () => { await request('/messages/' + retry.dataset.asnRetry + '/retry', { method: 'POST' }); await load(); feedback('Ugyanaz az ASN újrapróbálásra vár.'); });
    if (open) perform(async () => {
      const s = await request('/shipments/' + open.dataset.asnShipment);
      el('detail').innerHTML = `<h3>ASN rögzített szállítmány · ${esc(s.id)}</h3><ul>${s.issues.map(i => `<li>${esc(i.message)}</li>`).join('')}</ul>` + s.messages.map(m => `<h4>${esc(m.asn_number)} · ${esc(stateName(m.state))}</h4><p>${esc(m.error || '')}</p><a href="${API}/messages/${encodeURIComponent(m.id)}/original">DESADV fájl letöltése</a> ${['failed', 'retry'].includes(m.state) ? `<button data-asn-retry="${esc(m.id)}">Küldés újrapróbálása</button>` : ''}<details><summary>EDI üzenet</summary><pre>${esc(m.text)}</pre></details><details><summary>Raklapok és tételek</summary><pre>${esc(JSON.stringify(m.snapshot, null, 2))}</pre></details>`).join('') + table(['Időpont', 'Esemény', 'Leírás'], s.events.map(e => [esc(new Date(e.created_at).toLocaleString('hu-HU')), esc(stateName(e.state)), esc(e.description)]));
    });
  };
  load().catch(e => feedback(e.message, true));
}
