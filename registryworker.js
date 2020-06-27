const request = require('request');
const { parentPort, workerData } = require('worker_threads');

if (!workerData.scrapeRegistries) {
  process.exit();
}

const ms = workerData.minInterval * 60 * 1000 * 10;
// eslint-disable-next-line no-unused-vars
const interval = setInterval(scrapeRegistry, ms, parentPort);
const parseDelimited = /^(\S*)\s*(\S*)\s*(\S*)$/; // tab- or space-sep: handle, url, opt added
const parseHandle = /^@<(\S*) (\S*)>()$/; // @<handle url>
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

function scrapeRegistry() {
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
          console.log(`Error connecting with @${r.name} (${r.url})`);
          console.log(err);
          return;
        }

        body.split('\n').forEach((entry) => {
          const match = entry.match(r.parse);

          if (!match) {
            return;
          }

          parentPort.postMessage({
            handle: match[1],
            url: match[2],
            registered: match[3],
          });
        });
      } catch (e) {
        console.log(`Error connecting with @${r.name} (${r.url})`);
        console.log(e);
      }
    });
  });
  return null;
}
