/* eslint-disable max-lines */
import React, { Component } from 'react';
import { App, Text, View, Window } from 'proton-native';
import AccountHandler from './accounthandler';
import Entry from './entry';
import PostList from './postlist';
import Sidebar from './sidebar';

const fs = require('fs');
const getUrls = require('get-urls');
const homedir = require('os').homedir();
const ini = require('ini');
const path = require('path');
const { Worker } = require('worker_threads');

const twtxtconfig = ini.parse(
  fs.readFileSync(path.join(homedir, '.config', 'twtxt', 'config'), 'utf-8')
);

export default class TwtxtClient extends Component {
  constructor(props) {
    const config = {
      backgroundColor: 'black',
      cachePosts: false,
      fontFamily: null,
      fontSize: 18,
      foregroundColor: 'white',
      minInterval: 15,
      openApp: null,
      scrapeRegistries: false,
      textWidth: 100,
    };

    super(props);
    try {
      const configFile = path.join(homedir, '.config', 'Uxuyu.json');
      const configJson = fs.readFileSync(configFile, 'utf-8');
      const userConfig = JSON.parse(configJson);

      Object.assign(config, userConfig);
    } catch {}

    Object.keys(twtxtconfig.following).forEach((handle) => {
      const url = twtxtconfig.following[handle];

      twtxtconfig.following[handle] = {
        following: true,
        handle: handle,
        lastSeen: Date.now().toString(),
        lastPost: Date.now().toString(),
        url: url,
      };
    });

    const followWorker = new Worker('./followworker.js', {
      workerData: {
        following: twtxtconfig.following,
        minInterval: Math.max(config.minInterval, 5),
        twtxtConfig: twtxtconfig.twtxt,
      },
    });
    const peerWorker = new Worker('./accountworker.js', {
      workerData: {
        minInterval: Math.max(config.minInterval, 5),
        following: twtxtconfig.following,
        shouldCachePosts: config.cachePosts,
      },
    });
    const registryWorker = new Worker('./registryworker.js', {
      workerData: {
        minInterval: Math.max(config.minInterval, 5),
        scrapeRegistries: config.scrapeRegistries,
      },
    });
    const following = {};

    this.state = {
      config: config,
      following: twtxtconfig.following,
      highlightDate: null,
      knownPeers: Object.assign(following, twtxtconfig.following),
      mentions: [],
      pageNumber: 1,
      posts: {
        nobody: [
          {
            date: new Date('0001-01-01'),
            message: 'The dawn of time...',
            urls: [],
          },
        ],
      },
      query: null,
      showAllUsers: false,
      showOnlyUser: null,
      threadAccount: peerWorker,
      threadFollow: followWorker,
      threadRegistry: registryWorker,
      twtxt: twtxtconfig.twtxt,
    };
    this.accountHandler = new AccountHandler(this);
    this.boundSwitchUser = this.switchUser.bind(this);
    this.boundSwitchToFirehose = this.switchToFirehose.bind(this);
    this.boundSwitchQuery = this.switchQuery.bind(this);
    this.boundJumpToPost = this.jumpToPost.bind(this);
    this.increasePage = this.updatePage.bind(this, 1);
    this.decreasePage = this.updatePage.bind(this, -1);
    this.boundFollowUser = this.followUser.bind(this);
    this.boundUnfollowUser = this.unfollowUser.bind(this);
    this.boundUpdateRegistries = this.refreshRegistries.bind(this);
    this.boundUpdatePeers = this.refreshPeers.bind(this);
    followWorker.on('message', this.takeUpdate.bind(this));
    followWorker.on('error', this.reportUpdateError.bind(this));
    followWorker.on('exit', this.reportExit.bind(this));
    peerWorker.on('message', this.updateAccounts.bind(this));
    peerWorker.on('error', this.reportUpdateError.bind(this));
    peerWorker.on('exit', this.reportExit.bind(this));
    registryWorker.on('message', this.updateFromRegistry.bind(this));
    registryWorker.on('error', this.reportUpdateError.bind(this));
    registryWorker.on('exit', this.reportExit.bind(this));
  }

  modifyUserFollow(handles, updateFunction) {
    if (handles.length === 0) {
      return;
    }

    const { newState, peers } = updateFunction(
      handles,
      this.state.following,
      this.state.knownPeers
    );

    this.setState({
      following: {},
    });
    this.setState(newState);
    this.state.threadFollow.postMessage(peers);
  }

