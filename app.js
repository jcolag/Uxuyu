import React, {
  Component,
} from "react";
import {
  App,
  Text,
  View,
  Window,
} from "proton-native";

const fs = require('fs');
const homedir = require('os').homedir();
const ini = require('ini');
const moment = require('moment');
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
      interval: 30000,
    };
    const worker = new Worker(
      './followworker.js',
      {
        workerData: {
          following: twtxtconfig.following,
          twtxtConfig: twtxtconfig.twtxt,
        },
      }
    );

    super(props);
    this.state = {
      config: config,
      following: twtxtconfig.following,
      monitor: setInterval(this.monitorForChanges, config.interval, this),
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

  monitorForChanges(self) {
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
      .map(p => <View
        key={ ++key }
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
          👉 {p.handle} ({ moment(p.date).fromNow() })
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
          { p.message }
        </Text>
      </View>
    );

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
