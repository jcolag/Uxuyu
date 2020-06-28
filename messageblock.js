import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Button, Text, View } from 'proton-native';

const moment = require('moment');
const opn = require('open');

export default class MessageBlock extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  openUrl() {
    opn(this);
  }

  charWidth(c) {
    if ('`1!iIl;:\'",.'.indexOf(c) >= 0) {
      return 0.25;
    } else if ('1-=+*^()[]{}tfj '.indexOf(c) >= 0) {
      return 0.5;
    } else if ('wm'.indexOf(c) >= 0) {
      return 1.5;
    } else if ('WM'.indexOf(c) >= 0) {
      return 2;
    }

    return 1;
  }

  wrapString(sourceText) {
    let result = '';
    let currentWidth = 0;
    let text = sourceText === null ? '' : sourceText;

    text.split('').forEach((c) => {
      const w = this.charWidth(c);

      if (currentWidth + w >= this.props.config.textWidth) {
        let orphan = '';
        let pc = result.slice(-1);

        currentWidth = 0;
        while (!/\s/.test(pc)) {
          currentWidth += this.charWidth(pc);
          result = result.slice(0, -1);
          orphan += pc;
          pc = result.slice(-1);
        }

        result += '&nbsp;&nbsp;<br>';
        // eslint-disable-next-line newline-per-chained-call
        result += orphan.split('').reverse().join('');
        orphan = '';
      }

      result += c;
      currentWidth += w;
    });
    return result;
  }

  render() {
    const post = this.props.post;
    const urls = post.urls === null || typeof post.urls === 'undefined' ? [] : post.urls;
    const links = [];
    const bg = this.props.highlight
      ? this.props.config.foregroundColor
      : this.props.config.backgroundColor;
    const fg = this.props.highlight
      ? this.props.config.backgroundColor
      : this.props.config.foregroundColor;
    let key = 0;

    urls.forEach((u) => {
      links.push(
        <Button
          key={`link-${key++}`}
          onPress={this.openUrl.bind(u)}
          style={{
            backgroundColor: bg,
            border: `1px solid ${fg}`,
            borderRadius: `${this.props.config.fontSize / 2}px`,
            color: fg,
            fontFamily: this.props.config.fontFamily,
            fontSize: `${this.props.config.fontSize}pt`,
            fontWeight: 'normal',
            marginLeft: '10%',
            minWidth: '80%',
            textAlign: 'center',
            width: '80%',
          }}
          title={u}
        />
      );
    });
    return (
      <View
        key={++key}
        style={{
          backgroundColor: bg,
          paddingTop: `${this.props.config.fontSize / 2}pt`,
        }}
      >
        <Text
          key={++key}
          style={{
            backgroundColor: bg,
            color: fg,
            fontFamily: this.props.config.fontFamily,
            fontSize: `${this.props.config.fontSize * 0.8}pt`,
            fontWeight: 'normal',
            textAlign: 'right',
            width: '100%',
          }}
        >
          👉 {post.handle} ({moment(post.date).fromNow()})
        </Text>
        <Text
          key={++key}
          multiline
          style={{
            backgroundColor: bg,
            color: fg,
            fontFamily: this.props.config.fontFamily,
            fontSize: `${this.props.config.fontSize}pt`,
            fontWeight: 'normal',
            textAlign: 'left',
            width: '99%',
          }}
        >
          {this.wrapString(
            post.message.replace(/@&lt;(\S*) \S*&gt;/g, (_m, g) => `@${g}`)
          )}
        </Text>
        {links}
      </View>
    );
  }
}
MessageBlock.propTypes = {
  addUser: PropTypes.func,
  config: PropTypes.shape({
    backgroundColor: PropTypes.string,
    fontFamily: PropTypes.string,
    fontSize: PropTypes.number,
    foregroundColor: PropTypes.string,
    textWidth: PropTypes.number,
  }),
  highlight: PropTypes.bool,
  post: PropTypes.shape({
    date: PropTypes.date,
    handle: PropTypes.string,
    message: PropTypes.string,
    urls: PropTypes.array,
  }),
};