  followUser(handles) {
    this.modifyUserFollow(handles, this.accountHandler.followUser);
  }

  unfollowUser(handles) {
    this.modifyUserFollow(handles, this.accountHandler.unfollowUser);
  }

  refreshRegistries() {
    this.state.threadRegistry.postMessage(null);
  }

  refreshPeers() {
    this.state.threadFollow.postMessage(null);
  }

  updateAccounts(accountUpdate) {
    for (let i = 0; i < accountUpdate.length; i++) {
      accountUpdate[i].following = Object.prototype.hasOwnProperty.call(
        this.state.following,
        accountUpdate[i].handle
      );
    }

    this.setState({
      knownPeers: accountUpdate,
    });
    this.state.threadFollow.postMessage(accountUpdate);
  }

  takeUpdate(userUpdate) {
    const posts = this.state.posts;

    this.state.threadAccount.postMessage({
      data: userUpdate,
      type: 'posts',
    });
    for (let i = 0; i < userUpdate.messages.length; i++) {
      const message = userUpdate.messages[i].message;
      const urls = getUrls(message);

      // Some URLs are actually feeds.  Those shouldn't be included, but should
      // be added to the list of known peer accounts.
      urls.forEach((u) => {
        if (u.indexOf('&gt;') > 0) {
          const escaped = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // ]/
          const tag = new RegExp(`@&lt;\\S* ${escaped}`);
          const found = message.match(tag);

          if (found !== null) {
            const parts = found[0]
              .replace(/^@&lt;/, '')
              .replace(/&gt;.*/, '')
              .split(' ');
            this.addFoundUser(parts);
            if (parts[0] === this.state.twtxt.nick) {
              let mentions = this.state.mentions;
              const found = mentions.filter(
                (m) =>
                  // eslint-disable-next-line implicit-arrow-linebreak
                  m.handle === userUpdate.handle &&
                  m.date.toString() === userUpdate.messages[i].date.toString()
              );

              if (found.length === 0) {
                mentions.push({
                  date: userUpdate.messages[i].date,
                  following: Object.prototype.hasOwnProperty.call(
                    this.state.following,
                    userUpdate.handle
                  ),
                  handle: userUpdate.handle,
                  message: userUpdate.messages[i].message,
                });
                mentions = mentions.sort((a, b) => a.date - b.date);
                this.setState({
                  mentions: mentions,
                });
              }
            }
          }
        }
      });
      userUpdate.messages[i].urls = Array.from(urls).filter(
        (u) => u.indexOf('&gt;') < 0
      );
    }

    const accountUpdate = {};

    accountUpdate[userUpdate.handle] = userUpdate;
    this.state.threadAccount.postMessage({
      data: accountUpdate,
      type: 'peers',
    });
    this.setState({
      posts: {},
    });
    posts[userUpdate.handle] = userUpdate.messages;
    this.setState({
      posts: posts,
    });
  }

  updateFromRegistry(userUpdate) {
    const peers = this.accountHandler.updateFromRegistry(
      userUpdate,
      this.state.knownPeers
    );

    this.setState({
      knownPeers: peers,
    });
    this.state.threadAccount.postMessage({
      date: peers,
      type: 'peers',
    });
  }

  reportUpdateError(err) {
    this.addFakeMessage('ERROR:', JSON.stringify(err, ' ', 2));
  }

  reportExit(code) {
    this.addFakeMessage('WARNING: Worker has stopped with exit code', code);
  }

  addFakeMessage(message, code) {
    const handle = this.state.twtxt.nick;
    const posts = this.state.posts;
    const myPosts = Object.prototype.hasOwnProperty.call(posts, handle)
      ? posts[handle]
      : [];

    this.setState({
      posts: {},
    });
    myPosts.push({
      date: new Date(),
      message: `${message} ${code}`,
    });
    posts[handle] = myPosts;
    this.setState({
      posts: posts,
    });
  }

