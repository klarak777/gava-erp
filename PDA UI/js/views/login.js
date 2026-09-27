/**
 * login.js – PDA bejelentkezési képernyő
 * Egyelőre bármilyen felhasználónévvel be lehet lépni (vonalkód nincs még).
 */
import { showView, setAuth } from '../app.js';

export function renderLogin(container) {
  const isNative = !!(window.Capacitor && window.Capacitor.isNative);

  container.innerHTML = `
    <div class="pda-view pda-login" style="display: flex; flex-direction: column; min-height: 100vh;">
      <div class="pda-login__logo-wrap">
        <img
          class="pda-login__logo"
          src="/logo.ico"
          alt="Gava"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >
        <div class="pda-login__logo-fallback" style="display:none;">G</div>
      </div>

      <div class="pda-login__company" style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 10px;">Gava Hungria Kft.</div>
      <div class="pda-login__welcome-container" style="width: 100%; text-align: left; margin-top: 30px; padding: 0 10px;">
        <div class="pda-login__welcome" style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 4px;">Üdvözlünk!</div>
        <div class="pda-login__sub" style="text-align: left; color: #64748b; font-size: 14px;">Kérjük, jelentkezz be a folytatáshoz.</div>
      </div>

      <form class="pda-login__form" id="pda-login-form" autocomplete="off" style="margin-top: 30px; padding: 0 10px; flex: 1;">
        ${isNative ? `
          <!-- Natív PDA nézet: Nincs beviteli mező és gomb, csak várakozás -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1; margin-top: 20px;">
            <svg style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            <div style="font-size: 16px; font-weight: 700; color: #475569; text-align: center; line-height: 1.4;">Kérjük, olvasd be a dolgozói vonalkódot!</div>
          </div>
          <input type="hidden" id="pda-username">
        ` : `
          <!-- Emulátor nézet: Beviteli mező és gomb -->
          <div class="pda-form-group">
            <label class="pda-form-label" for="pda-username" style="font-size: 14px; display: flex; align-items: center; gap: 8px; color: #0f172a; margin-bottom: 8px;">
              <svg style="width: 20px; height: 20px; color: #6366f1;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Dolgozói vonalkód
            </label>
            <div style="position: relative; display: flex; align-items: center;">
              <svg style="position: absolute; left: 16px; width: 22px; height: 22px; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2 2v-2M4 12h16"></path></svg>
              <input
                class="pda-form-input"
                id="pda-username"
                type="text"
                readonly
                placeholder="Kérjük, olvasd be a dolgozói vonalkódot"
                autofocus
                autocomplete="off"
                style="padding-left: 48px; border-radius: 12px; height: 56px; border: 1px solid #cbd5e1; font-size: 15px;"
              >
            </div>
          </div>
          <button class="pda-btn pda-btn--primary" type="submit" style="border-radius: 12px; font-weight: 600; margin-top: 24px; background: linear-gradient(to right, #8b5cf6, #6366f1); height: 56px;">
            <svg style="width: 22px; height: 22px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2 2v-2M4 12h16"></path></svg>
            Bejelentkezés
          </button>
        `}

        <div id="pda-login-error" style="
          display:none;
          background:#fee2e2;
          color:#dc2626;
          border-radius:8px;
          padding:10px 14px;
          font-size:13px;
          font-weight:600;
          margin-top: 12px;
        "></div>
      </form>

      <div class="pda-login__footer" style="margin-top: auto; padding-bottom: 8px;">
        GAVA WMS PDA<br>Verzió V0.9.5
      </div>
    </div>

  `;

  const form = container.querySelector('#pda-login-form');
  const errorEl = container.querySelector('#pda-login-error');
  const errDiv = container.querySelector('#pda-login-error');
  const input = container.querySelector('#pda-username');

  const handleScan = (event) => {
    input.value = String(event.detail || '').trim();
    if (input.value) form.requestSubmit();
  };
  window._currentBarcodeHandler = handleScan;
  window.addEventListener('pda-barcode-scanned', handleScan);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errDiv.style.display = 'none';

    const rawVal = input.value.trim();
    const username = rawVal;
    if (!rawVal) {
      errDiv.textContent = 'Kérjük, olvasd be a vonalkódot!';
      errDiv.style.display = 'block';
      return;
    }



    // Teszt mód: bármilyen névvel be lehet lépni, API nélkül
    setAuth('pda-mock-token-' + Date.now(), { name: username });
    showView('dashboard');
  });
}
