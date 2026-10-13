const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { MAX_BYTES } = require('./aldiEdiTestArchive');

function configuration(env = process.env) {
  const intervalMinutes = Number(env.ALDI_EDI_POLL_MINUTES || 60);
  const port = Number(env.ALDI_EDI_SFTP_PORT || 22);
  const enabled = env.ALDI_EDI_TEST_SFTP_ENABLED === 'true';
  const profile = { mode: env.ALDI_EDI_CHANGE_MODE || '', sender: env.ALDI_EDI_TEST_SENDER || '', receiver: env.ALDI_EDI_TEST_RECEIVER || '', supplier: env.ALDI_EDI_TEST_SUPPLIER || '' };
  const missing = [];
  for (const [key, value] of Object.entries({ host: env.ALDI_EDI_SFTP_HOST, username: env.ALDI_EDI_SFTP_USERNAME, directory: env.ALDI_EDI_SFTP_DIRECTORY, hostKey: env.ALDI_EDI_SFTP_HOST_SHA256, ...profile })) if (!value) missing.push(key);
  if (!env.ALDI_EDI_SFTP_PASSWORD && !env.ALDI_EDI_SFTP_PRIVATE_KEY_PATH) missing.push('authentication');
  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1 || intervalMinutes > 1440) missing.push('pollInterval');
  if (!Number.isInteger(port) || port < 1 || port > 65535) missing.push('port');
  if (!['delta', 'full'].includes(profile.mode)) missing.push('changeMode');
  return { enabled, intervalMinutes, port, profile, missing: [...new Set(missing)], ready: !missing.length, env };
}

function createPoller(archive, { env = process.env, clientFactory } = {}) {
  let running = false;
  let lastPoll = null, lastResult = null;
  const status = () => {
    const config = configuration(env);
    return { enabled: config.enabled, ready: config.ready, missing: config.missing, intervalMinutes: config.intervalMinutes, running, lastPoll, lastResult, scope: 'test' };
  };
  async function poll() {
    const config = configuration(env);
    if (!config.enabled || !config.ready) throw new Error('Az SFTP tesztkapcsolat nincs engedélyezve vagy hiányos a beállítása.');
    if (running) return { status: 'busy' };
    running = true;
    lastPoll = new Date().toISOString();
    let client;
    try {
      client = clientFactory ? clientFactory() : new (require('ssh2-sftp-client'))('ALDI EDI test');
      const privateKey = env.ALDI_EDI_SFTP_PRIVATE_KEY_PATH ? await fs.readFile(env.ALDI_EDI_SFTP_PRIVATE_KEY_PATH) : undefined;
      const expectedFingerprint = env.ALDI_EDI_SFTP_HOST_SHA256.replace(/^SHA256:/, '').replace(/=+$/, '');
      await client.connect({
        host: env.ALDI_EDI_SFTP_HOST, port: config.port, username: env.ALDI_EDI_SFTP_USERNAME,
        password: privateKey ? undefined : env.ALDI_EDI_SFTP_PASSWORD, privateKey, passphrase: env.ALDI_EDI_SFTP_KEY_PASSPHRASE,
        readyTimeout: 20000, hostVerifier: key => {
          const actual = crypto.createHash('sha256').update(key).digest('base64').replace(/=+$/, '');
          return actual.length === expectedFingerprint.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expectedFingerprint));
        }
      });
      const entries = (await client.list(env.ALDI_EDI_SFTP_DIRECTORY)).filter(entry => entry.type === '-' && /\.(edi|edifact|txt)$/i.test(entry.name)).sort((a, b) => a.modifyTime - b.modifyTime || a.name.localeCompare(b.name));
      const results = [];
      for (const entry of entries) {
        if (!entry.size || entry.size > MAX_BYTES || /[/\\]/.test(entry.name)) {
          await archive.event(archive.db, null, 'sftp_file_rejected', 'SFTP fájl méret vagy név miatt nem vehető át.', { filename: String(entry.name).slice(0, 255) });
          continue;
        }
        const remote = path.posix.join(env.ALDI_EDI_SFTP_DIRECTORY, entry.name);
        // Bound the download even if the server's advertised file size is wrong.
        const { Writable } = require('node:stream');
        let count = 0;
        const chunks = [];
        const destination = new Writable({ write(chunk, _encoding, callback) {
          count += chunk.length;
          if (count > MAX_BYTES) callback(new Error('Az SFTP fájl meghaladja az 5 MB korlátot.'));
          else { chunks.push(Buffer.from(chunk)); callback(); }
        } });
        await client.get(remote, destination);
        const bytes = Buffer.concat(chunks);
        if (bytes.length !== entry.size) throw new Error('Az SFTP fájl mérete letöltés közben megváltozott; új lekérés szükséges.');
        results.push(await archive.receive(bytes, entry.name, config.profile, 'sftp'));
      }
      lastResult = { status: 'completed', received: results.length, failed: results.filter(r => r.status === 'failed').length };
      await archive.event(archive.db, null, 'sftp_poll', 'Az SFTP tesztlekérés befejeződött.', lastResult);
      return { ...lastResult, results };
    } catch (_error) {
      lastResult = { status: 'failed' };
      // Do not persist library errors containing connection credentials or key paths.
      await archive.event(archive.db, null, 'sftp_failed', 'Az SFTP kapcsolat vagy átvétel sikertelen. Ellenőrizd a végpontot, hostkulcsot, jogosultságot és fájlméretet.');
      throw new Error('Az SFTP tesztlekérés sikertelen; a hiba a fogadási naplóba került.');
    } finally {
      try { await client?.end(); } catch (_) { /* original result is retained */ }
      running = false;
    }
  }
  function start() {
    const config = configuration(env);
    if (!config.enabled || !config.ready) return null;
    // Explicitly configured TEST connection only; remote files are never deleted or moved.
    const timer = setInterval(() => poll().catch(error => console.error('[ALDI EDI]', error.message)), config.intervalMinutes * 60000);
    timer.unref();
    return timer;
  }
  return { poll, start, status };
}
module.exports = { configuration, createPoller };
