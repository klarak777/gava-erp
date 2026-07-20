/**
 * GAVA ERP – Partnerek modul
 * v0.5.8 – Teljes partner beviteli és kezelési modul (8 főfül, alfülekkel)
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
.prt-badge-fuvarozó { background: rgba(251,191,36,0.15); color: #fbbf24; }
.prt-badge-other { background: rgba(148,163,184,0.15); color: #94a3b8; }
.prt-badge-inactive { background: rgba(239,68,68,0.15); color: #f87171; }

/* ── Modal ─────────────────────────────────────────────────── */
.prt-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65);
  z-index: 3000; overflow: hidden;
}
.prt-modal {
  position: absolute; top: 5vh; left: 50%; transform: translateX(-50%);
  background: #ffffff; border-radius: 16px; width: 100%; max-width: 1200px;
  border: 1px solid var(--border); box-shadow: 0 24px 80px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; height: 90vh; overflow: hidden;
}
.prt-modal.maximized {
  top: 0 !important; left: 0 !important; transform: none !important;
  width: 100vw !important; height: 100vh !important; max-width: none !important;
  border-radius: 0 !important;
}
.prt-modal-titlebar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,0.03); border-radius: 16px 16px 0 0;
  cursor: grab; flex-shrink: 0;
}
.prt-modal-titlebar:active { cursor: grabbing; }
.prt-modal-titlebar h3 { margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary); pointer-events: none; }
.prt-modal-toprow {
  display: flex; align-items: center; gap: 16px; padding: 12px 20px;
  border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02);
  flex-wrap: wrap; flex-shrink: 0;
}
.prt-modal-toprow .prt-name-wrap { flex: 1; min-width: 260px; }
.prt-modal-toprow .prt-name-wrap label { font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px; }
.prt-modal-toprow .prt-name-input {
  width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc;
  background: #fff; color: #111; font-size: 15px; font-weight: 600;
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
.prt-panels { flex: 1; padding: 18px 20px; overflow-y: auto; min-height: 0; }
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

/* Footer removed */
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
function prtGetRowsHtml() {
  const typeBadge = (t) => {
    const map = {
      'vevő': ['Vevő', 'customer'],
      'szállító': ['Szállító', 'supplier'],
      'fuvarozó': ['Fuvarozó', 'transporter'],
      'customer': ['Vevő', 'customer'],
      'supplier': ['Szállító', 'supplier'],
      'transporter': ['Fuvarozó', 'transporter'],
      'Adószám': ['Adószám', 'other'],
      'CCW + Kód': ['CCW + Kód', 'other'],
      'Csoportos adószám': ['Csoportos', 'other'],
      'Közösségi adószám': ['Közösségi ad.', 'other'],
      'FELIR azonosító': ['FELIR', 'other'],
      'NEBIH': ['NEBIH', 'other'],
    };
    const [label, cls] = map[t] || ['Egyéb', 'other'];
    return `<span class="prt-badge prt-badge-${cls}">${label}</span>`;
  };
  return prtState.list.map(p => {
    let address = [p.zip, p.city, p.street_name, p.street_number].filter(Boolean).join(' ');
    if (!address) address = '-';
    let invoiceName = p.invoice_name || '-';
    let taxId = p.tax_id || '-';
    // Mivel ezek partnerek (nem telephelyek), ezek alapértelmezetten a székhelyek.
    let orgUnit = 'Székhely';
    return `
    <tr data-id="${p.id}">
      <td>${p.id}</td>
      <td style="font-weight:600">${prtEsc(p.name)}</td>
      <td>${prtEsc(invoiceName)}</td>
      <td>${prtEsc(taxId)}</td>
      <td><span class="prt-badge prt-badge-other">${orgUnit}</span></td>
      <td>${prtEsc(address)}</td>
      <td style="text-align:center; padding: 2px 8px;">
        <button class="prt-row-del-btn" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:16px; padding:4px;" title="Törlés">🗑️</button>
      </td>
    </tr>
    `;
  }).join('');
}

function prtRenderList(container) {
  container.innerHTML = `
    ${PARTNEREK_STYLE}
    <div class="prt-list-wrap">
      <div class="prt-list-header">
        <h2>🤝 Partnerek</h2>
        <div class="prt-search-row">
          <input class="prt-search-input" id="prt-search-name" type="text" placeholder="🔍 Név..." style="width: 180px;">
          <input class="prt-search-input" id="prt-search-tax" type="text" placeholder="🔍 Adószám..." style="width: 150px;">
          <input class="prt-search-input" id="prt-search-city" type="text" placeholder="🔍 Város..." style="width: 150px;">
          <button class="secondary-btn" id="prt-clear-btn" style="padding:8px 12px; border-radius:8px; border:1px solid var(--border);" title="Kereső törlése">✖</button>
          <button class="primary-btn" id="prt-new-btn">➕ Új Partner</button>
        </div>
      </div>
      <div class="prt-table-wrap">
        <table class="prt-table">
          <thead>
            <tr>
              <th>#</th><th>Név</th><th>Név a bizonylaton</th><th>Adószám</th><th>Szervezeti egység</th><th>Cím</th><th style="width:70px; text-align:center">Művelet</th>
            </tr>
          </thead>
          <tbody id="prt-tbody">${prtGetRowsHtml()}</tbody>
        </table>
      </div>
    </div>
  `;

  // Events
  container.querySelector('#prt-new-btn').addEventListener('click', () => prtOpenModal(null, container));
  container.querySelector('#prt-clear-btn').addEventListener('click', async () => {
    container.querySelector('#prt-search-name').value = '';
    container.querySelector('#prt-search-tax').value = '';
    container.querySelector('#prt-search-city').value = '';
    await prtLoadList('', '', '');
    container.querySelector('#prt-tbody').innerHTML = prtGetRowsHtml();
    prtBindListEvents(container);
  });
  
  let searchTimeout = null;
  const handleSearchInput = () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const sName = container.querySelector('#prt-search-name').value;
      const sTax = container.querySelector('#prt-search-tax').value;
      const sCity = container.querySelector('#prt-search-city').value;
      await prtLoadList(sName, sTax, sCity);
      container.querySelector('#prt-tbody').innerHTML = prtGetRowsHtml();
      prtBindListEvents(container);
    }, 250);
  };

  container.querySelector('#prt-search-name').addEventListener('input', handleSearchInput);
  container.querySelector('#prt-search-tax').addEventListener('input', handleSearchInput);
  container.querySelector('#prt-search-city').addEventListener('input', handleSearchInput);

  prtBindListEvents(container);
}

function prtBindListEvents(container) {
  container.querySelectorAll('#prt-tbody tr').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.prt-row-del-btn')) return;
      prtOpenModal(parseInt(row.dataset.id), container);
    });

    const delBtn = row.querySelector('.prt-row-del-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(row.dataset.id);
        const name = row.querySelector('td:nth-child(2)').textContent;
        if (confirm(`Biztosan törölni szeretnéd a(z) "${name}" nevű partnert és minden kapcsolódó adatát?`)) {
          const doDelete = async (force = false) => {
            try {
              const url = `/api/v1/partners/${id}` + (force ? '?force=true' : '');
              const res = await fetch(url, { method: 'DELETE' });
              const result = await res.json();
              
              if (res.status === 409 && result.warning) {
                if (confirm(result.error)) {
                  await doDelete(true);
                }
                return;
              }
              
              if (res.ok && result.success) {
                // Reload list
                const sName = container.querySelector('#prt-search-name').value;
                const sTax = container.querySelector('#prt-search-tax').value;
                const sCity = container.querySelector('#prt-search-city').value;
                await prtLoadList(sName, sTax, sCity);
                container.querySelector('#prt-tbody').innerHTML = prtGetRowsHtml();
                prtBindListEvents(container);
              } else {
                alert('Hiba a törlés során: ' + (result.error || 'Ismeretlen hiba'));
              }
            } catch (err) {
              alert('Hiba a törlés során: ' + err.message);
            }
          };
          
          await doDelete(false);
        }
      });
    }
  });
}

async function prtLoadList(searchName = '', searchTax = '', searchCity = '') {
  let url = `?limit=300`;
  if (searchName) url += `&searchName=${encodeURIComponent(searchName)}`;
  if (searchTax) url += `&searchTax=${encodeURIComponent(searchTax)}`;
  if (searchCity) url += `&searchCity=${encodeURIComponent(searchCity)}`;
  prtState.list = await prtApi('GET', url);
}

