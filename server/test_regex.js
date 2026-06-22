const path = require('path');
const filePath = '\\\\192.168.1.5\\raktar\\Fuvarok\\Fuvarmegbízás\\25-26\\PAP\\PAP LOG362.docx';
const normalizedFilePath = filePath.replace(/\\/g, '/');

const raktarPrefixPatterns = [
  /^\/\/192\.168\.\d+\.\d+\/raktar\//i,
  /^\\\\192\.168\.\d+\.\d+\\raktar\\/i,
  /^[A-Z]:\\raktar\\/i,
];

console.log('filePath:', filePath);
console.log('normalized:', normalizedFilePath);

let replaced = false;
let resolvedPath = filePath;
const raktarPath = '/mnt/raktar';

for (const pattern of raktarPrefixPatterns) {
  if (pattern.test(filePath) || pattern.test(normalizedFilePath)) {
    console.log('Matched pattern:', pattern);
    resolvedPath = path.join(raktarPath, normalizedFilePath.replace(pattern, ''));
    replaced = true;
    break;
  }
}
console.log('resolvedPath:', resolvedPath);
