/**
 * GAVA ERP – ALDI Belföldi Fuvarok modul
 * Jelenleg fejlesztés alatt álló funkció.
 */

export function renderAldiBelfoldiFuvarok(container, windowManager) {
  container.style.padding = '24px';
  container.style.height = '100%';
  container.style.background = 'var(--bg-main, #ffffff)';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';

  container.innerHTML = `
    <div style="text-align: center;">
      <img src="AldiNord-WorldwideLogo.svg" alt="ALDI" style="height:64px; margin-bottom: 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 12px;">ALDI – Belföldi fuvarok</h2>
      <p style="font-size: 16px; color: #64748b; margin-bottom: 32px;">Fejlesztés alatt...</p>
      
      <div style="padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; max-width: 400px; margin: 0 auto;">
        <span style="font-size: 48px; display: block; margin-bottom: 16px;">🚧</span>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          Ez a modul a következő fázisban kerül kidolgozásra. Itt fogod tudni kezelni az ALDI belföldi fuvarjait és fuvarmegbízásait.
        </p>
      </div>
    </div>
  `;
}
