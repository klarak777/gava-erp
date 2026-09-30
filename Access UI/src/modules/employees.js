import { NAV_CATEGORIES } from '../data/nav-structure.js';

async function apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    // Későbbi token itt lesz bekötve (pl. localStorage.getItem('token'))
    options.headers['Authorization'] = 'Bearer mock-token';
    return fetch(url, options);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export function renderEmployeesModule(wm) {
    wm.open('admin-employees', 'Dolgozók', (content) => {
        const winEl = content.closest('.mdi-window');
        if (winEl) {
            winEl.style.width = '1100px';
            winEl.style.height = '800px';
            winEl.style.maxHeight = '92vh';

            setTimeout(() => {
                const left = Math.max(20, (window.innerWidth - winEl.offsetWidth) / 2);
                const top = Math.max(70, (window.innerHeight - winEl.offsetHeight) / 2);
                winEl.style.left = `${left}px`;
                winEl.style.top = `${top}px`;
            }, 10);
        }

        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.backgroundColor = '#f8fafc';
        
        let employees = [];
        let currentEmployeeId = null;
        let isEditing = false;
        
        // Custom temporary mock stores for education/lang for the session
        let mockEdu = [];
        let mockLang = [];
        let mockDocs = [];
        let historyPage = 1;
        let sysHistoryPage = 1;
        const historyPerPage = 10;

        let permissionsHtml = '';
        NAV_CATEGORIES.forEach(cat => {
            if (!cat.groups || cat.groups.length === 0) return;
            const cleanLabel = cat.label.replace(/<[^>]*>?/gm, '').trim();
            
            let catContent = '';
            cat.groups.forEach(g => {
                if (g.id === 'pda_emulator') return; // Skip PDA emulator

                if (g.items && g.items.length > 0) {
                    g.items.forEach(item => {
                        catContent += `
                            <div class="emp-module-item" style="margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                <input type="checkbox" class="inp-perm-check" data-module="${item.id}" disabled>
                                <label style="font-size:12px; margin:0; flex:1; padding-left:8px;">${item.label} <span style="color:#94a3b8; font-size:11px;">(${g.title})</span></label>
                            </div>
                        `;
                    });
                } else {
                    catContent += `
                        <div class="emp-module-item" style="margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                            <input type="checkbox" class="inp-perm-check" data-module="${g.id}" disabled>
                            <label style="font-size:12px; margin:0; flex:1; padding-left:8px;">${g.title}</label>
                        </div>
                    `;
                }
            });

            if (catContent) {
                permissionsHtml += `
                <div style="margin-bottom:10px; border:1px solid #e2e8f0; border-radius:4px;">
                    <div style="font-weight:bold; background:#f1f5f9; padding:6px 10px; font-size:13px; display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" class="inp-perm-master" disabled>
                        <label style="margin:0; flex:1;">${cleanLabel}</label>
                    </div>
                    <div style="padding:10px;">
                        ${catContent}
                    </div>
                </div>`;
            }
        });

        content.innerHTML = `
            <style>
                .emp-top-bar { padding: 15px 20px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
                .emp-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
                .emp-search-container { display: flex; align-items: center; gap: 10px; flex: 1; max-width: 400px; position: relative; }
                .emp-search-input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
                .emp-search-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-height: 250px; overflow-y: auto; display: none; z-index: 100; }
                .emp-search-dropdown li { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
                .emp-search-dropdown li:hover { background: #f8fafc; }
                .emp-btn-new { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
                .emp-btn-new:hover { background: #1d4ed8; }
                .emp-btn-save { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
                .emp-btn-save:hover { background: #059669; }

                .emp-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .emp-tabs { display: flex; background: white; border-bottom: 1px solid #e2e8f0; padding: 0 20px; }
                .emp-tab { padding: 12px 24px; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; }
                .emp-tab.active { color: #2563eb; border-bottom-color: #2563eb; }

                .emp-tab-content { flex: 1; overflow-y: auto; padding: 20px; display: none; }
                .emp-tab-content.active { display: block; }
                
                .emp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                .emp-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                
                .emp-section-title { font-size: 15px; font-weight: 700; color: #334155; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; }
                
                .emp-field { margin-bottom: 12px; }
                .emp-field label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
                .emp-field input, .emp-field select, .emp-field textarea { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; font-family: inherit; }
                .emp-field input[disabled], .emp-field select[disabled], .emp-field textarea[disabled] { background: #f1f5f9; cursor: not-allowed; }

                .emp-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: white; }
                .emp-table th, .emp-table td { border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 13px; text-align: left; }
                .emp-table th { background: #f8fafc; font-weight: 600; color: #475569; }
                .emp-btn-small { background: #e2e8f0; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px; }
                .emp-btn-small:hover { background: #cbd5e1; }
                
                .emp-filter-tabs { display: flex; gap: 10px; margin-bottom: 15px; }
                .emp-filter-tab { padding: 4px 12px; border-radius: 12px; background: #f1f5f9; color: #475569; cursor: pointer; font-size: 12px; font-weight: 600; }
                .emp-filter-tab.active { background: #3b82f6; color: white; }
                
                .emp-readonly-text { font-size: 13px; font-weight: 600; color: #0f172a; padding: 8px 0; }
                
                dialog { padding:20px; border-radius:8px; border:1px solid #ccc; max-width:400px; width:100%; }
                dialog::backdrop { background: rgba(0,0,0,0.5); }
                .pagination-controls { display:flex; gap:10px; align-items:center; justify-content:flex-end; margin-top:10px; }
            </style>

            <div class="emp-top-bar">
                <div>
                    <div class="emp-title">DOLGOZÓ KIVÁLASZTÁSA</div>
                    <div class="emp-search-container">
                        <input type="text" id="emp-search" class="emp-search-input" placeholder="Név, azonosító keresése...">
                        <ul id="emp-search-results" class="emp-search-dropdown"></ul>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="btn-emp-save" class="emp-btn-save" style="display:none;">Mentés</button>
                    <button id="btn-emp-new" class="emp-btn-new">+ Új dolgozó</button>
                </div>
            </div>

            <div class="emp-body">
                <div class="emp-tabs">
                    <div class="emp-tab active" data-tab="adatok">ADATOK</div>
                    <div class="emp-tab" data-tab="eszkozei">ESZKÖZEI</div>
                    <div class="emp-tab" data-tab="jogok">JOGOK</div>
                </div>

                <!-- ADATOK FÜL -->
                <div class="emp-tab-content active" id="tab-adatok">
                    <div class="emp-section-title">1. Munkaügyi adatok</div>
                    <div class="emp-grid">
                        <div>
                            <div class="emp-field"><label>Teljes név</label><input type="text" id="inp-full_name" disabled></div>
                            <div class="emp-field"><label>Születési dátum</label><input type="date" id="inp-birth_date" disabled></div>
                            <div class="emp-field"><label>Születési hely</label><input type="text" id="inp-birth_place" disabled></div>
                            <div class="emp-field"><label>Anyja neve</label><input type="text" id="inp-mother_name" disabled></div>
                            <div class="emp-field">
                                <label>Neme</label>
                                <select id="inp-gender" disabled>
                                    <option value=""></option>
                                    <option value="Férfi">Férfi</option>
                                    <option value="Nő">Nő</option>
                                </select>
                            </div>
                            <div class="emp-field"><label>Állampolgárság</label><input type="text" id="inp-citizenship" disabled></div>
                        </div>
                        <div>
                            <div class="emp-field">
                                <label>Családi állapot</label>
                                <select id="inp-marital_status" disabled>
                                    <option value=""></option>
                                    <option value="Egyedülálló">Egyedülálló</option>
                                    <option value="Házas">Házas</option>
                                    <option value="Elvált">Elvált</option>
                                    <option value="Özvegy">Özvegy</option>
                                </select>
                            </div>
                            <div class="emp-field"><label>Gyermekek száma</label><input type="number" id="inp-children_count" disabled></div>

                            <div class="emp-field"><label>Telefonszám</label><input type="text" id="inp-phone" disabled></div>
                            <div class="emp-field"><label>E-mail cím</label><input type="email" id="inp-email" disabled></div>
                            <div class="emp-field"><label>TAJ szám</label><input type="text" id="inp-taj_number" disabled></div>
                        </div>
                        <div>
                            <div class="emp-field"><label>Adóazonosító jel</label><input type="text" id="inp-tax_number" disabled></div>
                            <div class="emp-field"><label>Bankszámlaszám</label><input type="text" id="inp-bank_account" disabled></div>
                        </div>
                    </div>

                    <div class="emp-section-title">2. Lakcím adatok</div>
                    <div class="emp-grid">
                        <div>
                            <div class="emp-field"><label>Ország</label><input type="text" id="inp-address_country" disabled></div>
                            <div class="emp-field"><label>Irányítószám</label><input type="text" id="inp-address_zip" disabled></div>
                            <div class="emp-field"><label>Város / Helységnév</label><input type="text" id="inp-address_city" disabled></div>
                        </div>
                        <div>
                            <div class="emp-field"><label>Közterület neve</label><input type="text" id="inp-address_street" disabled></div>
                            <div class="emp-field">
                                <label>Közterület jellege</label>
                                <select id="inp-address_type" disabled>
                                    <option value=""></option>
                                    <option value="utca">utca</option>
                                    <option value="út">út</option>
                                    <option value="tér">tér</option>
                                    <option value="köz">köz</option>
                                    <option value="körút">körút</option>
                                    <option value="sétány">sétány</option>
                                    <option value="park">park</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <div class="emp-field"><label>Házszám</label><input type="text" id="inp-address_number" disabled></div>
                            <div class="emp-field"><label>Épület, lépcsőház, ajtó</label><input type="text" id="inp-address_building" disabled></div>
                        </div>
                    </div>

                    <div class="emp-section-title">3. Munkavállaló profil</div>
                    <div class="emp-grid-2">
                        <div>
                            <div class="emp-field"><label>Munkakör</label><input type="text" id="inp-job_title" disabled></div>
                            <div class="emp-field"><label>Részleg / Osztály</label><input type="text" id="inp-department" disabled></div>
                            <div class="emp-field"><label>Telephely</label><input type="text" id="inp-site" disabled></div>
                            <div class="emp-field">
                                <label>Munkaviszony típusa</label>
                                <select id="inp-employment_type" disabled>
                                    <option value=""></option>
                                    <option value="Határozatlan idejű">Határozatlan idejű</option>
                                    <option value="Határozott idejű">Határozott idejű</option>
                                </select>
                            </div>
                            <div class="emp-field"><label>Belépés dátuma</label><input type="date" id="inp-join_date" disabled></div>
                            <div class="emp-field"><label>Próbaidő vége</label><input type="date" id="inp-probation_end" disabled></div>
                        </div>
                        <div>
                            <div class="emp-field">
                                <label>Foglalkoztatás jellege</label>
                                <select id="inp-employment_nature" disabled>
                                    <option value=""></option>
                                    <option value="Teljes munkaidő">Teljes munkaidő</option>
                                    <option value="Részmunkaidő">Részmunkaidő</option>
                                </select>
                            </div>
                            <div class="emp-field"><label>Munkaidő (óra/hét)</label><input type="number" id="inp-work_hours" disabled></div>
                            <div class="emp-field"><label>Besorolás</label><input type="text" id="inp-classification" disabled></div>
                            <div class="emp-field"><label>Besorolás szintje</label><input type="text" id="inp-classification_level" disabled></div>
                            <div class="emp-field"><label>Üzleti e-mail</label><input type="email" id="inp-business_email" disabled></div>
                            <div class="emp-field"><label>(belső) telefonszám</label><input type="text" id="inp-internal_phone" disabled></div>
                        </div>
                    </div>

                    <div class="emp-section-title">4. Oktatás & Képzés <button id="btn-add-edu" class="emp-btn-small" style="float:right;" disabled>+ Hozzáadás</button></div>
                    <table class="emp-table" id="table-edu">
                        <thead><tr><th>Intézmény</th><th>Végzettség</th><th>Év</th><th>Műveletek</th></tr></thead>
                        <tbody></tbody>
                    </table>

                    <div class="emp-section-title">Nyelvtudás <button id="btn-add-lang" class="emp-btn-small" style="float:right;" disabled>+ Hozzáadás</button></div>
                    <table class="emp-table" id="table-lang">
                        <thead><tr><th>Nyelv</th><th>Szint</th><th>Műveletek</th></tr></thead>
                        <tbody></tbody>
                    </table>

                    <div class="emp-section-title">5. Dokumentumok <button id="btn-upload-doc" class="emp-btn-small" style="float:right;" disabled>+ Feltöltés</button></div>
                    <table class="emp-table" id="table-docs">
                        <thead><tr><th>Fájlnév</th><th>Feltöltve</th><th>Műveletek</th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>

                <!-- ESZKÖZEI FÜL -->
                <div class="emp-tab-content" id="tab-eszkozei">
                    <div class="emp-section-title">1. Dolgozó adatai</div>
                    <div class="emp-grid-2">
                        <div>
                            <div class="emp-field"><label>Teljes név</label><div class="emp-readonly-text" id="ro-full_name">-</div></div>
                            <div class="emp-field"><label>Munkakör</label><div class="emp-readonly-text" id="ro-job_title">-</div></div>
                            <div class="emp-field"><label>Terület</label><div class="emp-readonly-text" id="ro-department">-</div></div>
                            <div class="emp-field"><label>Telephely</label><div class="emp-readonly-text" id="ro-site">-</div></div>
                            <div class="emp-field">
                                <label>Státusz</label>
                                <select id="inp-status" disabled style="max-width:200px;">
                                    <option value="Aktív">Aktív</option>
                                    <option value="Inaktív">Inaktív</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <div class="emp-field"><label>Belépés dátuma</label><div class="emp-readonly-text" id="ro-join_date">-</div></div>
                            <div class="emp-field"><label>Próbaidő vége</label><div class="emp-readonly-text" id="ro-probation_end">-</div></div>
                        </div>
                    </div>

                    <div class="emp-section-title">
                        2. Eszközök
                        <button id="btn-assign-device" class="emp-btn-small" style="float:right; background:#2563eb; color:white;" disabled>+ Eszköz kiosztása</button>
                    </div>
                    
                    <div class="emp-filter-tabs">
                        <div class="emp-filter-tab active" data-filter="all">Összes (<span id="dev-count-all">0</span>)</div>
                        <div class="emp-filter-tab" data-filter="Aktív">Aktív (<span id="dev-count-active">0</span>)</div>
                        <div class="emp-filter-tab" data-filter="Lejárt">Lejárt (<span id="dev-count-expired">0</span>)</div>
                        <div class="emp-filter-tab" data-filter="Visszavont">Visszavont (<span id="dev-count-revoked">0</span>)</div>
                    </div>

                    <table class="emp-table" id="table-devices">
                        <thead><tr><th>Eszköz típusa</th><th>Azonosító / Név</th><th>Kiosztás dátuma</th><th>Állapot</th><th>Megjegyzés</th><th>Műveletek</th></tr></thead>
                        <tbody></tbody>
                    </table>

                    <div class="emp-section-title" style="margin-top:30px;">3. Előzmények</div>
                    <table class="emp-table" id="table-device-history">
                        <thead><tr><th>Dátum / Idő</th><th>Esemény</th><th>Eszköz típusa</th><th>Azonosító</th><th>Megjegyzés</th><th>Műveletet végző</th></tr></thead>
                        <tbody></tbody>
                    </table>
                    <div class="pagination-controls" id="history-pagination">
                        <button class="emp-btn-small" id="btn-hist-prev" disabled>Előző</button>
                        <span style="font-size:12px;">Oldal: <span id="hist-page">1</span></span>
                        <button class="emp-btn-small" id="btn-hist-next" disabled>Következő</button>
                    </div>
                </div>

                <!-- JOGOK FÜL -->
                <div class="emp-tab-content" id="tab-jogok">
                    <div class="emp-grid-2">
                        <div>
                            <div class="emp-section-title">1. Modul hozzáférések</div>
                            <div id="module-permissions-container">
                                ${permissionsHtml}
                            </div>
                        </div>
                        <div>
                            <div class="emp-section-title">2. Bejelentkezési adatok</div>
                            <div class="emp-field"><label>Felhasználónév</label><input type="text" id="inp-username" disabled autocomplete="off"></div>
                            <div class="emp-field"><label>Jelszó (üres ha nem változik)</label><input type="password" id="inp-password_hash" disabled autocomplete="off"></div>
                            <div class="emp-field">
                                <label>Jogosultsági szint (Globális)</label>
                                <select id="inp-role" disabled>
                                    <option value="Felhasználó">Felhasználó</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div class="emp-field">
                                <label>PDA Azonosító</label>
                                <div style="display:flex; gap:10px;">
                                    <input type="text" id="inp-pda_identifier" disabled>
                                    <button class="emp-btn-small" id="btn-generate-pda" disabled>Generál</button>
                                    <button class="emp-btn-small" id="btn-print-pda" disabled>Nyomtat</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="emp-section-title" style="margin-top:30px;">3. Rendszerben végzett előzmények</div>
                    <table class="emp-table" id="table-system-history">
                        <thead><tr><th>Dátum / Idő</th><th>Esemény</th><th>Modul / Funkció</th><th>Részletek</th><th>IP cím</th><th>Operátor</th></tr></thead>
                        <tbody></tbody>
                    </table>
                    <div class="pagination-controls" id="sys-history-pagination">
                        <button class="emp-btn-small" id="btn-sys-hist-prev" disabled>Előző</button>
                        <span style="font-size:12px;">Oldal: <span id="sys-hist-page">1</span></span>
                        <button class="emp-btn-small" id="btn-sys-hist-next" disabled>Következő</button>
                    </div>
                </div>
            </div>

            <!-- MODALS -->
            <dialog id="device-dialog">
                <h3 style="margin-top:0;">Eszköz kiosztása / Szerkesztése</h3>
                <div class="emp-field">
                    <label>Eszköz típusa</label>
                    <select id="dev-type">
                        <option value="Belépő kártya">Belépő kártya</option>
                        <option value="Szekrény kulcs">Szekrény kulcs</option>
                        <option value="PDA készülék">PDA készülék</option>
                        <option value="Egyedi">Egyedi</option>
                    </select>
                </div>
                <div class="emp-field" id="dev-custom-name-container" style="display:none;">
                    <label>Egyedi eszköz neve</label>
                    <input type="text" id="dev-custom-name" class="emp-search-input">
                </div>
                <div class="emp-field">
                    <label>Azonosító</label>
                    <input type="text" id="dev-id" class="emp-search-input">
                </div>
                <div class="emp-field">
                    <label>Státusz</label>
                    <select id="dev-status">
                        <option value="Aktív">Aktív</option>
                        <option value="Inaktív">Inaktív</option>
                        <option value="Lejárt">Lejárt</option>
                        <option value="Visszavont">Visszavont</option>
                    </select>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
                    <button type="button" class="emp-btn-small" id="btn-dev-cancel">Mégse</button>
                    <button type="button" class="emp-btn-save" id="btn-dev-save">Mentés</button>
                </div>
            </dialog>

            <dialog id="edu-dialog">
                <h3 style="margin-top:0;">Oktatás & Képzés</h3>
                <div class="emp-field"><label>Intézmény</label><input type="text" id="edu-inst"></div>
                <div class="emp-field"><label>Végzettség</label><input type="text" id="edu-deg"></div>
                <div class="emp-field"><label>Év</label><input type="number" id="edu-year" min="1950" max="2099"></div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
                    <button type="button" class="emp-btn-small" id="btn-edu-cancel">Mégse</button>
                    <button type="button" class="emp-btn-save" id="btn-edu-save">Mentés</button>
                </div>
            </dialog>

            <dialog id="lang-dialog">
                <h3 style="margin-top:0;">Nyelvtudás</h3>
                <div class="emp-field"><label>Nyelv</label><input type="text" id="lang-name"></div>
                <div class="emp-field">
                    <label>Szint</label>
                    <select id="lang-level">
                        <option value="Alapfok">Alapfok</option>
                        <option value="Középfok">Középfok</option>
                        <option value="Felsőfok">Felsőfok</option>
                        <option value="Anyanyelvi">Anyanyelvi</option>
                    </select>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
                    <button type="button" class="emp-btn-small" id="btn-lang-cancel">Mégse</button>
                    <button type="button" class="emp-btn-save" id="btn-lang-save">Mentés</button>
                </div>
            </dialog>

            <dialog id="print-pda-dialog">
                <h3 style="margin-top:0;">PDA Vonalkód Nyomtatása</h3>
                <div style="text-align:center; padding: 20px; background: white; border:1px solid #e2e8f0; margin-bottom:15px;">
                    <div style="font-weight:bold; margin-bottom:10px; font-size:18px;" id="print-pda-name"></div>
                    <svg id="pda-barcode-svg"></svg>
                    <div style="font-size:14px; margin-top:5px; color:#475569;" id="print-pda-text"></div>
                </div>
                <div class="emp-field">
                    <label>Nyomtató kiválasztása</label>
                    <select id="sel-printer">
                        <option value="pdf">Mentés PDF-ként</option>
                        <option value="printer_1">Iroda - Lézer nyomtató 1</option>
                        <option value="printer_2">Raktár - Címkenyomtató</option>
                    </select>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
                    <button type="button" class="emp-btn-small" id="btn-print-cancel">Bezár</button>
                    <button type="button" class="emp-btn-save" id="btn-print-confirm">Nyomtatás indítása</button>
                </div>
            </dialog>

            <dialog id="doc-upload-dialog">
                <h3 style="margin-top:0;">Dokumentum feltöltése</h3>
                <div class="emp-field"><label>Fájl kiválasztása</label><input type="file" id="doc-file"></div>
                <div class="emp-field"><label>Megjegyzés / Típus</label><input type="text" id="doc-note"></div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
                    <button type="button" class="emp-btn-small" id="btn-doc-cancel">Mégse</button>
                    <button type="button" class="emp-btn-save" id="btn-doc-save">Feltöltés</button>
                </div>
            </dialog>
        `;

        // References
        const searchInput = content.querySelector('#emp-search');
        const searchResults = content.querySelector('#emp-search-results');
        const btnNew = content.querySelector('#btn-emp-new');
        const btnSave = content.querySelector('#btn-emp-save');
        const tabs = content.querySelectorAll('.emp-tab');
        const tabContents = content.querySelectorAll('.emp-tab-content');

        const inputs = content.querySelectorAll('input[id^="inp-"], select[id^="inp-"]');
        const permChecks = content.querySelectorAll('.inp-perm-check');
        const permMasters = content.querySelectorAll('.inp-perm-master');

        // Master checkbox logic
        permMasters.forEach(master => {
            master.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const container = e.target.closest('div').nextElementSibling;
                const checks = container.querySelectorAll('.inp-perm-check');
                checks.forEach(c => c.checked = isChecked);
            });
        });

        // UI Logic
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                content.querySelector(`#tab-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Device filters
        let currentDeviceFilter = 'all';
        content.querySelectorAll('.emp-filter-tab').forEach(t => {
            t.addEventListener('click', () => {
                content.querySelectorAll('.emp-filter-tab').forEach(ft => ft.classList.remove('active'));
                t.classList.add('active');
                currentDeviceFilter = t.dataset.filter;
                renderDevices();
            });
        });

        // Form logic
        const setEditing = (editing) => {
            isEditing = editing;
            inputs.forEach(inp => inp.disabled = !editing);
            permChecks.forEach(inp => inp.disabled = !editing);
            permMasters.forEach(inp => inp.disabled = !editing);
            content.querySelector('#btn-add-edu').disabled = !editing;
            content.querySelector('#btn-add-lang').disabled = !editing;
            content.querySelector('#btn-upload-doc').disabled = !editing;
            content.querySelector('#btn-assign-device').disabled = !editing;
            content.querySelector('#btn-generate-pda').disabled = !editing;
            content.querySelector('#btn-print-pda').disabled = !editing;
            btnSave.style.display = editing ? 'block' : 'none';
            
            const roleSel = content.querySelector('#inp-role');
            if (roleSel) {
                roleSel.addEventListener('change', () => {
                    if (roleSel.value === 'Admin') {
                        permChecks.forEach(p => p.checked = true);
                    } else {
                        permChecks.forEach(p => p.checked = false);
                    }
                });
            }
        };

        const clearForm = () => {
            inputs.forEach(inp => {
                if (inp.type === 'checkbox') inp.checked = false;
                else inp.value = '';
            });
            permChecks.forEach(inp => inp.checked = false);
            permMasters.forEach(inp => inp.checked = false);
            mockEdu = [];
            mockLang = [];
            historyPage = 1;
            renderEdu();
            renderLang();
            content.querySelector('#table-docs tbody').innerHTML = '';
            content.querySelector('#table-devices tbody').innerHTML = '';
            content.querySelector('#table-device-history tbody').innerHTML = '';
            content.querySelector('#table-system-history tbody').innerHTML = '';
            ['full_name', 'job_title', 'department', 'site', 'join_date', 'probation_end'].forEach(f => {
                content.querySelector(`#ro-${f}`).textContent = '-';
            });
            updateDeviceCounters([]);
        };

        const loadEmployees = async (search = '') => {
            try {
                const res = await apiFetch(`/api/v1/employees?search=${encodeURIComponent(search)}`);
                employees = await res.json();
                
                searchResults.innerHTML = '';
                if (employees.length === 0) {
                    searchResults.innerHTML = '<li style="color:#94a3b8; text-align:center;">Nincs találat</li>';
                } else {
                    employees.forEach(emp => {
                        const li = document.createElement('li');
                        li.textContent = `${emp.full_name} (${emp.department || 'Nincs részleg'})`;
                        li.addEventListener('click', () => {
                            searchResults.style.display = 'none';
                            searchInput.value = emp.full_name;
                            loadEmployeeProfile(emp.id);
                        });
                        searchResults.appendChild(li);
                    });
                }
            } catch (e) {
                console.error(e);
            }
        };

        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            if (searchInput.value.trim().length > 0) {
                searchResults.style.display = 'block';
                searchTimeout = setTimeout(() => loadEmployees(searchInput.value), 300);
            } else {
                searchResults.style.display = 'none';
            }
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.emp-search-container')) searchResults.style.display = 'none';
        });

        let currentProfile = null;

        const loadEmployeeProfile = async (id) => {
            try {
                const res = await apiFetch(`/api/v1/employees/${id}`);
                const emp = await res.json();
                currentProfile = emp;
                currentEmployeeId = id;
                setEditing(true);
                
                // Reset password visually to avoid submitting old pw to another user if changing fast
                content.querySelector('#inp-password_hash').value = '';

                inputs.forEach(inp => {
                    const field = inp.id.replace('inp-', '');
                    if (emp[field] !== undefined && field !== 'password_hash') {
                        if (inp.type === 'date' && emp[field]) {
                            inp.value = new Date(emp[field]).toISOString().split('T')[0];
                        } else if (inp.type === 'checkbox') {
                            inp.checked = emp[field];
                        } else {
                            inp.value = emp[field];
                        }
                    }
                });

                ['full_name', 'job_title', 'department', 'site'].forEach(f => {
                    content.querySelector(`#ro-${f}`).textContent = emp[f] || '-';
                });
                content.querySelector('#ro-join_date').textContent = emp.join_date ? new Date(emp.join_date).toISOString().split('T')[0] : '-';
                content.querySelector('#ro-probation_end').textContent = emp.probation_end ? new Date(emp.probation_end).toISOString().split('T')[0] : '-';

                permChecks.forEach(chk => chk.checked = false);
                if (emp.permissions) {
                    emp.permissions.forEach(p => {
                        const chk = content.querySelector(`.inp-perm-check[data-module="${p.module_name}"]`);
                        if (chk && p.has_access) chk.checked = true;
                    });
                }

                mockEdu = emp.educations || [];
                mockLang = emp.languages || [];
                renderEdu();
                renderLang();
                renderDevices();
                renderHistory();

            } catch (e) {
                alert('Hiba a dolgozó betöltésekor: ' + e.message);
            }
        };

        const updateDeviceCounters = (devices) => {
            content.querySelector('#dev-count-all').textContent = devices.length;
            content.querySelector('#dev-count-active').textContent = devices.filter(d => d.status === 'Aktív').length;
            content.querySelector('#dev-count-expired').textContent = devices.filter(d => d.status === 'Lejárt').length;
            content.querySelector('#dev-count-revoked').textContent = devices.filter(d => d.status === 'Visszavont').length;
        };

        const renderDevices = () => {
            if (!currentProfile || !currentProfile.devices) return;
            const tbody = content.querySelector('#table-devices tbody');
            const devices = currentProfile.devices;
            updateDeviceCounters(devices);
            
            let filtered = devices;
            if (currentDeviceFilter !== 'all') {
                filtered = devices.filter(d => d.status === currentDeviceFilter);
            }

            tbody.innerHTML = filtered.map(d => {
                let icon = '🔧';
                if (d.device_type === 'Belépő kártya') icon = '💳';
                else if (d.device_type === 'Szekrény kulcs') icon = '🔑';
                else if (d.device_type === 'PDA készülék') icon = '📱';
                
                const dispName = d.device_type === 'Egyedi' && d.notes ? `${escapeHtml(d.identifier)} (${escapeHtml(d.notes)})` : escapeHtml(d.identifier);

                return `
                <tr>
                    <td>${icon} ${escapeHtml(d.device_type)}</td>
                    <td>${dispName}</td>
                    <td>${d.issue_date ? new Date(d.issue_date).toISOString().split('T')[0] : ''}</td>
                    <td><span style="color:${d.status === 'Aktív' ? 'green' : (d.status === 'Visszavont' ? 'red' : 'orange')}">${escapeHtml(d.status)}</span></td>
                    <td>${escapeHtml(d.notes || '')}</td>
                    <td>
                        <button class="emp-btn-small" onclick="window.empEditDevice(${d.id})" ${!isEditing ? 'disabled' : ''}>✏️</button>
                        <button class="emp-btn-small" style="color:red;" onclick="window.empRevokeDevice(${d.id})" ${!isEditing || d.status === 'Visszavont' ? 'disabled' : ''}>❌</button>
                    </td>
                </tr>
                `;
            }).join('');
        };

        const renderHistory = () => {
            if (!currentProfile || !currentProfile.history) return;
            
            const dhTbody = content.querySelector('#table-device-history tbody');
            const shTbody = content.querySelector('#table-system-history tbody');

            const dh = currentProfile.history.filter(h => h.event_category === 'DEVICE');
            
            // Pagination logic for device history
            const startIdx = (historyPage - 1) * historyPerPage;
            const dhPaged = dh.slice(startIdx, startIdx + historyPerPage);
            
            content.querySelector('#hist-page').textContent = historyPage;
            content.querySelector('#btn-hist-prev').disabled = historyPage === 1;
            content.querySelector('#btn-hist-next').disabled = startIdx + historyPerPage >= dh.length;

            dhTbody.innerHTML = dhPaged.map(h => `
                <tr>
                    <td>${escapeHtml(new Date(h.event_time).toLocaleString())}</td>
                    <td>${escapeHtml(h.event_type)}</td>
                    <td>${escapeHtml(h.module_or_function || '')}</td>
                    <td>${escapeHtml(h.details || '')}</td>
                    <td></td>
                    <td>${escapeHtml(h.operator_name || '')}</td>
                </tr>
            `).join('');

            const sh = currentProfile.history.filter(h => h.event_category === 'SYSTEM');
            
            const sysStartIdx = (sysHistoryPage - 1) * historyPerPage;
            const shPaged = sh.slice(sysStartIdx, sysStartIdx + historyPerPage);
            
            content.querySelector('#sys-hist-page').textContent = sysHistoryPage;
            content.querySelector('#btn-sys-hist-prev').disabled = sysHistoryPage === 1;
            content.querySelector('#btn-sys-hist-next').disabled = sysStartIdx + historyPerPage >= sh.length;

            shTbody.innerHTML = shPaged.map(h => `
                <tr>
                    <td>${escapeHtml(new Date(h.event_time).toLocaleString())}</td>
                    <td>${escapeHtml(h.event_type)}</td>
                    <td>${escapeHtml(h.module_or_function || '')}</td>
                    <td>${escapeHtml(h.details || '')}</td>
                    <td>${escapeHtml(h.ip_address || '')}</td>
                    <td>${escapeHtml(h.operator_name || '')}</td>
                </tr>
            `).join('');
        };
        
        content.querySelector('#btn-hist-prev').addEventListener('click', () => { historyPage--; renderHistory(); });
        content.querySelector('#btn-hist-next').addEventListener('click', () => { historyPage++; renderHistory(); });
        content.querySelector('#btn-sys-hist-prev').addEventListener('click', () => { sysHistoryPage--; renderHistory(); });
        content.querySelector('#btn-sys-hist-next').addEventListener('click', () => { sysHistoryPage++; renderHistory(); });

        // Edu/Lang rendering
        const renderEdu = () => {
            const tbody = content.querySelector('#table-edu tbody');
            tbody.innerHTML = mockEdu.map((e, idx) => `
                <tr>
                    <td>${escapeHtml(e.institution)}</td>
                    <td>${escapeHtml(e.degree)}</td>
                    <td>${escapeHtml(e.year)}</td>
                    <td>
                        <button class="emp-btn-small" onclick="window.empEditEdu(${idx})" ${!isEditing ? 'disabled' : ''}>✏️</button>
                        <button class="emp-btn-small" onclick="window.empDelEdu(${idx})" ${!isEditing ? 'disabled' : ''}>🗑️</button>
                    </td>
                </tr>
            `).join('');
        };
        
        const renderLang = () => {
            const tbody = content.querySelector('#table-lang tbody');
            tbody.innerHTML = mockLang.map((l, idx) => `
                <tr>
                    <td>${escapeHtml(l.language)}</td>
                    <td>${escapeHtml(l.level)}</td>
                    <td>
                        <button class="emp-btn-small" onclick="window.empEditLang(${idx})" ${!isEditing ? 'disabled' : ''}>✏️</button>
                        <button class="emp-btn-small" onclick="window.empDelLang(${idx})" ${!isEditing ? 'disabled' : ''}>🗑️</button>
                    </td>
                </tr>
            `).join('');
        };

        const renderDocs = () => {
            const tbody = content.querySelector('#table-docs tbody');
            tbody.innerHTML = mockDocs.map((d, idx) => `
                <tr>
                    <td>${escapeHtml(d.filename)}</td>
                    <td>${escapeHtml(d.upload_date)}</td>
                    <td>
                        <button class="emp-btn-small" onclick="window.empDelDoc(${idx})" ${!isEditing ? 'disabled' : ''}>🗑️</button>
                    </td>
                </tr>
            `).join('');
        };
        
        window.empDelEdu = (idx) => { mockEdu.splice(idx, 1); renderEdu(); };
        window.empDelLang = (idx) => { mockLang.splice(idx, 1); renderLang(); };
        window.empDelDoc = (idx) => { mockDocs.splice(idx, 1); renderDocs(); };

        // New employee
        btnNew.addEventListener('click', () => {
            currentEmployeeId = null;
            currentProfile = null;
            searchInput.value = '';
            clearForm();
            setEditing(true);
            tabs[0].click(); // Goto Adatok
        });

        // Save
        btnSave.addEventListener('click', async () => {
            const payload = {};
            inputs.forEach(inp => {
                const field = inp.id.replace('inp-', '');
                if (field) {
                    if (inp.type === 'checkbox') payload[field] = inp.checked;
                    else if (inp.value) payload[field] = inp.value;
                }
            });

            // Collect permissions
            payload.permissions = [];
            permChecks.forEach(chk => {
                if (chk.checked) {
                    payload.permissions.push({
                        module_name: chk.dataset.module,
                        has_access: true,
                        access_level: 'Teljes' // Simplified
                    });
                }
            });
            
            payload.educations = mockEdu;
            payload.languages = mockLang;

            try {
                let res;
                if (currentEmployeeId) {
                    res = await apiFetch(`/api/v1/employees/${currentEmployeeId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await apiFetch(`/api/v1/employees`, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                }
                
                if (res.ok) {
                    const data = await res.json();
                    currentEmployeeId = currentEmployeeId || data.id;
                    alert('Sikeres mentés!');
                    loadEmployeeProfile(currentEmployeeId);
                } else {
                    const errorData = await res.json();
                    alert(errorData.error || 'Hiba a mentés során.');
                }
            } catch (e) {
                alert('Hálózati hiba: ' + e.message);
            }
        });

        // Generate PDA Barcode
        content.querySelector('#btn-generate-pda').addEventListener('click', () => {
            const pdaInput = content.querySelector('#inp-pda_identifier');
            const randomCode = 'PDA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            pdaInput.value = randomCode;
        });

        // Print PDA Modal
        const printDialog = content.querySelector('#print-pda-dialog');
        content.querySelector('#btn-print-pda').addEventListener('click', async () => {
            const pdaInput = content.querySelector('#inp-pda_identifier');
            if (!pdaInput.value) {
                alert('Nincs azonosító generálva!');
                return;
            }
            
            // Load real printers from the DB via the admin endpoint
            try {
                const res = await apiFetch('/api/v1/admin/printers');
                if (res.ok) {
                    const printers = await res.json();
                    const sel = content.querySelector('#sel-printer');
                    sel.innerHTML = '<option value="pdf">Mentés PDF-ként</option>';
                    printers.forEach(p => {
                        if (p.is_active) {
                            sel.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.type || 'Ismeretlen')})</option>`;
                        }
                    });
                }
            } catch (e) {
                console.error('Hiba a nyomtatók betöltésekor', e);
            }

            const empName = content.querySelector('#inp-full_name').value || 'Ismeretlen dolgozó';
            content.querySelector('#print-pda-name').textContent = empName;
            content.querySelector('#print-pda-text').textContent = pdaInput.value;
            
            // Generate barcode using JsBarcode (assuming it's available globally as it is in lokaciok)
            if (window.JsBarcode) {
                window.JsBarcode(content.querySelector('#pda-barcode-svg'), pdaInput.value, {
                    format: "CODE128",
                    displayValue: false,
                    height: 80,
                    width: 2,
                    margin: 0
                });
            } else {
                content.querySelector('#pda-barcode-svg').innerHTML = `<text y="20">Vonalkód: ${pdaInput.value}</text>`;
            }
            
            printDialog.showModal();
        });
        
        content.querySelector('#btn-print-cancel').addEventListener('click', () => printDialog.close());
        content.querySelector('#btn-print-confirm').addEventListener('click', async () => {
            const printer = content.querySelector('#sel-printer').value;
            const pdaCode = content.querySelector('#inp-pda_identifier').value;
            const svgContent = content.querySelector('#pda-barcode-svg').outerHTML;
            
            if (printer === 'pdf') {
                // PDF letöltés szimulálása / generálása
                // Generáljunk egy egyszerű HTML/JS nyomtatási ablakot a PDF mentéshez
                const printWin = window.open('', '_blank');
                printWin.document.write(`
                    <html>
                        <head><title>PDA_${pdaCode}</title></head>
                        <body style="text-align:center; font-family:sans-serif; margin-top:50px;">
                            <h2>${content.querySelector('#inp-full_name').value || 'Ismeretlen dolgozó'}</h2>
                            ${svgContent}
                            <p>${pdaCode}</p>
                            <script>
                                window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
                            </script>
                        </body>
                    </html>
                `);
                printWin.document.close();
            } else {
                // Backend hívás a tényleges nyomtatáshoz
                try {
                    const res = await apiFetch('/api/v1/admin/printers/print', {
                        method: 'POST',
                        body: JSON.stringify({ printer_id: printer, barcode: pdaCode, svg: svgContent })
                    });
                    if (res.ok) alert('A nyomtatási parancs sikeresen elküldve a kiválasztott nyomtatóra.');
                    else alert('Hiba történt a nyomtatási kérés során.');
                } catch (e) {
                    alert('Hálózati hiba a nyomtatáskor.');
                }
            }
            printDialog.close();
        });

        // Edu / Lang Modals
        const eduDialog = content.querySelector('#edu-dialog');
        let editingEduIdx = -1;
        content.querySelector('#btn-add-edu').addEventListener('click', () => {
            editingEduIdx = -1;
            content.querySelector('#edu-inst').value = '';
            content.querySelector('#edu-deg').value = '';
            content.querySelector('#edu-year').value = new Date().getFullYear();
            eduDialog.showModal();
        });
        window.empEditEdu = (idx) => {
            editingEduIdx = idx;
            const e = mockEdu[idx];
            content.querySelector('#edu-inst').value = e.institution;
            content.querySelector('#edu-deg').value = e.degree;
            content.querySelector('#edu-year').value = e.year;
            eduDialog.showModal();
        };
        content.querySelector('#btn-edu-cancel').addEventListener('click', () => eduDialog.close());
        content.querySelector('#btn-edu-save').addEventListener('click', () => {
            const data = {
                institution: content.querySelector('#edu-inst').value,
                degree: content.querySelector('#edu-deg').value,
                year: content.querySelector('#edu-year').value
            };
            if (editingEduIdx >= 0) mockEdu[editingEduIdx] = data;
            else mockEdu.push(data);
            renderEdu();
            eduDialog.close();
        });

        const langDialog = content.querySelector('#lang-dialog');
        let editingLangIdx = -1;
        content.querySelector('#btn-add-lang').addEventListener('click', () => {
            editingLangIdx = -1;
            content.querySelector('#lang-name').value = '';
            content.querySelector('#lang-level').value = 'Középfok';
            langDialog.showModal();
        });
        window.empEditLang = (idx) => {
            editingLangIdx = idx;
            const l = mockLang[idx];
            content.querySelector('#lang-name').value = l.language;
            content.querySelector('#lang-level').value = l.level;
            langDialog.showModal();
        };
        content.querySelector('#btn-lang-cancel').addEventListener('click', () => langDialog.close());
        content.querySelector('#btn-lang-save').addEventListener('click', () => {
            const data = {
                language: content.querySelector('#lang-name').value,
                level: content.querySelector('#lang-level').value
            };
            if (editingLangIdx >= 0) mockLang[editingLangIdx] = data;
            else mockLang.push(data);
            renderLang();
            langDialog.close();
        });

        const docDialog = content.querySelector('#doc-upload-dialog');
        content.querySelector('#btn-upload-doc').addEventListener('click', () => {
            content.querySelector('#doc-file').value = '';
            content.querySelector('#doc-note').value = '';
            docDialog.showModal();
        });
        content.querySelector('#btn-doc-cancel').addEventListener('click', () => docDialog.close());
        content.querySelector('#btn-doc-save').addEventListener('click', () => {
            alert('A dokumentum mentése fejlesztés alatt. Hamarosan bekerül a végleges elérési út.');
            docDialog.close();
        });

        // Assign Device Dialog
        const deviceDialog = content.querySelector('#device-dialog');
        const devType = content.querySelector('#dev-type');
        const devId = content.querySelector('#dev-id');
        const devStatus = content.querySelector('#dev-status');
        const devCustomName = content.querySelector('#dev-custom-name');
        let editingDeviceId = null;

        devType.addEventListener('change', () => {
            content.querySelector('#dev-custom-name-container').style.display = devType.value === 'Egyedi' ? 'block' : 'none';
        });

        content.querySelector('#btn-assign-device').addEventListener('click', () => {
            if (!currentEmployeeId) { alert('Előbb mentsd el a dolgozót!'); return; }
            editingDeviceId = null;
            devId.value = '';
            devStatus.value = 'Aktív';
            devType.value = 'Belépő kártya';
            devCustomName.value = '';
            devType.dispatchEvent(new Event('change'));
            deviceDialog.showModal();
        });
        
        window.empEditDevice = (id) => {
            const dev = currentProfile.devices.find(d => d.id === id);
            if (!dev) return;
            editingDeviceId = id;
            devType.value = dev.device_type;
            devId.value = dev.identifier;
            devStatus.value = dev.status;
            if (dev.device_type === 'Egyedi') devCustomName.value = dev.notes || '';
            devType.dispatchEvent(new Event('change'));
            deviceDialog.showModal();
        };

        content.querySelector('#btn-dev-cancel').addEventListener('click', () => {
            deviceDialog.close();
        });

        window.empRevokeDevice = async (deviceId) => {
            if (!confirm('Biztosan visszavonod ezt az eszközt?')) return;
            try {
                const res = await apiFetch(`/api/v1/employees/${currentEmployeeId}/devices/${deviceId}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Hiba a szerver válaszában');
                loadEmployeeProfile(currentEmployeeId);
            } catch (e) {
                alert('Hiba a visszavonás során.');
            }
        };

        content.querySelector('#btn-dev-save').addEventListener('click', async () => {
            const type = devType.value;
            const identifier = devId.value;
            const status = devStatus.value;
            const notes = type === 'Egyedi' ? devCustomName.value : '';
            if (!identifier) { alert('Kötelező megadni az azonosítót!'); return; }

            try {
                let res;
                if (editingDeviceId) {
                    res = await apiFetch(`/api/v1/employees/${currentEmployeeId}/devices/${editingDeviceId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ device_type: type, identifier, status, notes })
                    });
                } else {
                    res = await apiFetch(`/api/v1/employees/${currentEmployeeId}/devices`, {
                        method: 'POST',
                        body: JSON.stringify({ device_type: type, identifier, status, notes, issue_date: new Date().toISOString().split('T')[0] })
                    });
                }
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Mentési hiba');
                }
                deviceDialog.close();
                loadEmployeeProfile(currentEmployeeId);
            } catch (e) {
                alert('Hiba kiosztáskor/mentéskor.');
            }
        });
    });
}
