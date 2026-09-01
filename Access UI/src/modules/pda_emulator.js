/**
 * pda_emulator.js
 * PDA Emul\u00e1tor modul \u2013 megnyit egy PDA m\u00e9retarány\u00fa ablakot az ERP-n bel\u00fcl.
 */

export function renderPdaEmulator(container, windowManager) {
  openPdaEmulatorOverlay();
}

function openPdaEmulatorOverlay() {
  const existing = document.getElementById('pda-emulator-overlay');
  if (existing) {
    existing.style.display = 'flex';
    return;
  }

  // Newland MT93 m\u00e9retarány, de kicsinyítve, hogy jobban elf\u00e9rjen (pl. 320x680)
  const PDA_W = 320;
  const PDA_H = 680;

  const overlay = document.createElement('div');
  overlay.id = 'pda-emulator-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:rgba(15,23,42,0.4)', // Vil\u00e1gosabb/áttetszőbb h\u00e1ttér, hogy m\u00f6götte látszódjon az ERP
    'z-index:9900',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'pointer-events:none' // Az overlay nem fogja meg a kattintásokat, így alatta is lehet kattintani (opcionális, de mozgathatónál hasznos lehet. Viszont akkor a h\u00e1ttérre kattintva bezárás nem megy simán. Inkább hagyjuk meg a klikket, de ne legyen pointer-events:none, hanem az eg\u00e9sz overlay legyen a konténer. Vagy ne flex középre zárt legyen, hanem position absolute a frame-nek.)
  ].join(';');

  // Mivel mozgatható, az overlay csak egy \u00fcres háló, ami megfogja a kattintásokat, VAGY levehetjük a h\u00e1tteret teljesen, ha azt akarjuk, hogy m\u00f6götte m\u0171ködjön az ERP.
  // Maradjon a s\u00f6tét h\u00e1ttér, de a frame position: absolute lesz, hogy mozgatható legyen.
  
  overlay.innerHTML = `
    <div id="pda-emulator-frame" style="
      width:${PDA_W + 28}px;
      background:#1e293b;
      border-radius:36px;
      padding:16px 14px;
      box-shadow:0 40px 100px rgba(0,0,0,0.7),0 0 0 2px #334155,inset 0 0 0 1px #475569;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:10px;
      position:absolute;
      pointer-events:auto;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    ">
      <!-- Titlebar (Draggable terület) -->
      <div id="pda-emu-drag-handle" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 4px;cursor:grab;">
        <div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;pointer-events:none;">📱 PDA EMUL\u00c1TOR</div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button id="pda-emu-rotate-btn" title="Forgat\u00e1s" style="background:none;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:13px;padding:2px 7px;transition:all 0.2s;">⟳</button>
          <button id="pda-emu-reload-btn" title="\u00dajrat\u00f6lt\u00e9s" style="background:none;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:13px;padding:2px 7px;transition:all 0.2s;">↺</button>
          <button id="pda-emu-close-btn" title="Bez\u00e1r\u00e1s" style="background:#ef4444;border:none;border-radius:6px;color:white;cursor:pointer;font-size:12px;padding:2px 9px;font-weight:700;">✕</button>
        </div>
      </div>

      <!-- Front kamera -->
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:-4px;pointer-events:none;">
        <div style="width:6px;height:6px;background:#0f172a;border-radius:50%;border:1px solid #334155;"></div>
        <div style="width:56px;height:4px;background:#0f172a;border-radius:4px;border:1px solid #334155;"></div>
        <div style="width:6px;height:6px;background:#0f172a;border-radius:50%;border:1px solid #334155;"></div>
      </div>

      <!-- Képernyő -->
      <div id="pda-screen-container" style="
        width:${PDA_W}px;
        height:${PDA_H}px;
        border-radius:10px;
        overflow:hidden;
        background:#000;
        border:2px solid #0f172a;
        position:relative;
        box-shadow:inset 0 0 20px rgba(0,0,0,0.5);
        flex-shrink:0;
      ">
        <iframe
          id="pda-screen-iframe"
          src="/pda/"
          style="width:100%;height:100%;border:none;display:block;"
          title="GAVA WMS PDA"
        ></iframe>
      </div>

      <!-- Home gomb -->
      <div style="display:flex;gap:22px;align-items:center;pointer-events:none;">
        <div style="width:8px;height:8px;background:#334155;border-radius:50%;"></div>
        <div style="width:36px;height:36px;background:#0f172a;border-radius:50%;border:2px solid #334155;display:flex;align-items:center;justify-content:center;">
          <div style="width:15px;height:15px;background:#1e293b;border-radius:4px;border:1px solid #475569;"></div>
        </div>
        <div style="width:8px;height:8px;background:#334155;border-radius:50%;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const frame = document.getElementById('pda-emulator-frame');
  const handle = document.getElementById('pda-emu-drag-handle');
  const iframe = document.getElementById('pda-screen-iframe');

  // Drag logic
  let isDragging = false;
  let startX, startY, initialX, initialY;

  handle.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    handle.style.cursor = 'grabbing';
    
    const rect = frame.getBoundingClientRect();
    
    // Mivel translate(-50%, -50%) van alapból, a mozgatásnál \u00e1tváltjuk fix top/left-re a könnyebb számolás miatt.
    if (frame.style.transform.includes('translate')) {
      frame.style.transform = 'none';
      frame.style.left = rect.left + 'px';
      frame.style.top = rect.top + 'px';
    }

    startX = e.clientX;
    startY = e.clientY;
    initialX = frame.offsetLeft;
    initialY = frame.offsetTop;
    
    // Disable iframe pointer events during drag so it doesn't steal mouse events
    iframe.style.pointerEvents = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    frame.style.left = (initialX + dx) + 'px';
    frame.style.top = (initialY + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      handle.style.cursor = 'grab';
      iframe.style.pointerEvents = 'auto';
    }
  });

  // Bezárás
  overlay.querySelector('#pda-emu-close-btn').addEventListener('click', () => overlay.remove());
  
  // Csak akkor zárjon be k\u00edvülre kattintva, ha magára az overlay-re kattint
  overlay.addEventListener('click', (e) => { 
    if (e.target === overlay) overlay.remove(); 
  });

  // Újratöltés
  overlay.querySelector('#pda-emu-reload-btn').addEventListener('click', () => {
    if (iframe) iframe.src = iframe.src;
  });

  // Forgat\u00e1s (portré <-> fekvo)
  let isLandscape = false;
  overlay.querySelector('#pda-emu-rotate-btn').addEventListener('click', () => {
    isLandscape = !isLandscape;
    const screen = document.getElementById('pda-screen-container');
    if (isLandscape) {
      frame.style.width = \`\${PDA_H + 28}px\`;
      screen.style.width = \`\${PDA_H}px\`;
      screen.style.height = \`\${PDA_W}px\`;
    } else {
      frame.style.width = \`\${PDA_W + 28}px\`;
      screen.style.width = \`\${PDA_W}px\`;
      screen.style.height = \`\${PDA_H}px\`;
    }
  });
}
