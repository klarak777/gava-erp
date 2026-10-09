const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createEmployeeDocumentStorage } = require('../src/services/employeeDocumentStorage');

function fixture(platform = 'win32', env = {}) {
  const data = new Map(), directories = new Set();
  const calls = [], failures = {};
  const base = platform === 'win32' ? '\\\\192.168.1.5\\raktar' : '/mnt/raktar';
  directories.add(base);
  let mountInfo = '12 1 0:1 / / rw - ext4 /dev/root rw\n42 12 0:2 / /mnt/raktar rw - cifs //192.168.1.5/raktar rw';
  const error = code => Object.assign(new Error(code), { code });
  const files = {
    async stat(file) {
      if (failures.stat) throw error(failures.stat);
      if (directories.has(file)) return { isDirectory: () => true, isFile: () => false };
      if (data.has(file)) return { isDirectory: () => false, isFile: () => true, size: data.get(file).length };
      throw error('ENOENT');
    },
    async mkdir(file) { calls.push(['mkdir', file]); directories.add(file); },
    async writeFile(file, content, options) {
      calls.push(['write', file]);
      if (options?.flag === 'wx' && data.has(file)) throw error('EEXIST');
      data.set(file, Buffer.from(content));
    },
    async readFile(file) {
      if (file === '/proc/self/mountinfo') return mountInfo;
      if (!data.has(file)) throw error('ENOENT');
      return data.get(file);
    },
    async unlink(file) {
      calls.push(['unlink', file]);
      if (failures.unlink) throw error(failures.unlink);
      if (!data.delete(file)) throw error('ENOENT');
    }
  };
  const storage = createEmployeeDocumentStorage({ platform, env, files, uuid: () => 'unique-file' });
  return { storage, data, directories, calls, failures, setMountInfo: value => { mountInfo = value; } };
}
const uploadFile = { originalname: 'contract.pdf', buffer: Buffer.from('document content') };

test('Windows upload uses the exact UNC employee-ID directory and never a local drive', async () => {
  const f = fixture();
  const doc = await f.storage.save('17', uploadFile, 'Szerződés');
  assert.equal(doc.file_path, '\\\\192.168.1.5\\raktar\\Gava Hungria System\\ERP Dolgozók\\17\\Szerződés.pdf');
  assert.deepEqual(f.data.get(doc.file_path), uploadFile.buffer);
  assert.equal(await f.storage.readablePath({ ...doc, employee_id: 17 }), doc.file_path);
  const restore = await f.storage.remove({ ...doc, employee_id: 17 });
  assert.equal(f.data.has(doc.file_path), false);
  await restore();
  assert.deepEqual(f.data.get(doc.file_path), uploadFile.buffer);
});

test('unavailable share or local Windows configuration fails without any mkdir or write', async () => {
  const inaccessible = fixture(); inaccessible.failures.stat = 'EACCES';
  await assert.rejects(inaccessible.storage.save('1', uploadFile), { status: 503 });
  assert.equal(inaccessible.calls.length, 0);
  const local = fixture('win32', { RAKTAR_PATH: 'C:\\192.168.1.5\\raktar' });
  await assert.rejects(local.storage.save('1', uploadFile), { status: 503 });
  assert.equal(local.calls.length, 0);
});

test('Linux requires the real SMB mount and translates existing UNC records to it', async () => {
  const mounted = fixture('linux');
  const doc = await mounted.storage.save('1', uploadFile);
  assert.equal(doc.file_path, '/mnt/raktar/Gava Hungria System/ERP Dolgozók/1/contract.pdf');
  const windowsRecord = { ...doc, employee_id: 1, file_path: '\\\\192.168.1.5\\raktar\\Gava Hungria System\\ERP Dolgozók\\1\\contract.pdf' };
  assert.equal(await mounted.storage.readablePath(windowsRecord), doc.file_path);
  for (const mountInfo of [
    '12 1 0:1 / / rw - ext4 /dev/root rw',
    '12 1 0:1 / /mnt/raktar rw - ext4 /dev/root rw',
    '12 1 0:1 / /mnt/raktar rw - cifs //other-server/raktar rw'
  ]) {
    const missing = fixture('linux'); missing.setMountInfo(mountInfo);
    await assert.rejects(missing.storage.save('1', uploadFile), { status: 503 });
    assert.equal(missing.calls.length, 0);
  }
});

test('duplicate names keep both documents and traversal or wrong-owner paths are rejected', async () => {
  const f = fixture();
  const first = await f.storage.save('1', uploadFile);
  const second = await f.storage.save('1', { ...uploadFile, buffer: Buffer.from('second document') });
  assert.notEqual(first.file_path, second.file_path);
  assert.deepEqual(f.data.get(first.file_path), uploadFile.buffer);
  assert.equal(f.data.get(second.file_path).toString(), 'second document');
  await assert.rejects(f.storage.save('../2', uploadFile), { status: 400 });
  await assert.rejects(f.storage.save('1', uploadFile, '../other'), { status: 400 });
  assert.throws(() => f.storage.storedPath({ ...first, employee_id: 2 }), { status: 400 });
  assert.throws(() => f.storage.storedPath({ employee_id: 1, file_path: 'C:\\unrelated\\file.pdf' }), { status: 400 });
});

test('known legacy local documents remain readable without changing their records', async () => {
  const f = fixture();
  const doc = { employee_id: 1, file_path: 'C:\\192.168.1.5\\raktar\\Gava Hungria System\\ERP\\1\\old.pdf' };
  f.data.set(doc.file_path, uploadFile.buffer);
  assert.equal(await f.storage.readablePath(doc), doc.file_path);
});

