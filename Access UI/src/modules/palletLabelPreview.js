// Raklapcímke előnézet (SSCC) – önálló felugró ablak, bárhonnan hívható.
// Az Admin > Raklapcímkék modul címke-előnézetével azonos megjelenés.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v).replace(/-/g, '.') : d.toISOString().split('T')[0].replace(/-/g, '.');
}

function getChildren(label, labels) {
  let list = label.childrenLabels || [];
  if (list.length === 0 && label.pallets_json) {
    try {
      const m = JSON.parse(label.pallets_json);
      if (Array.isArray(m)) list = labels.filter(lb => m.includes(lb.sscc));
    } catch (_) {}
  }
  if (list.length === 0) list = labels.filter(lb => lb.consolidated_sscc === label.sscc);
  return list;
}

function buildBody(label, labels) {
  const isMaster = label.is_consolidated_master === true || label.is_consolidated_master === 1;
  const date = fmtDate(label.delivery_date);
  if (isMaster) {
    const children = getChildren(label, labels);
    const childrenHtml = children.length ? children.map(c => `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-left:4px solid #0284c7; border-radius:4px; padding:6px 10px; margin-bottom:6px; font-size:13px; line-height:1.5;">
        <div>Termék neve: <strong>${esc(c.product_name || '-')}</strong></div>
        <div>Kartonszám: <strong style="color:#0284c7;">${c.picked_cartons != null ? c.picked_cartons + ' #' : '-'}</strong></div>
        <div>Azonosító: <strong style="font-family:monospace;">${esc(c.sscc || '-')}</strong></div>
      </div>`).join('') : '<div style="color:#64748b; font-style:italic; padding:6px;">Nincsenek csatolt raklapok rögzítve.</div>';
    return `
      <div style="display:flex; flex-direction:column; gap:4px; font-size:14px; font-weight:600;">
        <div>Szállítási dátum: <strong>${date}</strong></div>
        <div>Kartonszám: <strong>${label.picked_cartons != null ? label.picked_cartons + ' #' : '-'}</strong></div>
        <div>Bruttó kg: <strong>${label.gross_weight ? Number(label.gross_weight).toFixed(0) + ' kg' : '-'}</strong></div>
      </div>
      <div style="margin-top:14px; border-top:2px solid #000; padding-top:8px;">
        <div style="font-size:15px; font-weight:900; margin-bottom:6px; text-transform:uppercase;">Raklapok</div>
        ${childrenHtml}
      </div>`;
  }
  const avg = (label.picked_cartons && label.net_weight) ? (Number(label.net_weight) / Number(label.picked_cartons)).toFixed(2) + ' kg/db' : '-';
  return `
    <div style="display:flex; flex-direction:column; gap:4px; font-size:13.5px; font-weight:600;">
      <div>Szállítási dátum: <strong>${date}</strong></div>
      <div>Szállítási hely: <strong>${esc(label.destination || 'ALDI')}</strong></div>
      <div>Kartonszám: <strong>${label.picked_cartons != null ? label.picked_cartons + ' #' : '-'}</strong></div>
      <div>Bruttó kg: <strong>${label.gross_weight ? Number(label.gross_weight).toFixed(2) + ' kg' : '-'}</strong></div>
      <div>Nettó kg: <strong>${label.net_weight ? Number(label.net_weight).toFixed(2) + ' kg' : '-'}</strong></div>
      <div>Átlag súly (nettó): <strong>${avg}</strong></div>
      <div>Lotszám: <strong>${esc(label.lot_number || '-')}</strong></div>
      <div>Származási ország: <strong>${esc(label.origin_country || '-')}</strong></div>
    </div>`;
}

