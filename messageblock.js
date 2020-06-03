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
    let key = 0;

    post.urls.forEach((u) => {
      links.push(
        <Button
          key={`link-${key++}`}
          onPress={this.openUrl.bind(u)}
          style={{
            border: `1px solid ${this.props.config.foregroundColor}`,
            borderRadius: `${this.props.config.fontSize / 2}px`,
            color: this.props.config.foregroundColor,
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
          paddingTop: `${this.props.config.fontSize / 2}pt`,
        }}
      >
        <Text
          key={++key}
          style={{
            color: this.props.config.foregroundColor,
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
            color: this.props.config.foregroundColor,
            fontSize: `${this.props.config.fontSize}pt`,
            fontWeight: 'bold',
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
    fontSize: PropTypes.number,
    foregroundColor: PropTypes.string,
  }),
  post: PropTypes.shape({
    date: PropTypes.date,
    handle: PropTypes.string,
    message: PropTypes.string,
    urls: PropTypes.array,
  }),
};
