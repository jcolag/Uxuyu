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
  try {
    parentPort.postMessage(
      postsFromLog(
        fs.readFileSync(
          workerData.twtxtConfig.twtfile, 'utf-8'
        ),
        workerData.twtxtConfig.nick
      )
    );
    handles.forEach(h => {
      const options = {
        headers: {
          'User-Agent': 'Uxuyu Prototype Testing',
        },
        url: workerData.following[h],
      };

      request(options, (err, res, body) => {
      try {
        if (err) {
          console.log(err);
          return;
        }

        parentPort.postMessage(postsFromLog(body, h));
      } catch(e) {
        console.log(e);
      }
      });
    });
  } catch(e) {
    console.log(e);
  }
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
