const fs = require('fs');
const file = 'Access UI/src/modules/aldi_rendelesek.js';
let content = fs.readFileSync(file, 'utf8');

const target1 = `                <td style="padding:10px 14px; text-align:center;">
                  <button class="aldi-view-order-btn" data-id="\${o.id}" data-orderno="\${o.order_number}" data-date="\${formattedDate}" style="background:none; border:none; cursor:pointer; font-size:16px;" title="Tételek megtekintése">📋</button>
                </td>`;
const repl1 = `                <td style="padding:10px 14px; text-align:center;">
                  <button class="aldi-view-order-btn" data-id="\${o.id}" data-orderno="\${o.order_number}" data-date="\${formattedDate}" style="background:none; border:none; cursor:pointer; font-size:16px;" title="Tételek megtekintése">📋</button>
                  <button class="aldi-delete-order-btn" data-id="\${o.id}" style="background:none; border:none; cursor:pointer; font-size:16px; margin-left:8px;" title="Rendelés törlése">🗑️</button>
                </td>`;

content = content.replace(target1, repl1);

const target2 = `    // Order view
    wrapper.querySelectorAll('.aldi-view-order-btn').forEach(btn => {`;

const repl2 = `    // Order delete
    wrapper.querySelectorAll('.aldi-delete-order-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        if (confirm('Biztosan törölni szeretnéd ezt a rendelést? A művelet nem vonható vissza, és a PDF fájl is törlődik!')) {
          try {
            const res = await fetch(\`/api/v1/aldi-daily-orders/\${id}\`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Hiba a törlés során');
            alert('A rendelés sikeresen törölve lett.');
            renderModule();
          } catch (err) {
            console.error(err);
            alert('Sikertelen törlés!');
          }
        }
      });
    });

    // Order view
    wrapper.querySelectorAll('.aldi-view-order-btn').forEach(btn => {`;

content = content.replace(target2, repl2);

fs.writeFileSync(file, content, 'utf8');
console.log("Done");
