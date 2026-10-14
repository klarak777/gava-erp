const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
function configuration(env = process.env) {
  const missing = [];
  for (const field of ['HOST', 'USERNAME', 'DIRECTORY', 'HOST_SHA256']) if (!env['ALDI_ASN_SFTP_' + field]) missing.push(field);
  if (!env.ALDI_ASN_SFTP_PASSWORD && !env.ALDI_ASN_SFTP_PRIVATE_KEY_PATH) missing.push('AUTHENTICATION');
  if (!/^\/(?!.*(?:^|\/)\.\.(?:\/|$))/.test(env.ALDI_ASN_SFTP_DIRECTORY || '')) missing.push('ABSOLUTE_DIRECTORY');
  const port = Number(env.ALDI_ASN_SFTP_PORT || 22);
  if (!Number.isInteger(port) || port < 1 || port > 65535) missing.push('PORT');
  return { enabled: env.ALDI_ASN_SFTP_ENABLED === 'true', liveEnabled: env.ALDI_ASN_LIVE_ENABLED === 'true', ready: !missing.length, missing, port };
}
function createTransport(asn, { env = process.env, clientFactory } = {}) {
  const db = asn.db;
  let busy = false;
  const status = () => configuration(env);
  async function send(message) {
    const config = configuration(env);
    let client, renameStarted = false;
    try {
      client = clientFactory ? clientFactory() : new (require('ssh2-sftp-client'))('Gava Warehouse ASN');
      const expected = env.ALDI_ASN_SFTP_HOST_SHA256.replace(/^SHA256:/, '').replace(/=+$/, '');
      await client.connect({ host: env.ALDI_ASN_SFTP_HOST, port: config.port, username: env.ALDI_ASN_SFTP_USERNAME,
        password: env.ALDI_ASN_SFTP_PRIVATE_KEY_PATH ? undefined : env.ALDI_ASN_SFTP_PASSWORD,
        privateKey: env.ALDI_ASN_SFTP_PRIVATE_KEY_PATH ? await fs.readFile(env.ALDI_ASN_SFTP_PRIVATE_KEY_PATH) : undefined,
        passphrase: env.ALDI_ASN_SFTP_KEY_PASSPHRASE, readyTimeout: 20000,
        hostVerifier: key => { const actual = crypto.createHash('sha256').update(key).digest('base64').replace(/=+$/, ''); return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected)); } });
      const remote = path.posix.join(env.ALDI_ASN_SFTP_DIRECTORY, message.filename);
      if (await client.exists(remote)) {
        const stat = await client.stat(remote);
        if (Number(stat.size) !== message.raw_bytes.length) throw new Error('REMOTE_COLLISION');
        const existing = await client.get(remote);
        if (!Buffer.isBuffer(existing) || crypto.createHash('sha256').update(existing).digest('hex') !== message.sha256) throw new Error('REMOTE_COLLISION');
      } else {
        await client.put(message.raw_bytes, remote + '.part');
        renameStarted = true;
        await client.rename(remote + '.part', remote);
      }
      return { state: 'sent', description: 'ASN továbbítva SFTP-n; az ALDI üzleti befogadása még nem igazolt.' };
    } catch (_) {
      return renameStarted
        ? { state: 'uncertain', description: 'A kézbesítés eredménye bizonytalan. Egyeztetés szükséges; automatikus újraküldés nincs.' }
        : { state: 'retry', description: 'Az ASN SFTP továbbítása sikertelen; kapcsolat, jogosultság, szerverkulcs vagy fájlütközés ellenőrzése szükséges.' };
    } finally { try { await client?.end(); } catch (_) { /* no credentials in errors */ } }
  }
  async function process() {
    const config = status();
    if (busy || !config.enabled || !config.ready) return { processed: 0, ...config };
    const profile = await asn.getProfile();
    if (!profile.confirmed || !profile.quantityConfirmed) return { processed: 0, reason: 'A partneri profil és a GTIN/karton mennyiségi egység nincs visszaigazolva.' };
    busy = true;
    let processed = 0;
    try {
      // A previous process may have died after remote publication. Never silently resend that payload.
      await db.transaction(async trx => {
        const stale = await trx('aldi_asn_jobs').where('state', 'sending').where('last_attempt_at', '<', new Date(Date.now() - 5 * 60000)).forUpdate().skipLocked();
        for (const j of stale) {
          await trx('aldi_asn_jobs').where({ message_id: j.message_id }).update({ state: 'uncertain', error: 'A küldő folyamat megszakadt; a kézbesítés ellenőrzendő.' });
          const m = await trx('aldi_asn_messages').where({ id: j.message_id }).first();
          await asn.event(trx, m.shipment_id, m.id, 'uncertain', 'Megszakadt küldési folyamat; automatikus ismétlés leállítva.');
        }
      });
      for (let index = 0; index < 20; index++) {
        const message = await db.transaction(async trx => {
          const profile = await asn.getProfile(trx);
          if (!profile.confirmed || !profile.quantityConfirmed) return null;
          const jobs = await trx('aldi_asn_jobs as j').join('aldi_asn_messages as m', 'm.id', 'j.message_id')
            .whereIn('j.state', ['queued', 'retry']).where('j.attempts', '<', 5).where('j.next_attempt_at', '<=', trx.fn.now())
            .orderBy('m.id').select('m.*', 'j.attempts').forUpdate('j').skipLocked();
          const m = jobs.find(m => {
            const routing = profile.destinations?.find(d => d.name === m.snapshot.destination) || profile;
            return (m.profile.mode !== 'live' || config.liveEnabled) && ['sender', 'supplier', 'syntax', 'mode', 'variant', 'requireLot', 'requiredDateType'].every(k => m.profile[k] === profile[k]) && m.profile.receiver === routing.receiver && m.profile.buyer === routing.buyer;
          });
          if (!m) return null;
          await trx('aldi_asn_jobs').where({ message_id: m.id }).update({ state: 'sending', attempts: m.attempts + 1, last_attempt_at: trx.fn.now(), error: null });
          await asn.event(trx, m.shipment_id, m.id, 'sending', 'ASN továbbítása elindult.', { attempt: m.attempts + 1 });
          return m;
        });
        if (!message) break;
        const result = await send(message);
        await db.transaction(async trx => {
          const exhausted = result.state === 'retry' && message.attempts + 1 >= 5;
          const state = exhausted ? 'failed' : result.state;
          await trx('aldi_asn_jobs').where({ message_id: message.id }).update({ state, error: state === 'sent' ? null : result.description, next_attempt_at: new Date(Date.now() + Math.min(60, 2 ** message.attempts) * 60000) });
          await asn.event(trx, message.shipment_id, message.id, state, result.description);
        });
        processed++;
      }
      return { processed };
    } finally { busy = false; }
  }
  function start() {
    if (!status().enabled) return null;
    const timer = setInterval(() => process().catch(() => console.error('[ALDI ASN] A küldési napló feldolgozása sikertelen.')), 10000);
    timer.unref(); return timer;
  }
  return { process, start, status };
}
module.exports = { configuration, createTransport };
