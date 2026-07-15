/**
 * GAVA ERP – Partnerek modul
 * v0.5.4 – Teljes partner beviteli és kezelési modul (8 főfül, alfülekkel)
 * Iroda > Partnerek
 */

// ─── CSS ─────────────────────────────────────────────────────────────────────
const PARTNEREK_STYLE = `
<style>
/* ── Partnerek Lista Nézet ─────────────────────────────────── */
.prt-list-wrap { padding: 20px; }
.prt-list-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
}
.prt-list-header h2 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text-primary); }
.prt-search-row { display: flex; gap: 10px; align-items: center; }
.prt-search-input {
  padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-light); color: var(--text-primary); font-size: 14px; width: 260px;
}
.prt-table-wrap {
  background: #ffffff; border-radius: 12px;
  overflow: hidden; border: 1px solid var(--border);
}
.prt-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.prt-table th {
  background: rgba(255,255,255,0.05); padding: 10px 14px;
  text-align: left; color: var(--text-muted); font-weight: 600;
  border-bottom: 1px solid var(--border); white-space: nowrap;
}
.prt-table td {
  padding: 9px 14px; border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}
.prt-table tr:last-child td { border-bottom: none; }
.prt-table tr:hover td { background: rgba(255,255,255,0.03); cursor: pointer; }
.prt-badge {
  display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px;
  font-weight: 600; text-transform: uppercase;
}
.prt-badge-customer { background: rgba(34,197,94,0.15); color: #4ade80; }
.prt-badge-supplier { background: rgba(96,165,250,0.15); color: #60a5fa; }
.prt-badge-other { background: rgba(148,163,184,0.15); color: #94a3b8; }
.prt-badge-inactive { background: rgba(239,68,68,0.15); color: #f87171; }

/* ── Modal ─────────────────────────────────────────────────── */
.prt-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65);
  z-index: 3000; display: flex; align-items: flex-start; justify-content: center;
  padding: 20px; overflow-y: auto;
}
.prt-modal {
  background: #ffffff; border-radius: 16px; width: 100%; max-width: 1200px;
  border: 1px solid var(--border); box-shadow: 0 24px 80px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; min-height: 640px; flex-shrink: 0;
}
.prt-modal-titlebar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,0.03); border-radius: 16px 16px 0 0;
}
.prt-modal-titlebar h3 { margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary); }
.prt-modal-toprow {
  display: flex; align-items: center; gap: 16px; padding: 12px 20px;
  border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02);
  flex-wrap: wrap;
}
.prt-modal-toprow .prt-name-wrap { flex: 1; min-width: 260px; }
.prt-modal-toprow .prt-name-wrap label { font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px; }
.prt-modal-toprow .prt-name-input {
  width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-light); color: var(--text-primary); font-size: 15px; font-weight: 600;
}
.prt-modal-flags { display: flex; gap: 18px; align-items: center; }
.prt-modal-flags label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); cursor: pointer; }
.prt-modal-flags input[type=checkbox] { width: 15px; height: 15px; accent-color: var(--accent); }

/* ── Fő Tabs ───────────────────────────────────────────────── */
.prt-tabs-main { display: flex; gap: 2px; padding: 10px 20px 0; overflow-x: auto; flex-shrink: 0; }
.prt-tab-main {
  padding: 8px 16px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 500;
  cursor: pointer; color: var(--text-muted); background: rgba(255,255,255,0.03);
  border: 1px solid transparent; border-bottom: none; white-space: nowrap; transition: all 0.2s;
}
.prt-tab-main:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }
.prt-tab-main.active {
  color: var(--accent); background: #ffffff;
  border-color: var(--border); border-bottom: 1px solid #ffffff;
}

/* ── Tab Panels ─────────────────────────────────────────────── */
.prt-panels { flex: 1; padding: 18px 20px; overflow-y: auto; }
.prt-panel { display: none; }
.prt-panel.active { display: block; }

/* ── Alfülek (Sub-tabs) ─────────────────────────────────────── */
.prt-subtabs { display: flex; gap: 4px; margin-bottom: 14px; }
.prt-subtab {
  padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 500;
  cursor: pointer; color: var(--text-muted); background: rgba(255,255,255,0.04);
  border: 1px solid var(--border); transition: all 0.15s;
}
.prt-subtab:hover { color: var(--text-primary); }
.prt-subtab.active { color: var(--accent); background: rgba(99,102,241,0.1); border-color: var(--accent); }
.prt-subpanel { display: none; }
.prt-subpanel.active { display: block; }

/* ── Form Layout ─────────────────────────────────────────────── */
.prt-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.prt-section {
  background: rgba(255,255,255,0.02); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px; margin-bottom: 14px;
}
.prt-section-title {
  font-size: 12px; font-weight: 700; color: var(--accent);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;
}
.prt-field { margin-bottom: 10px; }
.prt-field label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.prt-field input, .prt-field select, .prt-field textarea {
  width: 100%; padding: 7px 10px; border-radius: 7px; border: 1px solid var(--border);
  background: var(--bg-light); color: var(--text-primary); font-size: 13px;
  box-sizing: border-box; transition: border-color 0.2s;
}
.prt-field input:focus, .prt-field select:focus, .prt-field textarea:focus {
  outline: none; border-color: var(--accent);
}
.prt-field textarea { resize: vertical; min-height: 80px; }
.prt-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.prt-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.prt-row-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
.prt-check-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.prt-check-row label { font-size: 13px; color: var(--text-muted); cursor: pointer; }
.prt-check-row input[type=checkbox] { accent-color: var(--accent); }

/* ── Sub-táblázatok ──────────────────────────────────────────── */
.prt-subtable-wrap { background: rgba(0,0,0,0.15); border-radius: 8px; overflow: hidden; }
.prt-subtable { width: 100%; border-collapse: collapse; font-size: 13px; }
.prt-subtable th {
  background: rgba(255,255,255,0.06); padding: 8px 12px; text-align: left;
  color: var(--text-muted); font-weight: 600; font-size: 12px;
}
.prt-subtable td { padding: 6px 8px; border-top: 1px solid rgba(255,255,255,0.05); }
.prt-subtable tr:hover td { background: rgba(255,255,255,0.04); }
.prt-subtable td input, .prt-subtable td select {
  width: 100%; padding: 5px 8px; border-radius: 5px; border: 1px solid var(--border);
  background: var(--bg-light); color: var(--text-primary); font-size: 12px;
  box-sizing: border-box;
}
.prt-subtable-toolbar {
  display: flex; gap: 8px; padding: 8px 0;
}
.prt-toolbar-btn {
  padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
  cursor: pointer; border: 1px solid var(--border); background: rgba(255,255,255,0.05);
  color: var(--text-primary); transition: all 0.15s;
}
.prt-toolbar-btn:hover { background: rgba(255,255,255,0.1); }
.prt-toolbar-btn.danger { color: #f87171; border-color: rgba(248,113,113,0.3); }
.prt-toolbar-btn.danger:hover { background: rgba(248,113,113,0.1); }

/* ── Csatolmányok ────────────────────────────────────────────── */
.prt-attach-dropzone {
  border: 2px dashed var(--border); border-radius: 10px; padding: 30px;
  text-align: center; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
  margin-bottom: 12px;
}
.prt-attach-dropzone:hover { border-color: var(--accent); color: var(--accent); }

/* ── Footer ─────────────────────────────────────────────────── */
.prt-modal-footer {
  display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px;
  border-top: 1px solid var(--border); background: rgba(255,255,255,0.02);
  border-radius: 0 0 16px 16px;
}
</style>
`;