  addFoundUser(parts) {
    const user = {
      name: parts[0],
      url: parts[1],
    };
    const knownPeers = this.state.knownPeers;

    if (!Object.prototype.hasOwnProperty.call(knownPeers, user.name)) {
      knownPeers[user.name] = user;
      this.setState({
        knownPeers: knownPeers,
      });
    }

    this.state.threadAccount.postMessage({
      data: knownPeers,
      type: 'peers',
    });
  }

  navigate(options) {
    const defaults = {
      highlightDate: Number.MAX_VALUE,
      pageNumber: 1,
      query: null,
      showAllUsers: false,
      showOnlyUser: null,
    };
    const query = Object.assign(defaults, options);

    this.setState(query);
  }

  switchUser(user) {
    this.navigate({
      showAllUsers: user !== null,
      showOnlyUser: user,
    });
  }

  switchToFirehose() {
    this.navigate({
      showAllUsers: true,
    });
  }

  switchQuery(text) {
    this.navigate({
      query: text.trim().toLowerCase(),
      showAllUsers: this.state.showAllUsers,
    });
  }

  updatePage(increment) {
    const newPage = this.state.pageNumber + increment;
    const limit = Number(this.state.twtxt.limit_timeline);
    const postCount =
      this.state.showOnlyUser === null
        ? Object.keys(this.state.posts)
            .map((k) => this.state.posts[k].length)
            .reduce((a, b) => a + b, 0)
        : this.state.posts[this.state.showOnlyUser].length;

    if (newPage < 1 || newPage > Math.ceil(postCount / limit)) {
      return;
    }

    this.setState({
      highlightDate: Number.MAX_VALUE,
      pageNumber: newPage,
    });
  }

  jumpToPost(post) {
    const handle = post.handle;
    const date = new Date(post.date);
    let found = 0;

    this.navigate({
      showAllUsers: true,
    });
    for (found = 0; found < this.state.posts[handle].length; found++) {
      if (this.state.posts[handle][found].date.valueOf() === date.valueOf()) {
        break;
      }
    }

    found = this.state.posts[handle].length - found - 1;
    const page = Math.floor(found / Number(this.state.twtxt.limit_timeline));
    this.setState({
      highlightDate: date.valueOf(),
      pageNumber: page + 1,
      showOnlyUser: handle,
    });
  }

  render() {
    return (
      <App>
        <Window
          style={{
            backgroundColor: this.state.config.backgroundColor,
            height: '75%',
            width: '75%',
          }}
        >
          <View
            style={{
              alignItems: 'flex-start',
              flex: 1,
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'flex-start',
              width: '100%',
            }}
          >
            <View
              style={{
                alignItems: 'flex-start',
                flex: 1,
                flexDirection: 'row',
                height: '100%',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Sidebar
                boundSwitchToFirehose={this.boundSwitchToFirehose}
                boundSwitchUser={this.boundSwitchUser}
                config={this.state.config}
                following={this.state.following}
                jumpToPost={this.boundJumpToPost}
                mentions={this.state.mentions}
                nick={this.state.twtxt.nick}
              />
              <View
                style={{
                  alignItems: 'flex-start',
                  flex: 1,
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'flex-start',
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    color: this.state.config.foregroundColor,
                    fontFamily: this.state.config.fontFamily,
                    fontSize: `${this.state.config.fontSize * 1.25}pt`,
                    fontWeight: 'bold',
                    textAlign: 'left',
                  }}
                >
                  Posts
                </Text>
                <PostList
                  config={this.state.config}
                  highlightDate={this.state.highlightDate}
                  pageNumber={this.state.pageNumber}
                  posts={this.state.posts}
                  query={this.state.query}
                  showExtended={this.state.showAllUsers}
                  showUser={this.state.showOnlyUser}
                  twtxt={this.state.twtxt}
                  users={this.state.knownPeers}
                />
              </View>
            </View>
            <Entry
              config={this.state.config}
              decreasePage={this.decreasePage}
              followUser={this.boundFollowUser}
              increasePage={this.increasePage}
              pageNumber={this.state.pageNumber}
              query={this.boundSwitchQuery}
              switchUser={this.boundSwitchUser}
              twtxt={this.state.twtxt}
              unfollowUser={this.boundUnfollowUser}
              updatePeers={this.boundUpdatePeers}
              updateRegistries={this.boundUpdateRegistries}
              users={this.state.knownPeers}
            />
          </View>
        </Window>
      </App>
    );
  }
}
