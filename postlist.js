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
    const limit = Number(this.props.twtxt.limit_timeline);
    let posts = [];
    let key = 0;
    const offset = (this.props.pageNumber - 1) * limit;

    Object.keys(this.props.posts)
      .filter(
        (h) =>
          // eslint-disable-next-line implicit-arrow-linebreak
          this.props.showExtended ||
          h === 'nobody' ||
          h === this.props.twtxt.nick ||
          this.props.users[h].following
      )
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
      .filter(
        (p) =>
          // eslint-disable-next-line implicit-arrow-linebreak
          this.props.query === null ||
          p.message.toLowerCase().indexOf(this.props.query) >= 0
      )
      .sort((a, b) => b.date - a.date)
      .slice(offset, offset + limit)
      .map((p) => (
        <MessageBlock
          addUser={this.boundAddUser}
          config={this.props.config}
          highlight={this.props.highlightDate === new Date(p.date).valueOf()}
          key={(key += 5)}
          post={p}
        />
      ));
    return <View>{posts}</View>;
  }
}
PostList.propTypes = {
  config: PropTypes.any,
  highlightDate: PropTypes.number,
  pageNumber: PropTypes.number,
  query: PropTypes.string,
  posts: PropTypes.object,
  showExtended: PropTypes.bool,
  showUser: PropTypes.string,
  twtxt: PropTypes.shape({
    // eslint-disable-next-line camelcase
    limit_timeline: PropTypes.string,
    nick: PropTypes.string,
  }),
  users: PropTypes.object,
};
