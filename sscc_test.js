function calculateGS1CheckDigit(str) {
  let sum = 0;
  // Right to left calculation
  for (let i = str.length - 1; i >= 0; i--) {
    const digit = parseInt(str[i], 10);
    // Distance from the rightmost character (which is index str.length - 1)
    const posFromRight = str.length - 1 - i;
    const multiplier = posFromRight % 2 === 0 ? 3 : 1;
    sum += digit * multiplier;
  }
  return (10 - (sum % 10)) % 10;
}

const prefix = '5990001';
const ext = '3';
const seq = String(1).padStart(17 - prefix.length - ext.length, '0');
const base = ext + prefix + seq;
const check = calculateGS1CheckDigit(base);
console.log('Base:', base);
console.log('Check:', check);
console.log('SSCC:', base + check);
console.log('Length:', (base + check).length);
