import React, {
  Component,
} from "react";
import {
  App,
  Button,
  Text,
  View,
  Window,
} from "proton-native";

const fs = require('fs');
const getUrls = require('get-urls');
const homedir = require('os').homedir();
const ini = require('ini');
const moment = require('moment');
const opn = require('opn');
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
      threadFollow: worker,
      twtxt: twtxtconfig.twtxt,
    };
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

  openUrl() {
    opn(this);
  }

  createMessageBlock(post, key) {
    const urls = getUrls(post.message);
    const links = [];
    const knownUsers = this.state.knownUsers;

    urls.forEach(u => {
      if (u.indexOf('&gt;') > 0) {
        let escaped = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //]/
        let tag = new RegExp(`@&lt;\\S* ${escaped}`);
        let found = post.message.match(tag);

        if (found !== null) {
          const parts = found[0]
            .replace(/^@&lt;/, '')
            .replace(/&gt;.*/, '')
            .split(' ');
          if (!this.state.knownUsers.hasOwnProperty(parts[0])) {
            this.state.knownUsers[parts[0]] = parts[1];
          }
        }
      } else {
        links.push(<Button
          key={`link-${key++}`}
          onPress={this.openUrl.bind(u)}
          style={{
            border: `1px solid ${this.state.config.foregroundColor}`,
            color: this.state.config.foregroundColor,
            fontSize: `${this.state.config.fontSize}pt`,
            fontWeight: 'normal',
            textAlign: 'left',
            width: '99%',
          }}
          title={u}
        />);
      }
    });
    return (<View
        key={ ++key }
        style={{
          paddingTop: `${this.state.config.fontSize / 2}pt`,
        }}
      >
        <Text
          key={ ++key }
          style={{
            color: this.state.config.foregroundColor,
            fontSize: `${this.state.config.fontSize * 0.8}pt`,
            fontWeight: 'normal',
            textAlign: 'right',
            width: '100%',
          }}
        >
          👉 {post.handle} ({ moment(post.date).fromNow() })
        </Text>
        <Text
          key={ ++key }
          multiline
          style={{
            color: this.state.config.foregroundColor,
            fontSize: `${this.state.config.fontSize}pt`,
            fontWeight: 'bold',
            textAlign: 'left',
            width: '99%',
          }}
        >
          { post.message
              .replace(/@&lt;(\S*) \S*&gt;/g, (m, g, o, orig) => `@${g}`) }
        </Text>
        {links}
      </View>);
  }

  render() {
    const following = [];
    let posts = [];
    let key = 0;

    Object.keys(this.state.following).forEach(f => {
      following.push(
        <Text
          key={ ++key }
          style={{
            color: this.state.config.foregroundColor,
            fontSize: `${this.state.config.fontSize}pt`,
            fontWeight: 'bold',
            textAlign: 'left',
          }}
        >
          { f }
        </Text>
      );
    });
    Object.keys(this.state.posts).forEach(h => {
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
      .map(p => this.createMessageBlock(p, key += 5));

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
              <Text
                style={{
                  color: this.state.config.foregroundColor,
                  fontSize: `${this.state.config.fontSize * 1.25}pt`,
                  fontWeight: 'bold',
                  textAlign: 'left',
                }}
              >
                Following
              </Text>
              <View style={{
                alignItems: 'flex-start',
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'flex-start',
                width: '100%',
              }}>
                { following }
              </View>
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
        </Window>
      </App>
    );
  }
}
