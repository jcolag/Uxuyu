const fs = require('fs');
const request = require('request');
const winston = require('winston');
const { parentPort, workerData } = require('worker_threads');

const ms = workerData.minInterval * 60 * 1000;
let knownPeers = workerData.following;
let mostRecent = Date.now().valueOf();
// eslint-disable-next-line no-unused-vars
const interval = setInterval(updatePosts, ms, parentPort);
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'uxuyu' },
  transports: [new winston.transports.File({ filename: 'Uxuyu.log' })],
});

// This looks stupid, but the first iteration is #4 so that we don't try to
// pull every feed at once, but also aren't waiting half an hour (or whatever
// five intervals comes to) in order to grab the non-followed feeds.
let iterations = 4;

updatePosts(parentPort);
parentPort.on('message', updateFollowing);

function updateFollowing(newFollowing) {
  if (newFollowing === null) {
    updatePosts(parentPort, true);
  } else {
    knownPeers = newFollowing;
    mostRecent = Math.max(...Object.values(knownPeers).map((p) => p.lastSeen));
  }
}

function updatePosts(parentPort, getAll = false) {
  const handles = Object.keys(knownPeers);

  try {
    parentPort.postMessage(
      postsFromLog(
        fs.readFileSync(workerData.twtxtConfig.twtfile, 'utf-8'),
        workerData.twtxtConfig.nick
      )
    );
    handles.forEach((h) => {
      const user = knownPeers[h];
      const lastSeen =
        user === null || Number.isNaN(user.lastSeen) ? 0 : user.lastSeen;
      const age = (mostRecent - lastSeen) / 86400000;
      let cycle = Math.round(Math.log2(age + 1)) + 1;

      // We care less about people we don't follow.
      if (!Object.prototype.hasOwnProperty.call(workerData.following, h)) {
        cycle *= 5;
      }

      // But if we're asked to resynchronize peers, just get everyone.
      if (getAll) {
        cycle = 1;
      }

      // Bail if the cycles don't match.
      if (iterations % cycle !== 0) {
        return;
      }

      const options = {
        headers: {
          'User-Agent': 'Uxuyu Prototype Testing',
        },
        rejectUnauthorized: false,
        url: user.url,
      };

      request(options, (err, res, body) => {
        try {
          if (err) {
            logger.warn(`Error connecting with @${h} (${options.url})`);
            logger.warn(err);
            return;
          }

          parentPort.postMessage(postsFromLog(body, h, user.url));
        } catch (e) {
          logger.error(e);
        }
      });
    });
  } catch (e) {
    logger.error(e);
  }

  iterations += 1;
}

function postsFromLog(logData, handle, url) {
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
      handle === workerData.twtxtConfig.nick ||
      Object.prototype.hasOwnProperty.call(knownPeers, handle),
    handle: handle,
    lastSeen: Date.now().valueOf(),
    messages: posts.filter((p) => p !== null),
    url: url,
  };
}
