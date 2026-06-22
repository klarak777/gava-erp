const fs = require('fs');
const path = require('path');

const base = '\\\\192.168.1.5\\raktar\\Fuvarok\\Fuvarmegbízás\\25-26';
try {
  console.log('Exists base?', fs.existsSync(base));
  if (fs.existsSync(base)) {
    const files = fs.readdirSync(base);
    console.log('Files starting with P:', files.filter(f => f.startsWith('P')));
    for (const f of files) {
      if (f.startsWith('PAP')) {
        const fullPath = path.join(base, f);
        console.log('Full path:', fullPath);
        console.log('Hex of f:', Buffer.from(f).toString('hex'));
        console.log('Hex of PAP JÓZSEFNÉ:', Buffer.from('PAP JÓZSEFNÉ').toString('hex'));
        console.log('Match?', f === 'PAP JÓZSEFNÉ');
      }
    }
  } else {
    console.log('Could not read base dir');
  }
} catch (e) {
  console.error(e);
}
