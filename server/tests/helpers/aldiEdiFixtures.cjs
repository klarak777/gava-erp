const iconv = require('iconv-lite');

function order({ orderNumber = 'TEST-4532724690', version = 1, kind = '220', items = [[null, 20], [null, 44]], name = 'Gava', date = '20261014' } = {}) {
  const body = [`UNH+${version}+ORDERS:D:01B:UN:EAN010+2.0`, `BGM+${kind}+${orderNumber}:${version}+9`, 'DTM+137:20261013:102', 'NAD+BY+4099200005096::9', `NAD+SU+5013546350114::9++${name}`, 'NAD+DP+4099200999609::9'];
  items.forEach(([action, quantity, extra = {}], index) => {
    body.push(`LIN+${extra.lineId || (index ? '00090' : '00040')}+${action || ''}+${extra.gtin || (index ? '4069365093832' : '4061462846892')}:SRV`, `QTY+21:${quantity}`);
    if (extra.delivered !== undefined) body.push(`QTY+46:${extra.delivered}`);
    if (extra.close) body.push('QTY+27:0.000');
    body.push(`DTM+2:${extra.date || date}:102`);
  });
  body.push('UNS+S');
  return [...body, `UNT+${body.length + 1}+${version}`];
}
function interchange(messages = [order()], { control = 'TEST1', charset = 'UNOC', test = true } = {}) {
  return iconv.encode(["UNA:+.? '", `UNB+${charset}:3+4012345000009:14+4012345000016:14+261013:1200+${control}+++++EANCOM+${test ? '1' : ''}'`, ...messages.flat().map(s => s + "'"), `UNZ+${messages.length}+${control}'`].join('\n'), charset === 'UNOD' ? 'iso-8859-2' : 'latin1');
}
module.exports = { order, interchange };
