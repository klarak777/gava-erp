const fs = require('fs');
const path = 'Access UI/src/modules/kamion_szerkesztes.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace zero with empty string for numeric fields and unit
const fieldsToClearIfZero = [
    'euro_palets',
    'normal_palets',
    'gross_weight_kg',
    'price_eur',
    'price_bcn_eur',
    'reloading_per_plt',
    'transport_bcn_per_plt',
    'unit'
];

fieldsToClearIfZero.forEach(field => {
    // Current pattern: value="${isEmpty ? '' : escHtml(l.FIELDNAME)}"
    // We want to replace it with: value="${(isEmpty || l.FIELDNAME == 0 || l.FIELDNAME === '0' || l.FIELDNAME === '0.00' || l.FIELDNAME === '') ? '' : escHtml(l.FIELDNAME)}"
    const searchStr = `value="\${isEmpty ? '' : escHtml(l.${field})}"`;
    const replaceStr = `value="\${(isEmpty || l.${field} == 0 || l.${field} === '0' || l.${field} === '0.00' || l.${field} === '') ? '' : escHtml(l.${field})}"`;
    content = content.replace(searchStr, replaceStr);
});

// 2. Add Keydown listener for Enter key to jump to the cell below
const eventListenerHook = `            // Inline cell edit – szinkron az állapotba
            tbody.querySelectorAll('.cell-edit').forEach(inp => {
                inp.addEventListener('change', () => {`;

const keydownLogic = `            // Enter key to jump to the cell below
            tbody.querySelectorAll('.cell-edit').forEach(inp => {
                inp.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const currentField = inp.dataset.field;
                        const currentIndex = parseInt(inp.dataset.index, 10);
                        const nextIndex = currentIndex + 1;
                        const nextInput = tbody.querySelector(\`.cell-edit[data-field="\${currentField}"][data-index="\${nextIndex}"]\`);
                        if (nextInput) {
                            nextInput.focus();
                            nextInput.select();
                        }
                    }
                });
            });

            // Inline cell edit – szinkron az állapotba
            tbody.querySelectorAll('.cell-edit').forEach(inp => {
                inp.addEventListener('change', () => {`;

content = content.replace(eventListenerHook, keydownLogic);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified kamion_szerkesztes.js successfully!');
