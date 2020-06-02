const fs = require('fs');
const request = require('request');
const { parentPort, workerData } = require('worker_threads');

const ms = workerData.minInterval * 60 * 1000;
let knownPeers = workerData.following;
let handles = Object.keys(knownPeers);
// eslint-disable-next-line no-unused-vars
const interval = setInterval(updatePosts, ms, parentPort, handles);
let iterations = 0;

updatePosts(parentPort, handles);
parentPort.on('message', updateFollowing);

function updateFollowing(newFollowing) {
  knownPeers = newFollowing;
  handles = Object.keys(knownPeers);
}

function updatePosts(parentPort, handles) {
  try {
    parentPort.postMessage(
      postsFromLog(
        fs.readFileSync(workerData.twtxtConfig.twtfile, 'utf-8'),
        workerData.twtxtConfig.nick
      )
    );
    handles.forEach((h) => {
      if (!knownPeers[h].following && iterations % 5 !== 0) {
        return;
      }

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
        } catch (e) {
          console.log(e);
        }
      });
    });
  } catch (e) {
    console.log(e);
  }

  iterations += 1;
}

function postsFromLog(logData, handle) {
  const posts = logData
    .split('\n')
    .filter((l) => l.trim().length > 0 && l.trim()[0] !== '#')
    .map((l) => {
      const parts = l.split('\t').map((p) => p.trim());

      if (parts.length < 2) {
        return null;
      }

      return {
        date: new Date(parts[0]),
        message: parts[1].replace(
          /[<>]/g,
          // Prettier is fighting with ESLint over whether to force the replacement
          // object on a new line or not.  So...
          // eslint-disable-next-line prettier/prettier
          (tag) => ({
              '<': '&lt;',
              '>': '&gt;',
            }[tag] || tag)
        ),
      };
    });
  return {
    following:
      handle === workerData.twtxtConfig.nick || knownPeers[handle].following,
    handle: handle,
    messages: posts.filter((p) => p !== null),
  };
}
