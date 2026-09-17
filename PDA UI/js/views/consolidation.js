/**
 * consolidation.js – Összeemelés modul
 */
import { showView, apiFetch, appState } from '../app.js';

export async function renderConsolidation(container, params = {}) {
  const user = appState.user;
  const userName = user?.name || 'Felhasználó';
  const escHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };

  let scannedPallets = [];
  let consolidatedLabel = null;

  container.innerHTML = `
    <!-- 1. ÖSSZEEMELÉS PANE -->
    <div class="pda-pane active" id="pane-consolidation" style="display: flex; flex-direction: column; height: 100%; background: #f8fafc;">
      <!-- Fejléc -->
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 13.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">Összeemelés</div>
            <div class="pda-dashboard__role" style="font-size: 7.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; line-height: 1;">FELHASZNÁLÓ</div>
            <div class="pda-dashboard__name" style="font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px; margin-top: 1px; line-height: 1.15;">${escHtml(userName)}</div>
          </div>
        </div>
        <div class="pda-dashboard__header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
          <div class="pda-dashboard__notifications" style="position: relative; color: #6366f1; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; margin-right: 2px;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
            <span style="position: absolute; top: -2px; right: -2px; background: #6366f1; color: white; font-size: 7.5px; font-weight: 800; border-radius: 50%; width: 13px; height: 13px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #f8f9fc;">2</span>
          </div>
        </div>
      </div>

      <div class="pda-form-title" style="padding: 16px; font-size: 16px; color: #0f172a; text-align: center; font-weight: 800;">Több raklap együttes kezelése</div>

      <div class="pda-form-body" style="padding: 8px 12px; background: #fff; flex: 1; overflow-y: auto;">
        <div style="font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 12px; padding-left: 4px;">A raklapon lévő eredeti raklapok</div>
        
        <div id="cons-list" style="min-height: 150px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 16px; padding: 8px; display: flex; flex-direction: column; gap: 6px;">
           <div id="cons-empty" style="color: #94a3b8; font-size: 13px; text-align: center; padding-top: 20px; font-weight: 600;">Még nincs raklap beolvasva</div>
        </div>

        <div style="position: relative; display: flex; align-items: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px;">
            <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
          </svg>
          <input type="text" id="cons-barcode" placeholder="Kérjük, olvasd be a vonalkódot" style="width: 100%; padding: 14px 12px 14px 40px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-weight: 600; background: #fff; color: #0f172a;" autofocus>
        </div>
        <div id="cons-error" style="display: none; color: #dc2626; margin-top: 8px; font-size: 12px; font-weight: 600;"></div>
      </div>

      <!-- Alsó navigáció egyedi "Összeemelés befejezése" gombbal -->
      <div class="pda-bottom-nav" style="display: flex; padding: 12px 16px; background: #fff; border-top: 1px solid #e2e8f0; align-items: center; justify-content: space-between;">
        <div class="pda-bottom-nav__item pda-nav-home-btn" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; color: #64748b;">
          <svg fill="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span style="font-size: 10px; font-weight: 600; margin-top: 2px;">Főoldal</span>
        </div>
        <div class="pda-bottom-nav__item pda-nav-back-btn" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; color: #64748b;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span style="font-size: 10px; font-weight: 600; margin-top: 2px;">Vissza</span>
        </div>
        <button id="btn-cons-finish" style="cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; background: #4f46e5; color: white; border-radius: 8px; padding: 0 16px; height: 44px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
           <span style="font-size: 12px; font-weight: 700; text-align: center;">Összeemelés befejezése</span>
        </button>
      </div>
    </div>

    <!-- 2. NYOMTATÁS PANE -->
    <div class="pda-pane" id="pane-print" style="display: none; flex-direction: column; height: 100%; background: #f8fafc;">
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 13.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">Összeemelés</div>
            <div class="pda-dashboard__role" style="font-size: 7.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; line-height: 1;">FELHASZNÁLÓ</div>
          </div>
        </div>
      </div>

      <div class="pda-form-title" style="padding: 12px 14px 6px; font-size: 17px; color: #0f172a; text-align: center; font-weight: 800;">Raklap címke nyomtatása</div>
      
      <div class="pda-form-body" style="padding: 0 12px 14px; background: #fff; overflow-y: auto;">
        <div id="pallet-label-preview-card" style="border: 2px solid #0f172a; border-radius: 6px; background: #ffffff; padding: 10px 12px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
          <div id="lbl-truck" style="font-size: 19px; font-weight: 900; color: #0f172a; line-height: 1.1;"></div>
          <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Kamionszám</div>
          <div style="border-top: 1.5px solid #0f172a; margin: 5px 0;"></div>
          
          <div id="lbl-product" style="font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.2;"></div>
          <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Termék megnevezése</div>
          <div style="border-top: 1.5px solid #0f172a; margin: 5px 0;"></div>
          
          <div style="display: flex; flex-direction: column; gap: 2px; font-size: 11.5px; color: #1e293b;">
            <div>Érkezés dátuma: <strong id="lbl-date"></strong></div>
            <div>Karton szám: <strong id="lbl-cartons"></strong></div>
            <div>Beszállító: <strong id="lbl-supplier"></strong></div>
            <div>Ügyfél: <strong id="lbl-dest"></strong></div>
            <div>Származási ország: <strong id="lbl-origin"></strong></div>
          </div>
          <div style="border-top: 1.5px solid #0f172a; margin: 5px 0;"></div>

          <div style="text-align: center; padding-top: 2px;">
            <svg id="preview-sscc-svg" style="max-width: 100%; height: auto; display: block; margin: 0 auto;"></svg>
            <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">SSCC</div>
          </div>
        </div>

        <div class="pda-print-box" style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
          <div style="font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 5px;">Címkenyomtató vonalkód (Zebra ZPL)</div>
          <div style="position: relative; display: flex; align-items: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 10px;">
              <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
            </svg>
            <input type="text" id="print-printer-barcode" placeholder="Olvasd be a nyomtatót" style="width: 100%; padding: 8px 8px 8px 34px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; background: #fff; color: #0f172a;">
          </div>
        </div>

        <button class="pda-btn" id="print-btn" style="width: 100%; height: 42px; display: flex; align-items: center; justify-content: center; gap: 8px; background: #0ea5e9; color: #fff; border: none; border-radius: 6px; font-weight: 700;">
          🖨️ Nyomtatás címkenyomtatóra
        </button>
      </div>

      <div class="pda-bottom-nav" style="display: flex; padding: 16px; background: #fff; border-top: 1px solid #e2e8f0; gap: 12px;">
        <div class="pda-bottom-nav__item pda-nav-home-btn" style="cursor: pointer; flex: 1; display: flex; flex-direction: column; align-items: center; color: #64748b;">
          <svg fill="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span style="font-size: 10px; font-weight: 600; margin-top: 4px;">Főoldal</span>
        </div>
      </div>
    </div>
  `;

  const paneConsolidation = container.querySelector('#pane-consolidation');
  const panePrint = container.querySelector('#pane-print');
  
  const barcodeInput = container.querySelector('#cons-barcode');
  const consList = container.querySelector('#cons-list');
  const consEmpty = container.querySelector('#cons-empty');
  const consError = container.querySelector('#cons-error');
  const btnFinish = container.querySelector('#btn-cons-finish');

  const goDashboard = () => showView('dashboard');

  container.querySelectorAll('.pda-nav-home-btn').forEach(btn => btn.addEventListener('click', goDashboard));
  container.querySelectorAll('.pda-nav-back-btn').forEach(btn => btn.addEventListener('click', () => {
    if (panePrint.style.display === 'flex') {
      goDashboard(); // Already printed, just go home
    } else {
      goDashboard();
    }
  }));

  window.addEventListener('hwBack', () => {
    goDashboard();
  });

  function renderList() {
    if (scannedPallets.length === 0) {
      consEmpty.style.display = 'block';
      consList.innerHTML = '';
      consList.appendChild(consEmpty);
      btnFinish.style.opacity = '0.5';
      return;
    }

    btnFinish.style.opacity = '1';

    consEmpty.style.display = 'none';
    consList.innerHTML = '';
    scannedPallets.forEach((pallet, idx) => {
      const item = document.createElement('div');
      item.style.padding = '8px';
      item.style.background = '#ffffff';
      item.style.border = '1px solid #e2e8f0';
      item.style.borderRadius = '6px';
      item.innerHTML = `
        <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${escHtml(pallet.sscc)}</div>
        <div style="font-size: 11px; color: #475569; display: flex; justify-content: space-between; margin-top: 2px;">
          <span>${escHtml(pallet.product_name)}</span>
          <span style="font-weight: 700; color: #0ea5e9;">${pallet.picked_cartons} karton</span>
        </div>
      `;
      consList.appendChild(item);
    });
  }

  barcodeInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.value.trim();
      if (!code) return;

      consError.style.display = 'none';
      barcodeInput.disabled = true;

      // Check if already scanned
      if (scannedPallets.find(p => p.sscc === code)) {
        consError.textContent = 'Ez a raklap már szerepel a listán!';
        consError.style.display = 'block';
        barcodeInput.disabled = false;
        barcodeInput.value = '';
        barcodeInput.focus();
        return;
      }

      try {
        const res = await apiFetch(`/api/v1/pda/pallet-label/${encodeURIComponent(code)}`);
        const data = await res.json();
        
        if (res.ok) {
          scannedPallets.push(data);
          renderList();
        } else {
          consError.textContent = data.error || 'A raklapcímke nem található.';
          consError.style.display = 'block';
        }
      } catch (err) {
        consError.textContent = 'Hálózati hiba történt a lekérdezés során.';
        consError.style.display = 'block';
      } finally {
        barcodeInput.disabled = false;
        barcodeInput.value = '';
        barcodeInput.focus();
      }
    }
  });

  btnFinish.addEventListener('click', async () => {
    if (scannedPallets.length === 0) {
      alert('Nincs beolvasott raklap az összeemeléshez!');
      return;
    }
    
    const originalText = btnFinish.innerHTML;
    btnFinish.innerHTML = '<span style="font-size:12px;">...</span>';
    btnFinish.style.pointerEvents = 'none';

    try {
      const res = await apiFetch('/api/v1/pda/consolidation', {
        method: 'POST',
        body: JSON.stringify({ pallets: scannedPallets.map(p => p.sscc) })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        consolidatedLabel = data.label;
        
        // Show Print Pane
        paneConsolidation.style.display = 'none';
        paneConsolidation.classList.remove('active');
        panePrint.style.display = 'flex';
        panePrint.classList.add('active');

        // Render preview
        container.querySelector('#lbl-truck').textContent = consolidatedLabel.truck_number || '-';
        container.querySelector('#lbl-product').textContent = consolidatedLabel.product_name || '-';
        container.querySelector('#lbl-date').textContent = consolidatedLabel.delivery_date || '-';
        container.querySelector('#lbl-cartons').textContent = consolidatedLabel.picked_cartons || '0';
        container.querySelector('#lbl-supplier').textContent = consolidatedLabel.supplier || '-';
        container.querySelector('#lbl-dest').textContent = consolidatedLabel.destination || '-';
        container.querySelector('#lbl-origin').textContent = consolidatedLabel.origin_country || '-';

        if (window.JsBarcode) {
          window.JsBarcode("#preview-sscc-svg", consolidatedLabel.sscc, {
            format: "CODE128",
            displayValue: true,
            fontSize: 16,
            height: 40,
            margin: 0
          });
        }
      } else {
        alert('Hiba: ' + (data.error || 'Ismeretlen hiba'));
      }
    } catch (err) {
      alert('Hálózati hiba az összeemelés során.');
    } finally {
      btnFinish.innerHTML = originalText;
      btnFinish.style.pointerEvents = 'auto';
    }
  });

  // ZPL Nyomtatás logic
  const printPrinterInput = container.querySelector('#print-printer-barcode');
  const printBtn = container.querySelector('#print-btn');

  printPrinterInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await triggerZplPrint();
    }
  });

  printBtn?.addEventListener('click', async () => {
    await triggerZplPrint();
  });

  async function triggerZplPrint() {
    if (!consolidatedLabel) return;
    const pBarcode = printPrinterInput.value.trim();
    if (!pBarcode) {
      alert('Olvasd be a nyomtató vonalkódját!');
      printPrinterInput.focus();
      return;
    }

    const originalText = printBtn.innerHTML;
    printBtn.innerHTML = '⌛ Nyomtatás...';
    printBtn.disabled = true;

    try {
      const res = await apiFetch('/api/v1/pda/print-pallet-label', {
        method: 'POST',
        body: JSON.stringify({
          labelId: consolidatedLabel.id,
          printerBarcode: pBarcode
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Nyomtatás sikeresen elküldve!');
        printPrinterInput.value = '';
      } else {
        alert('Hiba a nyomtatás során: ' + (data.error || 'Ismeretlen hiba'));
      }
    } catch (e) {
      alert('Hálózati hiba a nyomtatás során.');
    } finally {
      printBtn.innerHTML = originalText;
      printBtn.disabled = false;
    }
  }

  renderList();
  setTimeout(() => {
    if (barcodeInput) barcodeInput.focus();
  }, 100);
}
