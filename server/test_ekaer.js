const fs = require('fs');

const pathStr = '\\\\192.168.1.5\\raktar\\Fuvarok\\EKAEREK\\EKAEREK 2025-2026\\LOG341\\AIHK742-AHOD227.docx';
const safeOrderNum = 'LOG341';
const okCheckPath = pathStr.replace(`\\${safeOrderNum}\\`, `\\${safeOrderNum} OK\\`).replace(`/${safeOrderNum}/`, `/${safeOrderNum} OK/`);

console.log('Original path:', pathStr);
console.log('Original exists?', fs.existsSync(pathStr));
console.log('OK Check Path:', okCheckPath);
console.log('OK Path exists?', fs.existsSync(okCheckPath));

const dirPath = '\\\\192.168.1.5\\raktar\\Fuvarok\\EKAEREK\\EKAEREK 2025-2026\\LOG341 OK';
console.log('Dir exists?', fs.existsSync(dirPath));
if (fs.existsSync(dirPath)) {
  console.log('Contents:', fs.readdirSync(dirPath));
}
