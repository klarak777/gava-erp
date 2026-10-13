const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { configuration, createPoller } = require('../src/services/aldiEdiSftp');
const { interchange } = require('./helpers/aldiEdiFixtures.cjs');

const key = Buffer.from('test-ssh-public-host-key');
const configured = () => ({ ALDI_EDI_TEST_SFTP_ENABLED: 'true', ALDI_EDI_SFTP_HOST: 'test.local', ALDI_EDI_SFTP_USERNAME: 'test', ALDI_EDI_SFTP_PASSWORD: 'DO-NOT-LOG', ALDI_EDI_SFTP_DIRECTORY: '/orders', ALDI_EDI_SFTP_HOST_SHA256: 'SHA256:' + crypto.createHash('sha256').update(key).digest('base64'), ALDI_EDI_CHANGE_MODE: 'delta', ALDI_EDI_TEST_SENDER: '4012345000009', ALDI_EDI_TEST_RECEIVER: '4012345000016', ALDI_EDI_TEST_SUPPLIER: '5013546350114' });

test('SFTP is disabled by default with hourly interval and requires all connection data', () => {
  assert.equal(configuration({}).enabled, false);
  assert.equal(configuration({}).intervalMinutes, 60);
  assert.equal(configuration({}).ready, false);
  assert.equal(configuration(configured()).ready, true);
  assert.equal(configuration({ ...configured(), ALDI_EDI_POLL_MINUTES: '0' }).ready, false);
});

test('SFTP pins server identity, preserves bytes, sorts files and reaches beyond 100 older files', async () => {
  const bytes = interchange(), receives = [], events = [], calls = [];
  const archive = { db: {}, event: async (_db, _id, status) => events.push(status), receive: async (b, name, profile, source) => { assert.deepEqual(b, bytes); receives.push({ name, profile, source }); return { status: 'processed' }; } };
  const client = {
    connect: async options => { assert.equal(options.hostVerifier(key), true); assert.equal(options.hostVerifier(Buffer.from('wrong')), false); calls.push('connect'); },
    list: async () => [...Array.from({ length: 101 }, (_, i) => ({ type: '-', name: `${i}.edi`, size: bytes.length, modifyTime: 101 - i })), { type: 'd', name: 'folder.edi' }, { type: '-', name: 'ignored.pdf' }],
    get: async (remote, destination) => { calls.push(remote); await pipeline(Readable.from([bytes]), destination); },
    end: async () => calls.push('end')
  };
  const poller = createPoller(archive, { env: configured(), clientFactory: () => client });
  const result = await poller.poll();
  assert.equal(result.received, 101);
  assert.equal(receives[0].name, '100.edi');
  assert.equal(receives[100].source, 'sftp');
  assert.deepEqual(events, ['sftp_poll']);
  assert.equal(calls.at(-1), 'end');
  assert.equal(poller.status().running, false);
  assert.ok(!JSON.stringify(poller.status()).includes('DO-NOT-LOG'));
});

test('SFTP transfer failure is recorded without secrets and always closes session', async () => {
  const events = [];
  let ended = false;
  const archive = { db: {}, event: async (_db, _id, status, description) => events.push({ status, description }) };
  const poller = createPoller(archive, { env: configured(), clientFactory: () => ({ connect: async () => { throw new Error('DO-NOT-LOG private credential'); }, end: async () => { ended = true; } }) });
  await assert.rejects(poller.poll(), /naplóba/);
  assert.equal(ended, true);
  assert.equal(poller.status().running, false);
  assert.equal(events[0].status, 'sftp_failed');
  assert.ok(!JSON.stringify(events).includes('DO-NOT-LOG'));
});

test('SFTP rejects oversize files and detects size changes during download', async () => {
  const bytes = interchange(), events = [];
  const archive = { db: {}, event: async (_db, _id, status) => events.push(status), receive: async () => assert.fail('Changed transfer must not be processed') };
  const poller = createPoller(archive, { env: configured(), clientFactory: () => ({
    connect: async () => {}, list: async () => [{ type: '-', name: 'big.edi', size: 6 * 1024 * 1024, modifyTime: 1 }, { type: '-', name: 'changing.edi', size: bytes.length + 1, modifyTime: 2 }],
    get: async (_remote, destination) => pipeline(Readable.from([bytes]), destination), end: async () => {}
  }) });
  await assert.rejects(poller.poll());
  assert.deepEqual(events, ['sftp_file_rejected', 'sftp_failed']);
});
