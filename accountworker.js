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
const postTableName = 'posts';
const postTableColumns = {
  url: 'TEXT',
  timestamp: 'INTEGER',
  text: 'TEXT',
  version: 'INTEGER',
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
  createTableIfMissing(postTableName, postTableColumns);

  // Now that we definitely have a database, we can start using it
  const peerSql = prepareSqlStatements(
    peerTableName,
    peerTableColumns,
    'last_seen = ?, last_post = ? WHERE url = ?',
    'handle'
  );
  const postSql = prepareSqlStatements(
    postTableName,
    postTableColumns,
    'text = ? WHERE url = ? AND timestamp = ?',
    'url'
  );

  selectAllPeersStmt = peerSql.selectAll;

  parentPort.on('message', (contents) => {
    switch (contents.type) {
      case 'peers':
        {
          const userDict = contents.data;
          const handles = Object.keys(userDict);

          handles.forEach((h) => {
            try {
              const peer = peerSql.check.get(h);
              const user = userDict[h];

              if (peer === null || typeof peer === 'undefined') {
                peerSql.insert.run(h, user.url, Date.now().valueOf(), 0);
              } else if (
                Object.prototype.hasOwnProperty.call(user, 'messages')
              ) {
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
        break;
      case 'posts':
        {
            if (!workerData.shouldCachePosts) {
              return;
            }

          const userPosts = contents.data;
        }
        break;
      default:
        logger.error('Unknown database update');
        break;
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

function prepareSqlStatements(tableName, tableColumns, updateString, checkBy) {
  const columns = Object.keys(tableColumns).join(', ');
  const checkStmt = db.prepare(
    `SELECT ${columns} FROM ${tableName} WHERE ${checkBy} = ?`
  );
  const insStmt = db.prepare(
    `INSERT INTO ${tableName} (${columns}) VALUES (?, ?, ?, ?)`
  );
  const updStmt = db.prepare(`UPDATE ${tableName} SET ${updateString}`);
  const selectAllStmt = db.prepare(`SELECT ${columns} FROM ${tableName}`);
  return {
    check: checkStmt,
    insert: insStmt,
    selectAll: selectAllStmt,
    update: updStmt,
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
