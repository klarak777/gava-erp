const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { Server, utils } = require('ssh2');
const { createPoller } = require('../src/services/aldiEdiSftp');
const { parseOrders } = require('../src/services/aldiEdiOrders');
const { interchange } = require('./helpers/aldiEdiFixtures.cjs');

test('real local SSH/SFTP connection downloads ORDERS with agreed non-GLN test identifiers', { timeout: 20000 }, async t => {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, privateKeyEncoding: { type: 'pkcs1', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' }
  });
  const hostPublicKey = utils.parseKey(privateKey).getPublicSSH();
  const bytes = Buffer.from(interchange().toString('latin1')
    .replace('4012345000016:14', 'GAVA-SFTP-TEST:ZZZ')
    .replace('5013546350114::9', 'GAVA-SUPPLIER-TEST::ZZZ'), 'latin1');
  const { STATUS_CODE } = utils.sftp;
  const attrs = { mode: 0o100644, uid: 1000, gid: 1000, size: bytes.length, atime: 1760000000, mtime: 1760000000 };
  const connections = new Set();
  const ssh = new Server({ hostKeys: [privateKey] }, client => {
    connections.add(client);
    client.on('error', () => {});
    client.on('close', () => connections.delete(client));
    client.on('authentication', ctx => {
      if (ctx.method === 'password' && ctx.username === 'edi-test' && ctx.password === 'local-test-only') ctx.accept();
      else ctx.reject();
    });
    client.on('ready', () => client.on('session', accept => {
      const session = accept();
      session.on('sftp', acceptSftp => {
        const stream = acceptSftp();
        let nextHandle = 1;
        const handles = new Map();
        const handleFor = value => { const handle = Buffer.alloc(4); handle.writeUInt32BE(nextHandle++); handles.set(handle.toString('hex'), value); return handle; };
        stream.on('REALPATH', (id, remote) => stream.name(id, [{ filename: remote, longname: remote, attrs }]));
        stream.on('OPENDIR', (id, remote) => remote === '/orders' ? stream.handle(id, handleFor({ directory: true, listed: false })) : stream.status(id, STATUS_CODE.NO_SUCH_FILE));
        stream.on('READDIR', (id, handle) => {
          const state = handles.get(handle.toString('hex'));
          if (!state?.directory) return stream.status(id, STATUS_CODE.FAILURE);
          if (state.listed) return stream.status(id, STATUS_CODE.EOF);
          state.listed = true;
          stream.name(id, [{ filename: 'test-order.edi', longname: '-rw-r--r-- 1 test test ' + bytes.length + ' Oct 13 12:00 test-order.edi', attrs }]);
        });
        stream.on('OPEN', (id, remote, flags) => {
          if (remote !== '/orders/test-order.edi') return stream.status(id, STATUS_CODE.NO_SUCH_FILE);
          if (flags !== utils.sftp.OPEN_MODE.READ) return stream.status(id, STATUS_CODE.PERMISSION_DENIED);
          stream.handle(id, handleFor({ file: true }));
        });
        for (const method of ['STAT', 'LSTAT']) stream.on(method, (id, remote) => {
          if (remote === '/orders/test-order.edi') stream.attrs(id, attrs);
          else if (remote === '/orders') stream.attrs(id, { ...attrs, mode: 0o40755, size: 0 });
          else stream.status(id, STATUS_CODE.NO_SUCH_FILE);
        });
        stream.on('FSTAT', (id, handle) => handles.get(handle.toString('hex'))?.file ? stream.attrs(id, attrs) : stream.status(id, STATUS_CODE.FAILURE));
        stream.on('READ', (id, handle, offset, length) => {
          if (!handles.get(handle.toString('hex'))?.file) return stream.status(id, STATUS_CODE.FAILURE);
          if (offset >= bytes.length) return stream.status(id, STATUS_CODE.EOF);
          stream.data(id, bytes.subarray(offset, offset + length));
        });
        stream.on('CLOSE', (id, handle) => { handles.delete(handle.toString('hex')); stream.status(id, STATUS_CODE.OK); });
      });
    }));
  });
  await new Promise(resolve => ssh.listen(0, '127.0.0.1', resolve));
  t.after(async () => { for (const client of connections) client.end(); await new Promise(resolve => ssh.close(resolve)); });
  const received = [], events = [];
  const archive = {
    db: {}, event: async (_db, _file, status) => events.push(status),
    receive: async (raw, filename, profile, source) => {
      assert.deepEqual(raw, bytes);
      const parsed = parseOrders(raw, profile);
      received.push({ filename, source, parsed });
      return { fileId: '1', status: 'processed' };
    }
  };
  const env = {
    ALDI_EDI_TEST_SFTP_ENABLED: 'true', ALDI_EDI_SFTP_HOST: '127.0.0.1', ALDI_EDI_SFTP_PORT: String(ssh.address().port),
    ALDI_EDI_SFTP_USERNAME: 'edi-test', ALDI_EDI_SFTP_PASSWORD: 'local-test-only', ALDI_EDI_SFTP_DIRECTORY: '/orders',
    ALDI_EDI_SFTP_HOST_SHA256: 'SHA256:' + crypto.createHash('sha256').update(hostPublicKey).digest('base64'),
    ALDI_EDI_CHANGE_MODE: 'delta', ALDI_EDI_TEST_SENDER: '4012345000009', ALDI_EDI_TEST_RECEIVER: 'GAVA-SFTP-TEST', ALDI_EDI_TEST_SUPPLIER: 'GAVA-SUPPLIER-TEST'
  };
  const poller = createPoller(archive, { env });
  const result = await poller.poll();
  assert.equal(result.received, 1);
  assert.equal(result.failed, 0);
  assert.equal(received[0].parsed.envelope.receiverQualifier, 'ZZZ');
  assert.equal(received[0].parsed.messages[0].parties.SU.identifier, 'GAVA-SUPPLIER-TEST');
  assert.equal(received[0].source, 'sftp');
  assert.deepEqual(events, ['sftp_poll']);
  assert.equal(poller.status().running, false);
  // A wrong pinned key must reject the very same server.
  const wrongPin = createPoller(archive, { env: { ...env, ALDI_EDI_SFTP_HOST_SHA256: 'SHA256:wrong-key' } });
  await assert.rejects(wrongPin.poll(), /sikertelen/);
  assert.equal(received.length, 1);
  assert.equal(events.at(-1), 'sftp_failed');
});