function printLabel(label, labels) {
  const w = window.open('', '_blank', 'width=650,height=800');
  if (!w) { alert('A felugró ablak letiltásra került. Engedélyezd a felugró ablakokat a nyomtatáshoz!'); return; }
  const isMaster = label.is_consolidated_master === true || label.is_consolidated_master === 1;
  const sscc = esc(label.sscc || '');
  w.document.write(`<!DOCTYPE html><html><head><title>Raklap címke - ${sscc}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
    <style>
      @page { size: 100mm 210mm; margin: 0; }
      * { box-sizing: border-box; }
      body { margin:0; padding:14px; font-family:Arial,sans-serif; display:flex; justify-content:center; }
      .pallet-label { width:100%; max-width:380px; border:3px solid #000; padding:16px 12px; }
      .t { font-size:34px; font-weight:900; text-align:center; }
      .s { font-size:13px; font-weight:bold; color:#333; text-transform:uppercase; text-align:center; margin-bottom:6px; }
      .d { border-top:3px solid #000; margin:10px 0; }
      .p { font-size:26px; font-weight:800; text-align:center; }
      @media print { body { padding:0; } .pallet-label { border:none; max-width:none; } }
    </style></head><body><div class="pallet-label">
      <div class="t">${esc(label.truck_number || '-')}</div><div class="s">Kamionszám</div><div class="d"></div>
      <div class="p">${esc(label.product_name || (isMaster ? 'Vegyes raklap' : '-'))}</div><div class="s">Termék megnevezése</div><div class="d"></div>
      ${buildBody(label, labels)}
      <div class="d"></div>
      <div style="text-align:center;"><svg id="bc"></svg>
        <div style="font-size:16px; font-family:monospace; font-weight:900;">${sscc}</div>
        <div style="font-size:14px; font-weight:900;">Azonosító</div></div>
    </div>
    <script>window.onload=function(){ if(typeof JsBarcode!=='undefined'){JsBarcode("#bc","${sscc}",{format:"CODE128",displayValue:false,height:70,margin:4});} setTimeout(function(){window.print();},300); };<\/script>
    </body></html>`);
  w.document.close();
}

/**
 * Megnyitja egy raklapcímke előnézetét (sscc_labels.id alapján).
 */
export async function openPalletLabelPreview(labelId) {
  let labels = [];
  try {
    const res = await fetch('/api/v1/admin/pallet-labels');
    const data = await res.json();
    labels = Array.isArray(data) ? data : [];
  } catch (e) {
    alert('Nem sikerült a raklapcímke betöltése.');
    return;
  }
  const label = labels.find(l => Number(l.id) === Number(labelId));
  if (!label) { alert('A raklapcímke nem található.'); return; }

  const isMaster = label.is_consolidated_master === true || label.is_consolidated_master === 1;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.6); z-index:99999; display:flex; align-items:center; justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#fff; border-radius:8px; max-width:480px; width:90%; padding:20px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.2); display:flex; flex-direction:column; gap:14px; max-height:90vh; overflow-y:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0; font-size:16px;">Raklapcímke megtekintése</h3>
        <button class="plp-close" style="background:none; border:none; font-size:18px; cursor:pointer; color:#64748b;">✕</button>
      </div>
      <div style="border:2px solid #000; padding:14px; background:#fff; font-family:Arial,sans-serif;">
        <div style="font-size:26px; font-weight:900; text-align:center;">${esc(label.truck_number || '-')}</div>
        <div style="font-size:11px; font-weight:bold; color:#555; text-transform:uppercase; text-align:center; margin-bottom:6px;">Kamionszám</div>
        <div style="border-top:2px solid #000; margin:8px 0;"></div>
        <div style="font-size:20px; font-weight:800; text-align:center;">${esc(label.product_name || (isMaster ? 'Vegyes raklap' : '-'))}</div>
        <div style="font-size:11px; font-weight:bold; color:#555; text-transform:uppercase; text-align:center; margin-bottom:6px;">Termék megnevezése</div>
        <div style="border-top:2px solid #000; margin:8px 0;"></div>
        ${buildBody(label, labels)}
        <div style="margin-top:18px; border-top:2px solid #000; margin-bottom:8px;"></div>
        <div style="text-align:center;">
          <svg class="plp-barcode" style="max-width:100%; height:auto; display:block; margin:0 auto;"></svg>
          <div style="font-size:14px; font-weight:900; font-family:monospace; margin-top:4px;">${esc(label.sscc || '')}</div>
          <div style="font-size:12px; font-weight:900; color:#555;">Azonosító</div>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end;">
        <button class="plp-print primary-btn" style="display:flex; align-items:center; gap:6px;">📄 Nyomtatás / PDF mentés</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  if (window.JsBarcode && label.sscc) {
    try { window.JsBarcode(overlay.querySelector('.plp-barcode'), label.sscc, { format: 'CODE128', displayValue: false, height: 55, margin: 2 }); } catch (e) { console.warn(e); }
  }
  const close = () => overlay.remove();
  overlay.querySelector('.plp-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('.plp-print').addEventListener('click', () => printLabel(label, labels));
}
