const fs = require('fs');
const request = require('request');
const {
  parentPort,
  workerData,
} = require('worker_threads');

const handles = Object.keys(workerData.following);
const ms = workerData.minInterval * 60 * 1000;
const interval = setInterval(updatePosts, ms, parentPort, handles);

updatePosts(parentPort, handles);

function updatePosts(parentPort, handles) {
  parentPort.postMessage(
    postsFromLog(
      fs.readFileSync(
        workerData.twtxtConfig.twtfile, 'utf-8'
      ),
      workerData.twtxtConfig.nick
    )
  );
  handles.forEach(h => {
    const url = workerData.following[h];

    request(url, (err, res, body) => {
      if (err) {
        return;
      }

      parentPort.postMessage(postsFromLog(body, h));
    });
  });
}

function postsFromLog(logData, handle) {
  const posts = logData
    .split('\n')
    .filter(l => l.trim().length > 0 && l.trim()[0] !== '#')
    .map(l => {
      const parts = l.split('\t').map(p => p.trim());

      if (parts.length < 2) {
        return null;
      }

      return {
        date: new Date(parts[0]),
        message: parts[1]
          .replace(/[<>]/g, tag => ({
            '<': '&lt;',
            '>': '&gt;',
          }[tag] || tag)),
      };
    });
  return {
    handle: handle,
    messages: posts.filter(p => p !== null),
  };
}