// ─── Modal Builder ────────────────────────────────────────────────────────────
function prtEsc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function prtBuildModal(data) {
  const p = data?.partner || {};
  const sites = data?.sites || [];
  const isNew = !p.id;

  return `
  <div class="prt-modal" id="prt-modal">
    <div class="prt-modal-titlebar">
      <h3>${isNew ? '➕ Új Partner' : `✏️ Partner: ${prtEsc(p.name)}`}</h3>
      <div style="display:flex;gap:12px;align-items:center">
        <button class="primary-btn" id="prt-save-btn" style="padding:4px 14px; font-size:13px;">💾 Mentés</button>
        <div style="width:1px; background:var(--border); margin:0 4px; height:20px;"></div>
        <button class="win-btn minimize" id="prt-minimize-btn" title="Kis méret" style="background:none; border:none; color:var(--text-primary); cursor:pointer; font-size:16px; padding:0 5px; font-weight:bold;">_</button>
        <button class="win-btn maximize" id="prt-maximize-btn" title="Teljes méret" style="background:none; border:none; color:var(--text-primary); cursor:pointer; font-size:14px; padding:0 5px;">□</button>
        <button class="secondary-btn" id="prt-close-btn" style="padding:4px 14px; font-size:13px;">✕ Bezár</button>
      </div>
    </div>

    <!-- Fejléc: Név, Természetes személy, Inaktív, Anonimizált -->
    <div class="prt-modal-toprow">
      <div class="prt-name-wrap">
        <label>Név: *</label>
        <input class="prt-name-input" id="prt-f-name" type="text" value="${prtEsc(p.name)}" placeholder="Partner neve">
      </div>
      <div class="prt-modal-flags">
        <label><input type="checkbox" id="prt-f-natural" ${p.is_natural_person ? 'checked' : ''}> Természetes személy</label>
        <label><input type="checkbox" id="prt-f-inactive" ${p.is_inactive ? 'checked' : ''}> Inaktív</label>
        <label><input type="checkbox" id="prt-f-anon" ${p.is_anonymized ? 'checked' : ''}> Anonimizált</label>
        <!-- Típus rejtett – az Azonosítók fülön állítható -->
        <input type="hidden" id="prt-f-type" value="${p.type || 'other'}">
        <span id="prt-type-badge" style="padding:5px 12px;border-radius:7px;background:rgba(99,102,241,0.12);color:var(--accent);font-size:12px;font-weight:600;">${prtEsc(p.type) || 'Nincs beállítva'}</span>
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
      <div class="prt-panel" data-panel="3" style="overflow-y:auto; max-height:480px; padding-right:8px; margin-top:-18px; padding-top:0;">
        ${prtBuildEgyebAdatokPanel(p, data)}
      </div>
      <!-- 4: Megjegyzés/Kategóriák -->
      <div class="prt-panel" data-panel="4" style="margin-top:-18px; padding-top:0;">
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

  </div>`;
}

