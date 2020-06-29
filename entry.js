import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Button, Text, TextInput, View } from 'proton-native';

const fs = require('fs');
const moment = require('moment');
const opn = require('open');

export default class Entry extends Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultPostText: '',
      longMsg: false,
    };
    this.postText = '';
    this.boundPostTweet = this.postTweet.bind(this);
  }

  tweetUpdated(text) {
    this.postText = text;
    this.setState({
      longMsg:
        this.postText.length > Number(this.props.twtxt.character_warning),
    });
  }

  postTweet() {
    const ts = moment().format();
    const feedFile = fs.readFileSync(this.props.twtxt.twtfile, 'utf-8');
    const matches = this.postText.match(/@\w+/g);
    let post = `${ts}\t${this.postText}\n`;

    // Look for any @references and, if we have a feed URL for that user,
    // replace them with well-formed twtxt @references.
    for (let m = 0; m < matches.length; m++) {
      const match = matches[m];
      const handle = match.slice(1);
      const user = this.props.users[handle];

      if (user) {
        const atref = `@<${handle} ${user.url}>`;

        post = post.replace(match, atref);
      }
    }

    // It's next to impossible to have a rule for where to add the new line,
    // so...just do it when it's not there.
    if (!feedFile.endsWith('\n')) {
      post = `\n${post}`;
    }

    // Append the post to the local feed and clear the input.
    fs.appendFileSync(this.props.twtxt.twtfile, post);
    this.setState({
      defaultPostText: this.postText,
    });
    this.postText = '';
    this.setState({
      defaultPostText: '',
    });

    // Call the post-tweet hook.
    if (
      Object.prototype.hasOwnProperty.call(
        this.props.twtxt,
        'post_tweet_hook'
      ) &&
      this.props.twtxt.post_tweet_hook.length > 0
    ) {
      try {
        opn(this.props.twtxt.post_tweet_hook, {
          app: this.props.config.openApp,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  render() {
    const btnStyle = {
      backgroundColor: this.props.config.backgroundColor,
      border: '1px solid ' + this.props.config.foregroundColor,
      borderRadius: `${this.props.config.fontSize / 2}px`,
      fontWeight: 'bold',
      color: this.props.config.foregroundColor,
      fontFamily: this.props.config.fontFamily,
      fontSize: `${this.props.config.fontSize}pt`,
      height: '40px',
      marginLeft: '0.5%',
      width: '2.5%',
    };

    return (
      <View
        style={{
          alignItems: 'flex-start',
          flex: 1,
          flexDirection: 'row',
          height: '40px',
          justifyContent: 'flex-start',
          maxHeight: '40px',
          width: '100%',
        }}
      >
        <TextInput
          onChangeText={(text) => this.tweetUpdated(text)}
          style={{
            backgroundColor: this.state.longMsg
              ? 'darkred'
              : this.props.config.backgroundColor,
            border: '1px solid ' + this.props.config.foregroundColor,
            color: this.state.longMsg
              ? 'lightyellow'
              : this.props.config.foregroundColor,
            fontFamily: this.props.config.fontFamily,
            fontSize: `${this.props.config.fontSize}pt`,
            height: '40px',
            width: '83%',
          }}
          value={this.state.defaultPostText}
        />
        <Button onPress={this.boundPostTweet} style={btnStyle} title='✉️' />
        <Button
          onPress={() => this.props.query(this.postText)}
          style={btnStyle}
          title='🔍'
        />
        <Button onPress={this.props.decreasePage} style={btnStyle} title='👈' />
        <Text
          style={{
            backgroundColor: this.props.config.backgroundColor,
            color: this.props.config.foregroundColor,
            fontWeight: 'bold',
            fontFamily: this.props.config.fontFamily,
            fontSize: `${this.props.config.fontSize}pt`,
            textAlign: 'center',
            width: '3%',
          }}
        >
          p. {this.props.pageNumber.toString()}
        </Text>
        <Button onPress={this.props.increasePage} style={btnStyle} title='👉' />
      </View>
    );
  }
}
Entry.propTypes = {
  config: PropTypes.shape({
    backgroundColor: PropTypes.string,
    fontFamily: PropTypes.string,
    fontSize: PropTypes.number,
    foregroundColor: PropTypes.string,
    openApp: PropTypes.string,
  }),
  decreasePage: PropTypes.func,
  increasePage: PropTypes.func,
  pageNumber: PropTypes.number,
  query: PropTypes.func,
  twtxt: PropTypes.shape({
    // eslint-disable-next-line camelcase
    character_warning: PropTypes.string,
    // eslint-disable-next-line camelcase
    post_tweet_hook: PropTypes.string,
    twtfile: PropTypes.string,
  }),
  users: PropTypes.object,
};
