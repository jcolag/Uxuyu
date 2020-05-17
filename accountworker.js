const fs = require('fs');
const {
  parentPort,
  workerData,
} = require('worker_threads');
const sqlite3 = require('better-sqlite3');

const ms = workerData.minInterval * 60 * 1000 / 3;
const interval = setInterval(statusCheck, ms, parentPort);
const tableName = 'peers';
const dbSource = './uxuyu.db';
const db = new sqlite3(dbSource, {
  verbose: console.log,
});

try {
  const hasTableStmt = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
  );
  const hasTable = hasTableStmt.all();

  console.log(JSON.stringify(hasTable, ' ', 2));
  if (hasTable.length === 0) {
    const createTableStmt = db.prepare(
      `CREATE TABLE ${tableName} (
        handle TEXT,
        url TEXT,
        last_seen INTEGER,
        last_post INTEGER
      );`
    );
    const createTable = createTableStmt.run();
    console.log(JSON.stringify(createTable, ' ', 2));
  }
} catch(e) {
  console.log(e);
}

function statusCheck(parentPort) {
  try {
    console.log('status');
  } catch(e) {
  }
}
