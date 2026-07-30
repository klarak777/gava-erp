const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(__dirname, '../mapping_report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

let md = `# Partner Szerepkörök Hozzárendelése (Párosítási Terv)

A kérésednek megfelelően átvizsgáltam a **Customer partnerek.csv**, **Reference partnerek.csv** és **Transport Company partnerek.csv** fájlokat, és a bennük szereplő rövidített neveket összepárosítottam a központi \`partners\` táblában található partnerekkel.

## User Review Required
> [!IMPORTANT]
> Kérlek, nézd át az alábbi párosításokat. Ahol több találat van (vagy egyáltalán nincs), ott a beazonosítás bizonytalan lehet. Ha a párosítások megfelelőek számodra, a jóváhagyásod (Proceed) után elvégzem a kategóriák / szerepkörök (Customer, Reference, Transport Company) beállítását az egyeztetett partnerekhez a \`partner_identifiers\` (vagy a megfelelő) táblában.

## 🛒 Vevők (Customer)
| CSV Rövidített Név | Javasolt Partner (Adatbázis Név) | Pontosság |
|---|---|---|
`;

report.customers.forEach(item => {
    let matchStr = "❌ Nincs találat";
    let acc = "-";
    if (item.matches && item.matches.length > 0) {
        matchStr = item.matches.map(m => \`\${m.partner} (ID: \${m.partner_id})\`).join('<br>');
        acc = item.matches.length > 1 ? "⚠️ Több találat" : "✅ OK";
    }
    md += \`| \${item.short_name_from_csv} | \${matchStr} | \${acc} |\n\`;
});

md += `\n## 🏢 Szállítók (Reference)
| CSV Rövidített Név | Javasolt Partner (Adatbázis Név) | Pontosság |
|---|---|---|
`;

report.references.forEach(item => {
    let matchStr = "❌ Nincs találat";
    let acc = "-";
    if (item.matches && item.matches.length > 0) {
        matchStr = item.matches.map(m => \`\${m.partner} (ID: \${m.partner_id})\`).join('<br>');
        acc = item.matches.length > 1 ? "⚠️ Több találat" : "✅ OK";
    }
    md += \`| \${item.short_name_from_csv} | \${matchStr} | \${acc} |\n\`;
});

md += `\n## 🚚 Fuvarozók (Transport Company)
| CSV Rövidített Név | Javasolt Partner (Adatbázis Név) | Pontosság |
|---|---|---|
`;

report.transporters.forEach(item => {
    let matchStr = "❌ Nincs találat";
    let acc = "-";
    if (item.matches && item.matches.length > 0) {
        matchStr = item.matches.map(m => \`\${m.partner} (ID: \${m.partner_id})\`).join('<br>');
        acc = item.matches.length > 1 ? "⚠️ Több találat" : "✅ OK";
    }
    md += \`| \${item.short_name_from_csv} | \${matchStr} | \${acc} |\n\`;
});

md += `

## Tervezett Megvalósítás
Miután elfogadtad a párosításokat:
1. Végigmegyek a 3 listán.
2. Csak az egyértelműen párosítható partnereknél regisztrálom be a \`partner_identifiers\` táblába a szerepkörhöz tartozó azonosítót:
   - Vevő esetén: \`(Customer) Vevők\` -> Rövid név érték
   - Szállító esetén: \`(Reference) Szállítók\` -> Rövid név érték
   - Fuvarozó esetén: \`Fuvarozók\` -> Rövid név érték
3. Ezzel biztosítom, hogy a rövidített név alapján beazonosíthatóak legyenek a különböző modulokban.

Kérlek jelezd, ha valamelyik hozzárendelés nem pontos, vagy ha finomítani kell a keresési feltételeken!`;

fs.writeFileSync(path.resolve(__dirname, '../implementation_plan.md'), md);
console.log('Generated implementation_plan.md');
