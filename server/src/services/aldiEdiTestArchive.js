const crypto = require('node:crypto');
const path = require('node:path');
const { parseOrders, applyOrderMessage, readableOriginal } = require('./aldiEdiOrders');

const MAX_BYTES = 5 * 1024 * 1024;
function createArchive(db) {
  const event = (connection, fileId, status, description, details = {}) => connection('aldi_edi_test_events').insert({ file_id: fileId, status, description, details: JSON.stringify(details) });
  async function processFile(file, retry = false) {
    try {
      const parsed = parseOrders(file.raw_bytes, file.profile);
      return await db.transaction(async trx => {
        await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', ['aldi-edi-test-processing']);
        const processed = await trx('aldi_edi_test_events').where({ file_id: file.id, status: 'processed' }).first();
        if (processed) {
          await event(trx, file.id, 'duplicate', 'Már feldolgozott üzenet ismételt feldolgozási kísérlete.', { retry, previousStatus: 'processed' });
          return { fileId: file.id, status: 'duplicate' };
        }
        await event(trx, file.id, 'processing', 'Feldolgozási kísérlet elindult.', { retry, profile: file.profile });
        const versions = [];
        for (const message of parsed.messages) {
          const replay = await trx('aldi_edi_test_versions').where({ sender: message.sender, receiver: message.receiver, control_reference: message.controlReference, message_reference: message.messageReference }).first();
          if (replay) throw new Error('Az UNB/UNH azonosítókat már másik fogadott üzenet használja.');
          const scope = { sender: message.sender, receiver: message.receiver, buyer: message.parties.BY.identifier, order_number: message.orderNumber };
          const previous = await trx('aldi_edi_test_versions').where(scope).orderBy('internal_version', 'desc').first();
          const snapshot = applyOrderMessage(previous?.snapshot, message, file.profile.mode);
          const [version] = await trx('aldi_edi_test_versions').insert({
            ...scope, file_id: file.id, message_reference: message.messageReference, control_reference: message.controlReference,
            internal_version: snapshot.internalVersion, snapshot: JSON.stringify(snapshot)
          }).returning('id');
          versions.push({ id: version.id, orderNumber: snapshot.orderNumber, version: snapshot.internalVersion, changes: snapshot.changes });
        }
        await event(trx, file.id, 'processed', 'ORDERS tesztüzenet feldolgozva és verziózott tesztrendelésként archiválva.', { retry, versions });
        return { fileId: file.id, status: 'processed', versions };
      });
    } catch (error) {
      const retryable = ['MISSING_PREVIOUS_ORDER', 'VERSION_GAP'].includes(error.code);
      await event(db, file.id, 'failed', error.message, { retry, retryable, errorCode: error.code || null });
      return { fileId: file.id, status: 'failed', error: error.message, retryable };
    }
  }
  async function receive(bytes, filename, profile, source = 'manual') {
    if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_BYTES) throw new Error('Az EDI tesztfájl mérete 1 bájt és 5 MB között legyen.');
    if (!['delta', 'full'].includes(profile.mode)) throw new Error('Válassz delta vagy full módosítási profilt.');
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const safeProfile = Object.fromEntries(['mode', 'sender', 'receiver', 'senderQualifier', 'receiverQualifier', 'supplier'].map(key => [key, String(profile[key] || '').trim()]));
    const [created] = await db('aldi_edi_test_files').insert({ filename: path.basename(filename).slice(0, 255), source, sha256, raw_bytes: bytes, profile: JSON.stringify(safeProfile) }).onConflict('sha256').ignore().returning('*');
    const file = created || await db('aldi_edi_test_files').where({ sha256 }).first();
    if (!created) {
      const last = await db('aldi_edi_test_events').where({ file_id: file.id }).whereNot('status', 'duplicate').orderBy('id', 'desc').first();
      if (last) {
        await event(db, file.id, 'duplicate', 'Azonos eredeti üzenet ismételt fogadása; új rendelésverzió nem keletkezett.', { source, filename: path.basename(filename).slice(0, 255), previousStatus: last.status });
        if (source === 'sftp' && last.status === 'failed' && last.details?.retryable) return processFile(file, true);
        return { fileId: file.id, status: 'duplicate', previousStatus: last.status };
      }
    }
    await event(db, file.id, 'received', 'Eredeti EDI fájl tartósan archiválva.', { sha256, source });
    return processFile(file);
  }
  async function list() {
    return db('aldi_edi_test_files as f')
      .leftJoin(db.raw("(SELECT DISTINCT ON (file_id) file_id, status, description FROM aldi_edi_test_events WHERE file_id IS NOT NULL AND status <> 'duplicate' ORDER BY file_id, id DESC) as e"), 'e.file_id', 'f.id')
      .select('f.id', 'f.filename', 'f.source', 'f.received_at', 'f.sha256', 'f.profile', 'e.status', 'e.description')
      .orderBy('f.id', 'desc').limit(100);
  }
  async function detail(id) {
    const file = await db('aldi_edi_test_files').where({ id }).first();
    if (!file) return null;
    const [events, versions] = await Promise.all([
      db('aldi_edi_test_events').where({ file_id: id }).orderBy('id'),
      db('aldi_edi_test_versions').where({ file_id: id }).orderBy('id')
    ]);
    const { raw_bytes, ...metadata } = file;
    return { ...metadata, originalText: readableOriginal(raw_bytes), events, versions };
  }
  return { db, receive, list, detail, event, processFile, MAX_BYTES };
}
module.exports = { createArchive, MAX_BYTES };