// ─── State ────────────────────────────────────────────────────────────────────
let prtState = {
  list: [],
  currentId: null,
  currentData: null,
  loading: false,
};

// ─── API ──────────────────────────────────────────────────────────────────────
async function prtApi(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api/v1/partners' + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API hiba');
  }
  return res.json();
}

// ─── Render lista ────────────────────────────────────────────────────────────
function prtRenderList(container) {
  const typeBadge = (t) => {
    const map = { customer: ['Vevő', 'customer'], supplier: ['Szállító', 'supplier'] };
    const [label, cls] = map[t] || ['Egyéb', 'other'];
    return `<span class="prt-badge prt-badge-${cls}">${label}</span>`;
  };
  const rows = prtState.list.map(p => `
    <tr data-id="${p.id}">
      <td>${p.id}</td>
      <td>${p.name || ''}</td>
      <td>${typeBadge(p.type)}</td>
      <td>${p.zip || ''} ${p.city || ''}</td>
      <td>${p.country || ''}</td>
      <td>${p.is_inactive ? '<span class="prt-badge prt-badge-inactive">Inaktív</span>' : '<span style="color:var(--text-muted)">-</span>'}</td>
      <td>
        <button class="prt-toolbar-btn prt-edit-btn" data-id="${p.id}">✏️ Szerkeszt</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    ${PARTNEREK_STYLE}
    <div class="prt-list-wrap">
      <div class="prt-list-header">
        <h2>🤝 Partnerek</h2>
        <div class="prt-search-row">
          <input class="prt-search-input" id="prt-search" type="text" placeholder="🔍 Keresés névre...">
          <select id="prt-type-filter" class="prt-search-input" style="width:140px">
            <option value="">Minden típus</option>
            <option value="customer">Vevők</option>
            <option value="supplier">Szállítók</option>
          </select>
          <button class="primary-btn" id="prt-new-btn">➕ Új Partner</button>
        </div>
      </div>
      <div class="prt-table-wrap">
        <table class="prt-table">
          <thead>
            <tr>
              <th>#</th><th>Név</th><th>Típus</th><th>Helyszín</th><th>Ország</th><th>Státusz</th><th>Műveletek</th>
            </tr>
          </thead>
          <tbody id="prt-tbody">${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  // Events
  container.querySelector('#prt-new-btn').addEventListener('click', () => prtOpenModal(null, container));
  container.querySelector('#prt-search').addEventListener('input', async (e) => {
    await prtLoadList(e.target.value, container.querySelector('#prt-type-filter').value);
    prtRenderList(container);
    prtBindListEvents(container);
  });
  container.querySelector('#prt-type-filter').addEventListener('change', async (e) => {
    await prtLoadList(container.querySelector('#prt-search').value, e.target.value);
    prtRenderList(container);
    prtBindListEvents(container);
  });
  prtBindListEvents(container);
}

function prtBindListEvents(container) {
  container.querySelectorAll('.prt-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      prtOpenModal(parseInt(btn.dataset.id), container);
    });
  });
  container.querySelectorAll('#prt-tbody tr').forEach(row => {
    row.addEventListener('click', () => prtOpenModal(parseInt(row.dataset.id), container));
  });
}

async function prtLoadList(search = '', type = '') {
  prtState.list = await prtApi('GET', `?search=${encodeURIComponent(search)}&type=${type}&limit=300`);
}

// ─── Modal Builder ────────────────────────────────────────────────────────────
function prtBuildModal(data) {
  const p = data?.partner || {};
  const sites = data?.sites || [];
  const isNew = !p.id;

  return `
  <div class="prt-modal" id="prt-modal">
    <div class="prt-modal-titlebar">
      <h3>${isNew ? '➕ Új Partner' : `✏️ Partner: ${p.name || ''}`}</h3>
      <div style="display:flex;gap:10px;align-items:center">
        <span style="font-size:12px;color:var(--text-muted)">Rögzítés után bezárás</span>
        <button class="secondary-btn" id="prt-close-btn" style="padding:5px 14px">✕ Bezár</button>
      </div>
    </div>

    <!-- Fejléc: Név, Természetes személy, Inaktív, Anonimizált -->
    <div class="prt-modal-toprow">
      <div class="prt-name-wrap">
        <label>Név: *</label>
        <input class="prt-name-input" id="prt-f-name" type="text" value="${p.name || ''}" placeholder="Partner neve">
      </div>
      <div class="prt-modal-flags">
        <label><input type="checkbox" id="prt-f-natural" ${p.is_natural_person ? 'checked' : ''}> Természetes személy</label>
        <label><input type="checkbox" id="prt-f-inactive" ${p.is_inactive ? 'checked' : ''}> Inaktív</label>
        <label><input type="checkbox" id="prt-f-anon" ${p.is_anonymized ? 'checked' : ''}> Anonimizált</label>
        <div class="prt-field" style="margin:0;min-width:140px">
          <select id="prt-f-type" style="padding:6px 10px;border-radius:7px;border:1px solid var(--border);background:var(--bg-light);color:var(--text-primary)">
            <option value="supplier" ${p.type === 'supplier' ? 'selected' : ''}>Szállító</option>
            <option value="customer" ${p.type === 'customer' ? 'selected' : ''}>Vevő</option>
            <option value="transporter" ${p.type === 'transporter' ? 'selected' : ''}>Fuvarozó</option>
            <option value="agent" ${p.type === 'agent' ? 'selected' : ''}>Ügynök</option>
            <option value="other" ${p.type === 'other' ? 'selected' : ''}>Egyéb</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Főfülek -->
    <div class="prt-tabs-main">
      ${['Székhely','Telephelyek','Természetes személy','Egyéb adatok','Megjegyzés/Kategóriák','Csatolmányok','Pénzügyi beállítások','Események']
        .map((t,i) => `<div class="prt-tab-main ${i===0?'active':''}" data-tab="${i}">${t}</div>`).join('')}
    </div>

    <!-- Panel tartalmak -->
    <div class="prt-panels">
      <!-- 0: Székhely -->
      <div class="prt-panel active" data-panel="0">
        ${prtBuildSzekhelyPanel(p, data)}
      </div>
      <!-- 1: Telephelyek -->
      <div class="prt-panel" data-panel="1">
        ${prtBuildTelephelyekPanel(sites)}
      </div>
      <!-- 2: Természetes személy -->
      <div class="prt-panel" data-panel="2">
        ${prtBuildTermeszetesPanel(p)}
      </div>
      <!-- 3: Egyéb adatok -->
      <div class="prt-panel" data-panel="3">
        ${prtBuildEgyebAdatokPanel(p, data)}
      </div>
      <!-- 4: Megjegyzés/Kategóriák -->
      <div class="prt-panel" data-panel="4">
        ${prtBuildMegjegyzesPanel(p, data)}
      </div>
      <!-- 5: Csatolmányok -->
      <div class="prt-panel" data-panel="5">
        ${prtBuildCsatolmanyokPanel(data)}
      </div>
      <!-- 6: Pénzügyi beállítások -->
      <div class="prt-panel" data-panel="6">
        ${prtBuildPenzugyiPanel(data)}
      </div>
      <!-- 7: Események -->
      <div class="prt-panel" data-panel="7">
        ${prtBuildEsemenyekPanel(data)}
      </div>
    </div>

    <!-- Footer -->
    <div class="prt-modal-footer">
      <button class="secondary-btn" id="prt-cancel-btn">Mégsem</button>
      <button class="primary-btn" id="prt-save-btn">💾 Mentés</button>
    </div>
  </div>`;
}

// ─── Panel builders ────────────────────────────────────────────────────────────
function prtField(id, label, value = '', type = 'text', attrs = '') {
  return `<div class="prt-field"><label>${label}</label><input type="${type}" id="${id}" value="${value || ''}" ${attrs}></div>`;
}

function prtBuildSzekhelyPanel(p, data) {
  const comms = data?.communications?.filter(c => !c.site_id) || [];
  const contacts = data?.contacts?.filter(c => !c.site_id) || [];
  const agents = data?.agents || [];

  return `
  <div class="prt-cols-2" style="margin-bottom:14px">
    <!-- Bal: Cím -->
    <div class="prt-section">
      <div class="prt-section-title">🏠 Cím</div>
      <div class="prt-check-row"><input type="checkbox" id="prt-f-moszr" ${p.sync_from_moszr?'checked':''}><label for="prt-f-moszr">Szinkronizálandó a MOSZR-ből</label></div>
      ${prtField('prt-f-invoice-name', 'Név a bizonylaton', p.invoice_name)}
      ${prtField('prt-f-country', 'Ország', p.country)}
      <div class="prt-row-3">
        ${prtField('prt-f-zip', 'Irsz.', p.zip)}
        ${prtField('prt-f-city', 'Helység', p.city)}
        ${prtField('prt-f-district', 'Kerület', p.district)}
      </div>
      ${prtField('prt-f-street-name', 'Közterület neve', p.street_name)}
      <div class="prt-row-3">
        ${prtField('prt-f-street-type', 'Jellege', p.street_type)}
        ${prtField('prt-f-street-number', 'Száma', p.street_number)}
        ${prtField('prt-f-building', 'Épület', p.building)}
      </div>
      <div class="prt-row-3">
        ${prtField('prt-f-staircase', 'Lépcsőház', p.staircase)}
        ${prtField('prt-f-floor', 'Emelet', p.floor)}
        ${prtField('prt-f-door', 'Ajtó', p.door)}
      </div>
    </div>
    <!-- Jobb: Levelezési cím -->
    <div class="prt-section">
      <div class="prt-section-title">✉️ Levelezési cím</div>
      <div class="prt-check-row"><input type="checkbox" id="prt-f-mailing-same" ${p.mailing_same_as_hq!==false?'checked':''}><label for="prt-f-mailing-same">Azonos a címmel</label></div>
      <div id="prt-mailing-fields" ${p.mailing_same_as_hq!==false?'style="opacity:0.4;pointer-events:none"':''}>
        ${prtField('prt-f-mailing-inv-name', 'Név a bizonylaton', p.mailing_invoice_name)}
        ${prtField('prt-f-mailing-country', 'Ország', p.mailing_country)}
        <div class="prt-row-2">
          ${prtField('prt-f-mailing-zip', 'Irsz.', p.mailing_zip)}
          ${prtField('prt-f-mailing-city', 'Helység', p.mailing_city)}
        </div>
        ${prtField('prt-f-mailing-street-name', 'Közterület neve', p.mailing_street_name)}
        <div class="prt-row-2">
          ${prtField('prt-f-mailing-street-type', 'Jellege', p.mailing_street_type)}
          ${prtField('prt-f-mailing-street-number', 'Száma', p.mailing_street_number)}
        </div>
        ${prtField('prt-f-gln', 'GLN', p.gln)}
      </div>
    </div>
  </div>

  <!-- Alfülek -->
  <div class="prt-subtabs">
    ${['Elérhetőségek','Kapcsolattartók','Ügynökök','Egyéb adatok'].map((t,i)=>
      `<div class="prt-subtab ${i===0?'active':''}" data-subtab="szh-${i}">${t}</div>`).join('')}
  </div>
  <!-- Elérhetőségek -->
  <div class="prt-subpanel active" data-subpanel="szh-0">
    <div class="prt-subtable-toolbar">
      <button class="prt-toolbar-btn" id="szh-comm-add">➕ Hozzáadás</button>
      <button class="prt-toolbar-btn danger" id="szh-comm-del">🗑️ Törlés</button>
    </div>
    <div class="prt-subtable-wrap">
      <table class="prt-subtable" id="szh-comm-table">
        <thead><tr><th>Kommunikációs csatorna</th><th>Érték</th></tr></thead>
        <tbody>
          ${comms.map(c=>`<tr data-id="${c.id||''}">
            <td><select class="szh-comm-type">${['Telefon','Email','Fax','Web','Mobil'].map(o=>`<option ${o===c.channel_type?'selected':''}>${o}</option>`).join('')}</select></td>
            <td><input type="text" class="szh-comm-value" value="${c.value||''}"></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <!-- Kapcsolattartók -->
  <div class="prt-subpanel" data-subpanel="szh-1">
    <div class="prt-subtable-toolbar">
      <button class="prt-toolbar-btn" id="szh-cont-add">➕ Hozzáadás</button>
      <button class="prt-toolbar-btn danger" id="szh-cont-del">🗑️ Törlés</button>
    </div>
    <div class="prt-subtable-wrap">
      <table class="prt-subtable" id="szh-cont-table">
        <thead><tr><th>Kapcsolattartó</th><th>Titulus</th></tr></thead>
        <tbody>
          ${contacts.map(c=>`<tr data-id="${c.id||''}">
            <td><input type="text" class="szh-cont-name" value="${c.name||''}"></td>
            <td><input type="text" class="szh-cont-title" value="${c.title||''}"></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <!-- Ügynökök -->
  <div class="prt-subpanel" data-subpanel="szh-2">
    <div class="prt-subtable-toolbar">
      <button class="prt-toolbar-btn" id="szh-agent-add">➕ Hozzáadás</button>
      <button class="prt-toolbar-btn danger" id="szh-agent-del">🗑️ Törlés</button>
    </div>
    <div class="prt-subtable-wrap">
      <table class="prt-subtable" id="szh-agent-table">
        <thead><tr><th>Érvényesség kezdete</th><th>Érvényesség vége</th><th>Ügynök</th></tr></thead>
        <tbody>
          ${agents.map(a=>`<tr data-id="${a.id||''}">
            <td><input type="date" class="szh-agent-from" value="${a.valid_from||''}"></td>
            <td><input type="date" class="szh-agent-to" value="${a.valid_to||''}"></td>
            <td><input type="text" class="szh-agent-name" value="${a.agent_name||''}"></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <!-- Egyéb adatok (székhelyhez) -->
  <div class="prt-subpanel" data-subpanel="szh-3">
    <div class="prt-row-2">
      <div class="prt-field"><label>Kommunikációs nyelv</label>
        <select id="prt-f-comm-lang"><option>Magyar</option><option>Angol</option><option>Spanyol</option><option>Egyéb</option></select>
      </div>
      ${prtField('prt-f-excise-num', 'Jövedéki engedélyszám', '')}
    </div>
    ${prtField('prt-f-gln2', 'GLN', p.gln)}
  </div>
  `;
}

function prtBuildTelephelyekPanel(sites) {
  return `
  <div class="prt-subtable-toolbar">
    <button class="prt-toolbar-btn" id="site-add-btn">➕ Hozzáadás</button>
    <button class="prt-toolbar-btn danger" id="site-del-btn">🗑️ Törlés</button>
  </div>
  <div class="prt-subtable-wrap" style="margin-bottom:16px">
    <table class="prt-subtable" id="sites-table">
      <thead><tr><th>Név</th><th>Cím</th><th>Törölve</th></tr></thead>
      <tbody>
        ${sites.map(s=>`<tr data-id="${s.id||''}">
          <td><input type="text" class="site-name" value="${s.name||''}"></td>
          <td><input type="text" class="site-address" value="${[s.zip,s.city,s.street_name].filter(Boolean).join(' ')}"></td>
          <td style="text-align:center"><input type="checkbox" class="site-deleted" ${s.is_deleted?'checked':''}></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div style="color:var(--text-muted);font-size:12px;margin-bottom:10px">Ha kiválasztasz egy telephelyet, az alfüleken az ahhoz kapcsolódó elérhetőségeket és kapcsolattartókat szerkesztheted.</div>
  <div class="prt-subtabs">
    ${['Elérhetőségek','Kapcsolattartók','Egyéb adatok'].map((t,i)=>
      `<div class="prt-subtab ${i===0?'active':''}" data-subtab="site-${i}">${t}</div>`).join('')}
  </div>
  <div class="prt-subpanel active" data-subpanel="site-0">
    <div id="site-comm-area" style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
      Válassz ki egy telephelyet a listából a kapcsolódó adatok szerkesztéséhez.
    </div>
  </div>
  <div class="prt-subpanel" data-subpanel="site-1">
    <div id="site-cont-area" style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
      Válassz ki egy telephelyet a listából.
    </div>
  </div>
  <div class="prt-subpanel" data-subpanel="site-2">
    <div style="padding:10px">
      <div class="prt-field"><label>Kommunikációs nyelv</label><select><option>Magyar</option><option>Angol</option></select></div>
    </div>
  </div>
  `;
}

function prtBuildTermeszetesPanel(p) {
  return `
  <div class="prt-cols-2">
    <div>
      <div class="prt-section">
        <div class="prt-section-title">👤 Személyes adatok</div>
        <div class="prt-row-2">
          ${prtField('prt-f-nat-fam-pref', 'Előtag', p.nat_family_name_prefix)}
          ${prtField('prt-f-nat-fam', 'Családi neve', p.nat_family_name)}
        </div>
        ${prtField('prt-f-nat-first', 'utóneve', p.nat_first_name)}
        <div class="prt-row-2">
          ${prtField('prt-f-nat-prev-fam-pref', 'Előző előtag', p.nat_prev_family_name_prefix)}
          ${prtField('prt-f-nat-prev-fam', 'Előző családi neve', p.nat_prev_family_name)}
        </div>
        ${prtField('prt-f-nat-prev-first', 'Előző utóneve', p.nat_prev_first_name)}
      </div>
      <div class="prt-section">
        <div class="prt-section-title">📋 Születési adatok</div>
        ${prtField('prt-f-birth-fam', 'Születési családi neve', p.birth_family_name)}
        ${prtField('prt-f-birth-first', 'Születési utóneve', p.birth_first_name)}
        ${prtField('prt-f-birth-place', 'Születési helye', p.birth_place)}
        <div class="prt-row-2">
          ${prtField('prt-f-birth-date', 'Születési idő', p.birth_date, 'date')}
          <div class="prt-field"><label>Neme</label>
            <select id="prt-f-gender">
              <option value="">-</option>
              <option value="M" ${p.gender==='M'?'selected':''}>Férfi</option>
              <option value="F" ${p.gender==='F'?'selected':''}>Nő</option>
            </select>
          </div>
        </div>
        ${prtField('prt-f-mother-fam', 'Anyja születési csn.', p.mothers_family_name)}
        ${prtField('prt-f-mother-first', 'Anyja utóneve', p.mothers_first_name)}
      </div>
    </div>
    <div>
      <div class="prt-section">
        <div class="prt-section-title">🪪 Azonosítók</div>
        ${prtField('prt-f-tax-id', 'Adóazonosító jel', p.tax_id)}
        ${prtField('prt-f-taj', 'TAJ szám', p.taj)}
      </div>
      <div class="prt-section">
        <div class="prt-section-title">🌾 Őstermelői adatok</div>
        ${prtField('prt-f-farmer-reg', 'Őstermelői regisztrációs szám', p.farmer_reg_number)}
        ${prtField('prt-f-farmer-cert', 'Őstermelői igazolvány száma', p.farmer_cert_number)}
        ${prtField('prt-f-farmer-act', 'Őstermelői tevékenység azon.', p.farmer_activity_id)}
        ${prtField('prt-f-family-farm', 'Családi gazdaság azonosítója', p.family_farm_id)}
        <div class="prt-check-row"><input type="checkbox" id="prt-f-comp-surcharge" ${p.has_compensation_surcharge?'checked':''}><label for="prt-f-comp-surcharge">Kompenzációs felárra jogosult</label></div>
        <div class="prt-field"><label>Állampolgárság</label>
          <select id="prt-f-citizenship">
            <option value="">-</option>
            <option value="HU" ${p.citizenship==='HU'?'selected':''}>Magyar</option>
            <option value="ES" ${p.citizenship==='ES'?'selected':''}>Spanyol</option>
            <option value="DE" ${p.citizenship==='DE'?'selected':''}>Német</option>
            <option value="other">Egyéb</option>
          </select>
        </div>
      </div>
    </div>
  </div>`;
}

function prtBuildEgyebAdatokPanel(p, data) {
  const idents = data?.identifiers || [];
  const chars = data?.characteristics || [];
  return `
  <div class="prt-cols-2">
    <div>
      <div class="prt-section-title" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px">🔢 Azonosítók</div>
      <div class="prt-subtable-toolbar">
        <button class="prt-toolbar-btn" id="ident-add-btn">➕</button>
        <button class="prt-toolbar-btn danger" id="ident-del-btn">🗑️</button>
        <button class="prt-toolbar-btn" style="color:var(--accent)">ABC Ellenőrzés</button>
      </div>
      <div class="prt-subtable-wrap">
        <table class="prt-subtable" id="ident-table">
          <thead><tr><th>Típus</th><th>Érték</th><th>É</th><th>Ellenőrizve</th></tr></thead>
          <tbody>
            ${idents.map(i=>`<tr data-id="${i.id||''}">
              <td><input type="text" class="ident-type" value="${i.id_type||''}"></td>
              <td><input type="text" class="ident-value" value="${i.value||''}"></td>
              <td><input type="text" class="ident-checked-by" value="${i.checked_by||''}" style="width:50px"></td>
              <td style="text-align:center"><input type="checkbox" class="ident-verified" ${i.is_verified?'checked':''}></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div>
      <div class="prt-section-title" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px">⭐ Jellemzők</div>
      <div class="prt-subtable-toolbar">
        <button class="prt-toolbar-btn" id="char-add-btn">➕</button>
        <button class="prt-toolbar-btn danger" id="char-del-btn">🗑️</button>
      </div>
      <div class="prt-subtable-wrap">
        <table class="prt-subtable" id="char-table">
          <thead><tr><th>Jellemző</th><th>Érték</th></tr></thead>
          <tbody>
            ${chars.map(c=>`<tr data-id="${c.id||''}">
              <td><input type="text" class="char-name" value="${c.characteristic||''}"></td>
              <td><input type="text" class="char-value" value="${c.value||''}"></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- Egyéb adatok section -->
  <div class="prt-section" style="margin-top:14px">
    <div class="prt-section-title">⚙️ Egyéb adatok</div>
    <div class="prt-row-4">
      <div class="prt-field"><label>Deviza</label><select id="prt-f-currency"><option value="EUR" ${p.currency==='EUR'?'selected':''}>EUR</option><option value="HUF" ${p.currency==='HUF'?'selected':''}>HUF</option><option value="USD" ${p.currency==='USD'?'selected':''}>USD</option></select></div>
      <div class="prt-field"><label>Árforma</label><select id="prt-f-price-type"><option>Listaár</option><option>Akció</option></select></div>
      <div class="prt-field"><label>Fizetési mód</label><select id="prt-f-payment"><option>Átutalás (30 nap)</option><option>Átutalás (60 nap)</option><option>Készpénz</option></select></div>
      <div class="prt-field"><label>Termékazonosító</label><input type="text" id="prt-f-product-id-type"></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:8px">
      <label class="prt-check-row"><input type="checkbox" id="prt-f-has-huni-tax" ${p.has_domestic_tax_num?'checked':''}><span>Rendelkezik adószámmal: Honi</span></label>
      <label class="prt-check-row"><input type="checkbox" id="prt-f-has-eu-tax" ${p.has_eu_tax_num?'checked':''}><span>EU</span></label>
      <label class="prt-check-row"><input type="checkbox" ${p.has_other_tax_num?'checked':''}><span>Egyéb</span></label>
      <label class="prt-check-row"><input type="checkbox" ${p.invoice_compensation_allowed?'checked':''}><span>Számlakompenzáció engedélyezve</span></label>
      <label class="prt-check-row"><input type="checkbox" ${p.is_kata_taxpayer?'checked':''}><span>KATA adózó</span></label>
    </div>
  </div>`;
}

function prtBuildMegjegyzesPanel(p, data) {
  const restrictions = data?.restrictions || [];
  const categories = data?.categories || [];
  return `
  <div class="prt-cols-2">
    <div>
      <div class="prt-section">
        <div class="prt-section-title">📝 Megjegyzés</div>
        <textarea id="prt-f-notes" style="width:100%;min-height:120px;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-light);color:var(--text-primary);resize:vertical;box-sizing:border-box">${p.notes||''}</textarea>
      </div>
      <div class="prt-section">
        <div class="prt-section-title">🚫 Korlátozások</div>
        <div class="prt-subtable-toolbar">
          <button class="prt-toolbar-btn" id="restr-add-btn">➕</button>
          <button class="prt-toolbar-btn danger" id="restr-del-btn">🗑️</button>
        </div>
        <div class="prt-subtable-wrap">
          <table class="prt-subtable" id="restr-table">
            <thead><tr><th>Művelet megnevezése</th><th>Tiltás kezdete</th></tr></thead>
            <tbody>
              ${restrictions.map(r=>`<tr data-id="${r.id||''}">
                <td><input type="text" class="restr-op" value="${r.operation_name||''}"></td>
                <td><input type="date" class="restr-start" value="${r.ban_start||''}"></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div>
      <div class="prt-section">
        <div class="prt-section-title">🏷️ Kategória besorolás</div>
        <div class="prt-subtable-toolbar">
          <button class="prt-toolbar-btn" id="cat-add-btn">➕</button>
          <button class="prt-toolbar-btn danger" id="cat-del-btn">🗑️</button>
        </div>
        <div class="prt-subtable-wrap">
          <table class="prt-subtable" id="cat-table">
            <thead><tr><th>Kategória</th></tr></thead>
            <tbody>
              ${categories.map(c=>`<tr data-id="${c.id||''}">
                <td><input type="text" class="cat-name" value="${c.category||''}"></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

function prtBuildCsatolmanyokPanel(data) {
  const attachments = data?.attachments || [];
  return `
  <div class="prt-attach-dropzone" id="prt-drop-zone">
    📎 Húzd ide a fájlt, vagy kattints a feltöltéshez
    <input type="file" id="prt-file-input" style="display:none" multiple>
  </div>
  <div class="prt-subtable-toolbar">
    <button class="prt-toolbar-btn" id="att-upload-btn">📂 Hozzáadás</button>
    <button class="prt-toolbar-btn danger" id="att-del-btn">🗑️ Törlés</button>
  </div>
  <div class="prt-subtable-wrap">
    <table class="prt-subtable" id="att-table">
      <thead><tr><th>T</th><th>Megnevezés</th><th>▲</th><th>Csatolva</th><th>Típus</th><th>Létrehozva</th><th>G</th><th>A</th><th>B</th><th>X</th><th>E</th><th>T</th><th>É</th></tr></thead>
      <tbody id="att-tbody">
        ${attachments.map(a=>`<tr data-id="${a.id}">
          <td>📄</td>
          <td>${a.file_name||''}</td>
          <td></td>
          <td>${a.attached_by||''}</td>
          <td>${a.file_type||''}</td>
          <td>${a.created_at ? new Date(a.created_at).toLocaleDateString('hu-HU') : ''}</td>
          <td style="text-align:center">${a.is_global?'✓':''}</td>
          <td style="text-align:center">${a.is_archive?'✓':''}</td>
          <td style="text-align:center">${a.is_blocked?'✓':''}</td>
          <td style="text-align:center">${a.is_expired?'✓':''}</td>
          <td style="text-align:center">${a.is_encrypted?'✓':''}</td>
          <td style="text-align:center">${a.is_template?'✓':''}</td>
          <td style="text-align:center">${a.is_checked?'✓':''}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function prtBuildPenzugyiPanel(data) {
  const bankAccounts = data?.bankAccounts || [];
  const discounts = data?.discounts || [];
  const cs = data?.creditSettings || {};
  return `
  <div class="prt-subtabs">
    ${['Bankszámlák','Százalékos kedvezmények','Hitelkeret, késedelmi kamat, Csoportos beszedés'].map((t,i)=>
      `<div class="prt-subtab ${i===0?'active':''}" data-subtab="fin-${i}">${t}</div>`).join('')}
  </div>
  <!-- Bankszámlák -->
  <div class="prt-subpanel active" data-subpanel="fin-0">
    <div class="prt-subtable-toolbar">
      <button class="prt-toolbar-btn" id="bank-add-btn">➕</button>
      <button class="prt-toolbar-btn danger" id="bank-del-btn">🗑️</button>
    </div>
    <div class="prt-subtable-wrap">
      <table class="prt-subtable" id="bank-table">
        <thead><tr><th>Számlaszám</th><th>Bank</th><th>A</th></tr></thead>
        <tbody>
          ${bankAccounts.map(b=>`<tr data-id="${b.id||''}">
            <td><input type="text" class="bank-num" value="${b.account_number||''}"></td>
            <td><input type="text" class="bank-name" value="${b.bank_name||''}"></td>
            <td style="text-align:center"><input type="checkbox" class="bank-primary" ${b.is_primary?'checked':''}></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <!-- Százalékos kedvezmények -->
  <div class="prt-subpanel" data-subpanel="fin-1">
    <div class="prt-subtable-toolbar">
      <button class="prt-toolbar-btn" id="disc-add-btn">➕</button>
      <button class="prt-toolbar-btn danger" id="disc-del-btn">🗑️</button>
    </div>
    <div class="prt-subtable-wrap">
      <table class="prt-subtable" id="disc-table">
        <thead><tr><th>Termékcsoport</th><th>Kedvezmény %</th></tr></thead>
        <tbody>
          ${discounts.map(d=>`<tr data-id="${d.id||''}">
            <td><input type="text" class="disc-group" value="${d.product_group||''}"></td>
            <td><input type="number" class="disc-pct" value="${d.discount_pct||''}" step="0.01"></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <!-- Hitelkeret stb. -->
  <div class="prt-subpanel" data-subpanel="fin-2">
    <div class="prt-section">
      <div class="prt-section-title">💳 Hitelkeret & Késedelmi kamat</div>
      <div class="prt-row-3">
        ${prtField('prt-f-credit-limit', 'Hitelkeret összege', cs.credit_limit, 'number')}
        ${prtField('prt-f-late-interest', 'Késedelmi kamat %', cs.late_interest_pct, 'number')}
        ${prtField('prt-f-coll-account', 'Csoportos beszedési számla', cs.collection_account)}
      </div>
      <div class="prt-check-row"><input type="checkbox" id="prt-f-group-coll" ${cs.group_collection?'checked':''}><label for="prt-f-group-coll">Csoportos beszedés engedélyezve</label></div>
    </div>
  </div>`;
}

function prtBuildEsemenyekPanel(data) {
  const events = data?.events || [];
  return `
  <div class="prt-subtable-wrap">
    <table class="prt-subtable">
      <thead><tr><th>Időpont</th><th>Esemény típus</th><th>Megnevezés</th><th>Létrehozó</th><th>Partner</th></tr></thead>
      <tbody>
        ${events.map(e=>`<tr>
          <td>${e.event_date ? new Date(e.event_date).toLocaleString('hu-HU') : ''}</td>
          <td>${e.event_type||''}</td>
          <td>${e.name||''}</td>
          <td>${e.created_by||''}</td>
          <td>${e.partner_name||''}</td>
        </tr>`).join('')}
        ${!events.length ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Nincsenek rögzített események</td></tr>' : ''}
      </tbody>
    </table>
  </div>
  <div class="prt-subtable-toolbar" style="margin-top:10px">
    <button class="prt-toolbar-btn">📌 Új adat</button>
    <button class="prt-toolbar-btn">📂 Megnyitás</button>
    <button class="prt-toolbar-btn danger">🗑️ Törlés</button>
  </div>`;
}

// ─── Modal: nyitás/zárás/binding ─────────────────────────────────────────────
async function prtOpenModal(id, listContainer) {
  prtState.currentId = id;
  let data = null;
  if (id) {
    try {
      data = await prtApi('GET', `/${id}`);
    } catch (e) {
      alert('Hiba a partner betöltésekor: ' + e.message);
      return;
    }
  }
  prtState.currentData = data;

  const overlay = document.createElement('div');
  overlay.className = 'prt-modal-overlay';
  overlay.id = 'prt-overlay';
  overlay.innerHTML = prtBuildModal(data);
  document.body.appendChild(overlay);

  prtBindModal(overlay, listContainer, id);
}

function prtBindModal(overlay, listContainer, id) {
  // Fő tab váltás
  overlay.querySelectorAll('.prt-tab-main').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.prt-tab-main').forEach(t => t.classList.remove('active'));
      overlay.querySelectorAll('.prt-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      overlay.querySelector(`.prt-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });

  // Alfülek (subtab) – általános kötés
  function bindSubtabs(scope) {
    scope.querySelectorAll('.prt-subtab').forEach(tab => {
      tab.addEventListener('click', () => {
        const panel = tab.closest('.prt-panel, .prt-modal');
        panel.querySelectorAll('.prt-subtab').forEach(t => t.classList.remove('active'));
        panel.querySelectorAll('.prt-subpanel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        panel.querySelector(`.prt-subpanel[data-subpanel="${tab.dataset.subtab}"]`).classList.add('active');
      });
    });
  }
  bindSubtabs(overlay);

  // Levelezési cím checkbox
  const mailingSame = overlay.querySelector('#prt-f-mailing-same');
  if (mailingSame) {
    mailingSame.addEventListener('change', () => {
      const fields = overlay.querySelector('#prt-mailing-fields');
      if (mailingSame.checked) {
        fields.style.opacity = '0.4'; fields.style.pointerEvents = 'none';
      } else {
        fields.style.opacity = '1'; fields.style.pointerEvents = 'auto';
      }
    });
  }

  // ── Subtable: Sor hozzáadása / törlése ──
  function bindSubtable(addBtnId, delBtnId, tableId, newRowFn) {
    const addBtn = overlay.querySelector('#' + addBtnId);
    const delBtn = overlay.querySelector('#' + delBtnId);
    const table = overlay.querySelector('#' + tableId);
    if (!addBtn || !table) return;
    addBtn.addEventListener('click', () => {
      const tr = document.createElement('tr');
      tr.innerHTML = newRowFn();
      table.querySelector('tbody').appendChild(tr);
    });
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        const selected = table.querySelector('tr.selected');
        if (selected) selected.remove();
        else alert('Válassz ki egy sort a törléshez (kattints rá)!');
      });
    }
    table.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr || !tr.parentElement.tagName === 'TBODY') return;
      table.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected', 'selected-row');
      tr.style.background = 'rgba(99,102,241,0.15)';
    });
  }

  bindSubtable('szh-comm-add','szh-comm-del','szh-comm-table', () =>
    `<td><select class="szh-comm-type">${['Telefon','Email','Fax','Web','Mobil'].map(o=>`<option>${o}</option>`).join('')}</select></td><td><input type="text" class="szh-comm-value"></td>`);
  bindSubtable('szh-cont-add','szh-cont-del','szh-cont-table', () =>
    `<td><input type="text" class="szh-cont-name"></td><td><input type="text" class="szh-cont-title"></td>`);
  bindSubtable('szh-agent-add','szh-agent-del','szh-agent-table', () =>
    `<td><input type="date" class="szh-agent-from"></td><td><input type="date" class="szh-agent-to"></td><td><input type="text" class="szh-agent-name"></td>`);
  bindSubtable('site-add-btn','site-del-btn','sites-table', () =>
    `<td><input type="text" class="site-name"></td><td><input type="text" class="site-address"></td><td style="text-align:center"><input type="checkbox" class="site-deleted"></td>`);
  bindSubtable('ident-add-btn','ident-del-btn','ident-table', () =>
    `<td><input type="text" class="ident-type" value="Adószám"></td><td><input type="text" class="ident-value"></td><td><input type="text" class="ident-checked-by" style="width:50px"></td><td style="text-align:center"><input type="checkbox" class="ident-verified"></td>`);
  bindSubtable('char-add-btn','char-del-btn','char-table', () =>
    `<td><input type="text" class="char-name"></td><td><input type="text" class="char-value"></td>`);
  bindSubtable('restr-add-btn','restr-del-btn','restr-table', () =>
    `<td><input type="text" class="restr-op"></td><td><input type="date" class="restr-start"></td>`);
  bindSubtable('cat-add-btn','cat-del-btn','cat-table', () =>
    `<td><input type="text" class="cat-name"></td>`);
  bindSubtable('bank-add-btn','bank-del-btn','bank-table', () =>
    `<td><input type="text" class="bank-num"></td><td><input type="text" class="bank-name"></td><td style="text-align:center"><input type="checkbox" class="bank-primary"></td>`);
  bindSubtable('disc-add-btn','disc-del-btn','disc-table', () =>
    `<td><input type="text" class="disc-group"></td><td><input type="number" class="disc-pct" step="0.01"></td>`);

  // ── Csatolmány feltöltés ──
  const attUploadBtn = overlay.querySelector('#att-upload-btn');
  const fileInput = overlay.querySelector('#prt-file-input');
  const dropZone = overlay.querySelector('#prt-drop-zone');
  if (attUploadBtn && fileInput) {
    attUploadBtn.addEventListener('click', () => fileInput.click());
    dropZone?.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      if (!id) { alert('Előbb mentsd el a partnert, majd csatolj fájlt!'); return; }
      for (const file of fileInput.files) {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch(`/api/v1/partners/${id}/attachments`, { method: 'POST', body: fd });
          const att = await res.json();
          const tbody = overlay.querySelector('#att-tbody');
          if (tbody) {
            const tr = document.createElement('tr');
            tr.dataset.id = att.id;
            tr.innerHTML = `<td>📄</td><td>${att.file_name}</td><td></td><td></td><td>${att.file_type||''}</td><td>${new Date().toLocaleDateString('hu-HU')}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>`;
            tbody.appendChild(tr);
          }
        } catch(e) { alert('Feltöltési hiba: ' + e.message); }
      }
    });
  }

  // ── Bezár ──
  overlay.querySelector('#prt-close-btn')?.addEventListener('click', () => prtCloseModal(overlay));
  overlay.querySelector('#prt-cancel-btn')?.addEventListener('click', () => prtCloseModal(overlay));
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) prtCloseModal(overlay);
  });

  // ── Mentés ──
  overlay.querySelector('#prt-save-btn')?.addEventListener('click', async () => {
    try {
      const payload = prtCollectData(overlay);
      let result;
      if (id) {
        result = await prtApi('PUT', `/${id}`, payload);
      } else {
        result = await prtApi('POST', '/', payload);
      }
      prtCloseModal(overlay);
      await prtLoadList();
      prtRenderList(listContainer);
    } catch (e) {
      alert('Mentési hiba: ' + e.message);
    }
  });
}

function prtCloseModal(overlay) {
  overlay.remove();
}

// ─── Data collection from modal ───────────────────────────────────────────────
function prtCollectTableRows(overlay, tableId, fields) {
  const rows = [];
  overlay.querySelectorAll(`#${tableId} tbody tr`).forEach(tr => {
    const row = { id: tr.dataset.id || null };
    fields.forEach(([cls, key, type]) => {
      const el = tr.querySelector(`.${cls}`);
      if (!el) return;
      if (type === 'bool') row[key] = el.checked;
      else row[key] = el.value;
    });
    rows.push(row);
  });
  return rows;
}

function prtCollectData(overlay) {
  const v = (id) => overlay.querySelector('#' + id)?.value || null;
  const cb = (id) => overlay.querySelector('#' + id)?.checked || false;

  return {
    partner: {
      name: v('prt-f-name'),
      type: v('prt-f-type'),
      is_natural_person: cb('prt-f-natural'),
      is_inactive: cb('prt-f-inactive'),
      is_anonymized: cb('prt-f-anon'),
      sync_from_moszr: cb('prt-f-moszr'),
      invoice_name: v('prt-f-invoice-name'),
      country: v('prt-f-country'),
      region: null,
      zip: v('prt-f-zip'),
      city: v('prt-f-city'),
      district: v('prt-f-district'),
      street_name: v('prt-f-street-name'),
      street_type: v('prt-f-street-type'),
      street_number: v('prt-f-street-number'),
      building: v('prt-f-building'),
      staircase: v('prt-f-staircase'),
      floor: v('prt-f-floor'),
      door: v('prt-f-door'),
      mailing_same_as_hq: cb('prt-f-mailing-same'),
      mailing_invoice_name: v('prt-f-mailing-inv-name'),
      mailing_country: v('prt-f-mailing-country'),
      mailing_zip: v('prt-f-mailing-zip'),
      mailing_city: v('prt-f-mailing-city'),
      mailing_street_name: v('prt-f-mailing-street-name'),
      mailing_street_type: v('prt-f-mailing-street-type'),
      mailing_street_number: v('prt-f-mailing-street-number'),
      gln: v('prt-f-gln'),
      nat_family_name_prefix: v('prt-f-nat-fam-pref'),
      nat_family_name: v('prt-f-nat-fam'),
      nat_first_name: v('prt-f-nat-first'),
      birth_place: v('prt-f-birth-place'),
      birth_date: v('prt-f-birth-date'),
      gender: v('prt-f-gender'),
      tax_id: v('prt-f-tax-id'),
      taj: v('prt-f-taj'),
      farmer_reg_number: v('prt-f-farmer-reg'),
      has_compensation_surcharge: cb('prt-f-comp-surcharge'),
      citizenship: v('prt-f-citizenship'),
      currency: v('prt-f-currency'),
      price_type: v('prt-f-price-type'),
      payment_method: v('prt-f-payment'),
      has_domestic_tax_num: cb('prt-f-has-huni-tax'),
      has_eu_tax_num: cb('prt-f-has-eu-tax'),
      notes: overlay.querySelector('#prt-f-notes')?.value || null,
      default_print_mode: 'system',
    },
    communications: prtCollectTableRows(overlay, 'szh-comm-table', [
      ['szh-comm-type','channel_type','str'],
      ['szh-comm-value','value','str'],
    ]),
    contacts: prtCollectTableRows(overlay, 'szh-cont-table', [
      ['szh-cont-name','name','str'],
      ['szh-cont-title','title','str'],
    ]),
    agents: prtCollectTableRows(overlay, 'szh-agent-table', [
      ['szh-agent-from','valid_from','str'],
      ['szh-agent-to','valid_to','str'],
      ['szh-agent-name','agent_name','str'],
    ]),
    sites: prtCollectTableRows(overlay, 'sites-table', [
      ['site-name','name','str'],
      ['site-deleted','is_deleted','bool'],
    ]),
    identifiers: prtCollectTableRows(overlay, 'ident-table', [
      ['ident-type','id_type','str'],
      ['ident-value','value','str'],
      ['ident-checked-by','checked_by','str'],
      ['ident-verified','is_verified','bool'],
    ]),
    characteristics: prtCollectTableRows(overlay, 'char-table', [
      ['char-name','characteristic','str'],
      ['char-value','value','str'],
    ]),
    restrictions: prtCollectTableRows(overlay, 'restr-table', [
      ['restr-op','operation_name','str'],
      ['restr-start','ban_start','str'],
    ]),
    categories: prtCollectTableRows(overlay, 'cat-table', [
      ['cat-name','category','str'],
    ]),
    bankAccounts: prtCollectTableRows(overlay, 'bank-table', [
      ['bank-num','account_number','str'],
      ['bank-name','bank_name','str'],
      ['bank-primary','is_primary','bool'],
    ]),
    discounts: prtCollectTableRows(overlay, 'disc-table', [
      ['disc-group','product_group','str'],
      ['disc-pct','discount_pct','str'],
    ]),
    creditSettings: {
      credit_limit: overlay.querySelector('#prt-f-credit-limit')?.value || null,
      late_interest_pct: overlay.querySelector('#prt-f-late-interest')?.value || null,
      collection_account: overlay.querySelector('#prt-f-coll-account')?.value || null,
      group_collection: overlay.querySelector('#prt-f-group-coll')?.checked || false,
    },
  };
}

// ─── Module entry point ───────────────────────────────────────────────────────
export default async function partnerekModule(container) {
  container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Partnerek betöltése...</div>`;
  try {
    await prtLoadList();
    prtRenderList(container);
  } catch (e) {
    container.innerHTML = `<div style="padding:40px;color:#f87171">Hiba: ${e.message}</div>`;
  }
}
