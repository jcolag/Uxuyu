import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View } from 'proton-native';
import MessageBlock from './messageblock';

export default class PostList extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    let posts = [];
    let key = 0;

    Object.keys(this.props.posts)
      .filter((h) => this.props.showUser === null || h === this.props.showUser)
      .forEach((h) => {
        this.props.posts[h].forEach((p) => {
          posts.push({
            date: p.date,
            handle: h,
            message: p.message,
            urls: p.urls,
          });
        });
      });
    posts = posts
      .sort((a, b) => b.date - a.date)
      .slice(0, this.props.twtxt.limit_timeline)
      .map((p) => (
        <MessageBlock
          addUser={this.boundAddUser}
          config={this.props.config}
          key={(key += 5)}
          post={p}
        />
      ));
    return <View>{posts}</View>;
  }
}
PostList.propTypes = {
  config: PropTypes.any,
  posts: PropTypes.object,
  showUser: PropTypes.string,
  twtxt: PropTypes.shape({
    // eslint-disable-next-line camelcase
    limit_timeline: PropTypes.string,
  }),
};
