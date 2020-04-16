const fs = require('fs');
const request = require('request');
const {
  isMainThread,
  MessageChannel,
  MessagePort,
  parentPort,
  Worker,
  workerData,
} = require('worker_threads');

const handles = Object.keys(workerData.following);

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

function postsFromLog(logData, handle) {
  const posts = logData
    .split('\n')
    .filter(l => l.trim().length > 0 && l.trim()[0] !== '#')
    .map(l => {
      const parts = l.split('\t').map(p => p.trim());

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
    messages: posts,
  };
}
