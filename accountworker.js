const { parentPort, workerData } = require('worker_threads');
const sqlite3 = require('better-sqlite3');
const winston = require('winston');

const following = workerData.following;
const ms = (workerData.minInterval * 60 * 1000) / 3;
// eslint-disable-next-line no-unused-vars
const interval = setInterval(updateAccounts, ms, parentPort);
const tableName = 'peers';
const dbSource = './uxuyu.db';
const db = new sqlite3(dbSource, {
  verbose: null,
});
const columns = 'handle, url, last_seen, last_post';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'uxuyu' },
  transports: [new winston.transports.File({ filename: 'Uxuyu.log' })],
});
let selectAllStmt = '';

try {
  const hasTableStmt = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
  );
  const hasTable = hasTableStmt.all();

  if (hasTable.length === 0) {
    const createTableStmt = db.prepare(
      `CREATE TABLE ${tableName} (
        handle TEXT,
        url TEXT,
        last_seen INTEGER,
        last_post INTEGER
      );`
    );
    createTableStmt.run();
  }

  // Now that we definitely have a database, we can start using it
  const checkStmt = db.prepare(
    `SELECT ${columns} FROM ${tableName} WHERE handle = ?`
  );
  const insStmt = db.prepare(
    `INSERT INTO ${tableName} (${columns}) VALUES (?, ?, ?, ?)`
  );
  const updStmt = db.prepare(
    `UPDATE ${tableName} SET last_seen = ?, last_post = ? WHERE url = ?`
  );
  selectAllStmt = db.prepare(`SELECT ${columns} FROM ${tableName}`);

  parentPort.on('message', (userDict) => {
    const handles = Object.keys(userDict);

    handles.forEach((h) => {
      try {
        const peer = checkStmt.get(h);
        const user = userDict[h];

        if (peer === null || typeof peer === 'undefined') {
          insStmt.run(h, user.url, Date.now().valueOf(), 0);
        } else if (Object.prototype.hasOwnProperty.call(user, 'messages')) {
          const lastPost =
            user.messages.length === 0
              ? 0
              : Math.max(...user.messages.map((m) => m.date.valueOf()));

          updStmt.run(user.lastSeen, lastPost, user.url);
        }
      } catch (he) {
        logger.error('Unable to update database');
        logger.error(JSON.stringify(userDict[h]));
        logger.error(JSON.stringify(he));
      }
    });
  });

  updateAccounts(parentPort);
} catch (e) {
  logger.error(e);
}

function updateAccounts(parentPort) {
  const peers = {};

  try {
    selectAllStmt.all().forEach((r) => {
      peers[r.handle] = {
        following: Object.prototype.hasOwnProperty.call(following, r.handle),
        handle: r.handle,
        lastPost: r.last_post,
        lastSeen: r.last_seen,
        url: r.url,
      };
    });
    parentPort.postMessage(peers);
  } catch (e) {}
}
