const fs = require('fs');

const file = '\\\\192.168.1.5\\raktar\\Fuvarok\\Fuvarmegbízás\\25-26\\PAP JÓZSEFNÉ\\PAP LOG362.docx';
console.log('File exists?', fs.existsSync(file));
