import React, {
  Component,
} from "react";
import {
  App,
  Text,
  View,
  Window,
} from "proton-native";
import Entry from "./entry";
import MessageBlock from "./messageblock";
import PanelFollow from "./panelfollow";

const fs = require('fs');
const homedir = require('os').homedir();
const ini = require('ini');
const path = require('path');
const { Worker } = require('worker_threads');

const twtxtconfig = ini.parse(
  fs.readFileSync(
    path.join(homedir, '.config', 'twtxt', 'config'),
    'utf-8'
  )
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
    const worker = new Worker(
      './followworker.js',
      {
        workerData: {
          following: twtxtconfig.following,
          minInterval: Math.max(config.minInterval, 5),
          twtxtConfig: twtxtconfig.twtxt,
        },
      }
    );
    let following = new Object();

    super(props);
    this.state = {
      config: config,
      following: twtxtconfig.following,
      knownUsers: Object.assign(following, twtxtconfig.following),
      posts: {
        'nobody': [
          {
            date: new Date('0001-01-01'),
            message: 'The dawn of time...',
          },
        ]
      },
      showOnlyUser: null,
      threadFollow: worker,
      twtxt: twtxtconfig.twtxt,
    };
    this.postText = '';
    this.boundAddUser = this.addUser.bind(this);
    this.boundSwitchUser = this.switchUser.bind(this);
    worker.on('message', this.takeUpdate.bind(this));
    worker.on('error', this.reportUpdateError.bind(this));
    worker.on('exit', this.reportExit.bind(this));
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
    const myPosts = posts.hasOwnProperty(handle) ? posts[handle] : [];

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

    if (!this.state.knownUsers.hasOwnProperty(user.name)) {
      this.state.knownUsers[user.name] = user.address;
    }
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
      .filter(h => showUser === null || h === showUser)
      .forEach(h => {
        this.state.posts[h].forEach(p => {
          posts.push({
            date: p.date,
            handle: h,
            message: p.message,
          });
        });
      });
    posts = posts
      .sort((a,b) => b.date - a.date)
      .map(p => <MessageBlock
        addUser={this.boundAddUser}
        config={this.state.config}
        key={key += 5}
        post={p}
      />);

    return (
      <App>
        <Window
          style={{
            backgroundColor: this.state.config.backgroundColor,
            height: '75%',
            width: '75%',
          }}
        >
          <View style={{
            alignItems: 'flex-start',
            flex: 1,
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'flex-start',
            width: '100%',
          }}>
            <View style={{
              alignItems: 'flex-start',
              flex: 1,
              flexDirection: 'row',
              height: '100%',
              justifyContent: 'flex-start',
              width: '100%',
            }}>
              <View style={{
                alignItems: 'flex-start',
                flex: 1,
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'flex-start',
                maxWidth: '250px',
                width: '250px',
              }}>
                <PanelFollow
                  config={this.state.config}
                  following={this.state.following}
                  owner={this.state.twtxt.nick}
                  switchUser={this.boundSwitchUser}
                />
                <Text
                  style={{
                    color: this.state.config.foregroundColor,
                    fontSize: `${this.state.config.fontSize * 1.25}pt`,
                    fontWeight: 'bold',
                    textAlign: 'left',
                  }}
                >
                  Mentions
                </Text>
                <View style={{
                  alignItems: 'flex-start',
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  width: '100%',
                }}>
                  <Text
                    style={{
                      color: this.state.config.foregroundColor,
                      fontSize: `${this.state.config.fontSize}pt`,
                      fontWeight: 'bold',
                      textAlign: 'left',
                    }}
                  >
                    Test
                  </Text>
                </View>
              </View>
              <View style={{
                alignItems: 'flex-start',
                flex: 1,
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'flex-start',
                width: '100%',
              }}>
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
                { posts }
              </View>
            </View>
            <Entry
              config={this.state.config}
            />
          </View>
        </Window>
      </App>
    );
  }
}
