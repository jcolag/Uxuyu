const request = require('request');
const winston = require('winston');
const { parentPort, workerData } = require('worker_threads');

if (!workerData.scrapeRegistries) {
  process.exit();
}

const ms = workerData.minInterval * 60 * 1000 * 24.3;
// eslint-disable-next-line no-unused-vars
const interval = setInterval(scrapeRegistry, ms, parentPort);
const parseDelimited = /^(\S*)\s*(\S*)\s*(\S*)$/; // tab- or space-sep: handle, url, opt added
const parseHandle = /^@<(\S*) (\S*)>()$/; // @<handle url>
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'uxuyu' },
  transports: [new winston.transports.File({ filename: 'Uxuyu.log' })],
});
const registries = [
  {
    name: 'Twtxt Registry',
    url: 'https://registry.twtxt.org/api/plain/users',
    parse: parseDelimited,
  },
  {
    name: 'twtxt-directory',
    url: 'http://twtxt.xyz/users.txt',
    parse: parseHandle,
  },
  {
    name: 'we-are-twtxt',
    url:
      'https://raw.githubusercontent.com/mdom/we-are-twtxt/master/we-are-twtxt.txt',
    parse: parseDelimited,
  },
  {
    name: 'we-are-twtxt-bots',
    url:
      'https://raw.githubusercontent.com/mdom/we-are-twtxt/master/we-are-bots.txt',
    parse: parseDelimited,
  },
  {
    name: 'twtxt.tilde.institute',
    url: 'https://twtxt.tilde.institute/api/plain/users',
    parse: parseDelimited,
  },
  {
    name: 'gettwtxt',
    url: 'https://twtxt.envs.net/api/plain/users',
    parse: parseDelimited,
  },
];

// Because this code runs so infrequently (no more than every two hours,
// unless you modified the lower bound), this fires off a one-shot
// series of requests at half the minimum timer, so that it doesn't
// overlap with any other activity.
setTimeout(
  scrapeRegistry,
  (workerData.minInterval * 60 * 1000) / 2,
  parentPort
);
parentPort.on('message', () => scrapeRegistry(parentPort));

function scrapeRegistry(parentPort) {
  registries.forEach((r) => {
    const options = {
      headers: {
        'User-Agent': 'Uxuyu Prototype Testing',
      },
      url: r.url,
    };

    request(options, (err, res, body) => {
      try {
        if (err) {
          logger.warn(`Error connecting with @${r.name} (${r.url})`);
          logger.warn(err);
          return;
        }

        const lines = body
          .split('\n')
          .filter((l) => l.trim !== '' && l[0] !== '#');
        parentPort.postMessage({
          lines: lines,
          registry: r,
        });
      } catch (e) {
        logger.warn(`Error connecting with @${r.name} (${r.url})`);
        logger.warn(e);
      }
    });
  });
  return null;
}
