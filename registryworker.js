const { parentPort, workerData } = require('worker_threads');

if (!workerData.scrapeRegistries) {
  process.exit();
}

const ms = workerData.minInterval * 60 * 1000;
// eslint-disable-next-line no-unused-vars
const interval = setInterval(scrapeRegistry, ms, parentPort);
const registries = [
  {
    name: 'Twtxt Registry',
    url: 'https://registry.twtxt.org/api/plain/users',
    parse: null,
  },
  {
    name: 'twtxt-directory',
    url: 'http://twtxt.xyz/users.txt',
    parse: null,
  },
  {
    name: 'we-are-twtxt',
    url:
      'https://raw.githubusercontent.com/mdom/we-are-twtxt/master/we-are-twtxt.txt',
    parse: null,
  },
  {
    name: 'we-are-twtxt-bots',
    url:
      'https://raw.githubusercontent.com/mdom/we-are-twtxt/master/we-are-bots.txt',
    parse: null,
  },
  {
    name: 'twtxt.tilde.institute',
    url: 'https://twtxt.tilde.institute/api/plain/users',
    parse: null,
  },
  {
    name: 'gettwtxt',
    url: 'https://twtxt.envs.net/api/plain/users',
    parse: null,
  },
];

function scrapeRegistry() {
  registries.forEach((r) => r);
  return null;
}
