const { parentPort, workerData } = require('worker_threads');
const sqlite3 = require('better-sqlite3');
const winston = require('winston');

const following = workerData.following;
const ms = (workerData.minInterval * 60 * 1000) / 3;
// eslint-disable-next-line no-unused-vars
const interval = setInterval(updateAccounts, ms, parentPort);
const peerTableName = 'peers';
const peerTableColumns = {
  handle: 'TEXT',
  url: 'TEXT',
  // eslint-disable-next-line camelcase
  last_seen: 'INTEGER',
  // eslint-disable-next-line camelcase
  last_post: 'INTEGER',
};
const dbSource = './uxuyu.db';
const db = new sqlite3(dbSource, {
  verbose: null,
});
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'uxuyu' },
  transports: [new winston.transports.File({ filename: 'Uxuyu.log' })],
});
let selectAllPeersStmt = '';

try {
  createTableIfMissing(peerTableName, peerTableColumns);

  // Now that we definitely have a database, we can start using it
  const peerSql = prepareSqlStatements(
    peerTableColumns,
    'last_seen = ?, last_post = ? WHERE url = ?'
  );

  selectAllPeersStmt = peerSql.selectAll;

  parentPort.on('message', (contents) => {
    if (contents.type === 'peers') {
      const userDict = contents.data;
      const handles = Object.keys(userDict);

      handles.forEach((h) => {
        try {
          const peer = peerSql.check.get(h);
          const user = userDict[h];

          if (peer === null || typeof peer === 'undefined') {
            peerSql.insert.run(h, user.url, Date.now().valueOf(), 0);
          } else if (Object.prototype.hasOwnProperty.call(user, 'messages')) {
            const lastPost =
              user.messages.length === 0
                ? 0
                : Math.max(...user.messages.map((m) => m.date.valueOf()));

            peerSql.update.run(user.lastSeen, lastPost, user.url);
          }
        } catch (he) {
          logger.error('Unable to update database');
          logger.error(JSON.stringify(userDict[h]));
          logger.error(JSON.stringify(he));
        }
      });
    }
  });

  updateAccounts(parentPort);
} catch (e) {
  logger.error(e);
}

function createTableIfMissing(tableName, tableSpec) {
  const hasTableStmt = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
  );
  const hasTable = hasTableStmt.all();

  if (hasTable.length === 0) {
    const columns = Object.keys(tableSpec)
      .map((k) => ` ${k} ${tableSpec[k]}`)
      .join(', ');
    const createTableStmt = db.prepare(
      `CREATE TABLE ${tableName} (${columns});`
    );
    createTableStmt.run();
  }
}

function prepareSqlStatements(tableColumns, updateString) {
  const columns = Object.keys(tableColumns).join(', ');
  const checkPeerStmt = db.prepare(
    `SELECT ${columns} FROM ${peerTableName} WHERE handle = ?`
  );
  const insPeerStmt = db.prepare(
    `INSERT INTO ${peerTableName} (${columns}) VALUES (?, ?, ?, ?)`
  );
  const updPeerStmt = db.prepare(`UPDATE ${peerTableName} SET ${updateString}`);
  const selectAllPeersStmt = db.prepare(
    `SELECT ${columns} FROM ${peerTableName}`
  );
  return {
    check: checkPeerStmt,
    insert: insPeerStmt,
    selectAll: selectAllPeersStmt,
    update: updPeerStmt,
  };
}

function updateAccounts(parentPort) {
  const peers = {};

  try {
    selectAllPeersStmt.all().forEach((r) => {
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
