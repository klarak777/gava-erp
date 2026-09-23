/**
 * scanPallet.js – Raklapcímke beolvasása
 */
import { showView, apiFetch, appState } from '../app.js';

export async function renderScanPallet(container, params = {}) {
  const user = appState.user;
  const userName = user?.name || 'Felhasználó';
  const escHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };

  container.innerHTML = `
    <div class="pda-pane active" id="pane-scan-pallet" style="display: flex; flex-direction: column; height: 100%; background: #f8fafc;">
      <!-- Fejléc -->
      <div class="pda-dashboard__header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 8px 10px; background: #f8f9fc; border-bottom: none; gap: 4px;">
        <div class="pda-dashboard__header-left" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <img src="/logo.ico" alt="Gava Logo" class="pda-dashboard__logo" onerror="this.style.display='none'" style="width: 32px; height: 32px; border: none; padding: 0; flex-shrink: 0;">
          <div class="pda-dashboard__user-info" style="display: flex; flex-direction: column; justify-content: center; gap: 0px;">
            <div class="pda-dashboard__company" style="font-size: 13.5px; font-weight: 800; color: #0f172a; white-space: nowrap; line-height: 1.15; letter-spacing: -0.2px;">Raklap beolvasás</div>
            <div class="pda-dashboard__role" style="font-size: 7.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; line-height: 1;">FELHASZNÁLÓ</div>
            <div class="pda-dashboard__name" style="font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px; margin-top: 1px; line-height: 1.15;">${escHtml(userName)}</div>
          </div>
        </div>
        <div class="pda-dashboard__header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
          <div class="pda-dashboard__notifications" style="position: relative; color: #6366f1; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; margin-right: 2px;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
          </div>
        </div>
      </div>

      <div class="pda-form-title" style="padding: 24px 16px 8px; font-size: 18px; color: #0f172a; text-align: center; font-weight: 800;">Raklap címke</div>
      
      <div class="pda-form-body" style="padding: 16px; background: #fff; flex: 1; overflow-y: auto;">
        
        <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px;">Raklap Vonalkód</div>
        <div style="position: relative; display: flex; align-items: center; margin-bottom: 24px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px;">
            <path d="M4 7V4h16v3M9 20h6M12 14v6M4 17v3h16v-3M9 7h6v5H9z"></path>
          </svg>
          <input type="text" inputmode="none" id="scan-pallet-barcode" placeholder="Kérjük, olvasd be a vonalkódot" style="width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: #f8fafc; color: #0f172a;" autofocus>
        </div>

        <!-- Eredmény konténer -->
        <div id="scan-pallet-result" style="display: none; border: 2px solid #0f172a; border-radius: 6px; background: #ffffff; padding: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
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
            <svg id="scan-pallet-sscc-svg" style="max-width: 100%; height: auto; display: block; margin: 0 auto;"></svg>
            <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">SSCC</div>
          </div>
        </div>
        
        <div id="scan-pallet-error" style="display: none; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center;"></div>
      </div>

      <!-- Alsó navigáció -->
      <div class="pda-bottom-nav" style="display: flex; padding: 16px; background: #fff; border-top: 1px solid #e2e8f0; gap: 12px;">
        <div class="pda-bottom-nav__item pda-nav-home-btn" style="cursor: pointer; flex: 1; display: flex; flex-direction: column; align-items: center; color: #64748b;">
          <svg class="pda-bottom-nav__icon" fill="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 00.707-1.707l-9-9a.999.999 0 00-1.414 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4z"></path></svg>
          <span class="pda-bottom-nav__label" style="font-size: 10px; font-weight: 600; margin-top: 4px;">Főoldal</span>
        </div>
        <div class="pda-bottom-nav__item pda-nav-back-btn" style="cursor: pointer; flex: 1; display: flex; flex-direction: column; align-items: center; color: #64748b;">
          <svg class="pda-bottom-nav__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          <span class="pda-bottom-nav__label" style="font-size: 10px; font-weight: 600; margin-top: 4px;">Vissza</span>
        </div>
      </div>
    </div>
  `;

  // Events
  const barcodeInput = container.querySelector('#scan-pallet-barcode');
  const resultBox = container.querySelector('#scan-pallet-result');
  const errorBox = container.querySelector('#scan-pallet-error');

  const lblTruck = container.querySelector('#lbl-truck');
  const lblProduct = container.querySelector('#lbl-product');
  const lblDate = container.querySelector('#lbl-date');
  const lblCartons = container.querySelector('#lbl-cartons');
  const lblSupplier = container.querySelector('#lbl-supplier');
  const lblDest = container.querySelector('#lbl-dest');
  const lblOrigin = container.querySelector('#lbl-origin');

  const goDashboard = () => showView('dashboard');
  
  container.querySelector('.pda-nav-back-btn').addEventListener('click', goDashboard);
  container.querySelector('.pda-nav-home-btn').addEventListener('click', goDashboard);

  window.addEventListener('hwBack', () => {
    goDashboard();
  });

  // Process Barcode Logic
  async function processBarcode(code) {
    if (!code) return;
    
    resultBox.style.display = 'none';
    errorBox.style.display = 'none';
    barcodeInput.disabled = true;

    try {
      const res = await apiFetch(`/api/v1/pda/pallet-label/${encodeURIComponent(code)}`);
      const data = await res.json();
      
      if (res.ok) {
        lblTruck.textContent = data.truck_number || '-';
        lblProduct.textContent = data.product_name || '-';
        lblDate.textContent = data.delivery_date || '-';
        lblCartons.textContent = data.picked_cartons || '0';
        lblSupplier.textContent = data.supplier || '-';
        lblDest.textContent = data.destination || '-';
        lblOrigin.textContent = data.origin_country || '-';

        // Generate barcode via JsBarcode if available
        if (window.JsBarcode) {
          window.JsBarcode("#scan-pallet-sscc-svg", data.sscc, {
            format: "CODE128",
            displayValue: true,
            fontSize: 16,
            height: 40,
            margin: 0
          });
        }

        resultBox.style.display = 'block';
      } else {
        errorBox.textContent = data.error || 'A raklapcímke nem található.';
        errorBox.style.display = 'block';
      }
    } catch (err) {
      errorBox.textContent = 'Hálózati hiba történt a lekérdezés során.';
      errorBox.style.display = 'block';
    } finally {
      barcodeInput.disabled = false;
      barcodeInput.value = '';
      barcodeInput.focus();
    }
  }

  // Handle barcode input via Enter key (for scanners that append Enter)
  barcodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.value.trim();
      processBarcode(code);
    }
  });

  // Handle barcode input automatically when length reaches 18 characters (SSCC length)
  barcodeInput.addEventListener('input', () => {
    const code = barcodeInput.value.trim();
    if (code.length === 18) {
      processBarcode(code);
    }
  });

  // Fókuszban tartás
  setTimeout(() => {
    if (barcodeInput) {
      barcodeInput.focus();
      // Kis trükk: kattintásra mindig kerüljön fókuszba, ha valahogy elvesztené
      document.body.addEventListener('click', () => {
        if (document.getElementById('scan-pallet-barcode') && !barcodeInput.disabled) {
          barcodeInput.focus();
        }
      });
    }
  }, 100);
}
