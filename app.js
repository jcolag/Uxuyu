import React, { Component } from 'react';
import { App, Text, View, Window } from 'proton-native';
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
    let config = {
      backgroundColor: 'black',
      fontFamily: null,
      fontSize: 18,
      foregroundColor: 'white',
      minInterval: 15,
      openApp: null,
    };

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

    const fworker = new Worker('./followworker.js', {
      workerData: {
        following: twtxtconfig.following,
        minInterval: Math.max(config.minInterval, 5),
        twtxtConfig: twtxtconfig.twtxt,
      },
    });
    const pworker = new Worker('./accountworker.js', {
      workerData: {
        minInterval: Math.max(config.minInterval, 5),
      },
    });
    let following = new Object();

    super(props);
    try {
      const configFile = path.join(homedir, '.config', 'Uxuyu.json');
      const configJson = fs.readFileSync(configFile, 'utf-8');
      const userConfig = JSON.parse(configJson);

      Object.assign(config, userConfig);
    } catch {}
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
      showOnlyUser: null,
      threadAccount: pworker,
      threadFollow: fworker,
      twtxt: twtxtconfig.twtxt,
    };
    this.postText = '';
    this.boundAddUser = this.addUser.bind(this);
    this.boundSwitchUser = this.switchUser.bind(this);
    this.boundJumpToPost = this.jumpToPost.bind(this);
    this.increasePage = this.updatePage.bind(this, 1);
    this.decreasePage = this.updatePage.bind(this, -1);
    fworker.on('message', this.takeUpdate.bind(this));
    fworker.on('error', this.reportUpdateError.bind(this));
    fworker.on('exit', this.reportExit.bind(this));
    pworker.on('message', this.updateAccounts.bind(this));
    pworker.on('error', this.reportUpdateError.bind(this));
    pworker.on('exit', this.reportExit.bind(this));
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

    for (let i = 0; i < userUpdate.messages.length; i++) {
      const message = userUpdate.messages[i].message;
      const urls = getUrls(message);

      // Some URLs are actually feeds.  Those shouldn't be included, but should
      // be added to the list of known peer accounts.
      urls.forEach((u) => {
        if (u.indexOf('&gt;') > 0) {
          let escaped = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //]/
          let tag = new RegExp(`@&lt;\\S* ${escaped}`);
          let found = message.match(tag);

          if (found !== null) {
            const parts = found[0]
              .replace(/^@&lt;/, '')
              .replace(/&gt;.*/, '')
              .split(' ');
            this.addUser(parts);
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

    this.setState({
      posts: {},
    });
    posts[userUpdate.handle] = userUpdate.messages;
    this.setState({
      posts: posts,
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

  addUser(parts) {
    const user = {
      name: parts[0],
      address: parts[1],
    };
    const knownPeers = this.state.knownPeers;

    if (
      !Object.prototype.hasOwnProperty.call(this.state.knownPeers, user.name)
    ) {
      knownPeers[user.name] = {
        url: user.address,
      };
      this.setState({
        knownPeers: knownPeers,
      });
    }

    this.state.threadAccount.postMessage(this.state.knownPeers);
  }

  switchUser(user) {
    this.setState({
      highlightDate: Number.MAX_VALUE,
      pageNumber: 1,
      showOnlyUser: user,
    });
  }

  updatePage(increment) {
    const newPage = this.state.pageNumber + increment;

    if (newPage < 1) {
      return;
    }

    if (this.state.showOnlyUser !== null) {
      const postCount = this.state.posts[this.state.showOnlyUser].length;

      if (
        newPage > Math.ceil(postCount / Number(this.state.twtxt.limit_timeline))
      ) {
        return;
      }
    }

    this.setState({
      highlightDate: Number.MAX_VALUE,
      pageNumber: newPage,
    });
  }

  jumpToPost(post) {
    const handle = post.handle;
    const date = new Date(post.date);
    let foundIndex = 0;

    this.setState({
      highlightDate: Number.MAX_VALUE,
      pageNumber: 0,
      showOnlyUser: null,
    });

    for (
      foundIndex = 0;
      foundIndex < this.state.posts[handle].length;
      foundIndex++
    ) {
      if (
        this.state.posts[handle][foundIndex].date.valueOf() === date.valueOf()
      ) {
        break;
      }
    }

    foundIndex = this.state.posts[handle].length - foundIndex - 1;
    const page = Math.floor(
      foundIndex / Number(this.state.twtxt.limit_timeline)
    );

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
                boundSwitchUser={this.boundSwitchUser}
                config={this.state.config}
                following={this.state.following}
                jumpToPost={this.boundJumpToPost}
                mentions={this.state.mentions}
                nick={this.state.twtxt.nick}
              ></Sidebar>
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
                  showUser={this.state.showOnlyUser}
                  twtxt={this.state.twtxt}
                />
              </View>
            </View>
            <Entry
              config={this.state.config}
              decreasePage={this.decreasePage}
              increasePage={this.increasePage}
              pageNumber={this.state.pageNumber}
              twtxt={this.state.twtxt}
            />
          </View>
        </Window>
      </App>
    );
  }
}
