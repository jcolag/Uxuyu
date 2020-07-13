const fs = require('fs');
const ini = require('ini');
const path = require('path');

const homedir = require('os').homedir();

export default class AccountHandler {
  constructor(app) {
    this.app = app;
  }

  followUser(handles, following, peers) {
    const filename = path.join(homedir, '.config', 'twtxt', 'config');
    const twtxtconfig = ini.parse(fs.readFileSync(filename, 'utf-8'));

    handles.forEach((h) => {
      const handle = h.indexOf('@') === 0 ? h.slice(1) : h;

      if (Object.prototype.hasOwnProperty.call(peers, handle)) {
        const user = peers[handle];

        twtxtconfig.following[handle] = user.url;
        following[handle] = user;
        peers[handle].following = true;
      }
    });

    if (handles.length > 0) {
      fs.writeFileSync(
        filename,
        ini.stringify(twtxtconfig).replace(/[=]/g, ' = ')
      );
    }

    return {
      newState: {
        following: following,
        knownPeers: peers,
      },
      peers: peers,
    };
  }

  unfollowUser(handles, following, peers) {
    const filename = path.join(homedir, '.config', 'twtxt', 'config');
    const twtxtconfig = ini.parse(fs.readFileSync(filename, 'utf-8'));

    handles.forEach((h) => {
      const handle = h.indexOf('@') === 0 ? h.slice(1) : h;

      peers[handle].following = false;
      if (Object.prototype.hasOwnProperty.call(twtxtconfig.following, handle)) {
        delete twtxtconfig.following[handle];
      }
      if (Object.prototype.hasOwnProperty.call(following, handle)) {
        delete following[handle];
      }
    });

    if (handles.length > 0) {
      fs.writeFileSync(
        filename,
        ini.stringify(twtxtconfig).replace(/[=]/g, ' = ')
      );
    }

    return {
      newState: {
        following: following,
        knownPeers: peers,
      },
      peers: peers,
    };
  }

  updateFromRegistry(userUpdate, knownPeers) {
    const lines = userUpdate.lines;
    const parse = userUpdate.registry.parse;

    for (let idx = 0; idx < lines.length; idx++) {
      const match = lines[idx].match(parse);

      if (match) {
        const user = {
          handle: match[1],
          registered: match[3],
          url: match[2],
        };

        if (!Object.prototype.hasOwnProperty.call(knownPeers, user.name)) {
          knownPeers[user.name] = user;
          return knownPeers;
        }
      }
    }

    return knownPeers;
  }
}
