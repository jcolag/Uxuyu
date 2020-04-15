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
const path = require('path');

const twtxtconfig = ini.parse(
  fs.readFileSync(
    path.join(homedir, '.config', 'twtxt', 'config'),
    'utf-8'
  )
);

export default class Example extends Component {
  constructor(props) {
    let config = {
      backgroundColor: 'black',
      exportStyle: '',
      fontSize: 18,
      foregroundColor: 'white',
      interval: 30000,
    };

    super(props);
    this.state = {
      config: config,
      following: twtxtconfig.following,
      monitor: setInterval(this.monitorForChanges, config.interval, this),
      twtxt: twtxtconfig.twtxt,
    };
  }

  monitorForChanges(self) {
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
        </Window>
      </App>
    );
  }
}