// ─── Panel builders ────────────────────────────────────────────────────────────
function prtField(id, label, value = '', type = 'text', attrs = '') {
  return `<div class="prt-field"><label>${label}</label><input type="${type}" id="${id}" value="${prtEsc(value)}" ${attrs}></div>`;
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
        ${sites.map((s, index) => {
          let addrStr = [s.zip, s.city, s.street_name, s.street_number].filter(Boolean).join(' ');
          if (s.is_same_as_hq) addrStr = 'Azonos a székhellyel';
          return `<tr data-index="${index}" data-id="${s.id||''}" style="${s.is_deleted ? 'opacity:0.5;' : ''}">
            <td><input type="text" class="site-name" value="${prtEsc(s.name)}" style="background:var(--bg-light);"></td>
            <td><input type="text" class="site-address" value="${prtEsc(addrStr)}" readonly style="background:var(--bg-light);"></td>
            <td style="text-align:center"><input type="checkbox" class="site-deleted" ${s.is_deleted?'checked':''}></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  <div style="color:var(--text-muted);font-size:12px;margin-bottom:10px">Ha kiválasztasz egy telephelyet, az alfüleken az ahhoz kapcsolódó címeket, elérhetőségeket és kapcsolattartókat szerkesztheted.</div>
  <div class="prt-subtabs">
    ${['Címek','Elérhetőségek','Kapcsolattartók','Egyéb adatok'].map((t,i)=>
      `<div class="prt-subtab ${i===0?'active':''}" data-subtab="site-${i}">${t}</div>`).join('')}
  </div>
  <div class="prt-subpanel active" data-subpanel="site-0">
    <div id="site-address-area">
      <div style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
        Válassz ki egy telephelyet a listából a címadatok szerkesztéséhez.
      </div>
    </div>
  </div>
  <div class="prt-subpanel" data-subpanel="site-1">
    <div id="site-comm-area" style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
      Válassz ki egy telephelyet a listából.
    </div>
  </div>
  <div class="prt-subpanel" data-subpanel="site-2">
    <div id="site-cont-area" style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
      Válassz ki egy telephelyet a listából.
    </div>
  </div>
  <div class="prt-subpanel" data-subpanel="site-3">
    <div id="site-other-area" style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
      Válassz ki egy telephelyet a listából.
    </div>
  </div>
  `;
}

function prtBuildTermeszetesPanel(p) {
  const getPrefixOptions = (val) => {
    const opts = ['Dr.','Prof.','Úr','Asszony','Kisasszony','ifj.','id.','özv.','Mr.','Mrs.','Ms.','Miss','Mx.','Sir','Dame','Lord','Lady','Rev.','Fr.','Capt.','Col.','Gen.','Sr.','Sra.','Srta.','Don','Doña','Ing.','Lic.'];
    let html = `<option value="" ${!val?'selected':''}>-</option>`;
    html += opts.map(o => `<option value="${o}" ${val===o?'selected':''}>${o}</option>`).join('');
    return html;
  };

  return `
  <div class="prt-cols-2">
    <!-- Bal oszlop -->
    <div>
      <!-- Személyes adatok -->
      <div class="prt-section">
        <div class="prt-section-title">Személyes adatok</div>
        <div style="display:flex; gap:10px; margin-bottom:5px;">
          <div class="prt-field" style="flex:1;"><label>Családi neve:</label>
            <div style="display:flex; gap:5px;">
              <select id="prt-f-nat-fam-pref" style="width:80px;height:24px;border:1px solid var(--border);border-radius:3px;">${getPrefixOptions(p.nat_family_name_prefix)}</select>
              <input type="text" id="prt-f-nat-fam" value="${p.nat_family_name||''}" style="flex:1;">
            </div>
          </div>
          <div class="prt-field" style="flex:1;"><label>utóneve:</label>
            <input type="text" id="prt-f-nat-first" value="${p.nat_first_name||''}">
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <div class="prt-field" style="flex:1;"><label>Előző családi neve:</label>
            <div style="display:flex; gap:5px;">
              <select id="prt-f-nat-prev-fam-pref" style="width:80px;height:24px;border:1px solid var(--border);border-radius:3px;">${getPrefixOptions(p.nat_prev_family_name_prefix)}</select>
              <input type="text" id="prt-f-nat-prev-fam" value="${p.nat_prev_family_name||''}" style="flex:1;">
            </div>
          </div>
          <div class="prt-field" style="flex:1;"><label>utóneve:</label>
            <input type="text" id="prt-f-nat-prev-first" value="${p.nat_prev_first_name||''}">
          </div>
        </div>
      </div>
      
      <!-- Születési adatok -->
      <div class="prt-section">
        <div class="prt-section-title">Születési adatok</div>
        <div class="prt-row-2">
          ${prtField('prt-f-birth-fam', 'Családi neve:', p.birth_family_name)}
          ${prtField('prt-f-birth-first', 'utóneve:', p.birth_first_name)}
        </div>
        ${prtField('prt-f-birth-display', 'Megjelenített név:', p.birth_display_name)}
        ${prtField('prt-f-birth-place', 'Hely:', p.birth_place)}
        <div class="prt-row-2">
          ${prtField('prt-f-birth-date', 'Idő:', p.birth_date, 'date')}
          <div class="prt-field"><label>Neme:</label>
            <select id="prt-f-gender">
              <option value="">-</option>
              <option value="M" ${p.gender==='M'?'selected':''}>Férfi</option>
              <option value="F" ${p.gender==='F'?'selected':''}>Nő</option>
            </select>
          </div>
        </div>
        <div class="prt-row-2">
          ${prtField('prt-f-mother-fam', 'Anyja családi neve:', p.mothers_family_name)}
          ${prtField('prt-f-mother-first', 'utóneve:', p.mothers_first_name)}
        </div>
        ${prtField('prt-f-mother-display', 'Anyja megjelenített neve:', p.mothers_display_name)}
      </div>
    </div>
    
    <!-- Jobb oszlop -->
    <div>
      <div class="prt-section">
        <div class="prt-section-title">Azonosítók</div>
        ${p.is_natural_person 
          ? prtField('prt-f-tax-id', 'Adóazonosító jel:', p.tax_id)
          : '<div class="prt-field" style="opacity:0.4;pointer-events:none"><label>Adóazonosító jel: <em style="font-size:10px;">(csak term. személynek)</em></label><input type="hidden" id="prt-f-tax-id" value=""><input type="text" disabled style="width:100%;" placeholder="-"></div>'
        }
        ${prtField('prt-f-taj', 'TAJ:', p.taj)}
      </div>
      <div class="prt-section">
        <div class="prt-section-title">Őstermelő</div>
        ${prtField('prt-f-farmer-reg', 'Őstermelői regisztrációs szám:', p.farmer_reg_number)}
        ${prtField('prt-f-farmer-cert', 'Őstermelő igazolvány száma:', p.farmer_cert_number)}
        ${prtField('prt-f-farmer-act', 'Őstermelői tevékenység azon.:', p.farmer_activity_id)}
        ${prtField('prt-f-family-farm', 'Családi gazdaság azonosítója:', p.family_farm_id)}
            <input type="checkbox" id="prt-f-comp-surcharge" ${p.has_compensation_surcharge?'checked':''}> Kompenzációs felárra jogosult
          </label>
        </div>
        <div class="prt-field" style="margin-top:10px;"><label>Állampolgárság:</label>
          <select id="prt-f-citizenship">
            <option value="">-</option>
            <option value="Magyar" ${p.citizenship==='Magyar'?'selected':''}>Magyar</option>
            <option value="Külföldi" ${p.citizenship==='Külföldi'?'selected':''}>Külföldi</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  `;
}

function prtBuildEgyebAdatokPanel(p, data) {
  const idents = data?.identifiers || [];
  const chars = data?.characteristics || [];
  
  // Csak nem természetes személyeknél töltjük be az adószámot az Azonosítók táblába
  if (!p.is_natural_person && p.tax_id && !idents.some(i => i.id_type === 'Adószám')) {
    idents.unshift({ id_type: 'Adószám', value: p.tax_id, is_verified: false, checked_by: '' });
  }
  return `
  <div class="prt-cols-2">
    <div>
      <div class="prt-section-title" style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:8px">Azonosítók</div>
      <div class="prt-subtable-toolbar" style="background:var(--bg-light); padding:4px; border:1px solid var(--border); border-bottom:none; border-radius:8px 8px 0 0;">
        <button class="prt-toolbar-btn" id="ident-add-btn">➕</button>
        <button class="prt-toolbar-btn danger" id="ident-del-btn">🗑️</button>
        <button class="prt-toolbar-btn" id="ident-verify-btn" style="color:var(--text-primary);">ABC Ellenőrzés</button>
      </div>
      <div class="prt-subtable-wrap" style="height:250px; border:1px solid var(--border); background:var(--surface); border-radius:0 0 8px 8px;">
        <table class="prt-subtable" id="ident-table">
          <thead><tr><th>Típus</th><th>Érték</th><th>É</th><th>Ellenőrizve</th></tr></thead>
          <tbody>
            ${idents.map(i=>`<tr data-id="${i.id||''}">
              <td><select class="ident-type" style="background:var(--bg-light); min-width:160px;" ${i.id_type==='Adószám' ? 'disabled' : ''}>
                <option value="Adószám" ${i.id_type==='Adószám'?'selected':''}>Adószám</option>
                <option value="CCW + Kód" ${i.id_type==='CCW + Kód'?'selected':''}>CCW + Kód</option>
                <option value="Csoportos adószám" ${i.id_type==='Csoportos adószám'?'selected':''}>Csoportos adószám</option>
                <option value="FELIR azonosító" ${i.id_type==='FELIR azonosító'?'selected':''}>FELIR azonosító</option>
                <option value="NEBIH" ${i.id_type==='NEBIH'?'selected':''}>NEBIH</option>
                <option value="(Reference) Szállítók" ${i.id_type==='(Reference) Szállítók'?'selected':''}>(Reference) Szállítók</option>
                <option value="(Customer) Vevők" ${i.id_type==='(Customer) Vevők'?'selected':''}>(Customer) Vevők</option>
                <option value="Fuvarozók" ${i.id_type==='Fuvarozók'?'selected':''}>Fuvarozók</option>
              </select></td>
              <td><input type="text" class="ident-value" value="${prtEsc(i.value)}" style="background:var(--bg-light);color:var(--text-primary)"></td>
              <td style="text-align:center">
                <span class="ident-status" style="${['Adószám', 'Közösségi adószám'].includes(i.id_type) ? '' : 'display:none'}">${i.is_verified ? '✅' : (i.checked_by ? '❌' : '—')}</span>
                <input type="hidden" class="ident-verified" value="${i.is_verified ? '1' : '0'}">
              </td>
              <td><input type="text" class="ident-checked-by" value="${prtEsc(i.checked_by)}" style="width:120px; background:var(--bg-light); ${['Adószám', 'Közösségi adószám'].includes(i.id_type) ? '' : 'display:none'}" readonly></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div>
      <div class="prt-section-title" style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:8px">Jellemzők</div>
      <div class="prt-subtable-wrap" style="height:285px; border:1px solid var(--border); background:var(--surface); border-radius:8px;">
        <table class="prt-subtable" id="char-table">
          <thead><tr><th>Jellemző</th><th>Érték</th><th><button class="prt-toolbar-btn" id="char-add-btn" style="padding:2px 6px;">➕</button> <button class="prt-toolbar-btn danger" id="char-del-btn" style="padding:2px 6px;">🗑️</button></th></tr></thead>
          <tbody>
            ${chars.map(c=>`<tr data-id="${c.id||''}">
              <td><input type="text" class="char-name" value="${c.characteristic||''}" style="background:var(--bg-light);"></td>
              <td><input type="text" class="char-value" value="${c.value||''}" style="background:var(--bg-light);"></td>
              <td></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- Egyéb adatok section -->
  <div class="prt-section" style="margin-top:14px; background:var(--bg-light); padding:10px; border-radius:8px; border:1px solid var(--border);">
    <div class="prt-section-title" style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text-primary);">Egyéb adatok</div>
    <div class="prt-row-3" style="margin-bottom:10px;">
      <div class="prt-field" style="display:flex;align-items:center;gap:8px;"><label style="width:100px;">Deviza:</label><select id="prt-f-currency" style="flex:1; background:var(--surface);"><option value="EUR" ${p.currency==='EUR'?'selected':''}>EUR</option><option value="HUF" ${p.currency==='HUF'?'selected':''}>HUF</option><option value="USD" ${p.currency==='USD'?'selected':''}>USD</option></select></div>
      <div class="prt-field" style="display:flex;align-items:center;gap:8px;"><label style="width:100px;">Árforma:</label><select id="prt-f-price-type" style="flex:1; background:var(--surface);"><option ${p.price_type==='Listaár'?'selected':''}>Listaár</option><option ${p.price_type==='Akció'?'selected':''}>Akció</option></select></div>
      <div class="prt-field" style="display:flex;align-items:center;gap:8px;"><label style="width:100px;">Fizetési mód:</label><select id="prt-f-payment" style="flex:1; background:var(--surface);"><option ${p.payment_method==='Átutalás (30 nap)'?'selected':''}>Átutalás (30 nap)</option><option ${p.payment_method==='Átutalás (60 nap)'?'selected':''}>Átutalás (60 nap)</option><option ${p.payment_method==='Készpénz'?'selected':''}>Készpénz</option></select></div>
    </div>
    <div class="prt-row-3" style="margin-bottom:10px;">
      <div class="prt-field" style="display:flex;align-items:center;gap:8px;">
        <label style="width:140px;">Rendelkezik adószámmal:</label>
        <label class="prt-check-row" style="margin:0"><input type="checkbox" id="prt-f-has-huni-tax" ${p.has_domestic_tax_num?'checked':''}> Honi</label>
        <label class="prt-check-row" style="margin:0"><input type="checkbox" id="prt-f-has-eu-tax" ${p.has_eu_tax_num?'checked':''}> EU</label>
        <label class="prt-check-row" style="margin:0"><input type="checkbox" id="prt-f-has-other-tax" ${p.has_other_tax_num?'checked':''}> Egyéb</label>
      </div>
      <div class="prt-field" style="display:flex;align-items:center;gap:8px;"><label style="width:130px;">Termékdíj ügyletkód:</label><input type="text" id="prt-f-product-tax-code" value="${p.product_tax_code||''}" style="flex:1; background:var(--surface);"></div>
      <div class="prt-field" style="display:flex;align-items:center;gap:8px;"><label style="width:110px;">Termékazonosító:</label><input type="text" id="prt-f-product-id-type" value="${p.product_id_type||''}" style="flex:1; background:var(--surface);"></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:10px;font-size:12px;">
      <label class="prt-check-row"><input type="checkbox" id="prt-f-claims-acc" ${p.claims_as_current_account?'checked':''}><span>Követelések kezelése folyószámla jelleggel</span></label>
      <label class="prt-check-row"><input type="checkbox" id="prt-f-inv-comp" ${p.invoice_compensation_allowed?'checked':''}><span>Számlakompenzáció engedélyezve</span></label>
      <label class="prt-check-row"><input type="checkbox" id="prt-f-cash-flow" ${p.cash_flow_accounting?'checked':''}><span>Pénzforgalmi elszámolású</span></label>
      <label class="prt-check-row"><input type="checkbox" id="prt-f-late-fee" ${p.late_fee_applicable?'checked':''}><span>Késedelmi költségátalány felszámítás</span></label>
      <label class="prt-check-row"><input type="checkbox" id="prt-f-kata" ${p.is_kata_taxpayer?'checked':''}><span>KATA adózó</span></label>
    </div>
    
    <div class="prt-cols-2" style="margin-bottom:10px;">
      <div class="prt-section" style="background:var(--surface); border:1px solid var(--border); padding:8px; margin-bottom:0;">
        <div style="font-weight:600;margin-bottom:6px;font-size:12px;">E-számla befogadás</div>
        <div style="display:flex;gap:10px;">
          <div class="prt-field" style="flex:1;display:flex;align-items:center;gap:5px;margin-bottom:0;"><label>Kezdete:</label><input type="date" id="prt-f-einv-rec-start" value="${p.einvoice_receive_start?p.einvoice_receive_start.split('T')[0]:''}" style="flex:1; background:var(--bg-light);"></div>
          <div class="prt-field" style="flex:1;display:flex;align-items:center;gap:5px;margin-bottom:0;"><label>Vége:</label><input type="date" id="prt-f-einv-rec-end" value="${p.einvoice_receive_end?p.einvoice_receive_end.split('T')[0]:''}" style="flex:1; background:var(--bg-light);"></div>
        </div>
      </div>
      <div class="prt-section" style="background:var(--surface); border:1px solid var(--border); padding:8px; margin-bottom:0;">
        <div style="font-weight:600;margin-bottom:6px;font-size:12px;">E-számla küldés</div>
        <div style="display:flex;gap:10px;">
          <div class="prt-field" style="flex:1;display:flex;align-items:center;gap:5px;margin-bottom:0;"><label>Kezdete:</label><input type="date" id="prt-f-einv-send-start" value="${p.einvoice_send_start?p.einvoice_send_start.split('T')[0]:''}" style="flex:1; background:var(--bg-light);"></div>
          <div class="prt-field" style="flex:1;display:flex;align-items:center;gap:5px;margin-bottom:0;"><label>Vége:</label><input type="date" id="prt-f-einv-send-end" value="${p.einvoice_send_end?p.einvoice_send_end.split('T')[0]:''}" style="flex:1; background:var(--bg-light);"></div>
        </div>
      </div>
    </div>
    
    <div style="display:flex;gap:20px;align-items:center;">
      <div class="prt-field" style="display:flex;align-items:center;gap:8px;flex:1;margin-bottom:0;"><label style="width:140px;margin-bottom:0;">EDI/e-számla szolgáltató:</label><select id="prt-f-edi-prov" style="flex:1; background:var(--surface);"><option value="">Nincs</option><option value="Szolgáltató 1" ${p.edi_provider==='Szolgáltató 1'?'selected':''}>Szolgáltató 1</option><option value="Szolgáltató 2" ${p.edi_provider==='Szolgáltató 2'?'selected':''}>Szolgáltató 2</option></select></div>
      <div class="prt-field" style="display:flex;align-items:center;gap:15px;flex:2;margin-bottom:0;">
        <label style="margin-bottom:0;">Alapértelmezett bizonylat nyomtatási mód:</label>
        <label style="display:flex;align-items:center;gap:4px;margin-bottom:0;"><input type="radio" name="prt_print_mode" value="system" ${(!p.default_print_mode || p.default_print_mode==='system')?'checked':''}> Rendszerbeállítás</label>
        <label style="display:flex;align-items:center;gap:4px;margin-bottom:0;"><input type="radio" name="prt_print_mode" value="local" ${p.default_print_mode==='local'?'checked':''}> Helyi nyomtató</label>
        <label style="display:flex;align-items:center;gap:4px;margin-bottom:0;"><input type="radio" name="prt_print_mode" value="remote" ${p.default_print_mode==='remote'?'checked':''}> Távnyomtatás</label>
      </div>
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
  // Dirty-tracking: has anything changed?
  let isDirty = false;
  overlay.addEventListener('input', () => { isDirty = true; }, true);
  overlay.addEventListener('change', () => { isDirty = true; }, true);

  // Dragging logic
  const modal = overlay.querySelector('.prt-modal');
  const titlebar = overlay.querySelector('.prt-modal-titlebar');
  let isDragging = false, startX, startY, initialLeft, initialTop;

  titlebar.addEventListener('mousedown', (e) => {
    if (modal.classList.contains('maximized') || modal.classList.contains('minimized')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = modal.getBoundingClientRect();
    // Convert from transform-based center to absolute left/top for dragging
    modal.style.transform = 'none';
    modal.style.left = rect.left + 'px';
    modal.style.top = rect.top + 'px';
    initialLeft = rect.left;
    initialTop = rect.top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging || modal.classList.contains('maximized') || modal.classList.contains('minimized')) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    modal.style.left = (initialLeft + dx) + 'px';
    modal.style.top = (initialTop + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Minimize / Maximize handlers
  const minBtn = overlay.querySelector('#prt-minimize-btn');
  const maxBtn = overlay.querySelector('#prt-maximize-btn');

  minBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    // Use current name from input; fall back to loaded partner name; then 'Új'
    const partnerName = overlay.querySelector('#prt-f-name')?.value?.trim()
                        || prtState.currentData?.partner?.name?.trim()
                        || '';
    const shortName = partnerName
      ? (partnerName.length > 18 ? partnerName.substring(0, 15) + '...' : partnerName)
      : (id ? '#' + id : 'Új');
    
    overlay.style.display = 'none';
    
    if (!overlay.dataset.taskId) {
      overlay.dataset.taskId = 'prt-modal-' + Date.now() + Math.floor(Math.random() * 1000);
    }
    
    let taskItem = document.querySelector(`.taskbar-item[data-prt-modal="${overlay.dataset.taskId}"]`);
    if (!taskItem) {
      taskItem = document.createElement('div');
      taskItem.className = 'taskbar-item';
      taskItem.setAttribute('data-prt-modal', overlay.dataset.taskId);
      taskItem.style.cssText = 'background:#111;color:#bbb;padding:6px 14px;border-radius:4px;cursor:pointer;margin-right:5px;font-weight:600;font-size:13px;display:flex;align-items:center;gap:6px;';
      taskItem.innerHTML = '<span>👤</span><span class="task-label">Partner: ' + shortName + '</span>';
      
      taskItem.onclick = (e) => {
        e.stopPropagation();
        overlay.style.display = 'block';
        taskItem.remove();
        const mdiTaskbar = document.querySelector('.mdi-taskbar');
        if (mdiTaskbar) {
          const visibleItems = Array.from(mdiTaskbar.children).some(item => item.style.display !== 'none');
          mdiTaskbar.style.display = visibleItems ? 'flex' : 'none';
          mdiTaskbar.style.visibility = visibleItems ? 'visible' : 'hidden';
        }
      };
      
      const mdiTaskbar = document.querySelector('.mdi-taskbar');
      if (mdiTaskbar) {
        mdiTaskbar.appendChild(taskItem);
        mdiTaskbar.style.display = 'flex';
        mdiTaskbar.style.visibility = 'visible';
      }
    } else {
      const lbl = taskItem.querySelector('.task-label');
      if (lbl) lbl.textContent = 'Partner: ' + shortName;
      taskItem.style.display = 'flex';
    }
  });

  maxBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    modal.classList.toggle('maximized');
  });

  // Fő tab váltás
  overlay.querySelectorAll('.prt-tab-main').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.prt-tab-main').forEach(t => t.classList.remove('active'));
      overlay.querySelectorAll('.prt-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      overlay.querySelector(`.prt-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });

  // Természetes személy checkbox – Adóazonosító jel mező megjelenítése/elrejtése
  const naturalCb = overlay.querySelector('#prt-f-natural');
  const updateTaxIdField = () => {
    const isNatural = naturalCb?.checked;
    const taxIdWrap = overlay.querySelector('#prt-f-tax-id')?.closest('.prt-field');
    if (taxIdWrap) {
      taxIdWrap.style.opacity = isNatural ? '1' : '0.4';
      taxIdWrap.style.pointerEvents = isNatural ? '' : 'none';
      const taxInput = overlay.querySelector('#prt-f-tax-id');
      if (taxInput) taxInput.disabled = !isNatural;
    }
  };
  naturalCb?.addEventListener('change', updateTaxIdField);
  updateTaxIdField(); // Kezdeti állapot beállítása

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
  // ── Custom Sites Table Handler ──
  let selectedSiteIndex = null;
  
  const sitesTable = overlay.querySelector('#sites-table');
  if (sitesTable) {
    sitesTable.addEventListener('click', (e) => {
      const tr = e.target.closest('tbody tr');
      if (!tr) return;
      
      const idx = parseInt(tr.dataset.index);
      if (isNaN(idx)) return;
      
      if (selectedSiteIndex !== null && selectedSiteIndex !== idx) {
        prtSaveActiveSiteToMemory(overlay, selectedSiteIndex);
      }
      
      selectedSiteIndex = idx;
      
      // Highlight row
      sitesTable.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected', 'selected-row');
      tr.style.background = 'rgba(99,102,241,0.15)';
      
      prtLoadActiveSiteDetails(overlay, idx);
    });

    // Handle updates to Name input and Deleted checkbox inside the table row
    sitesTable.addEventListener('input', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const idx = parseInt(tr.dataset.index);
      const site = prtState.currentData.sites[idx];
      if (!site) return;
      if (e.target.classList.contains('site-name')) {
        site.name = e.target.value;
      }
    });

    sitesTable.addEventListener('change', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const idx = parseInt(tr.dataset.index);
      const site = prtState.currentData.sites[idx];
      if (!site) return;
      if (e.target.classList.contains('site-deleted')) {
        site.is_deleted = e.target.checked;
        tr.style.opacity = e.target.checked ? '0.5' : '1';
      }
    });
  }

  const siteAddBtn = overlay.querySelector('#site-add-btn');
  const siteDelBtn = overlay.querySelector('#site-del-btn');

  if (siteAddBtn && sitesTable) {
    siteAddBtn.addEventListener('click', () => {
      if (!prtState.currentData.sites) prtState.currentData.sites = [];
      const newSite = {
        name: 'Új Telephely',
        is_deleted: false,
        is_same_as_hq: false,
        is_billing_address: false,
        is_invoice_mailing_address: false,
        mailing_address_source: 'same',
        communications: [],
        contacts: []
      };
      prtState.currentData.sites.push(newSite);
      
      prtRenderSitesTable(overlay);
      
      const lastIndex = prtState.currentData.sites.length - 1;
      selectedSiteIndex = lastIndex;
      prtHighlightSiteRow(overlay, lastIndex);
      prtLoadActiveSiteDetails(overlay, lastIndex);
    });
  }

  if (siteDelBtn && sitesTable) {
    siteDelBtn.addEventListener('click', () => {
      if (selectedSiteIndex !== null && prtState.currentData.sites[selectedSiteIndex]) {
        const site = prtState.currentData.sites[selectedSiteIndex];
        if (site.id) {
          site.is_deleted = true;
        } else {
          prtState.currentData.sites.splice(selectedSiteIndex, 1);
        }
        selectedSiteIndex = null;
        prtRenderSitesTable(overlay);
        
        // Clear detail panels
        overlay.querySelector('#site-address-area').innerHTML = `
          <div style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
            Válassz ki egy telephelyet a listából a címadatok szerkesztéséhez.
          </div>`;
        overlay.querySelector('#site-comm-area').innerHTML = `
          <div style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
            Válassz ki egy telephelyet a listából.
          </div>`;
        overlay.querySelector('#site-cont-area').innerHTML = `
          <div style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
            Válassz ki egy telephelyet a listából.
          </div>`;
        overlay.querySelector('#site-other-area').innerHTML = `
          <div style="color:var(--text-muted);padding:20px;text-align:center;font-size:13px">
            Válassz ki egy telephelyet a listából.
          </div>`;
      } else {
        alert('Válassz ki egy telephelyet a listából a törléshez!');
      }
    });
  }

  // To allow saving of currently active site details to memory before save click
  overlay.querySelector('#prt-save-btn')?.addEventListener('mousedown', () => {
    if (selectedSiteIndex !== null) {
      prtSaveActiveSiteToMemory(overlay, selectedSiteIndex);
    }
  });
  bindSubtable('ident-add-btn','ident-del-btn','ident-table', () =>
    `<td><select class="ident-type" style="min-width:160px"><option value="Adószám">Adószám</option><option value="CCW + Kód">CCW + Kód</option><option value="Csoportos adószám">Csoportos adószám</option><option value="FELIR azonosító">FELIR azonosító</option><option value="NEBIH">NEBIH</option><option value="(Reference) Szállítók">(Reference) Szállítók</option><option value="(Customer) Vevők">(Customer) Vevők</option><option value="Fuvarozók">Fuvarozók</option></select></td><td><input type="text" class="ident-value"></td><td style="text-align:center"><span class="ident-status" style="display:none">—</span><input type="hidden" class="ident-verified" value="0"></td><td><input type="text" class="ident-checked-by" style="width:120px;display:none" readonly></td>`);

  const identTable = overlay.querySelector('#ident-table');

  // ── Identifiers Uniqueness Logic ──
  if (identTable) {
    const uniqueTypes = ['Adószám', 'Csoportos adószám', 'FELIR azonosító', 'NEBIH'];
    
    const enforceUniqueness = () => {
      const selects = Array.from(identTable.querySelectorAll('.ident-type'));
      const usedTypes = [];
      
      selects.forEach(select => {
        let currentVal = select.value;
        if (uniqueTypes.includes(currentVal) && usedTypes.includes(currentVal)) {
          const firstAvailable = Array.from(select.options).find(o => !uniqueTypes.includes(o.value) || !usedTypes.includes(o.value));
          if (firstAvailable) {
            select.value = firstAvailable.value;
            currentVal = firstAvailable.value;
          }
        }
        if (uniqueTypes.includes(currentVal)) {
          usedTypes.push(currentVal);
        }
      });
      
      selects.forEach(select => {
        const currentVal = select.value;
        Array.from(select.options).forEach(opt => {
          if (uniqueTypes.includes(opt.value)) {
            opt.disabled = (usedTypes.includes(opt.value) && opt.value !== currentVal);
          }
        });
      });
    };

    identTable.addEventListener('change', (e) => {
      if (e.target.classList.contains('ident-type')) {
        const val = e.target.value;
        const row = e.target.closest('tr');
        const statusSpan = row.querySelector('.ident-status');
        const checkedByInput = row.querySelector('.ident-checked-by');
        
        if (['Adószám', 'Közösségi adószám'].includes(val)) {
          if (statusSpan) statusSpan.style.display = 'inline';
          if (checkedByInput) checkedByInput.style.display = 'inline-block';
        } else {
          if (statusSpan) statusSpan.style.display = 'none';
          if (checkedByInput) checkedByInput.style.display = 'none';
        }

        if (uniqueTypes.includes(val)) {
          const selects = Array.from(identTable.querySelectorAll('.ident-type'));
          const duplicates = selects.filter(s => s !== e.target && s.value === val);
          if (duplicates.length > 0) {
            alert('Már létezik "' + val + '" típusú azonosító! Ebből a típusból csak egy adható meg.');
            const firstAvailable = Array.from(e.target.options).find(o => !o.disabled && o.value !== val);
            if (firstAvailable) {
              e.target.value = firstAvailable.value;
              e.target.dispatchEvent(new Event('change', { bubbles: true })); // trigger again to fix display
            }
          }
        }
        enforceUniqueness();
      }
    });

    // Run initially and after adding a row
    enforceUniqueness();
    overlay.querySelector('#ident-add-btn')?.addEventListener('click', () => {
      setTimeout(enforceUniqueness, 50);
    });
  }
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

  // ── VIES Ellenőrzés ──
  const verifyBtn = overlay.querySelector('#ident-verify-btn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      const selectedRow = overlay.querySelector('#ident-table tbody tr.selected');
      if (!selectedRow) return alert('Válassz ki egy azonosítót az ellenőrzéshez (kattints a sorra)!');
      const typeSelect = selectedRow.querySelector('.ident-type');
      if (!typeSelect || (typeSelect.value !== 'Közösségi adószám' && typeSelect.value !== 'Adószám')) {
        return alert('Csak Közösségi adószám vagy Adószám típusú azonosítót lehet ellenőrizni!');
      }
      const valInput = selectedRow.querySelector('.ident-value');
      const vatNumber = valInput?.value?.trim();
      if (!vatNumber) return alert('Az érték mező üres!');
      
      try {
        verifyBtn.textContent = '⏳ Ellenőrzés...';
        verifyBtn.disabled = true;
        const res = await fetch('/api/v1/partners/verify-vat/' + vatNumber);
        const data = await res.json();
        const dt = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const checkedBy = `${dt.getFullYear()}.${pad(dt.getMonth()+1)}.${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        const checkedByInput = selectedRow.querySelector('.ident-checked-by');
        if (checkedByInput) checkedByInput.value = checkedBy;
        if (res.ok && data.isValid) {
          selectedRow.querySelector('.ident-verified').value = '1';
          const statusSpan = selectedRow.querySelector('.ident-status');

          if (statusSpan) statusSpan.textContent = '✅';
          
          if (data.name) {
            const invoiceNameInput = overlay.querySelector('#prt-f-invoice-name');
            if (invoiceNameInput) {
              invoiceNameInput.value = data.name;
              invoiceNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // Ha a fő Név mező üres, töltsük ki azt is!
            const nameInput = overlay.querySelector('#prt-f-name');
            if (nameInput && !nameInput.value.trim()) {
              nameInput.value = data.name;
              nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Also update the state directly just in case
            if (prtState && prtState.currentData) {
              prtState.currentData.invoice_name = data.name;
              if (!prtState.currentData.name) prtState.currentData.name = data.name;
            }
          }
          alert('Az adószám érvényes!\nNév: ' + (data.name || 'ismeretlen') + '\nCím: ' + (data.address || 'ismeretlen'));
        } else {
          selectedRow.querySelector('.ident-verified').value = '0';
          const statusSpan = selectedRow.querySelector('.ident-status');
          if (statusSpan) statusSpan.textContent = '❌';
          alert('Az adószám érvénytelen vagy nem ellenőrizhető.\nOka: ' + (data.userError || data.error || 'Nincs adat.'));
        }
      } catch (err) {
        alert('Hiba az ellenőrzés során: ' + err.message);
      } finally {
        verifyBtn.textContent = 'ABC Ellenőrzés';
        verifyBtn.disabled = false;
      }
    });
  }

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
  function tryClose() {
    if (isDirty) {
      const ok = confirm('Vannak nem mentett módosítások. Biztosan bezárod mentés nélkül?');
      if (!ok) return;
    }
    prtCloseModal(overlay);
  }
  overlay.querySelector('#prt-close-btn')?.addEventListener('click', tryClose);
  overlay.querySelector('#prt-cancel-btn')?.addEventListener('click', tryClose);
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) tryClose();
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
      else if (type === 'boolstr') row[key] = el.value === '1';
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
      nat_prev_family_name_prefix: v('prt-f-nat-prev-fam-pref'),
      nat_prev_family_name: v('prt-f-nat-prev-fam'),
      nat_prev_first_name: v('prt-f-nat-prev-first'),
      birth_family_name: v('prt-f-birth-fam'),
      birth_first_name: v('prt-f-birth-first'),
      birth_display_name: v('prt-f-birth-display'),
      birth_place: v('prt-f-birth-place'),
      birth_date: v('prt-f-birth-date'),
      gender: v('prt-f-gender'),
      mothers_family_name: v('prt-f-mother-fam'),
      mothers_first_name: v('prt-f-mother-first'),
      mothers_display_name: v('prt-f-mother-display'),
      tax_id: v('prt-f-tax-id'),
      taj: v('prt-f-taj'),
      farmer_reg_number: v('prt-f-farmer-reg'),
      farmer_cert_number: v('prt-f-farmer-cert'),
      farmer_activity_id: v('prt-f-farmer-act'),
      family_farm_id: v('prt-f-family-farm'),
      has_compensation_surcharge: cb('prt-f-comp-surcharge'),
      citizenship: v('prt-f-citizenship'),
      currency: v('prt-f-currency'),
      price_type: v('prt-f-price-type'),
      payment_method: v('prt-f-payment'),
      has_domestic_tax_num: cb('prt-f-has-huni-tax'),
      has_eu_tax_num: cb('prt-f-has-eu-tax'),
      has_other_tax_num: cb('prt-f-has-other-tax'),
      product_tax_code: v('prt-f-product-tax-code'),
      product_id_type: v('prt-f-product-id-type'),
      claims_as_current_account: cb('prt-f-claims-acc'),
      invoice_compensation_allowed: cb('prt-f-inv-comp'),
      cash_flow_accounting: cb('prt-f-cash-flow'),
      late_fee_applicable: cb('prt-f-late-fee'),
      is_kata_taxpayer: cb('prt-f-kata'),
      einvoice_receive_start: v('prt-f-einv-rec-start'),
      einvoice_receive_end: v('prt-f-einv-rec-end'),
      einvoice_send_start: v('prt-f-einv-send-start'),
      einvoice_send_end: v('prt-f-einv-send-end'),
      edi_provider: v('prt-f-edi-prov'),
      notes: overlay.querySelector('#prt-f-notes')?.value || null,
      default_print_mode: overlay.querySelector('input[name="prt_print_mode"]:checked')?.value || 'system',
    },
    communications: [], // Will be populated below
    contacts: [], // Will be populated below
    agents: prtCollectTableRows(overlay, 'szh-agent-table', [
      ['szh-agent-from','valid_from','str'],
      ['szh-agent-to','valid_to','str'],
      ['szh-agent-name','agent_name','str'],
    ]),
    sites: [], // Will be populated below
    identifiers: prtCollectTableRows(overlay, 'ident-table', [
      ['ident-type','id_type','str'],
      ['ident-value','value','str'],
      ['ident-checked-by','checked_by','str'],
      ['ident-verified','is_verified','boolstr'],
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

  // Collect HQ communications and contacts
  data.communications = prtCollectTableRows(overlay, 'szh-comm-table', [
    ['szh-comm-type','channel_type','str'],
    ['szh-comm-value','value','str'],
  ]);

  data.contacts = prtCollectTableRows(overlay, 'szh-cont-table', [
    ['szh-cont-name','name','str'],
    ['szh-cont-title','title','str'],
  ]);

  // Collect sites and enrich communications/contacts with tempId/siteId mappings
  const rawSites = prtState.currentData?.sites || [];
  data.sites = rawSites.map((s, idx) => {
    const tr = overlay.querySelector(`#sites-table tbody tr[data-index="${idx}"]`);
    const nameVal = tr ? tr.querySelector('.site-name')?.value : s.name;
    const delVal = tr ? tr.querySelector('.site-deleted')?.checked : s.is_deleted;
    
    const enrichedSite = {
      ...s,
      name: nameVal || s.name,
      is_deleted: delVal !== undefined ? delVal : s.is_deleted,
      _tempId: s.id ? null : idx + 1
    };

    // Push site communications
    if (s.communications) {
      s.communications.forEach(c => {
        data.communications.push({
          ...c,
          site_id: s.id || null,
          site_temp_id: s.id ? null : enrichedSite._tempId
        });
      });
    }

    // Push site contacts
    if (s.contacts) {
      s.contacts.forEach(c => {
        data.contacts.push({
          ...c,
          site_id: s.id || null,
          site_temp_id: s.id ? null : enrichedSite._tempId
        });
      });
    }

    return enrichedSite;
  });
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

// ─── Telephely részletes mentés / betöltés segédfüggvények ──────────────────

function prtBuildSiteAddressForm(s) {
  return `
  <div class="prt-cols-2" style="margin-bottom:14px">
    <!-- Bal: Cím -->
    <div class="prt-section">
      <div class="prt-section-title">🏠 Cím</div>
      <div class="prt-check-row"><input type="checkbox" class="site-f-same-hq" ${s.is_same_as_hq?'checked':''}><label>Azonos a székhely címmel</label></div>
      <div class="prt-check-row"><input type="checkbox" class="site-f-billing" ${s.is_billing_address?'checked':''}><label>Számlázási cím</label></div>
      <div class="prt-check-row"><input type="checkbox" class="site-f-invoice-mailing" ${s.is_invoice_mailing_address?'checked':''}><label>Számla postázási cím</label></div>
      
      <div class="site-address-fields" ${s.is_same_as_hq?'style="opacity:0.4;pointer-events:none"':''}>
        <div class="prt-field"><label>Név a bizonylaton</label><input type="text" class="site-f-invoice-name" value="${s.document_name||''}"></div>
        <div class="prt-field"><label>Ország</label><input type="text" class="site-f-country" value="${s.country||''}"></div>
        <div class="prt-row-3">
          <div class="prt-field"><label>Irsz.</label><input type="text" class="site-f-zip" value="${s.zip||''}"></div>
          <div class="prt-field"><label>Helység</label><input type="text" class="site-f-city" value="${s.city||''}"></div>
          <div class="prt-field"><label>Kerület</label><input type="text" class="site-f-district" value="${s.district||''}"></div>
        </div>
        <div class="prt-field"><label>Közterület neve</label><input type="text" class="site-f-street-name" value="${s.street_name||''}"></div>
        <div class="prt-row-3">
          <div class="prt-field"><label>Jellege</label><input type="text" class="site-f-street-type" value="${s.street_type||''}"></div>
          <div class="prt-field"><label>Száma</label><input type="text" class="site-f-street-number" value="${s.street_number||''}"></div>
          <div class="prt-field"><label>Épület</label><input type="text" class="site-f-building" value="${s.building||''}"></div>
        </div>
        <div class="prt-row-3">
          <div class="prt-field"><label>Lépcsőház</label><input type="text" class="site-f-staircase" value="${s.staircase||''}"></div>
          <div class="prt-field"><label>Emelet</label><input type="text" class="site-f-floor" value="${s.floor||''}"></div>
          <div class="prt-field"><label>Ajtó</label><input type="text" class="site-f-door" value="${s.door||''}"></div>
        </div>
      </div>
    </div>
    <!-- Jobb: Levelezési cím -->
    <div class="prt-section">
      <div class="prt-section-title">✉️ Levelezési cím</div>
      <div class="prt-check-row"><input type="checkbox" class="site-f-mailing-same" ${s.mailing_address_source==='same' || !s.mailing_country?'checked':''}><label>Azonos a címmel</label></div>
      <div class="site-mailing-fields" ${(s.mailing_address_source==='same' || !s.mailing_country)?'style="opacity:0.4;pointer-events:none"':''}>
        <div class="prt-field"><label>Név a bizonylaton</label><input type="text" class="site-f-mailing-inv-name" value="${s.mailing_document_name||''}"></div>
        <div class="prt-field"><label>Ország</label><input type="text" class="site-f-mailing-country" value="${s.mailing_country||''}"></div>
        <div class="prt-row-2">
          <div class="prt-field"><label>Irsz.</label><input type="text" class="site-f-mailing-zip" value="${s.mailing_zip||''}"></div>
          <div class="prt-field"><label>Helység</label><input type="text" class="site-f-mailing-city" value="${s.mailing_city||''}"></div>
        </div>
        <div class="prt-field"><label>Közterület neve</label><input type="text" class="site-f-mailing-street-name" value="${s.mailing_street_name||''}"></div>
        <div class="prt-row-2">
          <div class="prt-field"><label>Jellege</label><input type="text" class="site-f-mailing-street-type" value="${s.mailing_street_type||''}"></div>
          <div class="prt-field"><label>Száma</label><input type="text" class="site-f-mailing-street-number" value="${s.mailing_street_number||''}"></div>
        </div>
        <div class="prt-field"><label>GLN</label><input type="text" class="site-f-mailing-gln" value="${s.mailing_gln||''}"></div>
      </div>
    </div>
  </div>`;
}

function prtBuildSiteCommPanel(comms) {
  return `
  <div class="prt-subtable-toolbar">
    <button class="prt-toolbar-btn" id="site-comm-add-btn">➕ Hozzáadás</button>
    <button class="prt-toolbar-btn danger" id="site-comm-del-btn">🗑️ Törlés</button>
  </div>
  <div class="prt-subtable-wrap">
    <table class="prt-subtable" id="site-comm-table">
      <thead><tr><th>Kommunikációs csatorna</th><th>Érték</th></tr></thead>
      <tbody>
        ${comms.map(c=>`<tr data-id="${c.id||''}">
          <td><select class="site-comm-type">${['Telefon','Email','Fax','Web','Mobil'].map(o=>`<option ${o===c.channel_type?'selected':''}>${o}</option>`).join('')}</select></td>
          <td><input type="text" class="site-comm-value" value="${c.value||''}"></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function prtBuildSiteContPanel(contacts) {
  return `
  <div class="prt-subtable-toolbar">
    <button class="prt-toolbar-btn" id="site-cont-add-btn">➕ Hozzáadás</button>
    <button class="prt-toolbar-btn danger" id="site-cont-del-btn">🗑️ Törlés</button>
  </div>
  <div class="prt-subtable-wrap">
    <table class="prt-subtable" id="site-cont-table">
      <thead><tr><th>Kapcsolattartó</th><th>Titulus</th></tr></thead>
      <tbody>
        ${contacts.map(c=>`<tr data-id="${c.id||''}">
          <td><input type="text" class="site-cont-name" value="${c.name||''}"></td>
          <td><input type="text" class="site-cont-title" value="${c.title||''}"></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function prtBuildSiteOtherPanel(s) {
  return `
  <div style="padding:10px">
    <div class="prt-row-2">
      <div class="prt-field"><label>Kommunikációs nyelv</label>
        <select class="site-f-comm-lang">
          <option value="Magyar" ${s.comm_lang==='Magyar'?'selected':''}>Magyar</option>
          <option value="Angol" ${s.comm_lang==='Angol'?'selected':''}>Angol</option>
          <option value="Spanyol" ${s.comm_lang==='Spanyol'?'selected':''}>Spanyol</option>
          <option value="Egyéb" ${s.comm_lang==='Egyéb'?'selected':''}>Egyéb</option>
        </select>
      </div>
      <div class="prt-field"><label>Jövedéki engedélyszám</label>
        <input type="text" class="site-f-excise-num" value="${s.excise_num||''}">
      </div>
    </div>
    <div class="prt-row-3">
      <div class="prt-field"><label>GLN</label>
        <input type="text" class="site-f-gln" value="${s.gln||''}">
      </div>
      <div class="prt-field"><label>Szállítási raktár</label>
        <input type="text" class="site-f-del-wh" value="${s.delivery_warehouse||''}">
      </div>
      <div class="prt-field"><label>Alapértelmezett tranzakció</label>
        <input type="text" class="site-f-def-tr" value="${s.default_transaction||''}">
      </div>
    </div>
  </div>`;
}

function prtRenderSitesTable(overlay) {
  const tbody = overlay.querySelector('#sites-table tbody');
  if (!tbody) return;
  const sites = prtState.currentData.sites || [];
  tbody.innerHTML = sites.map((s, index) => {
    let addrStr = [s.zip, s.city, s.street_name, s.street_number].filter(Boolean).join(' ');
    if (s.is_same_as_hq) {
      addrStr = 'Azonos a székhellyel';
    }
    return `
      <tr data-index="${index}" data-id="${s.id||''}" style="${s.is_deleted ? 'opacity:0.5;' : ''}">
        <td><input type="text" class="site-name" value="${prtEsc(s.name)}" style="background:var(--bg-light);"></td>
        <td><input type="text" class="site-address" value="${prtEsc(addrStr)}" readonly style="background:var(--bg-light);"></td>
        <td style="text-align:center"><input type="checkbox" class="site-deleted" ${s.is_deleted?'checked':''}></td>
      </tr>
    `;
  }).join('');
}

function prtHighlightSiteRow(overlay, idx) {
  const table = overlay.querySelector('#sites-table');
  if (table) {
    table.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
    const tr = table.querySelector(`tbody tr[data-index="${idx}"]`);
    if (tr) {
      tr.classList.add('selected', 'selected-row');
      tr.style.background = 'rgba(99,102,241,0.15)';
    }
  }
}

function prtSaveActiveSiteAddressToMemory(addressArea, site) {
  const v = (cls) => addressArea.querySelector('.' + cls)?.value || '';
  
  site.document_name = v('site-f-invoice-name');
  site.country = v('site-f-country');
  site.zip = v('site-f-zip');
  site.city = v('site-f-city');
  site.district = v('site-f-district');
  site.street_name = v('site-f-street-name');
  site.street_type = v('site-f-street-type');
  site.street_number = v('site-f-street-number');
  site.building = v('site-f-building');
  site.staircase = v('site-f-staircase');
  site.floor = v('site-f-floor');
  site.door = v('site-f-door');
  
  site.mailing_document_name = v('site-f-mailing-inv-name');
  site.mailing_country = v('site-f-mailing-country');
  site.mailing_zip = v('site-f-mailing-zip');
  site.mailing_city = v('site-f-mailing-city');
  site.mailing_street_name = v('site-f-mailing-street-name');
  site.mailing_street_type = v('site-f-mailing-street-type');
  site.mailing_street_number = v('site-f-mailing-street-number');
  site.mailing_gln = v('site-f-mailing-gln');
}

function prtSaveActiveSiteToMemory(overlay, idx) {
  const site = prtState.currentData.sites[idx];
  if (!site) return;

  const addressArea = overlay.querySelector('#site-address-area');
  if (addressArea) {
    prtSaveActiveSiteAddressToMemory(addressArea, site);
  }

  const commTable = overlay.querySelector('#site-comm-table');
  if (commTable) {
    site.communications = prtCollectTableRows(overlay, 'site-comm-table', [
      ['site-comm-type','channel_type','str'],
      ['site-comm-value','value','str'],
    ]);
  }

  const contTable = overlay.querySelector('#site-cont-table');
  if (contTable) {
    site.contacts = prtCollectTableRows(overlay, 'site-cont-table', [
      ['site-cont-name','name','str'],
      ['site-cont-title','title','str'],
    ]);
  }

  const otherArea = overlay.querySelector('#site-other-area');
  if (otherArea) {
    const v = (cls) => otherArea.querySelector('.' + cls)?.value || '';
    site.comm_lang = v('site-f-comm-lang');
    site.excise_num = v('site-f-excise-num');
    site.gln = v('site-f-gln');
    site.delivery_warehouse = v('site-f-del-wh');
    site.default_transaction = v('site-f-def-tr');
  }
}

function prtLoadActiveSiteDetails(overlay, idx) {
  const site = prtState.currentData.sites[idx];
  if (!site) return;

  if (!site._enriched) {
    site.communications = prtState.currentData.communications?.filter(c => c.site_id === site.id) || [];
    site.contacts = prtState.currentData.contacts?.filter(c => c.site_id === site.id) || [];
    site._enriched = true;
  }

  const addressArea = overlay.querySelector('#site-address-area');
  if (addressArea) {
    addressArea.innerHTML = prtBuildSiteAddressForm(site);
    
    const inputs = addressArea.querySelectorAll('input[type="text"]');
    inputs.forEach(inp => {
      inp.addEventListener('input', (e) => {
        prtSaveActiveSiteAddressToMemory(addressArea, site);
        const summaryInput = overlay.querySelector(`#sites-table tbody tr[data-index="${idx}"] .site-address`);
        if (summaryInput) {
          let addrStr = [site.zip, site.city, site.street_name, site.street_number].filter(Boolean).join(' ');
          if (site.is_same_as_hq) addrStr = 'Azonos a székhellyel';
          summaryInput.value = addrStr;
        }
      });
    });

    const sameHq = addressArea.querySelector('.site-f-same-hq');
    sameHq?.addEventListener('change', (e) => {
      site.is_same_as_hq = e.target.checked;
      const fieldsDiv = addressArea.querySelector('.site-address-fields');
      if (fieldsDiv) {
        fieldsDiv.style.opacity = e.target.checked ? '0.4' : '1';
        fieldsDiv.style.pointerEvents = e.target.checked ? 'none' : 'auto';
      }
      if (e.target.checked) {
        site.invoice_name = overlay.querySelector('#prt-f-invoice-name')?.value || '';
        site.country = overlay.querySelector('#prt-f-country')?.value || '';
        site.zip = overlay.querySelector('#prt-f-zip')?.value || '';
        site.city = overlay.querySelector('#prt-f-city')?.value || '';
        site.district = overlay.querySelector('#prt-f-district')?.value || '';
        site.street_name = overlay.querySelector('#prt-f-street-name')?.value || '';
        site.street_type = overlay.querySelector('#prt-f-street-type')?.value || '';
        site.street_number = overlay.querySelector('#prt-f-street-number')?.value || '';
        site.building = overlay.querySelector('#prt-f-building')?.value || '';
        site.staircase = overlay.querySelector('#prt-f-staircase')?.value || '';
        site.floor = overlay.querySelector('#prt-f-floor')?.value || '';
        site.door = overlay.querySelector('#prt-f-door')?.value || '';
        
        prtLoadActiveSiteDetails(overlay, idx);
      }
      
      const summaryInput = overlay.querySelector(`#sites-table tbody tr[data-index="${idx}"] .site-address`);
      if (summaryInput) {
        summaryInput.value = e.target.checked ? 'Azonos a székhellyel' : [site.zip, site.city, site.street_name, site.street_number].filter(Boolean).join(' ');
      }
    });

    const billing = addressArea.querySelector('.site-f-billing');
    billing?.addEventListener('change', (e) => {
      site.is_billing_address = e.target.checked;
    });

    const invMailing = addressArea.querySelector('.site-f-invoice-mailing');
    invMailing?.addEventListener('change', (e) => {
      site.is_invoice_mailing_address = e.target.checked;
    });

    const mailingSame = addressArea.querySelector('.site-f-mailing-same');
    mailingSame?.addEventListener('change', (e) => {
      site.mailing_address_source = e.target.checked ? 'same' : 'other';
      const fieldsDiv = addressArea.querySelector('.site-mailing-fields');
      if (fieldsDiv) {
        fieldsDiv.style.opacity = e.target.checked ? '0.4' : '1';
        fieldsDiv.style.pointerEvents = e.target.checked ? 'none' : 'auto';
      }
    });
  }

  const commArea = overlay.querySelector('#site-comm-area');
  if (commArea) {
    commArea.innerHTML = prtBuildSiteCommPanel(site.communications);
    const addBtn = commArea.querySelector('#site-comm-add-btn');
    const delBtn = commArea.querySelector('#site-comm-del-btn');
    const table = commArea.querySelector('#site-comm-table');
    
    addBtn?.addEventListener('click', () => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><select class="site-comm-type">${['Telefon','Email','Fax','Web','Mobil'].map(o=>`<option>${o}</option>`).join('')}</select></td><td><input type="text" class="site-comm-value"></td>`;
      table.querySelector('tbody').appendChild(tr);
    });

    delBtn?.addEventListener('click', () => {
      const selected = table.querySelector('tr.selected');
      if (selected) selected.remove();
    });

    table?.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr || !tr.parentElement.tagName === 'TBODY') return;
      table.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected', 'selected-row');
      tr.style.background = 'rgba(99,102,241,0.15)';
    });
  }

  const contArea = overlay.querySelector('#site-cont-area');
  if (contArea) {
    contArea.innerHTML = prtBuildSiteContPanel(site.contacts);
    const addBtn = contArea.querySelector('#site-cont-add-btn');
    const delBtn = contArea.querySelector('#site-cont-del-btn');
    const table = contArea.querySelector('#site-cont-table');

    addBtn?.addEventListener('click', () => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="text" class="site-cont-name"></td><td><input type="text" class="site-cont-title"></td>`;
      table.querySelector('tbody').appendChild(tr);
    });

    delBtn?.addEventListener('click', () => {
      const selected = table.querySelector('tr.selected');
      if (selected) selected.remove();
    });

    table?.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr || !tr.parentElement.tagName === 'TBODY') return;
      table.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected', 'selected-row');
      tr.style.background = 'rgba(99,102,241,0.15)';
    });
  }

  const otherArea = overlay.querySelector('#site-other-area');
  if (otherArea) {
    otherArea.innerHTML = prtBuildSiteOtherPanel(site);
  }
}
