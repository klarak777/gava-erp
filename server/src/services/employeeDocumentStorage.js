const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const SHARE = '\\\\192.168.1.5\\raktar';
const FOLDER = ['Gava Hungria System', 'ERP Dolgozók'];

function createEmployeeDocumentStorage({ platform = process.platform, env = process.env, files = fs.promises, uuid = randomUUID } = {}) {
  const paths = platform === 'win32' ? path.win32 : path.posix;
  const base = env.RAKTAR_PATH || (platform === 'win32' ? SHARE : '/mnt/raktar');
  const root = paths.join(base, ...FOLDER);
  const inside = (parent, file) => {
    const relative = paths.relative(parent, file);
    return relative !== '' && relative !== '..' && !relative.startsWith(`..${paths.sep}`) && !paths.isAbsolute(relative);
  };
  const employeeDirectory = id => {
    if (!/^[1-9]\d*$/.test(String(id))) throw Object.assign(new Error('Érvénytelen dolgozóazonosító.'), { status: 400 });
    return paths.join(root, String(id));
  };
  async function requireShare() {
    try {
      if (platform === 'win32') {
        if (!/^\\\\[^\\]+\\[^\\]+/.test(paths.normalize(base))) throw new Error('Windows alatt UNC hálózati útvonal szükséges.');
      } else {
        if (!paths.isAbsolute(base) || base.startsWith('//')) throw new Error('Linux alatt csatolt Raktár-megosztás szükséges.');
        const decode = text => text.replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
        const mounts = String(await files.readFile('/proc/self/mountinfo', 'utf8')).trim().split('\n').map(line => {
          const [left, right] = line.split(' - ');
          const info = left.split(' '), tail = (right || '').split(' ');
          return { mount: decode(info[4] || ''), type: tail[0], source: decode(tail[1] || '') };
        }).filter(mount => base === mount.mount || inside(mount.mount, base)).sort((a, b) => b.mount.length - a.mount.length);
        const mount = mounts[0];
        if (!mount || !['cifs', 'smb3'].includes(mount.type) || mount.source.replace(/\\/g, '/').replace(/\/$/, '') !== '//192.168.1.5/raktar') {
          throw new Error('A /mnt/raktar útvonalhoz a //192.168.1.5/raktar SMB-megosztást kell csatolni.');
        }
      }
      const info = await files.stat(base);
      if (!info.isDirectory()) throw new Error('A Raktár megosztás nem könyvtár.');
    } catch (cause) {
      throw Object.assign(new Error('A Raktár hálózati megosztása nem érhető el vagy nincs megfelelően csatolva. A dokumentumot nem mentettük helyi mappába.'), { status: 503, cause });
    }
  }
  function filename(original, name) {
    const originalName = path.win32.basename(String(original || ''));
    const extension = path.win32.extname(originalName).toLowerCase();
    if (!['.pdf', '.png', '.jpg', '.jpeg'].includes(extension)) throw Object.assign(new Error('Csak PDF, PNG vagy JPG/JPEG dokumentum tölthető fel.'), { status: 400 });
    const label = String(name || '').trim();
    const final = label ? (label.toLowerCase().endsWith(extension) ? label : label + extension) : originalName;
    if (!final || /[<>:"/\\|?*\x00-\x1f]/.test(final) || /[. ]$/.test(final) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(final)) {
      throw Object.assign(new Error('Érvénytelen dokumentumnév.'), { status: 400 });
    }
    return final;
  }
  async function save(id, file, name) {
    const dir = employeeDirectory(id);
    const displayName = filename(file.originalname, name);
    await requireShare();
    await files.mkdir(dir, { recursive: true });
    let destination = paths.join(dir, displayName);
    try {
      await files.writeFile(destination, file.buffer, { flag: 'wx' });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const extension = paths.extname(displayName);
      destination = paths.join(dir, `${displayName.slice(0, -extension.length)}-${uuid()}${extension}`);
      await files.writeFile(destination, file.buffer, { flag: 'wx' });
    }
    return { file_name: displayName, file_path: destination };
  }
  function storedPath(doc) {
    const dir = employeeDirectory(doc.employee_id);
    let candidate = String(doc.file_path || '');
    // UNC records remain usable when the same share is mounted in Linux.
    if (platform !== 'win32' && candidate.replace(/\\/g, '/').startsWith('//192.168.1.5/raktar/')) {
      candidate = paths.join(base, candidate.replace(/\\/g, '/').slice('//192.168.1.5/raktar/'.length));
    }
    if (!paths.isAbsolute(candidate)) throw Object.assign(new Error('Érvénytelen dokumentumútvonal.'), { status: 400 });
    candidate = paths.normalize(candidate);
    // Keep known legacy documents readable until they are explicitly migrated.
    const oldNetworkDir = paths.join(base, 'Gava Hungria System', 'ERP', String(doc.employee_id));
    const oldLocalDir = paths.resolve(__dirname, '../../..', 'uploads', 'employees', String(doc.employee_id));
    const ghostBase = platform === 'win32' ? 'C:\\192.168.1.5\\raktar' : '/192.168.1.5/raktar';
    const legacyDirs = [oldNetworkDir, oldLocalDir, ...['ERP', 'ERP Dolgozók'].map(folder => paths.join(ghostBase, 'Gava Hungria System', folder, String(doc.employee_id)))];
    if (![dir, ...legacyDirs].some(parent => inside(parent, candidate))) {
      throw Object.assign(new Error('A dokumentum útvonala nem a dolgozó dokumentummappájába mutat.'), { status: 400 });
    }
    return candidate;
  }
  async function readablePath(doc) {
    const destination = storedPath(doc);
    if (inside(base, destination)) await requireShare();
    const info = await files.stat(destination);
    if (!info.isFile()) throw Object.assign(new Error('A dokumentum fájlja nem található.'), { code: 'ENOENT' });
    return destination;
  }
  async function remove(doc) {
    let destination;
    try { destination = await readablePath(doc); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    const buffer = await files.readFile(destination);
    await files.unlink(destination);
    // If the database transaction fails, restore exactly the removed file.
    return () => files.writeFile(destination, buffer, { flag: 'wx' });
  }
  return { root, employeeDirectory, requireShare, save, storedPath, readablePath, remove, discard: file => files.unlink(file.file_path) };
}

module.exports = { createEmployeeDocumentStorage };
