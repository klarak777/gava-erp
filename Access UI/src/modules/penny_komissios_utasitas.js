/**
 * GAVA ERP – PENNY Komissiós utasítás modul
 */

export function renderPennyKomissiosUtasitas(container, windowManager) {
  container.style.overflow = 'auto';
  container.style.padding = '0';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';
  container.style.background = 'var(--bg-main, #f8fafc)';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding: 20px 28px; display:flex; flex-direction:column; gap:16px;';
  
  wrapper.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <img src="Penny logo.jpg" alt="PENNY" style="height:28px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
      <div>
        <h2 style="margin:0; font-size:20px; font-weight:700; color:var(--text-primary, #0f172a);">
          PENNY – Komissiós Utasítás
        </h2>
        <p style="margin:0; font-size:12px; color:var(--text-muted, #64748b);">Komissiózási rendelések, utasítások és raktári előkészítés</p>
      </div>
    </div>

    <div class="access-form-view" style="background:#ffffff; border:1px solid var(--border, #cbd5e1); border-radius:12px; padding:32px; text-align:center; color:#64748b;">
      <div style="font-size:36px; margin-bottom:8px;">📋</div>
      <h3 style="margin:0 0 6px 0; font-size:16px; font-weight:700; color:#1e293b;">Komissiós utasítás modul</h3>
      <p style="margin:0; font-size:13px;">A PENNY komissiózási utasítások funkciók fejlesztése a következő fázisban érkezik.</p>
    </div>
  `;

  container.appendChild(wrapper);
}
