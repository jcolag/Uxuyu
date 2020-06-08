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

  render() {
    const post = this.props.post;
    const links = [];
    const bg = this.props.highlight
      ? this.props.config.foregroundColor
      : this.props.config.backgroundColor;
    const fg = this.props.highlight
      ? this.props.config.backgroundColor
      : this.props.config.foregroundColor;
    let key = 0;

    post.urls.forEach((u) => {
      links.push(
        <Button
          key={`link-${key++}`}
          onPress={this.openUrl.bind(u)}
          style={{
            backgroundColor: bg,
            border: `1px solid ${fg}`,
            borderRadius: `${this.props.config.fontSize / 2}px`,
            color: fg,
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
            fontSize: `${this.props.config.fontSize}pt`,
            fontWeight: 'normal',
            textAlign: 'left',
            width: '99%',
          }}
        >
          {post.message.replace(/@&lt;(\S*) \S*&gt;/g, (m, g) => `@${g}`)}
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
    fontSize: PropTypes.number,
    foregroundColor: PropTypes.string,
  }),
  highlight: PropTypes.bool,
  post: PropTypes.shape({
    date: PropTypes.date,
    handle: PropTypes.string,
    message: PropTypes.string,
    urls: PropTypes.array,
  }),
};
