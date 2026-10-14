const GAVA_COMPANY_PREFIX = '5999883976';
function checkDigit(body) {
  let sum = 0;
  for (let i = body.length - 1, p = 0; i >= 0; i--, p++) sum += Number(body[i]) * (p % 2 ? 1 : 3);
  return String((10 - sum % 10) % 10);
}
const validGs1 = (value, lengths) => /^\d+$/.test(String(value || '')) && lengths.includes(String(value).length) && checkDigit(String(value).slice(0, -1)) === String(value).slice(-1);
function generateSscc(serial, prefix = process.env.GS1_COMPANY_PREFIX || GAVA_COMPANY_PREFIX) {
  if (!/^\d{6,12}$/.test(prefix) || !/^\d+$/.test(String(serial))) throw new Error('Érvénytelen GS1 cégprefix vagy SSCC sorszám.');
  const width = 16 - prefix.length;
  if (String(serial).length > width) throw new Error('Az SSCC sorszámtartomány betelt; új számozási tartomány szükséges.');
  const body = '3' + prefix + String(serial).padStart(width, '0');
  return body + checkDigit(body);
}
module.exports = { checkDigit, validGs1, generateSscc, GAVA_COMPANY_PREFIX };
