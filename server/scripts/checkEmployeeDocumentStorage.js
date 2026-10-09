// A synthetic file verifies the configured share, read and delete without database writes.
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { createEmployeeDocumentStorage } = require('../src/services/employeeDocumentStorage');

async function main() {
  const employeeId = process.argv[2];
  const storage = createEmployeeDocumentStorage();
  const directory = storage.employeeDirectory(employeeId);
  await storage.requireShare();
  let directoryExisted = true;
  try { await fs.stat(directory); }
  catch (error) { if (error.code === 'ENOENT') directoryExisted = false; else throw error; }
  const filename = `__erp_storage_probe_${randomUUID()}.pdf`;
  const content = Buffer.from('%PDF-1.4\n% ERP storage test; no employee information\n%%EOF\n');
  let stored;
  try {
    stored = await storage.save(employeeId, { originalname: filename, buffer: content });
    const destination = await storage.readablePath({ ...stored, employee_id: employeeId });
    const read = await fs.readFile(destination);
    if (!content.equals(read)) throw new Error('A visszaolvasott tartalom eltér a tesztfájltól.');
    await storage.remove({ ...stored, employee_id: employeeId });
    stored = null;
    console.log(JSON.stringify({ directory, upload: 'ok', read: 'ok', delete: 'ok', databaseWrites: 0 }));
  } finally {
    if (stored) await storage.discard(stored);
    // rmdir removes only this newly created, empty ID folder, never recursively.
    if (!directoryExisted) await fs.rmdir(directory);
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
