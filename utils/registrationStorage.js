const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const filePath = path.join(dataDir, 'registrations.json');
const backupsDir = path.join(dataDir, 'backups');
const MAX_BACKUPS = 10;


if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

function safeReadJSON(fp) {
  try {
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`safeReadJSON: error reading ${fp}:`, err.message);
    return null;
  }
}


function removeExpiredRegistrations(map, log = true) {
  const now = Date.now();
  let removed = 0;

  for (const [plate, data] of map.entries()) {
    if (data.expiresAt && data.expiresAt < now) {
      map.delete(plate);
      removed++;
    }
  }

  if (removed > 0 && log) {
    console.log(`🧹 Removed ${removed} expired registrations.`);
  }

  return removed;
}

function loadRegistrations() {
 
  const main = safeReadJSON(filePath);
  let map;

  if (main && typeof main === 'object') {
    map = new Map(
      Object.entries(main).map(([k, v]) => [k.toLowerCase(), v])
    );
  } else {
    
    const backups = fs.readdirSync(backupsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ f, t: fs.statSync(path.join(backupsDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);

    for (const b of backups) {
      const data = safeReadJSON(path.join(backupsDir, b.f));
      if (data && typeof data === 'object') {
        console.warn(`Main registrations.json missing/corrupt — loaded backup ${b.f}`);
        map = new Map(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
        break;
      }
    }

    
    if (!map) {
      map = new Map();
    }
  }

  
  removeExpiredRegistrations(map);

  return map;
}

function _writeAtomic(fp, content) {
  const tmp = fp + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, fp);
}

function pruneBackups() {
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ f, t: fs.statSync(path.join(backupsDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);

  while (files.length > MAX_BACKUPS) {
    const last = files.pop();
    try { fs.unlinkSync(path.join(backupsDir, last.f)); } catch (e) { /* ignore */ }
  }
}

function saveRegistrations(map) {
  const obj = Object.fromEntries(map);
  const content = JSON.stringify(obj, null, 2);

  try {
    _writeAtomic(filePath, content);
  } catch (err) {
    console.warn('Failed to write registrations.json:', err);
  }

  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `registrations-${stamp}.json`;
    fs.writeFileSync(path.join(backupsDir, backupName), content, 'utf8');
    pruneBackups();
  } catch (err) {
    console.warn('Failed to write backup:', err);
  }
}

module.exports = {
  loadRegistrations,
  saveRegistrations,
  removeExpiredRegistrations 
};
