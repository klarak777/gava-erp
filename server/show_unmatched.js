const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('historical_csv_audit_results.json', 'utf8'));

console.log('=== UNMATCHED HISTORICAL IDENTIFIERS ===\n');

for (const [file, res] of Object.entries(data)) {
  const missingRef = res.unmatched.reference;
  const missingCust = res.unmatched.customer;
  
  if (missingRef.length > 0 || missingCust.length > 0) {
    console.log(`\n📁 ${file}`);
    if (missingRef.length > 0) {
      console.log(`  Hiányzó Reference (${missingRef.length} db):`, missingRef.join(', '));
    }
    if (missingCust.length > 0) {
      console.log(`  Hiányzó Customer (${missingCust.length} db):`, missingCust.join(', '));
    }
  }
}