function routeFixture(storageFixture = fixture()) {
  let tables = { employees: [{ id: 1 }], employee_documents: [], employee_history: [] };
  const failures = {}, handlers = {};
  function db(table) {
    const filters = []; let first = false, insert;
    const rows = () => (tables[table] || []).filter(row => filters.every(filter => filter(row)));
    const query = {
      where(values) { for (const [key, value] of Object.entries(values)) filters.push(row => String(row[key]) === String(value)); return this; },
      select() { return this; }, orderBy() { return this; }, forUpdate() { return this; },
      first() { first = true; return this; }, returning() { return this; },
      insert(values) { insert = values; return this; },
      async del() { const selected = new Set(rows()); tables[table] = tables[table].filter(row => !selected.has(row)); return selected.size; },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          if (insert) {
            const added = { ...insert, id: (tables[table]?.length || 0) + 1 };
            tables[table].push(added); return [added];
          }
          return first ? rows()[0] : rows();
        }).then(resolve, reject);
      }
    };
    return query;
  }
  db.fn = { now: () => 'now' };
  db.transaction = async action => {
    const snapshot = structuredClone(tables);
    try { const result = await action(db); if (failures.commit) throw new Error('commit failed'); return result; }
    catch (error) { tables = snapshot; throw error; }
  };
  const multer = () => ({ single: () => (_req, _res, next) => next() }); multer.memoryStorage = () => ({});
  const router = { use() {} };
  for (const method of ['get', 'post', 'put', 'delete']) router[method] = (url, ...callbacks) => { handlers[`${method} ${url}`] = callbacks.at(-1); };
  const sourceFile = path.resolve(__dirname, '../src/routes/employees.js');
  const mocks = {
    express: { Router: () => router }, multer, '../db/db': db,
    '../services/employeeDocumentStorage': { createEmployeeDocumentStorage: () => storageFixture.storage }
  };
  vm.runInNewContext(fs.readFileSync(sourceFile, 'utf8'), {
    require: name => mocks[name] || require(name.startsWith('.') ? path.resolve(path.dirname(sourceFile), name) : name),
    module: {}, process, console: { error() {} }
  });
  const invoke = async (route, request = {}) => {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; }, sendFile(destination) { this.destination = destination; } };
    await handlers[route]({ params: { id: '1', docId: '1' }, body: {}, user: { name: 'Operator' }, ...request }, res);
    return res;
  };
  return { invoke, storageFixture, failures, tables: () => tables };
}

test('upload, retrieval and deletion routes use the same network file and persist history', async () => {
  const r = routeFixture();
  const response = await r.invoke('post /:id/documents', { file: uploadFile });
  assert.equal(response.code, 200);
  assert.equal(r.tables().employee_documents.length, 1);
  const retrieval = await r.invoke('get /:id/documents/:docId');
  assert.equal(retrieval.destination, response.data.file_path);
  assert.equal((await r.invoke('delete /:id/documents/:docId')).code, 200);
  assert.equal(r.tables().employee_documents.length, 0);
  assert.equal(r.storageFixture.data.size, 0);
  assert.equal(r.tables().employee_history.length, 2);
});

test('failed network upload or missing employee creates no document or local file', async () => {
  const r = routeFixture(); r.storageFixture.failures.stat = 'EACCES';
  assert.equal((await r.invoke('post /:id/documents', { file: uploadFile })).code, 503);
  assert.equal(r.tables().employee_documents.length, 0);
  assert.equal(r.storageFixture.calls.length, 0);
  const missing = await r.invoke('post /:id/documents', { params: { id: '999' }, file: uploadFile });
  assert.equal(missing.code, 404); assert.equal(r.storageFixture.calls.length, 0);
});

test('upload database failure removes only the newly written file', async () => {
  const r = routeFixture(); r.failures.commit = true;
  const response = await r.invoke('post /:id/documents', { file: uploadFile });
  assert.equal(response.code, 500); assert.equal(r.storageFixture.data.size, 0);
  assert.equal(r.tables().employee_documents.length, 0);
});

test('physical deletion failure keeps both database record and file', async () => {
  const r = routeFixture(); await r.invoke('post /:id/documents', { file: uploadFile });
  r.storageFixture.failures.unlink = 'EACCES';
  assert.equal((await r.invoke('delete /:id/documents/:docId')).code, 500);
  assert.equal(r.tables().employee_documents.length, 1);
  assert.equal(r.storageFixture.data.size, 1); assert.equal(r.tables().employee_history.length, 1);
});

test('deletion database failure restores the removed file and retains its record', async () => {
  const r = routeFixture(); await r.invoke('post /:id/documents', { file: uploadFile });
  r.failures.commit = true;
  assert.equal((await r.invoke('delete /:id/documents/:docId')).code, 500);
  assert.equal(r.tables().employee_documents.length, 1);
  assert.deepEqual([...r.storageFixture.data.values()][0], uploadFile.buffer);
});

test('a shared file is removed only after its final reference; wrong employee cannot delete it', async () => {
  const r = routeFixture(); await r.invoke('post /:id/documents', { file: uploadFile });
  r.tables().employee_documents.push({ ...r.tables().employee_documents[0], id: 2 });
  const wrong = await r.invoke('delete /:id/documents/:docId', { params: { id: '2', docId: '1' } });
  assert.equal(wrong.code, 404);
  assert.equal((await r.invoke('delete /:id/documents/:docId')).code, 200);
  assert.equal(r.storageFixture.data.size, 1);
  assert.equal((await r.invoke('delete /:id/documents/:docId', { params: { id: '1', docId: '2' } })).code, 200);
  assert.equal(r.storageFixture.data.size, 0);
});
