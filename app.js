import React, { Component } from 'react';
import { App, Text, View, Window } from 'proton-native';
import Entry from './entry';
import MessageBlock from './messageblock';
import PanelFollow from './panelfollow';
import PanelMention from './panelmention';

const fs = require('fs');
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
      exportStyle: '',
      fontSize: 18,
      foregroundColor: 'white',
      minInterval: 15,
    };
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
    this.state = {
      config: config,
      following: twtxtconfig.following,
      knownPeers: Object.assign(following, twtxtconfig.following),
      posts: {
        nobody: [
          {
            date: new Date('0001-01-01'),
            message: 'The dawn of time...',
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
    fworker.on('message', this.takeUpdate.bind(this));
    fworker.on('error', this.reportUpdateError.bind(this));
    fworker.on('exit', this.reportExit.bind(this));
    pworker.on('message', this.updateAccounts.bind(this));
    pworker.on('error', this.reportUpdateError.bind(this));
    pworker.on('exit', this.reportExit.bind(this));
  }

  updateAccounts(accountUpdate) {
    for (let i = 0; i < accountUpdate.length; i++) {
      const match = this.state.following.filter(
        (f) => f.handle === accountUpdate[i].handle
      );

      if (match.length > 0) {
        accountUpdate[i].following = true;
      }
    }

    this.setState({
      knownPeers: accountUpdate,
    });
    this.state.threadFollow.postMessage(accountUpdate);
  }

  takeUpdate(userUpdate) {
    const posts = this.state.posts;

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
      knownPeers[user.name] = user.address;
      this.setState({
        knownPeers: knownPeers,
      });
    }

    this.state.threadAccount.postMessage(this.state.knownPeers);
  }

  switchUser(user) {
    this.setState({
      showOnlyUser: user,
    });
  }

  render() {
    const showUser = this.state.showOnlyUser;
    let posts = [];
    let key = 0;

    Object.keys(this.state.posts)
      .filter((h) => showUser === null || h === showUser)
      .forEach((h) => {
        this.state.posts[h].forEach((p) => {
          posts.push({
            date: p.date,
            handle: h,
            message: p.message,
          });
        });
      });
    posts = posts
      .sort((a, b) => b.date - a.date)
      .slice(0, this.state.twtxt.limit_timeline)
      .map((p) => (
        <MessageBlock
          addUser={this.boundAddUser}
          config={this.state.config}
          key={(key += 5)}
          post={p}
        />
      ));

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
              <View
                style={{
                  alignItems: 'flex-start',
                  flex: 1,
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'flex-start',
                  maxWidth: '250px',
                  width: '250px',
                }}
              >
                <PanelFollow
                  config={this.state.config}
                  following={this.state.following}
                  owner={this.state.twtxt.nick}
                  switchUser={this.boundSwitchUser}
                />
                <PanelMention config={this.state.config}></PanelMention>
              </View>
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
                    fontSize: `${this.state.config.fontSize * 1.25}pt`,
                    fontWeight: 'bold',
                    textAlign: 'left',
                  }}
                >
                  Posts
                </Text>
                {posts}
              </View>
            </View>
            <Entry config={this.state.config} twtxt={this.state.twtxt} />
          </View>
        </Window>
      </App>
    );
  }
}
