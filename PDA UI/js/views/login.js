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
          src="/GAVA.png"
          alt="Gava"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >
        <div class="pda-login__logo-fallback" style="display:none;">G</div>
      </div>

      <div class="pda-login__company">Gava Hungria Kft.</div>
      <div class="pda-login__welcome">Üdvözlünk!</div>
      <div class="pda-login__sub">Kérjük, jelentkezz be a folytatáshoz.</div>

      <form class="pda-login__form" id="pda-login-form" autocomplete="off">
        <div class="pda-form-group">
          <label class="pda-form-label" for="pda-username">
            <span>👤</span> Dolgozói azonosító
          </label>
          <input
            class="pda-form-input"
            id="pda-username"
            type="text"
            placeholder="Kérjük, add meg az azonosítód"
            autofocus
            autocomplete="off"
          >
        </div>

        <div id="pda-login-error" style="
          display:none;
          background:#fee2e2;
          color:#dc2626;
          border-radius:8px;
          padding:10px 14px;
          font-size:13px;
          font-weight:600;
        "></div>

        <button class="pda-btn pda-btn--primary" type="submit">
          <span>🔑</span> Bejelentkezés
        </button>
      </form>

      <div class="pda-login__footer">
        GAVA WMS PDA &nbsp;|&nbsp; Verzió 1.0.0
      </div>
    </div>
  `;

  const form = container.querySelector('#pda-login-form');
  const errorEl = container.querySelector('#pda-login-error');
  const usernameInput = container.querySelector('#pda-username');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const username = usernameInput.value.trim();
    if (!username) {
      errorEl.textContent = 'Kérjük add meg az azonosítód!';
      errorEl.style.display = 'block';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> Bejelentkezés...';

    try {
      const res = await fetch('/api/v1/auth/pda-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (res.ok) {
        setAuth(data.token, data.user || { name: username });
        showView('dashboard');
      } else {
        errorEl.textContent = data.error || 'Sikertelen bejelentkezés.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>🔑</span> Bejelentkezés';
      }
    } catch (err) {
      errorEl.textContent = 'Hálózati hiba! Ellenőrizd a kapcsolatot.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🔑</span> Bejelentkezés';
    }
  });
}
