const fs = require('fs');
let c = fs.readFileSync('Access UI/src/main.js', 'utf8');
c += `\n\n// Global number formatter for inputs starting with comma or dot
document.addEventListener('change', (e) => {
    if (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'number')) {
        let val = e.target.value;
        if (typeof val === 'string') {
            val = val.trim();
            if (val.startsWith(',')) {
                e.target.value = '0' + val;
                e.target.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (val.startsWith('.')) {
                e.target.value = '0' + val;
                e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }
});
`;
fs.writeFileSync('Access UI/src/main.js', c);
