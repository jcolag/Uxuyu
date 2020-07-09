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
  selectAllStmt = db.prepare(`SELECT ${columns} FROM ${tableName}`);

  parentPort.on('message', (userDict) => {
    const handles = Object.keys(userDict);

    handles.forEach((h) => {
      try {
        const peer = checkStmt.get(h);

        if (peer === null || typeof peer === 'undefined') {
          insStmt.run(h, userDict[h].url, Date.now().valueOf(), 0);
        }
      } catch (he) {
        logger.error(he);
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
