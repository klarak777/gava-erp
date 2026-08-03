const fs = require('fs');

let c = fs.readFileSync('Access UI/src/modules/admin.js', 'utf8');
c = c.replace(/\r\n/g, '\n');

// 1. Add CSS rules to openAdminTable style tag
const styleOld = `.admin-compact-table .icon-btn {
                    padding: 2px 4px !important;
                    font-size: 11px !important;
                    background: none !important;
                    border: none !important;
                    cursor: pointer !important;
                }`;

const styleNew = `.admin-compact-table .icon-btn {
                    padding: 2px 4px !important;
                    font-size: 11px !important;
                    background: none !important;
                    border: none !important;
                    cursor: pointer !important;
                }
                .arch-btn { padding: 3px 8px; font-size: 11px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; background: white; }
                .arch-btn:hover { background: #f1f5f9; }
                .arch-reassign-container { position: relative; display: inline-block; margin-left: 8px; }
                .arch-reassign-dropdown { 
                    position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ccc; 
                    border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 250px; z-index: 100;
                    display: none; flex-direction: column; padding: 8px;
                }
                .arch-reassign-input { width: 100%; padding: 4px; font-size: 11px; box-sizing: border-box; margin-bottom: 4px; }
                .arch-reassign-list { max-height: 150px; overflow-y: auto; list-style: none; margin: 0; padding: 0; }
                .arch-reassign-list li { padding: 4px; font-size: 11px; cursor: pointer; border-bottom: 1px solid #f1f1f1; }
                .arch-reassign-list li:hover { background: #eff6ff; }`;

if (!c.includes(styleOld)) throw new Error('styleOld not found');
c = c.replace(styleOld, styleNew);

// 2. Update HTML row structure in openAdminTable
const rowOld = `                        \${(extraPayload.allowReassign && item.identifier_id) ? \`
                            <div style="position:relative; display:inline-block;">
                                <button class="arch-btn btn-reassign" data-id="\${item.identifier_id}" data-inactive="false" title="Áthelyezés másik partnerhez">🔄 Áthelyezés</button>
                                <div class="arch-reassign-dropdown" id="dropdown-\${item.identifier_id}" style="display:none; position:absolute; right:0; top:100%; background:white; border:1px solid #ccc; border-radius:4px; padding:8px; z-index:100; width:200px;">
                                    <input type="text" class="arch-reassign-input" placeholder="Keresés 1 karaktertől..." style="width:100%; box-sizing:border-box;">
                                    <ul class="arch-reassign-list" style="list-style:none; padding:0; margin:0; max-height:150px; overflow-y:auto;"></ul>
                                </div>
                            </div>
                        \` : ''}`;

const rowNew = `                        \${(extraPayload.allowReassign && item.identifier_id) ? \`
                            <div class="arch-reassign-container">
                                <button class="arch-btn btn-reassign" data-id="\${item.identifier_id}" data-inactive="false" title="Áthelyezés másik partnerhez">🔄 Áthelyez</button>
                                <div class="arch-reassign-dropdown" id="dropdown-\${item.identifier_id}">
                                    <input type="text" class="arch-reassign-input" placeholder="Keresés 1 karaktertől...">
                                    <ul class="arch-reassign-list"></ul>
                                </div>
                            </div>
                        \` : ''}`;

if (!c.includes(rowOld)) throw new Error('rowOld not found');
c = c.replace(rowOld, rowNew);

fs.writeFileSync('Access UI/src/modules/admin.js', c, 'utf8');
console.log('Successfully matched reassignment styling in admin.js!');
