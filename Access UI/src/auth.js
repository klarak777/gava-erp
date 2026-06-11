// Simple Authentication Logic mimicking MS Access Login

export function initAuth(onLoginSuccess) {
    const loginOverlay = document.getElementById('login-overlay');
    const appContainer = document.getElementById('app');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // Check if already logged in (sessionStorage)
    const currentUser = sessionStorage.getItem('gava_user');

    if (currentUser) {
        showApp(currentUser);
        if (onLoginSuccess) onLoginSuccess();
        return; // early return – no need to attach login events
    }

    // Find login button by ID (works with type="button" too)
    const loginBtn = document.getElementById('login-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const username = document.getElementById('username').value.trim();

            // A prototípusban bármilyen nem üres felhasználónév elfogadott
            if (username.length > 0) {
                sessionStorage.setItem('gava_user', username);
                if (loginError) loginError.style.display = 'none';
                showApp(username);
                if (onLoginSuccess) onLoginSuccess();
            } else {
                if (loginError) loginError.style.display = 'block';
            }
        });

        // Űrlap beküldésének megakadályozása (ne frissítse az oldalt)
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                loginBtn.click();
            });
            
            // Enter billentyű támogatás
            loginForm.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    loginBtn.click();
                }
            });
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('gava_user');
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
            const pwEl = document.getElementById('password');
            const unEl = document.getElementById('username');
            if (pwEl) pwEl.value = '';
            if (unEl) unEl.value = '';
        });
    }

    function showApp(username) {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';

        const userNameEl = document.getElementById('logged-user-name');
        if (userNameEl) userNameEl.textContent = username;
    }
}
