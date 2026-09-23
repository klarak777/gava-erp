/**
 * login.js – PDA bejelentkezési képernyő
 * Egyelőre bármilyen felhasználónévvel be lehet lépni (vonalkód nincs még).
 */
import { showView, setAuth } from '../app.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="pda-view pda-login">
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

      <form class="pda-login__form" id="pda-login-form" autocomplete="off" style="margin-top: 30px; padding: 0 10px;">
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
              placeholder="Kérjük, olvasd be a dolgozói vonalkódot"
              autofocus
              autocomplete="off"
              style="padding-left: 48px; border-radius: 12px; height: 56px; border: 1px solid #cbd5e1; font-size: 15px;"
            >
          </div>
        </div>

        <!-- Szerver URL beállítása (opcionális, főleg telepített APK-hoz) -->
        <div class="pda-form-group" style="margin-top: 16px;">
          <label class="pda-form-label" for="pda-server-url" style="font-size: 14px; display: flex; align-items: center; gap: 8px; color: #0f172a; margin-bottom: 8px;">
            <svg style="width: 20px; height: 20px; color: #6366f1;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
            Szerver címe (pl. https://app.gavahungria.hu)
          </label>
          <div style="position: relative; display: flex; align-items: center;">
            <svg style="position: absolute; left: 16px; width: 22px; height: 22px; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            <input
              class="pda-form-input"
              id="pda-server-url"
              type="url"
              placeholder="Hagyd üresen ha weben használod"
              autocomplete="off"
              style="padding-left: 48px; border-radius: 12px; height: 56px; border: 1px solid #cbd5e1; font-size: 15px;"
            >
          </div>
        </div>

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

        <button class="pda-btn pda-btn--primary" type="submit" style="border-radius: 12px; font-weight: 600; margin-top: 24px; background: linear-gradient(to right, #8b5cf6, #6366f1); height: 56px;">
          <svg style="width: 22px; height: 22px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2 2v-2M4 12h16"></path></svg>
          Bejelentkezés
        </button>
      </form>

      <div class="pda-login__footer">
        GAVA WMS PDA<br>Verzió V0.9.3.1
      </div>
    </div>
  `;

  const form = container.querySelector('#pda-login-form');
  const errorEl = container.querySelector('#pda-login-error');
  const errDiv = container.querySelector('#pda-login-error');
  const serverInput = container.querySelector('#pda-server-url');
  const input = container.querySelector('#pda-username');

  import('../app.js').then(({ appState }) => {
    if (appState.apiBaseUrl && serverInput) {
      serverInput.value = appState.apiBaseUrl;
    }
  });

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

    if (serverInput) {
      const serverUrl = serverInput.value.trim();
      import('../app.js').then(({ appState }) => {
        if (serverUrl) {
          appState.apiBaseUrl = serverUrl;
          localStorage.setItem('pda_api_base_url', serverUrl);
        } else {
          appState.apiBaseUrl = '';
          localStorage.removeItem('pda_api_base_url');
        }
      });
    }

    // Teszt mód: bármilyen névvel be lehet lépni, API nélkül
    setAuth('pda-mock-token-' + Date.now(), { name: username });
    showView('dashboard');
  });
}
